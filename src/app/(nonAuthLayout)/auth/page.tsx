'use client'

import React, { FormEvent, useEffect, useState } from 'react';
import { signUp, login, claimGuestScore } from '@/lib/api';
import useGameStore from '@/store/useGameStore';
import { useRouter } from 'next/navigation'
import { errorToast } from '@/utils/customToast';

type AuthEvent = FormEvent<HTMLFormElement> & {
  target: HTMLFormElement & {
    elements: {
      username?: HTMLInputElement;
      email: HTMLInputElement;
      password: HTMLInputElement;
    };
  };
};

const AuthForms = () => {
  const { setGameState } = useGameStore();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const router = useRouter();

  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get('mode');
    if (requestedMode === 'signup') setActiveTab('signup');
  }, []);

  const handleLogin = async (e: AuthEvent) => { 
    e.preventDefault();
    
    try {
      const formData = new FormData(e.target);
      await login(
        formData.get('email') as string,
        formData.get('password') as string
      );

      await onAuthSuccess();
    } catch (error) {
      errorToast(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const handleSignup = async (e: AuthEvent) => {
    e.preventDefault();
    
    try {
      const formData = new FormData(e.target);
      await signUp(
        formData.get('username') as string,
        formData.get('email') as string,
        formData.get('password') as string
      );

      await onAuthSuccess();
    } catch (error) {
      errorToast(error instanceof Error ? error.message : 'Signup failed')
    }
  };

  const onAuthSuccess = async () => {
    setGameState('menu');
    window.dispatchEvent(new Event('auth-state-changed'));

    let guestScoreSaved = false;
    const pendingScore = window.sessionStorage.getItem('rapid-keys-pending-score');
    if (pendingScore) {
      try {
        const { wpm, accuracy } = JSON.parse(pendingScore) as { wpm: number; accuracy: number };
        await claimGuestScore(wpm, accuracy);
        window.sessionStorage.removeItem('rapid-keys-pending-score');
        guestScoreSaved = true;
      } catch {
        // Keep the pending result so the user can retry saving after authentication.
      }
    }

    const next = new URLSearchParams(window.location.search).get('next');
    if (next === 'multi-player') {
      router.push('/multi-player');
      return;
    }
    router.push(guestScoreSaved ? '/menu?guestScore=saved' : '/menu');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Ambient glow */}
      <div className="particle-bg pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Brand */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-headline font-extrabold italic" style={{ color: '#de8eff', textShadow: '0 0 40px rgba(222,142,255,0.4)' }}>
          Rapid Keys
        </h1>
        <p className="text-on-surface-variant mt-2 text-sm tracking-widest uppercase">Type faster. Race harder.</p>
      </div>

      <div className="glass-panel w-full max-w-md p-8">
        {/* Tabs */}
        <div className="flex border-b border-white/5 mb-8">
          {(['login', 'signup'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-tabtrigger={tab}
              data-active={activeTab === tab ? 'true' : 'false'}
              className="flex-1 pb-3 text-sm font-bold uppercase tracking-widest transition-all data-[active=true]:text-primary data-[active=true]:border-b-2 data-[active=true]:border-primary data-[active=false]:text-on-surface-variant"
            >
              {tab === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Login tab */}
        <div id="tab-login" data-tab hidden={activeTab !== 'login'}>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="stat-label block mb-2" htmlFor="login-email">Email or Username</label>
              <input
                id="login-email" name="email" type="text" placeholder="speed@racer.io" required
                className="w-full bg-surface-container-highest text-on-surface rounded-lg px-4 py-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-secondary/30 transition-all placeholder:text-on-surface-variant/40"
              />
            </div>
            <div>
              <label className="stat-label block mb-2" htmlFor="login-password">Password</label>
              <input
                id="login-password" name="password" type="password" required
                className="w-full bg-surface-container-highest text-on-surface rounded-lg px-4 py-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-secondary/30 transition-all"
              />
            </div>
            <button
              type="submit"
              className="shiny-btn-mask w-full py-4 bg-gradient-to-r from-primary to-primary-dim text-on-primary-fixed rounded-xl font-headline font-bold shadow-glow-primary hover:brightness-110 active:scale-[0.98] transition-all mt-2"
            >
              Log In
            </button>
          </form>
        </div>

        {/* Signup tab */}
        <div id="tab-signup" data-tab hidden={activeTab !== 'signup'}>
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="stat-label block mb-2" htmlFor="signup-username">Username</label>
              <input
                id="signup-username" name="username" type="text" placeholder="speedtyper_x" required
                className="w-full bg-surface-container-highest text-on-surface rounded-lg px-4 py-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-secondary/30 transition-all placeholder:text-on-surface-variant/40"
              />
            </div>
            <div>
              <label className="stat-label block mb-2" htmlFor="signup-email">Email</label>
              <input
                id="signup-email" name="email" type="email" placeholder="you@example.com" required
                className="w-full bg-surface-container-highest text-on-surface rounded-lg px-4 py-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-secondary/30 transition-all placeholder:text-on-surface-variant/40"
              />
            </div>
            <div>
              <label className="stat-label block mb-2" htmlFor="signup-password">Password</label>
              <input
                id="signup-password" name="password" type="password" required
                className="w-full bg-surface-container-highest text-on-surface rounded-lg px-4 py-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-secondary/30 transition-all"
              />
            </div>
            <button
              type="submit"
              className="shiny-btn-mask w-full py-4 bg-gradient-to-r from-secondary/20 to-secondary/10 border border-secondary/30 text-secondary rounded-xl font-headline font-bold hover:bg-secondary/20 active:scale-[0.98] transition-all mt-2"
            >
              Create Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthForms;
