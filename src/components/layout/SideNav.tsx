'use client'

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useGameStore from '@/store/useGameStore';
import { infoToast, successToast, errorToast } from '@/utils/customToast';
import { getFriendsAndRequests, sendFriendRequest, removeFriend } from '@/lib/api';
import { FriendUser } from '@/types/auth';
import { useSocket } from '@/context/SocketContext';
import {
  Globe,
  Users,
  MessageSquare,
  Trophy,
  HelpCircle,
  LogOut,
  Plus,
  ChevronDown,
  UserPlus,
  Loader2,
  X,
  Trash2,
} from 'lucide-react';

interface SideNavProps {
  onClose?: () => void;
  asOverlay?: boolean;
}

const SideNav: React.FC<SideNavProps> = ({ onClose, asOverlay }) => {
  const { user, highestWPM, logout } = useGameStore();
  const pathname = usePathname();
  const router = useRouter();

  const { socket, onlineUserIds, openChat, unreadCounts } = useSocket();

  const [friendsOpen, setFriendsOpen] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const addFriendInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getFriendsAndRequests()
      .then(data => setFriends(data.friends))
      .catch(() => {/* silent */});
  }, []);

  const handleAddFriend = async () => {
    const name = addFriendInput.trim();
    if (!name) return;
    setAddFriendLoading(true);
    try {
      const res = await sendFriendRequest(name);
      successToast(res.message);
      setAddFriendInput('');
      if (res.targetId && socket) {
        socket.emit('notifyFriendRequest', { toUserId: res.targetId });
      }
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setAddFriendLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId);
      setFriends(prev => prev.filter(f => f.id !== friendId));
      successToast('Friend removed');
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to remove friend');
    }
  };

  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(user?.username ?? 'user')}`;

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
  };

  return (
    <>
      {/* Backdrop for overlay mode */}
      {asOverlay && onClose && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`h-screen w-64 fixed left-0 top-0 pt-20 bg-slate-900/60 backdrop-blur-md shadow-2xl flex flex-col border-r border-white/5 font-headline transition-all ${asOverlay ? 'z-50' : 'z-40'}`}>

        {/* Close button (overlay mode) */}
        {asOverlay && onClose && (
          <button
            onClick={onClose}
            className="absolute top-[72px] right-3 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
          >
            <X size={16} />
          </button>
        )}

        {/* User identity mini-card */}
        <div className="px-6 py-4 flex items-center gap-3 border-b border-white/5 mb-2">
          <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt={user?.username ?? 'User'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-secondary truncate text-sm">
              {user?.username ?? 'Player'}
            </div>
            <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">
              {highestWPM > 0 ? `${highestWPM} WPM Best` : 'Just Starting'}
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 mt-2 overflow-y-auto">

          {/* Global Lobby */}
          <button
            onClick={() => router.push('/multi-player')}
            className={[
              'w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 text-sm',
              pathname === '/multi-player'
                ? 'text-secondary border-r-4 border-secondary bg-secondary/10'
                : 'text-on-surface-variant hover:bg-white/5 hover:text-secondary hover:translate-x-1',
            ].join(' ')}
          >
            <Globe size={18} className="shrink-0" />
            <span className="font-medium">Global Lobby</span>
            {pathname !== '/multi-player' && (
              <span className="ml-auto text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-mono">LIVE</span>
            )}
          </button>

          {/* Friends accordion */}
          <div>
            <button
              onClick={() => setFriendsOpen(v => !v)}
              className="w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 text-sm text-on-surface-variant hover:bg-white/5 hover:text-secondary"
            >
              <Users size={18} className="shrink-0" />
              <span className="font-medium">Friends</span>
              {friends.length > 0 && (
                <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono mr-1">
                  {friends.length}
                </span>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform shrink-0 ${friendsOpen ? 'rotate-180' : ''} ${friends.length > 0 ? '' : 'ml-auto'}`}
              />
            </button>

            {friendsOpen && (
              <div className="bg-black/20 border-t border-b border-white/5">
                {friends.length === 0 ? (
                  <p className="px-6 py-3 text-xs text-on-surface-variant/50 italic">No friends yet</p>
                ) : (
                  <ul className="py-1">
                    {friends.map(f => (
                      <li key={f.id} className="px-4 py-2 flex items-center gap-2 text-sm text-on-surface hover:bg-white/5 transition-all group">
                        <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${onlineUserIds.has(f.id) ? 'bg-tertiary' : 'bg-on-surface-variant/30'}`} />
                        <button
                          onClick={() => openChat(f)}
                          className="flex-1 truncate text-left hover:text-secondary transition-colors"
                        >
                          {f.username}
                        </button>
                        {unreadCounts[f.id] > 0 && (
                          <span className="min-w-[16px] h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none">
                            {unreadCounts[f.id]}
                          </span>
                        )}
                        <button
                          onClick={() => handleRemoveFriend(f.id)}
                          title="Remove friend"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-on-surface-variant hover:text-error shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add friend */}
                <div className="px-4 py-3 border-t border-white/5 flex gap-2">
                  <input
                    ref={addFriendInputRef}
                    type="text"
                    value={addFriendInput}
                    onChange={e => setAddFriendInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                    placeholder="Add by username…"
                    className="flex-1 min-w-0 bg-white/5 text-on-surface rounded-lg px-3 py-1.5 text-xs outline-none border border-white/5 focus:ring-1 focus:ring-secondary/40 placeholder:text-on-surface-variant/40"
                  />
                  <button
                    onClick={handleAddFriend}
                    disabled={addFriendLoading || !addFriendInput.trim()}
                    className="p-1.5 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all disabled:opacity-40 shrink-0"
                    title="Send friend request"
                  >
                    {addFriendLoading
                      ? <Loader2 size={14} className="animate-spin" />
                      : <UserPlus size={14} />
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <button
            onClick={() => infoToast('Coming Soon', 'Messages feature under development')}
            className="w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 text-sm text-on-surface-variant hover:bg-white/5 hover:text-secondary hover:translate-x-1"
          >
            <MessageSquare size={18} className="shrink-0" />
            <span className="font-medium">Messages</span>
          </button>

          {/* Achievements */}
          <button
            onClick={() => infoToast('Coming Soon', 'Achievements feature under development')}
            className="w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 text-sm text-on-surface-variant hover:bg-white/5 hover:text-secondary hover:translate-x-1"
          >
            <Trophy size={18} className="shrink-0" />
            <span className="font-medium">Achievements</span>
          </button>
        </nav>

        {/* Create Room CTA */}
        <div className="px-4 mb-4">
          <button
            onClick={() => router.push('/multi-player')}
            className="w-full py-3 bg-secondary/10 border border-secondary/30 text-secondary font-bold rounded-lg hover:bg-secondary/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={16} />
            Create Room
          </button>
        </div>

        {/* Bottom actions */}
        <div className="border-t border-white/5 py-4">
          <button className="w-full text-on-surface-variant px-4 py-2 flex items-center gap-3 hover:text-secondary transition-all cursor-pointer text-sm">
            <HelpCircle size={16} />
            <span className="font-medium">Support</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-on-surface-variant px-4 py-2 flex items-center gap-3 hover:text-error transition-all cursor-pointer text-sm"
          >
            <LogOut size={16} />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default SideNav;
