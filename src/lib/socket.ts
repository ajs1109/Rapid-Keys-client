import { Server } from 'socket.io';
import { NextApiResponseWithSocket } from '@/types/socket';
import { generateTypingText } from '@/utils/serverUtils';

// Extend NextApiResponse to include socket.io
export default function SocketHandler(_: any, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io');
    
    const io = new Server(res.socket.server as any, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Room management
    const rooms = new Map<string, Room>();
    const userSocketMap = new Map<string, string>(); // userId -> socketId
    const socketUserMap = new Map<string, User>(); // socketId -> User

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      
      // Authenticate user with socket
      socket.on('authenticate', async ({ userId, username }: { userId: string, username: string }) => {
        if (userId && username) {
          userSocketMap.set(userId, socket.id);
          socketUserMap.set(socket.id, { userId, username });
          
          // Send online friends
          const onlineFriends = Array.from(socketUserMap.values())
            .filter(user => user.userId !== userId);
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
            userId: user.userId, 
            username: user.username,
            progress: 0,
            wpm: 0,
            accuracy: 0,
            isReady: false,
            isFinished: false
          }],
          status: 'waiting', // waiting, countdown, active, finished
          gameText: generateTypingText(200),
          startTime: null,
          gameTime: 60 // Default game time (seconds)
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
          io.emit('roomAvailable', { 
            roomId, 
            playerCount: 1
          });
        }
        
        console.log(`Room created: ${roomId}, Private: ${isPrivate}`);
      });
      
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
          userId: user.userId, 
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
        io.to(roomId).emit('playerJoined', { 
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
        io.to(roomId).emit('playerReadyState', {
          userId: room.players[playerIndex].userId,
          isReady: ready
        });
        
        // Check if all players are ready
        const allReady = room.players.every(p => p.isReady);
        if (allReady && room.players.length >= 2) {
          // Start countdown
          room.status = 'countdown';
          let countdown = 3;
          
          io.to(roomId).emit('gameCountdown', { countdown });
          
          const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
              io.to(roomId).emit('gameCountdown', { countdown });
            } else {
              clearInterval(countdownInterval);
              // Start the game
              room.status = 'active';
              room.startTime = Date.now();
              io.to(roomId).emit('gameStart', { 
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
          io.to(roomId).emit('playerProgress', {
            userId: room.players[playerIndex].userId,
            progress: 100,
            wpm,
            accuracy,
            finished: true,
            position
          });
          
          // If all players finished, end the game
          if (room.players.every(p => p.isFinished)) {
            endGame(roomId, io, rooms);
          }
        } else {
          // Broadcast progress to all players in room
          io.to(roomId).emit('playerProgress', {
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
        io.to(friendSocketId).emit('battleInvitation', {
          roomId,
          from: {
            userId: user.userId,
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
          userSocketMap.delete(user.userId);
          socketUserMap.delete(socket.id);
          
          // Notify others that user is offline
          socket.broadcast.emit('userOffline', { userId: user.userId });
          
          // Leave all rooms
          for (const [roomId, room] of rooms.entries()) {
            if (room.players.some(p => p.socketId === socket.id)) {
              leaveRoom(socket, roomId, io, rooms, userSocketMap, socketUserMap);
            }
          }
        }
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}

// Helper function to handle a player leaving a room
function leaveRoom(
  socket: any,
  roomId: string,
  io: Server,
  rooms: Map<string, Room>,
  userSocketMap: Map<string, string>,
  socketUserMap: Map<string, User>
) {
  const room = rooms.get(roomId);
  if (!room) return;
  
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
function endGame(roomId: string, io: Server, rooms: Map<string, Room>) {
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

// // Helper function to generate typing text
// function generateTypingText(): string {
//   const sentences = [];
//   const wordCount = 50; // Adjust for desired length
  
//   for (let i = 0; i < wordCount; i++) {
//     sentences.push(randomSentence({ words: 5 + Math.floor(Math.random() * 10) }));
//   }
  
//   return sentences.join(' ');
// }

// Types
interface User {
  userId: string;
  username: string;
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

interface Room {
  id: string;
  isPrivate: boolean;
  players: Player[];
  status: 'waiting' | 'countdown' | 'active' | 'finished';
  gameText: string;
  startTime: number | null;
  gameTime: number;
}