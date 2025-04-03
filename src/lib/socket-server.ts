import { User } from '@/types/auth';
import { generateTypingText } from '@/utils/serverUtils';
import { Server } from 'socket.io';
import { IncomingMessage, ServerResponse } from 'http';

// Extended Room interface with all required properties
interface GameRoom {
  id: string;
  isPrivate: boolean;
  players: Player[];
  status: 'waiting' | 'countdown' | 'active' | 'finished';
  gameText: string;
  startTime: number | null;
  gameTime: number;
}

interface Player {
  socketId: string;
  userId: string;
  username: string;
  progress: number;
  wpm: number;
  accuracy: number;
  isReady: boolean;
  isFinished: boolean;
}

let io: Server | null = null;

export function initSocketServer(httpServer: any) {
  if (!io) {
    console.log('Initializing Socket.io');
    
    io = new Server(httpServer, { // Removed const to use the outer io variable
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Room management
    const rooms = new Map<string, GameRoom>();
    const userSocketMap = new Map<string, string>(); // userId -> socketId
    const socketUserMap = new Map<string, User>(); // socketId -> User

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      
      // Authenticate user with socket
      socket.on('authenticate', async ({ userId, username }: { userId: string, username: string }) => {
        if (userId && username) {
          userSocketMap.set(userId, socket.id);
          socketUserMap.set(socket.id, { 
            id: userId, 
            username,
            email: '', // You might want to include this in the auth data
            gamesPlayed: 0,
            highestWPM: 0,
            highestAccuracy: 0
          });
          
          // Send online friends
          const onlineFriends = Array.from(socketUserMap.values())
            .filter(user => user.id !== userId);
          socket.emit('onlineFriends', onlineFriends);
          
          // Notify others that a new user is online
          socket.broadcast.emit('userOnline', { userId, username });
        }
      });
      
      // Create a new room
      socket.on('createRoom', ({ isPrivate }: { isPrivate: boolean }) => {
        const user = socketUserMap.get(socket.id);
        if (!user) return;
        
        // Create room with unique ID
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        rooms.set(roomId, {
          id: roomId,
          isPrivate,
          players: [{ 
            socketId: socket.id, 
            userId: user.id, 
            username: user.username,
            progress: 0,
            wpm: 0,
            accuracy: 0,
            isReady: false,
            isFinished: false
          }],
          status: 'waiting',
          gameText: generateTypingText(200),
          startTime: null,
          gameTime: 60
        });
        
        // Join the socket to the room
        socket.join(roomId);
        
        // Emit room details back to creator
        socket.emit('roomCreated', { 
          roomId, 
          isPrivate 
        });
        
        // If public room, broadcast to everyone
        if (!isPrivate) {
          io?.emit('roomAvailable', { 
            roomId, 
            playerCount: 1
          });
        }
        
        console.log(`Room created: ${roomId}, Private: ${isPrivate}`);
      });
      
      // Rest of your socket event handlers remain the same...
      // Just make sure to use the proper types
      // Join an existing room
      socket.on('joinRoom', ({ roomId }: { roomId: string }) => {
        const user = socketUserMap.get(socket.id);
        if (!user) return;
        
        const room = rooms.get(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }
        
        if (room.status !== 'waiting') {
          socket.emit('error', { message: 'Game already in progress' });
          return;
        }
        
        // Add player to room
        room.players.push({ 
          socketId: socket.id, 
          userId: user.id, 
          username: user.username,
          progress: 0,
          wpm: 0,
          accuracy: 0,
          isReady: false,
          isFinished: false
        });
        
        // Join the socket to the room
        socket.join(roomId);
        
        // Notify everyone in room about the new player
        getSocketServer().to(roomId).emit('playerJoined', { 
          players: room.players.map(p => ({
            userId: p.userId,
            username: p.username,
            isReady: p.isReady
          }))
        });
        
        console.log(`User ${user.username} joined room: ${roomId}`);
      });
      
      // Player ready state change
      socket.on('playerReady', ({ roomId, ready }: { roomId: string, ready: boolean }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex === -1) return;
        
        room.players[playerIndex].isReady = ready;
        
        // Notify room about player ready state
        getSocketServer().to(roomId).emit('playerReadyState', {
          userId: room.players[playerIndex].userId,
          isReady: ready
        });
        
        // Check if all players are ready
        const allReady = room.players.every(p => p.isReady);
        if (allReady && room.players.length >= 2) {
          // Start countdown
          room.status = 'countdown';
          let countdown = 3;
          
          getSocketServer().to(roomId).emit('gameCountdown', { countdown });
          
          const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
              getSocketServer().to(roomId).emit('gameCountdown', { countdown });
            } else {
              clearInterval(countdownInterval);
              // Start the game
              room.status = 'active';
              room.startTime = Date.now();
              getSocketServer().to(roomId).emit('gameStart', { 
                text: room.gameText,
                gameTime: room.gameTime 
              });
            }
          }, 1000);
        }
      });
      
      // Receive player progress updates
      socket.on('progressUpdate', ({ 
        roomId, 
        progress, 
        wpm, 
        accuracy 
      }: { 
        roomId: string, 
        progress: number, 
        wpm: number, 
        accuracy: number 
      }) => {
        const room = rooms.get(roomId);
        if (!room || room.status !== 'active') return;
        
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex === -1) return;
        
        // Update player stats
        room.players[playerIndex].progress = progress;
        room.players[playerIndex].wpm = wpm;
        room.players[playerIndex].accuracy = accuracy;
        
        // Check if player finished
        if (progress >= 100 && !room.players[playerIndex].isFinished) {
          room.players[playerIndex].isFinished = true;
          
          // Calculate final position
          const position = room.players.filter(p => p.isFinished).length;
          
          // Notify player about finish position
          socket.emit('playerFinished', { position });
          
          // Notify everyone about player finishing
          io?.to(roomId).emit('playerProgress', {
            userId: room.players[playerIndex].userId,
            progress: 100,
            wpm,
            accuracy,
            finished: true,
            position
          });
          
          // If all players finished, end the game
          if (room.players.every(p => p.isFinished)) {
            endGame(roomId, getSocketServer(), rooms);
          }
        } else {
          // Broadcast progress to all players in room
          io?.to(roomId).emit('playerProgress', {
            userId: room.players[playerIndex].userId,
            progress,
            wpm,
            accuracy,
            finished: false
          });
        }
      });
      
      // Friend battle invitation
      socket.on('inviteFriend', ({ friendId, roomId }: { friendId: string, roomId: string }) => {
        const user = socketUserMap.get(socket.id);
        if (!user) return;
        
        const friendSocketId = userSocketMap.get(friendId);
        if (!friendSocketId) {
          socket.emit('error', { message: 'Friend is not online' });
          return;
        }
        
        // Send invitation to friend
        io?.to(friendSocketId).emit('battleInvitation', {
          roomId,
          from: {
            userId: user.id,
            username: user.username
          }
        });
      });
      
      // Leave room
      socket.on('leaveRoom', ({ roomId }: { roomId: string }) => {
        leaveRoom(socket, roomId, io, rooms, userSocketMap, socketUserMap);
      });
      
      // Disconnect handler
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        const user = socketUserMap.get(socket.id);
        if (user) {
          // Remove from user maps
          userSocketMap.delete(user.id);
          socketUserMap.delete(socket.id);
          
          // Notify others that user is offline
          socket.broadcast.emit('userOffline', { userId: user.id });
          
          // Leave all rooms
          for (const [roomId, room] of rooms.entries()) {
            if (room.players.some(p => p.socketId === socket.id)) {
              leaveRoom(socket, roomId, io, rooms, userSocketMap, socketUserMap);
            }
          }
        }
      });
      
    });
  }
}

