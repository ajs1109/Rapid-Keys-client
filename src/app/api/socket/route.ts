import { NextRequest, NextResponse } from 'next/server';
import { initSocketServer } from '@/lib/socket-server';

export const GET = async (req: NextRequest) => {
  try {
    // This ensures the socket server is initialized
    const socketServer = initSocketServer((req as any).socket?.server);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to initialize socket' },
      { status: 500 }
    );
  }
};