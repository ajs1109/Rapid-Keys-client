'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RotateCcw, Home, Star, TrendingUp, Keyboard } from 'lucide-react';
import useGameStore from '@/store/useGameStore';
import { useRouter } from 'next/navigation';
import { generateWords, updateScore } from '@/lib/api';
import GlassPanel from '@/components/ui/GlassPanel';
import ShinyButton from '@/components/ui/ShinyButton';

const SAMPLE_TEXT = `Technology continues to transform the way we live and work in unprecedented ways. As artificial intelligence becomes more sophisticated, it opens up new possibilities for innovation and efficiency. However, we must carefully consider the ethical implications of these advances. The rapid pace of digital transformation requires us to adapt quickly while maintaining our human connections. Despite the challenges, this era of technological revolution presents exciting opportunities for those who are willing to embrace change and learn continuously.`;
const GAME_TIME = 60;

const SinglePlayer = () => {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [userInput, setUserInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [showResults, setShowResults] = useState(false);
  const [isHighScore, setIsHighScore] = useState(false);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [correctCharacters, setCorrectCharacters] = useState(0);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const { setGameState, setGameMode, user, setHighScore, highestAccuracy, highestWPM, setGamesPlayed, gamesPlayed } = useGameStore();
  const router = useRouter();

  const getWords = async () => {
    try {
      const { words } = await generateWords(200);
      setText(words);
    } catch {
      // fallback to SAMPLE_TEXT — already set
    }
  };

  useEffect(() => {
    hiddenInputRef.current?.focus();
    const handleClick = () => hiddenInputRef.current?.focus();
    document.addEventListener('click', handleClick);
    getWords();
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Timer
  useEffect(() => {
    let id: NodeJS.Timeout | undefined;
    if (isActive && timeLeft > 0) {
      id = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(id); endGame(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (id) clearInterval(id); };
  }, [isActive, timeLeft]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Start on first keypress
  useEffect(() => {
    if (!isActive && userInput.length > 0) setIsActive(true);
  }, [userInput, isActive]);

  // WPM + accuracy calculation
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    const minutes = (GAME_TIME - timeLeft) / 60;
    let correctChars = 0, correctWordsCount = 0, cur = '', exp = '';
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === text[i]) {
        correctChars++;
        cur += userInput[i];
        exp += text[i];
        if (userInput[i] === ' ') {
          if (cur.trim() === exp.trim()) correctWordsCount++;
          cur = ''; exp = '';
        }
      } else { cur = ''; exp = ''; }
    }
    setCorrectCharacters(correctChars);
    setTotalCharacters(userInput.length);
    setAccuracy(userInput.length > 0 ? Math.round((correctChars / userInput.length) * 100) : 100);
    setWpm(Math.round(correctWordsCount / Math.max(minutes, 1 / 60)));
  }, [userInput, isActive, timeLeft, text]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (timeLeft > 0) setUserInput(e.target.value);
  };

  const endGame = async () => {
    setIsActive(false);
    const currentScore = wpm * accuracy;
    const highestScore = highestWPM * highestAccuracy;
    if (currentScore > highestScore || (currentScore === highestScore && wpm > highestWPM)) {
      setHighScore(wpm, accuracy);
      setIsHighScore(true);
    }
    const updatedGamesPlayed = gamesPlayed + 1;
    setGamesPlayed(updatedGamesPlayed);
    try { await updateScore(user?.id ?? '', wpm, accuracy, updatedGamesPlayed); } catch { /* ignore */ }
    setShowResults(true);
  };

  const resetGame = () => {
    setUserInput(''); setIsActive(false); setTimeLeft(GAME_TIME);
    setWpm(0); setAccuracy(100); setShowResults(false);
    setTotalCharacters(0); setCorrectCharacters(0); setIsHighScore(false);
    getWords();
    hiddenInputRef.current?.focus();
  };

  const homeButton = () => {
    setGameState('menu'); setGameMode(null); router.push('/menu');
  };

  const progress = text.length > 0 ? Math.min(100, Math.round((userInput.length / text.length) * 100)) : 0;

  // ── Rendered text with char-by-char coloring ──────────────────────────
  const renderedText = useMemo(() => {
    return text.split('').map((char, index) => {
      let cls = 'transition-colors duration-75 ';
      if (index < userInput.length) {
        cls += userInput[index] === char
          ? 'text-on-surface'
          : 'text-error bg-error/10';
      } else if (index === userInput.length) {
        cls += 'relative';
      } else {
        cls += 'text-on-surface-variant';
      }
      return (
        <span key={index} className={cls}>
          {index === userInput.length && <span className="caret-custom" />}
          {char}
        </span>
      );
    });
  }, [text, userInput]);

  // ── Sparkline data ─────────────────────────────────────────────────────
  const wpmHistory = useRef<number[]>([]);
  useEffect(() => {
    if (isActive) wpmHistory.current = [...wpmHistory.current.slice(-7), wpm];
  }, [wpm, isActive]);

  // ── Results overlay ────────────────────────────────────────────────────
  const ResultsOverlay = () => {
    const maxBar = Math.max(...wpmHistory.current, 1);
    return (
      <div className="fixed inset-0 z-60 bg-background/90 backdrop-blur-md flex items-center justify-center p-6">
        <GlassPanel elevated className="w-full max-w-5xl p-10 relative overflow-hidden">
          {/* ambient glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-5xl font-headline font-bold tracking-tight text-on-surface mb-2">
                  PRACTICE COMPLETE
                </h2>
                <p className="text-on-surface-variant uppercase tracking-[0.3em] text-sm">
                  Session Summary • 60 Seconds
                </p>
              </div>
              {isHighScore && (
                <div className="flex items-center gap-3 bg-tertiary/10 border border-tertiary/30 px-6 py-3 rounded-xl">
                  <Star size={20} className="text-tertiary" />
                  <span className="text-tertiary font-headline font-bold text-lg uppercase italic">
                    New Personal Best!
                  </span>
                </div>
              )}
            </div>

            {/* Bento stat grid */}
            <div className="grid grid-cols-12 gap-6 mb-10">
              {/* WPM */}
              <div className="col-span-12 md:col-span-4 bg-surface-container-highest p-8 rounded-xl flex flex-col justify-between">
                <span className="stat-label mb-4">Final Speed</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-headline font-extrabold text-secondary tracking-tighter">{wpm}</span>
                  <span className="text-on-surface-variant font-headline font-medium text-xl">WPM</span>
                </div>
                {isHighScore && (
                  <div className="mt-6 flex items-center gap-2 text-tertiary text-sm">
                    <TrendingUp size={14} /><span>New personal best!</span>
                  </div>
                )}
              </div>

              {/* Accuracy */}
              <div className="col-span-12 md:col-span-4 bg-surface-container-highest p-8 rounded-xl flex flex-col justify-between">
                <span className="stat-label mb-4">Accuracy Rate</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-headline font-extrabold text-tertiary tracking-tighter">{accuracy}</span>
                  <span className="text-on-surface-variant font-headline font-medium text-xl">%</span>
                </div>
                <div className="mt-6 h-2 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full" style={{ width: `${accuracy}%` }} />
                </div>
              </div>

              {/* WPM Sparkline */}
              <div className="col-span-12 md:col-span-4 bg-surface-container-highest p-8 rounded-xl">
                <span className="stat-label mb-4">Speed Over Time</span>
                <div className="h-20 flex items-end gap-1 mt-4">
                  {(wpmHistory.current.length > 0 ? wpmHistory.current : [0]).map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-secondary/60 rounded-t transition-all"
                      style={{ height: `${Math.round((v / maxBar) * 100)}%`, opacity: 0.3 + (i / (wpmHistory.current.length || 1)) * 0.7 }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="stat-label">Start</span>
                  <span className="stat-label">Peak</span>
                </div>
              </div>

              {/* Chars */}
              <div className="col-span-12 md:col-span-6 bg-surface-container-highest p-6 rounded-xl flex items-center justify-between">
                <div>
                  <span className="stat-label">Correct Characters</span>
                  <div className="text-4xl font-headline font-bold text-on-surface mt-2">{correctCharacters}</div>
                </div>
                <div>
                  <span className="stat-label">Total Characters</span>
                  <div className="text-4xl font-headline font-bold text-on-surface-variant mt-2">{totalCharacters}</div>
                </div>
              </div>

              {/* Previous best — only when not a new high score */}
              {!isHighScore && (
                <div className="col-span-12 md:col-span-6 bg-surface-container-highest p-6 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="stat-label">Best WPM</span>
                    <div className="text-4xl font-headline font-bold text-primary mt-2">{highestWPM}</div>
                  </div>
                  <div>
                    <span className="stat-label">Best Accuracy</span>
                    <div className="text-4xl font-headline font-bold text-primary mt-2">{highestAccuracy}%</div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <ShinyButton variant="ghost" size="md" icon={<Home size={16} />} onClick={homeButton}>
                Home
              </ShinyButton>
              <ShinyButton variant="primary" size="md" icon={<RotateCcw size={16} />} onClick={resetGame}>
                Try Again
              </ShinyButton>
            </div>
          </div>
        </GlassPanel>
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden flex flex-col items-center relative">
      {/* Hidden input */}
      <input
        title="Start Typing"
        ref={hiddenInputRef}
        value={userInput}
        onChange={handleInputChange}
        className="opacity-0 absolute top-0 left-0 h-0 w-0 pointer-events-none"
        autoFocus
      />

      <div className="w-full max-w-4xl px-8 flex flex-col flex-1 min-h-0">

        {/* ── Stats bar ── */}
        <div className="flex items-center justify-between py-4 mb-4 border-b border-white/5">
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="stat-label">Time Remaining</span>
              <span className={`text-3xl font-mono font-medium mt-1 ${timeLeft <= 10 ? 'text-error' : 'text-secondary'}`}>
                00:{String(timeLeft).padStart(2, '0')}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="stat-label">Words Per Minute</span>
              <span className="text-3xl font-mono text-secondary font-medium mt-1">{wpm}</span>
            </div>
            <div className="flex flex-col">
              <span className="stat-label">Accuracy</span>
              <span className={`text-3xl font-mono font-medium mt-1 ${accuracy >= 95 ? 'text-tertiary' : accuracy >= 80 ? 'text-secondary' : 'text-error'}`}>
                {accuracy}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={resetGame}
              className="p-2 rounded hover:bg-surface-variant text-on-surface-variant transition-colors"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-2 bg-surface-container-high px-4 py-1.5 rounded-full border border-white/5">
              <span className="w-2 h-2 rounded-full bg-tertiary" />
              <span className="stat-label normal-case text-[10px]">Zen Mode</span>
            </div>
          </div>
        </div>

        {/* ── Typing area ── */}
        <div className="flex-1 min-h-0 flex flex-col justify-start py-2">
          <div className="w-full relative">
            {/* Ambient cyan glow behind typing area */}
            <div className="absolute -inset-10 bg-secondary/5 blur-[120px] rounded-full pointer-events-none" />
            <div
              className="relative mono-focus text-3xl leading-[1.9] text-on-surface-variant select-none overflow-hidden"
              style={{ maxHeight: '42vh' }}
            >
              {renderedText}
            </div>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="py-8 w-full">
          <div className="h-1.5 w-full bg-surface-container-lowest rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary to-tertiary rounded-full shadow-[0_0_12px_rgba(0,238,252,0.4)]"
              style={{ width: `${progress}%`, transition: 'width 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </div>
          <div className="flex justify-between mt-3">
            <span className="stat-label">Session Progress</span>
            <span className="stat-label">{progress}% Complete</span>
          </div>
        </div>

        {/* ── Keyboard hint ── */}
        <div className="flex items-center justify-between pb-4">
          <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs font-mono text-secondary">
            ctrl + r to reset
          </span>
          <div className="flex items-center gap-2 text-on-surface-variant/40">
            <Keyboard size={14} />
            <span className="text-xs">Click anywhere to focus</span>
          </div>
        </div>
      </div>

      {showResults && <ResultsOverlay />}
    </div>
  );
};

export default SinglePlayer;