export function getSocketServer(): Server {
  if (!io) {
    throw new Error('Socket.io server not initialized');
  }
  return io;
}

// Helper function to handle a player leaving a room
function leaveRoom(
  socket: any,
  roomId: string,
  io: Server | null,
  rooms: Map<string, GameRoom>,
  userSocketMap: Map<string, string>,
  socketUserMap: Map<string, User>
) {
  const room = rooms.get(roomId);
  if (!room || !io) return;
  
  const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
  if (playerIndex === -1) return;
  
  const userId = room.players[playerIndex].userId;
  
  // Remove player from room
  room.players.splice(playerIndex, 1);
  
  // Leave the socket room
  socket.leave(roomId);
  
  // If room is empty, delete it
  if (room.players.length === 0) {
    rooms.delete(roomId);
    io.emit('roomClosed', { roomId });
    console.log(`Room deleted: ${roomId}`);
  } else {
    // Notify remaining players
    io.to(roomId).emit('playerLeft', { userId });
    
    // If game was active, check if we need to end it
    if (room.status === 'active' && room.players.every(p => p.isFinished)) {
      endGame(roomId, io, rooms);
    }
  }
}

// Helper function to end a game
function endGame(roomId: string, io: Server, rooms: Map<string, GameRoom>) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.status = 'finished';
  
  // Create results with player rankings
  const results = room.players
    .map(p => ({
      userId: p.userId,
      username: p.username,
      wpm: p.wpm,
      accuracy: p.accuracy,
      progress: p.progress
    }))
    .sort((a, b) => {
      // First sort by progress (completed or not)
      if (a.progress === 100 && b.progress < 100) return -1;
      if (a.progress < 100 && b.progress === 100) return 1;
      // Then by WPM for those who completed
      if (a.progress === 100 && b.progress === 100) return b.wpm - a.wpm;
      // Finally by progress percentage for those who didn't complete
      return b.progress - a.progress;
    });
  
  // Send results to all players in room
  io.to(roomId).emit('gameResults', { results });
  
  // Reset room to waiting state after 10 seconds
  setTimeout(() => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      if (!room) return;
      
      room.status = 'waiting';
      room.players.forEach(p => {
        p.progress = 0;
        p.wpm = 0;
        p.accuracy = 0;
        p.isReady = false;
        p.isFinished = false;
      });
      
      io.to(roomId).emit('roomReset');
    }
  }, 10000);
}
