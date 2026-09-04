'use client'

import React, { useEffect } from 'react';
import { ArrowRight, Zap, BrainCircuit, Swords } from 'lucide-react';
import useGameStore from '@/store/useGameStore';
import type { GameMode, GameState } from '@/types/game';
import { useRouter } from 'next/navigation';
import { successToast } from '@/utils/customToast';

const MenuPage: React.FC = () => {
  const { setGameState, setGameMode, highestWPM } = useGameStore();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('guestScore') === 'saved') {
      successToast('Typing score saved', 'Your guest result is now part of your Rapid Keys profile.');
      window.history.replaceState({}, '', '/menu');
    }
  }, []);

  const handleModeSelect = (mode: NonNullable<GameMode>) => {
    setGameMode(mode);
    setGameState(mode as GameState);
    router.push(`/${mode}-player`);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] px-8 md:px-12 pb-12 flex flex-col items-center justify-center relative overflow-hidden">

      {/* Velocity perspective grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(222,142,255,0.03) 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(222,142,255,0.03) 50px)',
            transform: 'perspective(500px) rotateX(60deg)',
          }}
        />
      </div>

      {/* Heading cluster */}
      <div className="text-center mb-10 space-y-3">
        <h1 className="text-4xl md:text-6xl font-headline font-extrabold italic tracking-tighter text-on-surface uppercase">
          SELECT YOUR{' '}
          <span
            className="text-transparent bg-clip-text animate-pulse"
            style={{
              backgroundImage: 'linear-gradient(to right, #de8eff, #00eefc, #de8eff)',
              backgroundSize: '200% auto',
            }}
          >
            ARENA
          </span>
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg font-light tracking-wide max-w-xl mx-auto">
          Hone your skills in isolation or dominate the global circuit.
        </p>
      </div>

      {/* Mode selection grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl">

        {/* ── Practice Range ── */}
        <div
          className="group relative bg-slate-950/40 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 border border-white/5 hover:border-secondary/30 cursor-pointer"
          onClick={() => handleModeSelect('single')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="p-8 flex flex-col h-full relative z-10">
            {/* Top row */}
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-secondary shadow-[0_0_20px_rgba(0,238,252,0.1)]">
                <BrainCircuit size={26} />
              </div>
              <div className="text-right">
                <div className="stat-label mb-1">Your Best</div>
                <div className="text-4xl font-headline font-bold text-secondary">
                  {highestWPM > 0 ? highestWPM : '—'}{' '}
                  <span className="text-lg font-light text-on-surface-variant">WPM</span>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-headline font-bold text-on-surface mb-3">PRACTICE RANGE</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
              Experience <span className="text-secondary">Zen Mode</span>. A distraction-free environment designed to build
              muscle memory and peak accuracy without competitive pressure.
            </p>

            {/* Bottom row */}
            <div className="mt-auto flex items-center justify-between">
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-surface-container-highest border border-outline-variant/20 text-xs text-on-surface-variant uppercase tracking-tighter">
                  Solo
                </span>
                <span className="px-3 py-1 rounded-full bg-surface-container-highest border border-outline-variant/20 text-xs text-on-surface-variant uppercase tracking-tighter">
                  Unlimited
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleModeSelect('single'); }}
                className="group/btn flex items-center gap-3 py-3 px-8 bg-surface-container-highest border border-secondary/20 rounded-lg hover:bg-secondary hover:text-black transition-all font-bold tracking-widest text-sm uppercase active:scale-95 shadow-lg"
              >
                ENTER RANGE
                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          {/* Ambient glow */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/10 blur-[80px] rounded-full pointer-events-none" />
        </div>

        {/* ── Battle Arena ── */}
        <div
          className="group relative bg-slate-950/40 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 border-beam cursor-pointer"
          onClick={() => handleModeSelect('multi')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="p-8 flex flex-col h-full relative z-10">
            {/* Top row */}
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary shadow-[0_0_20px_rgba(222,142,255,0.15)]">
                <Swords size={26} />
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                  <span className="stat-label" style={{ color: '#c4ffcd' }}>Live Now</span>
                </div>
                <div className="text-4xl font-headline font-bold text-primary">
                  Arena <span className="text-lg font-light text-on-surface-variant">Awaits</span>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-headline font-bold text-on-surface mb-3">BATTLE ARENA</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
              Engage in <span className="text-primary">High-Stakes Racing</span>. Face off against global contenders
              in real-time ranked matches and climb the leaderboard.
            </p>

            {/* Bottom row */}
            <div className="mt-auto flex items-center justify-between">
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs text-primary uppercase tracking-tighter">
                  Competitive
                </span>
                <span className="px-3 py-1 rounded-full bg-surface-container-highest border border-outline-variant/20 text-xs text-on-surface-variant uppercase tracking-tighter">
                  Ranked
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleModeSelect('multi'); }}
                className="shiny-btn-mask group/btn flex items-center gap-3 py-3 px-8 bg-gradient-to-r from-primary to-primary-dim rounded-lg hover:shadow-[0_0_30px_rgba(222,142,255,0.4)] transition-all font-extrabold tracking-widest text-sm uppercase text-on-primary-fixed active:scale-95"
              >
                FIND MATCH
                <Zap size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          {/* Ambient glow */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
        </div>
      </div>

      {/* Decorative velocity lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden -z-10">
        <div className="absolute h-px w-screen bg-gradient-to-r from-transparent via-primary/40 to-transparent top-1/4 -left-1/4 rotate-12 blur-[1px]" />
        <div className="absolute h-px w-screen bg-gradient-to-r from-transparent via-secondary/40 to-transparent top-2/3 -right-1/4 -rotate-12 blur-[1px]" />
        <div className="absolute h-px w-screen bg-gradient-to-r from-transparent via-white/20 to-transparent top-1/2 left-0 rotate-45 blur-[2px]" />
      </div>

      {/* Bottom status bar */}
      <div className="fixed bottom-8 right-8 flex gap-6 items-center bg-surface-container-low/80 backdrop-blur-md px-6 py-3 rounded-full border border-outline-variant/10 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tertiary" />
          <span className="text-xs font-mono text-on-surface-variant">SERVER: US-EAST-1</span>
        </div>
        <div className="h-4 w-px bg-outline-variant/30" />
        <span className="text-xs font-mono text-on-surface-variant">LATENCY: —</span>
        <div className="h-4 w-px bg-outline-variant/30" />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs font-mono text-on-surface-variant uppercase">Connected</span>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
