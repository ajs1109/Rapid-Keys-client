'use client'

import React from 'react';
import useGameStore from '@/store/useGameStore';
import { useRouter } from 'next/navigation';
import { Plus, Lock, Zap } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import ShinyButton from '@/components/ui/ShinyButton';

const GameModeSelection: React.FC = () => {
  const { setGameMode, setGameState } = useGameStore();
  const router = useRouter();

  const handleSinglePlayer = () => {
    setGameMode('single');
    setGameState('single');
    router.push('/single-player');
  };

  const handleMultiPlayer = () => {
    setGameMode('multi');
    setGameState('multi');
    router.push('/multi-player');
  };

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-10 space-y-2">
        <h1 className="text-5xl font-bold font-headline text-on-surface tracking-tight">
          Battle Lobby
        </h1>
        <p className="text-on-surface-variant font-medium">
          Select your arena. Compete in high-stakes typing sprints.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="bento-grid">

        {/* ── Create a Room (8 cols) ── */}
        <GlassPanel
          glow="primary"
          className="col-span-12 lg:col-span-8 p-8 flex flex-col justify-between relative group overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Plus className="text-primary" size={28} />
              <h2 className="text-2xl font-bold font-headline">Create a Room</h2>
            </div>
            <p className="text-on-surface-variant max-w-md mb-8">
              Host your own typing battle. Set it public so anyone can join, or go private for an
              invite-only showdown with your friends.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <ShinyButton
              variant="primary"
              size="lg"
              icon={<Zap size={18} />}
              onClick={handleMultiPlayer}
            >
              Start Public Battle
            </ShinyButton>
            <ShinyButton
              variant="secondary"
              size="lg"
              icon={<Lock size={18} />}
              onClick={handleMultiPlayer}
            >
              Create Private Room
            </ShinyButton>
          </div>
        </GlassPanel>

        {/* ── Solo Practice (4 cols) ── */}
        <GlassPanel
          glow="secondary"
          className="col-span-12 lg:col-span-4 p-8 flex flex-col justify-center border-2 border-transparent hover:border-secondary/20 transition-all group"
        >
          <h3 className="text-xl font-bold font-headline mb-4 flex items-center gap-2">
            <span className="text-secondary">⌨</span>
            Solo Practice
          </h3>
          <p className="text-on-surface-variant text-sm mb-6">
            Sharpen your skills in a distraction-free Zen mode. No opponents, just you and the clock.
          </p>
          <ShinyButton
            variant="secondary"
            size="md"
            className="w-full"
            onClick={handleSinglePlayer}
          >
            Enter Practice Mode
          </ShinyButton>
        </GlassPanel>

        {/* ── Live Lobby placeholder (12 cols) ── */}
        <GlassPanel className="col-span-12 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="text-tertiary" size={20} />
              <h3 className="text-xl font-bold font-headline">Live Lobby</h3>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse" />
                Online
              </span>
            </div>
          </div>

          {/* Empty state: rooms load on the multi-player page */}
          <div className="px-6 py-12 flex flex-col items-center justify-center gap-4 text-on-surface-variant">
            <Zap size={40} className="opacity-20" />
            <p className="text-sm">Join a room to see the live lobby</p>
            <ShinyButton variant="primary" size="sm" onClick={handleMultiPlayer}>
              Go to Battle →
            </ShinyButton>
          </div>
        </GlassPanel>

      </div>
    </div>
  );
};

export default GameModeSelection;
