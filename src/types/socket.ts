import { Server as NetServer, Socket } from 'net';
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export interface Player {
  userId: string;
  username: string;
  isReady?: boolean;
  progress?: number;
  wpm?: number;
  accuracy?: number;
  finished?: boolean;
}

export interface Room {
  roomId: string;
  playerCount: number;
}

export interface Friend {
  userId: string;
  username: string;
}

export interface GameResults {
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
  progress: number;
}