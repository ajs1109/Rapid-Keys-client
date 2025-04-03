// server/socket/game.ts
import { Server, Socket } from "socket.io";
import { Room, Player, GameResult, GameText } from '@/types/multiplayer';
import { generateTypingText } from "@/utils/serverUtils";

// Sample game texts
const GAME_TEXTS: GameText[] = [
  {
    id: '1',
    text: 'The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet. Typing is a skill that improves with practice, so keep practicing every day to become faster and more accurate.',
    difficulty: 'easy'
  },
  {
    id: '2',
    text: 'Programming is the process of creating a set of instructions that tell a computer how to perform a task. JavaScript, often abbreviated as JS, is a programming language that conforms to the ECMAScript specification. TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
    difficulty: 'medium'
  },
  {
    id: '3',
    text: 'The theory of relativity usually encompasses two interrelated theories by Albert Einstein: special relativity and general relativity. Special relativity applies to all physical phenomena in the absence of gravity. General relativity explains the law of gravitation and its relation to other forces of nature.',
    difficulty: 'hard'
  }
];

const GAME_TIME = 60; // 60 seconds
const COUNTDOWN_TIME = 5; // 5 seconds countdown before game starts

export default class GameServer {
  private io: Server;
  private rooms: Map<string, Room> = new Map();
  private connectedUsers: Map<string, { userId: string, username: string, socketId: string }> = new Map();
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
        accuracy: number 
      }) => {
        this.handleProgressUpdate(socket, data.roomId, data.progress, data.wpm, data.accuracy);
      });

      // Friend and invitation events
      socket.on('inviteFriend', (data: { friendId: string, roomId: string }) => {
        this.handleInviteFriend(socket, data.friendId, data.roomId);
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
      .filter(user => user.userId !== userId); // Still exclude self
  }

  private handleAuthentication(socket: Socket, data: { userId: string, username: string }) {
    this.connectedUsers.set(socket.id, {
      userId: data.userId,
      username: data.username,
      socketId: socket.id
    });
  
    // Update friends list for this user only
    this.updateOnlineFriends(socket);
  
    // Notify others about this new user (excluding self)
    socket.broadcast.emit('userOnline', {
      userId: data.userId,
      username: data.username
    });
  
    console.log(`User authenticated: ${data.username} (${data.userId})`);
  }

  private handleCreateRoom(socket: Socket, isPrivate: boolean) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const roomId = (Number(Math.floor(Math.random() * 900000) + 100000)).toString();
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
    console.log('new room:', newRoom);
    // Notify the creator
    socket.emit('roomCreated', { roomId, newRoom });

    // For public rooms, notify others
    if (!isPrivate) {
      this.io.emit('roomAvailable', { 
        roomId, 
        playerCount: 1 
      });
    }

    console.log(`Room created: ${roomId} by ${user.username}`);
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

    // Add player to room
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

    // Notify all players in the room
    this.io.to(roomId).emit('playerJoined', { 
      players: room.players 
    });

    // For public rooms, update room count
    if (!room.isPrivate) {
      this.io.emit('roomAvailable', { 
        roomId, 
        playerCount: room.players.length 
      });
    }

    console.log(`${user.username} joined room ${roomId}`);
  }

  private handleLeaveRoom(socket: Socket, roomId: string) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    // Remove player from room
    room.players = room.players.filter(p => p.id !== user.userId);
    socket.leave(roomId);

    // Notify remaining players
    if (room.players.length > 0) {
      this.io.to(roomId).emit('playerLeft', { 
        userId: user.userId 
      });

      // For public rooms, update room count
      if (!room.isPrivate) {
        this.io.emit('roomAvailable', { 
          roomId, 
          playerCount: room.players.length 
        });
      }

      // If game was in progress, end it if only one player left
      if (room.isGameInProgress && room.players.length === 1) {
        this.endGame(room);
      }
    } else {
      // No players left - close the room
      this.rooms.delete(roomId);
      if (!room.isPrivate) {
        this.io.emit('roomClosed', { roomId });
      }
    }

    console.log(`${user.username} left room ${roomId}`);
  }

  private handlePlayerReady(socket: Socket, roomId: string, ready: boolean) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    // Update player ready status
    const player = room.players.find(p => p.id === user.userId);
    if (player) {
      player.isReady = ready;
    }

    // Notify all players in the room
    this.io.to(roomId).emit('playerReadyState', { 
      userId: user.userId, 
      isReady: ready 
    });

    // Check if all players are ready to start the game
    if (ready && room.players.length >= 2 && room.players.every(p => p.isReady) && !room.isGameInProgress) {
      this.startGame(room);
    }

    console.log(`${user.username} is ${ready ? 'ready' : 'not ready'} in room ${roomId}`);
  }

  private startGame(room: Room) {
    room.isGameInProgress = true;
    
    // Select a random game text
    const randomText = GAME_TEXTS[Math.floor(Math.random() * GAME_TEXTS.length)];
    const generatedText = generateTypingText(200);
    room.gameText = generatedText;

    // Start countdown
    let countdown = COUNTDOWN_TIME;
    room.countdown = countdown;
    
    const countdownInterval = setInterval(() => {
      countdown--;
      room.countdown = countdown;
      
      this.io.to(room.id).emit('gameCountdown', { 
        countdown 
      });
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        this.io.to(room.id).emit('gameStart', { 
          text: room.gameText, 
          gameTime: GAME_TIME 
        });
      }
    }, 1000);

    console.log(`Game starting in room ${room.id}`);
  }

  private handleProgressUpdate(
    socket: Socket, 
    roomId: string, 
    progress: number, 
    wpm: number, 
    accuracy: number
  ) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const room = this.rooms.get(roomId);
    if (!room || !room.isGameInProgress) return;

    // Update player progress
    const player = room.players.find(p => p.id === user.userId);
    if (player) {
      player.progress = progress;
      player.wpm = wpm;
      player.accuracy = accuracy;

      // Check if player finished
      if (progress >= 100 && !player.finished) {
        player.finished = true;
        player.position = room.results.length + 1;
        
        // Add to results
        room.results.push({
          ...player,
          position: player.position
        });

        // Notify player of their finish position
        socket.emit('playerFinished', { 
          position: player.position 
        });

        // Check if all players finished
        if (room.players.every(p => p.finished)) {
          this.endGame(room);
        }
      }
    }

    // Broadcast progress to all players
    this.io.to(roomId).emit('playerProgress', {
      userId: user.userId,
      progress,
      wpm,
      accuracy,
      finished: player?.finished || false
    });

    console.log(`Progress update from ${user.username} in room ${roomId}: ${progress}%`);
  }

  private endGame(room: Room) {
    room.isGameInProgress = false;
    
    // Calculate final positions based on progress and WPM
    const sortedResults = [...room.players]
      .sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        if (a.wpm !== b.wpm) return b.wpm - a.wpm;
        return b.accuracy - a.accuracy;
      })
      .map((player, index) => ({
        ...player,
        position: index + 1
      }));

    room.results = sortedResults;
    
    // Send results to all players
    this.io.to(room.id).emit('gameResults', { 
      results: sortedResults 
    });

    console.log(`Game ended in room ${room.id}`);
  }

  private handleInviteFriend(socket: Socket, friendId: string, roomId: string) {
    const inviter = this.connectedUsers.get(socket.id);
    if (!inviter) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    // Find friend's socket (in a real app, you'd look up the friend's connection)
    const friendEntry = [...this.connectedUsers.values()].find(u => u.userId === friendId);
    if (!friendEntry) {
      socket.emit('error', { message: 'Friend is not online' });
      return;
    }

    // Send invitation to friend
    this.io.to(friendEntry.socketId).emit('battleInvitation', {
      roomId,
      from: {
        userId: inviter.userId,
        username: inviter.username
      }
    });

    console.log(`Invitation sent to ${friendEntry.username} from ${inviter.username}`);
  }

  private updateOnlineFriends(socket: Socket) {
    const currentUser = this.connectedUsers.get(socket.id);
    if (!currentUser) return;
  
    // Filter out the current user from online friends
    const onlineFriends = [...this.connectedUsers.values()].filter(
      user => user.userId !== currentUser.userId
    );
  
    // Send only to the requesting socket
    socket.emit('onlineFriends', onlineFriends);
  }
  private handleDisconnect(socket: Socket) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;
  
    // Notify others about disconnection
    socket.broadcast.emit('userOffline', {
      userId: user.userId
    });
  
    // Remove from connected users
    this.connectedUsers.delete(socket.id);
  
    console.log(`User disconnected: ${user.username} (${user.userId})`);
  }
}