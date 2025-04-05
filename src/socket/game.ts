import { Server, Socket } from "socket.io";
import { generateTypingText } from "@/utils/serverUtils";

interface Player {
  id: string;
  username: string;
  socketId: string;
  isReady: boolean;
  progress: number;
  wpm: number;
  accuracy: number;
  finished: boolean;
  position?: number;
}

interface Room {
  id: string;
  players: Player[];
  isPrivate: boolean;
  isGameInProgress: boolean;
  gameText?: string;
  countdown?: number;
  results: Player[];
}

interface ConnectedUser {
  userId: string;
  username: string;
  socketId: string;
}

const GAME_TIME = 60; // 60 seconds
const COUNTDOWN_TIME = 5; // 5 seconds countdown before game starts

export default class GameServer {
  private io: Server;
  private rooms: Map<string, Room> = new Map();
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private friendsList: Map<string, string[]> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`New connection: ${socket.id}`);

      // Authentication handler
      socket.on('authenticate', (data: { userId: string, username: string }) => {
        this.handleAuthentication(socket, data);
      });

      // Room management
      socket.on('createRoom', (data: { isPrivate: boolean }) => {
        this.handleCreateRoom(socket, data.isPrivate);
      });

      socket.on('joinRoom', (data: { roomId: string }) => {
        this.handleJoinRoom(socket, data.roomId);
      });

      socket.on('rejoinRoom', (data: { roomId: string }) => {
        this.handleRejoinRoom(socket, data.roomId);
      });

      socket.on('leaveRoom', (data: { roomId: string }) => {
        this.handleLeaveRoom(socket, data.roomId);
      });

      socket.on('playerReady', (data: { roomId: string, ready: boolean }) => {
        this.handlePlayerReady(socket, data.roomId, data.ready);
      });

      // Gameplay events
      socket.on('progressUpdate', (data: { 
        roomId: string, 
        progress: number, 
        wpm: number, 
        accuracy: number,
        finished: boolean
      }) => {
        this.handleProgressUpdate(
          socket, 
          data.roomId, 
          data.progress, 
          data.wpm, 
          data.accuracy,
          data.finished
        );
      });

      // Friend and invitation events
      socket.on('inviteFriend', (data: { 
        friendId: string, 
        roomId: string,
        from: { userId: string, username: string }
      }) => {
        this.handleInviteFriend(socket, data.friendId, data.roomId, data.from);
      });

      // Disconnection handler
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  public addFriend(userId: string, friendId: string) {
    if (!this.friendsList.has(userId)) {
      this.friendsList.set(userId, []);
    }
    this.friendsList.get(userId)?.push(friendId);
  }

  private getOnlineFriendsForUser(userId: string) {
    const friends = this.friendsList.get(userId) || [];
    return [...this.connectedUsers.values()]
      .filter(user => friends.includes(user.userId))
      .filter(user => user.userId !== userId);
  }

  private updateOnlineFriends(socket: Socket) {
    const currentUser = this.connectedUsers.get(socket.id);
    if (!currentUser) return;
  
    const onlineFriends = this.getOnlineFriendsForUser(currentUser.userId);
    socket.emit('onlineFriends', onlineFriends);
  }

  private handleAuthentication(socket: Socket, data: { userId: string, username: string }) {
    this.connectedUsers.set(socket.id, {
      userId: data.userId,
      username: data.username,
      socketId: socket.id
    });
  
    this.updateOnlineFriends(socket);
  
    socket.broadcast.emit('userOnline', {
      userId: data.userId,
      username: data.username
    });
  }

  private handleCreateRoom(socket: Socket, isPrivate: boolean) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const roomId = Math.floor(Math.random() * 900000 + 100000).toString();
    const newRoom: Room = {
      id: roomId,
      players: [{
        id: user.userId,
        username: user.username,
        socketId: socket.id,
        isReady: false,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false
      }],
      isPrivate,
      isGameInProgress: false,
      results: []
    };

    this.rooms.set(roomId, newRoom);
    socket.join(roomId);
    
    socket.emit('roomCreated', { roomId, newRoom });

    if (!isPrivate) {
      this.io.emit('roomAvailable', { 
        roomId, 
        playerCount: 1 
      });
    }
  }

  private handleJoinRoom(socket: Socket, roomId: string) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.isGameInProgress) {
      socket.emit('error', { message: 'Game is already in progress' });
      return;
    }

    if (room.players.some(p => p.id === user.userId)) {
      socket.emit('error', { message: 'You are already in this room' });
      return;
    }

    room.players.push({
      id: user.userId,
      username: user.username,
      socketId: socket.id,
      isReady: false,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false
    });

    socket.join(roomId);

    this.io.to(roomId).emit('playerJoined', { players: room.players });

    if (!room.isPrivate) {
      this.io.emit('roomAvailable', { 
        roomId, 
        playerCount: room.players.length 
      });
    }
  }

  private handleRejoinRoom(socket: Socket, roomId: string) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === user.userId);
    if (!player) return;

    // Update socket ID for the player
    player.socketId = socket.id;
    socket.join(roomId);

    // Send current room state to the reconnecting player
    socket.emit('roomCreated', { roomId, newRoom: room });
    
    if (room.isGameInProgress) {
      // If game is in progress, send the current game state
      socket.emit('gameStart', { 
        text: room.gameText, 
        gameTime: GAME_TIME 
      });
    }
  }

  private handleLeaveRoom(socket: Socket, roomId: string) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === user.userId);
    if (playerIndex === -1) return;

    const wasGameInProgress = room.isGameInProgress;
    const player = room.players[playerIndex];

    // If game was in progress, mark player as finished
    if (wasGameInProgress && !player.finished) {
      player.finished = true;
      player.position = room.results.length + 1;
      room.results.push({
        ...player,
        position: player.position
      });

      this.io.to(roomId).emit('playerProgress', {
        userId: user.userId,
        progress: player.progress,
        wpm: player.wpm,
        accuracy: player.accuracy,
        finished: true
      });

      // Check if all players finished
      if (room.players.every(p => p.finished)) {
        this.endGame(room);
      }
    }

    // Remove player from room
    room.players.splice(playerIndex, 1);
    socket.leave(roomId);

    if (room.players.length > 0) {
      this.io.to(roomId).emit('playerLeft', { userId: user.userId });

      if (!room.isPrivate) {
        this.io.emit('roomAvailable', { 
          roomId, 
          playerCount: room.players.length 
        });
      }

      // If only one player left and game was in progress, end the game
      if (wasGameInProgress && room.players.length === 1) {
        this.endGame(room);
      }
    } else {
      // No players left - close the room
      this.rooms.delete(roomId);
      if (!room.isPrivate) {
        this.io.emit('roomClosed', { roomId });
      }
    }
  }

  private handlePlayerReady(socket: Socket, roomId: string, ready: boolean) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === user.userId);
    if (!player) return;

    player.isReady = ready;

    this.io.to(roomId).emit('playerReadyState', { 
      userId: user.userId, 
      isReady: ready 
    });

    if (ready && room.players.length >= 2 && 
        room.players.every(p => p.isReady) && !room.isGameInProgress) {
      this.startGame(room);
    }
  }

  private startGame(room: Room) {
    room.isGameInProgress = true;
    
    // Generate game text
    const generatedText = generateTypingText(200);
    room.gameText = generatedText;

    // Start countdown
    let countdown = COUNTDOWN_TIME;
    room.countdown = countdown;
    
    const countdownInterval = setInterval(() => {
      countdown--;
      room.countdown = countdown;
      
      this.io.to(room.id).emit('gameCountdown', { countdown });
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        this.io.to(room.id).emit('gameStart', { 
          text: room.gameText, 
          gameTime: GAME_TIME 
        });
      }
    }, 1000);
  }

  private handleProgressUpdate(
    socket: Socket, 
    roomId: string, 
    progress: number, 
    wpm: number, 
    accuracy: number,
    finished: boolean
  ) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const room = this.rooms.get(roomId);
    if (!room || !room.isGameInProgress) return;

    const player = room.players.find(p => p.id === user.userId);
    if (!player) return;

    player.progress = progress;
    player.wpm = wpm;
    player.accuracy = accuracy;
    player.finished = finished;

    if (finished && !player.position) {
      player.position = room.results.length + 1;
      room.results.push({
        ...player,
        position: player.position
      });

      socket.emit('playerFinished', { position: player.position });

      if (room.players.every(p => p.finished)) {
        this.endGame(room);
      }
    }

    this.io.to(roomId).emit('playerProgress', {
      userId: user.userId,
      progress,
      wpm,
      accuracy,
      finished
    });
  }

  private endGame(room: Room) {
    room.isGameInProgress = false;
    
    // Calculate final positions
    const sortedResults = [...room.players]
      .sort((a, b) => {
        // Finished players first
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        
        // Then by WPM
        if (a.wpm !== b.wpm) return b.wpm - a.wpm;
        
        // Then by accuracy
        return b.accuracy - a.accuracy;
      })
      .map((player, index) => ({
        ...player,
        position: index + 1
      }));

    room.results = sortedResults;
    
    // Send results to all players
    this.io.to(room.id).emit('gameResults', { results: sortedResults });

    // Reset room after game ends
    room.players.forEach(player => {
      player.isReady = false;
      player.progress = 0;
      player.wpm = 0;
      player.accuracy = 100;
      player.finished = false;
      player.position = undefined;
    });
    room.results = [];
    room.isGameInProgress = false;
    room.gameText = undefined;
    room.countdown = undefined;
  }

  private handleInviteFriend(
    socket: Socket, 
    friendId: string, 
    roomId: string,
    from: { userId: string, username: string }
  ) {
    const room = this.rooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Check if friend is already in the room
    if (room.players.some(p => p.id === friendId)) {
      socket.emit('error', { message: 'Friend is already in the room' });
      return;
    }

    // Find friend's socket
    const friendEntry = [...this.connectedUsers.values()].find(u => u.userId === friendId);
    if (!friendEntry) {
      socket.emit('error', { message: 'Friend is not online' });
      return;
    }

    // Send invitation to friend
    this.io.to(friendEntry.socketId).emit('battleInvitation', {
      roomId,
      from
    });
  }

  private handleDisconnect(socket: Socket) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    // Find all rooms the user was in
    const userRooms = [...this.rooms.values()].filter(room => 
      room.players.some(p => p.id === user.userId)
    );

    // Handle each room
    userRooms.forEach(room => {
      const player = room.players.find(p => p.id === user.userId);
      if (!player) return;

      if (room.isGameInProgress && !player.finished) {
        // Mark player as finished if game was ongoing
        player.finished = true;
        player.position = room.results.length + 1;
        room.results.push({
          ...player,
          position: player.position
        });

        // Notify remaining players
        this.io.to(room.id).emit('playerProgress', {
          userId: user.userId,
          progress: player.progress,
          wpm: player.wpm,
          accuracy: player.accuracy,
          finished: true
        });

        // End game if all players finished
        if (room.players.every(p => p.finished)) {
          this.endGame(room);
        }
      }
      
      // Remove player from room
      room.players = room.players.filter(p => p.id !== user.userId);
      
      if (room.players.length === 0) {
        this.rooms.delete(room.id);
      } else {
        this.io.to(room.id).emit('playerLeft', { userId: user.userId });
      }
    });

    // Notify others about disconnection
    socket.broadcast.emit('userOffline', {
      userId: user.userId
    });

    // Remove from connected users
    this.connectedUsers.delete(socket.id);
  }
}