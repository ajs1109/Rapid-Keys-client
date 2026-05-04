// components/layout/Header.tsx  — Kinetic Precision TopNavBar
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Settings, Check, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import useGameStore from '@/store/useGameStore';
import { respondToFriendRequest } from '@/lib/api';
import { successToast, errorToast } from '@/utils/customToast';
import { useSocket } from '@/context/SocketContext';

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useGameStore();

  const { friendRequests: requests, setFriendRequests } = useSocket();

  const [showNotifs, setShowNotifs] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        bellRef.current && !bellRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRespond = async (fromUserId: string, action: 'accept' | 'decline') => {
    try {
      const res = await respondToFriendRequest(fromUserId, action);
      successToast(res.message);
      setFriendRequests(prev => prev.filter(r => r.id !== fromUserId));
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed');
    }
  };

  const navLinks = [
    { label: 'Battle',      href: '/multi-player'  },
    { label: 'Practice',    href: '/single-player' },
    { label: 'Leaderboard', href: '#'              },
  ];

  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(user?.username ?? 'user')}`;

  return (
    <header className="fixed top-0 w-full z-50 bg-slate-950/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex items-center justify-between px-8 py-4 font-headline">
      {/* Brand */}
      <button
        onClick={() => router.push('/menu')}
        className="text-2xl font-bold tracking-wider text-purple-500 italic select-none hover:text-purple-400 transition-colors"
      >
        Rapid Keys
      </button>

      {/* Centre nav */}
      <nav className="hidden md:flex items-center gap-8 tracking-tight">
        {navLinks.map(({ label, href }) => {
          const isActive = pathname === href;
          const isDisabled = href === '#';
          return (
            <button
              key={label}
              onClick={() => !isDisabled && router.push(href)}
              disabled={isDisabled}
              className={[
                'text-sm transition-all pb-0.5',
                isActive
                  ? 'text-purple-400 border-b-2 border-purple-500'
                  : isDisabled
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-400 hover:text-slate-200',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* Notifications bell */}
        <div className="relative">
          <button
            ref={bellRef}
            title="Notifications"
            onClick={() => setShowNotifs(v => !v)}
            className="relative text-slate-400 hover:bg-white/5 transition-all p-2 rounded-full"
          >
            <Bell size={18} />
            {requests.length > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-error text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                {requests.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-full mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-white/5">
                <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                  Friend Requests
                </span>
              </div>
              {requests.length === 0 ? (
                <p className="px-4 py-4 text-xs text-on-surface-variant/50 italic text-center">No pending requests</p>
              ) : (
                <ul>
                  {requests.map(r => (
                    <li key={r.id} className="px-4 py-3 flex items-center gap-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
                      <span className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-sm shrink-0">
                        {r.username[0].toUpperCase()}
                      </span>
                      <span className="flex-1 text-sm text-on-surface truncate">{r.username}</span>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleRespond(r.id, 'accept')}
                          className="p-1.5 rounded-lg bg-tertiary/10 text-tertiary hover:bg-tertiary/20 transition-all"
                          title="Accept"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => handleRespond(r.id, 'decline')}
                          className="p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-all"
                          title="Decline"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <button
          title="Settings"
          onClick={() => router.push('/profile')}
          className="text-slate-400 hover:bg-white/5 transition-all p-2 rounded-full"
        >
          <Settings size={18} />
        </button>
        <button
          onClick={() => router.push('/profile')}
          className="h-9 w-9 rounded-full border-2 border-primary/50 overflow-hidden hover:scale-105 transition-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt={user?.username ?? 'Profile'}
            className="w-full h-full object-cover"
          />
        </button>
      </div>

      {/* Bottom gradient separator */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
    </header>
  );

};

export default Header;
