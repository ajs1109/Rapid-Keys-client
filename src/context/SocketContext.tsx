'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SERVER_URI } from '@/config';
import useGameStore from '@/store/useGameStore';
import { FriendUser } from '@/types/auth';
import { getFriendsAndRequests } from '@/lib/api';

export interface ChatMessage {
  id: string;
  fromUserId: string;
  fromUsername: string;
  message: string;
  timestamp: number;
  isOwn: boolean;
}

interface SocketContextValue {
  socket: Socket | null;
  onlineUserIds: Set<string>;
  friendRequests: FriendUser[];
  setFriendRequests: React.Dispatch<React.SetStateAction<FriendUser[]>>;
  chatMessages: Record<string, ChatMessage[]>;
  unreadCounts: Record<string, number>;
  activeChatFriend: FriendUser | null;
  openChat: (friend: FriendUser) => void;
  closeChat: () => void;
  sendDM: (toUserId: string, message: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  onlineUserIds: new Set(),
  friendRequests: [],
  setFriendRequests: () => {},
  chatMessages: {},
  unreadCounts: {},
  activeChatFriend: null,
  openChat: () => {},
  closeChat: () => {},
  sendDM: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useGameStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [friendRequests, setFriendRequests] = useState<FriendUser[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [activeChatFriend, setActiveChatFriend] = useState<FriendUser | null>(null);
  // Ref so socket event handlers always see the latest activeChatFriend without re-registering
  const activeChatRef = useRef<FriendUser | null>(null);
  activeChatRef.current = activeChatFriend;

  // Fetch initial pending friend requests once
  useEffect(() => {
    if (!user?.id) return;
    getFriendsAndRequests()
      .then(data => setFriendRequests(data.requests))
      .catch(() => {/* silent */});
  }, [user?.id]);

  // Persistent global socket for presence + chat
  useEffect(() => {
    if (!user?.id) return;

    const sock = io(SERVER_URI, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    sock.on('connect', () => {
      sock.emit('authenticate', { userId: user.id, username: user.username });
    });

    // ── Presence ───────────────────────────────────────────────────────
    sock.on('onlineFriends', (friends: { userId: string }[]) => {
      setOnlineUserIds(new Set(friends.map(f => f.userId)));
    });
    sock.on('userOnline', ({ userId }: { userId: string }) => {
      setOnlineUserIds(prev => new Set([...prev, userId]));
    });
    sock.on('userOffline', ({ userId }: { userId: string }) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // ── Friend request notifications ───────────────────────────────────
    sock.on('friendRequestReceived', ({ userId, username }: { userId: string; username: string }) => {
      setFriendRequests(prev =>
        prev.some(r => r.id === userId) ? prev : [...prev, { id: userId, username }]
      );
    });

    // ── DM chat ────────────────────────────────────────────────────────
    sock.on('receiveDM', ({ fromUserId, fromUsername, message, timestamp }: {
      fromUserId: string;
      fromUsername: string;
      message: string;
      timestamp: number;
    }) => {
      const msg: ChatMessage = {
        id: `${fromUserId}-${timestamp}`,
        fromUserId,
        fromUsername,
        message,
        timestamp,
        isOwn: false,
      };
      setChatMessages(prev => ({
        ...prev,
        [fromUserId]: [...(prev[fromUserId] ?? []), msg],
      }));
      // Only count unread when the chat with this person isn't currently open
      if (activeChatRef.current?.id !== fromUserId) {
        setUnreadCounts(prev => ({
          ...prev,
          [fromUserId]: (prev[fromUserId] ?? 0) + 1,
        }));
      }
    });

    setSocket(sock);

    return () => {
      sock.disconnect();
      setSocket(null);
      setOnlineUserIds(new Set());
    };
  }, [user?.id, user?.username]);

  const openChat = useCallback((friend: FriendUser) => {
    setActiveChatFriend(friend);
    setUnreadCounts(prev => ({ ...prev, [friend.id]: 0 }));
  }, []);

  const closeChat = useCallback(() => {
    setActiveChatFriend(null);
  }, []);

  const sendDM = useCallback((toUserId: string, message: string) => {
    if (!socket || !user) return;
    const timestamp = Date.now();
    socket.emit('sendDM', { toUserId, message, timestamp });
    const msg: ChatMessage = {
      id: `own-${timestamp}`,
      fromUserId: user.id,
      fromUsername: user.username,
      message,
      timestamp,
      isOwn: true,
    };
    setChatMessages(prev => ({
      ...prev,
      [toUserId]: [...(prev[toUserId] ?? []), msg],
    }));
  }, [socket, user]);

  return (
    <SocketContext.Provider value={{
      socket,
      onlineUserIds,
      friendRequests,
      setFriendRequests,
      chatMessages,
      unreadCounts,
      activeChatFriend,
      openChat,
      closeChat,
      sendDM,
    }}>
      {children}
    </SocketContext.Provider>
  );
};
