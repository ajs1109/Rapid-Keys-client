'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RotateCcw, Home, Star, TrendingUp, Keyboard, LogIn, UserPlus } from 'lucide-react';
import useGameStore from '@/store/useGameStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateWords, updateScore } from '@/lib/api';
import GlassPanel from '@/components/ui/GlassPanel';
import ShinyButton from '@/components/ui/ShinyButton';

const SAMPLE_TEXT = `Technology continues to transform the way we live and work in unprecedented ways. As artificial intelligence becomes more sophisticated, it opens up new possibilities for innovation and efficiency. However, we must carefully consider the ethical implications of these advances. The rapid pace of digital transformation requires us to adapt quickly while maintaining our human connections. Despite the challenges, this era of technological revolution presents exciting opportunities for those who are willing to embrace change and learn continuously.`;
const GAME_TIME = 60;

interface SinglePlayerProps {
  guestMode?: boolean;
}

const SinglePlayer = ({ guestMode = false }: SinglePlayerProps) => {
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
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('a, button, input, textarea, select')) return;
      hiddenInputRef.current?.focus();
    };
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
    if (guestMode) {
      window.sessionStorage.setItem('rapid-keys-pending-score', JSON.stringify({ wpm, accuracy }));
      setShowResults(true);
      return;
    }

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
    wpmHistory.current = [];
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
      <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-background/95 p-4 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-labelledby="results-title">
        <GlassPanel elevated className="relative my-auto w-full max-w-4xl overflow-hidden p-5 sm:p-8">
          {/* ambient glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="results-title" className="mb-2 font-headline text-3xl font-bold tracking-[-0.03em] text-on-surface sm:text-5xl">
                  Test complete
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Your 60-second typing result
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
            <div className="mb-7 grid grid-cols-12 gap-3 sm:gap-5">
              {/* WPM */}
              <div className="col-span-6 flex flex-col justify-between rounded-xl bg-surface-container-highest p-5 md:col-span-4 md:p-7">
                <span className="stat-label mb-4">Final Speed</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline text-5xl font-extrabold tracking-[-0.04em] text-secondary sm:text-6xl">{wpm}</span>
                  <span className="font-headline text-base font-medium text-on-surface-variant sm:text-lg">WPM</span>
                </div>
                {isHighScore && (
                  <div className="mt-6 flex items-center gap-2 text-tertiary text-sm">
                    <TrendingUp size={14} /><span>New personal best!</span>
                  </div>
                )}
              </div>

              {/* Accuracy */}
              <div className="col-span-6 flex flex-col justify-between rounded-xl bg-surface-container-highest p-5 md:col-span-4 md:p-7">
                <span className="stat-label mb-4">Accuracy Rate</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline text-5xl font-extrabold tracking-[-0.04em] text-tertiary sm:text-6xl">{accuracy}</span>
                  <span className="font-headline text-base font-medium text-on-surface-variant sm:text-lg">%</span>
                </div>
                <div className="mt-6 h-2 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full" style={{ width: `${accuracy}%` }} />
                </div>
              </div>

              {/* WPM Sparkline */}
              <div className="col-span-12 rounded-xl bg-surface-container-highest p-5 md:col-span-4 md:p-7">
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
              {!guestMode && !isHighScore && (
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

            {guestMode && (
              <div className="mb-6 flex flex-col gap-4 rounded-xl bg-secondary/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">Save this score</h3>
                  <p className="mt-1 max-w-lg text-sm leading-6 text-on-surface-variant">
                    Create a free account or log in and we’ll add this result to your profile automatically.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href="/auth?mode=login&claim=guest" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-on-surface outline-none transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-secondary">
                    <LogIn size={16} aria-hidden="true" /> Log in
                  </Link>
                  <Link href="/auth?mode=signup&claim=guest" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary-fixed outline-none transition-colors hover:bg-primary-dim focus-visible:ring-2 focus-visible:ring-primary">
                    <UserPlus size={16} aria-hidden="true" /> Sign up
                  </Link>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              {!guestMode && (
                <ShinyButton variant="ghost" size="md" icon={<Home size={16} />} onClick={homeButton}>
                  Home
                </ShinyButton>
              )}
              <ShinyButton variant="primary" size="md" icon={<RotateCcw size={16} />} onClick={resetGame}>
                Try again
              </ShinyButton>
            </div>
          </div>
        </GlassPanel>
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div className={`${guestMode ? 'min-h-[calc(100svh-9rem)]' : 'h-[calc(100vh-80px)] overflow-hidden'} relative flex flex-col items-center`}>
      {/* Hidden input */}
      <input
        title="Start Typing"
        ref={hiddenInputRef}
        value={userInput}
        onChange={handleInputChange}
        className="fixed left-[-9999px] top-0 h-px w-px opacity-0"
        autoFocus
        aria-label="Typing test input"
      />

      <div className="flex w-full max-w-4xl min-h-0 flex-1 flex-col px-4 sm:px-8">

        {/* ── Stats bar ── */}
        <div className="mb-4 flex items-center justify-between border-b border-white/5 py-4">
          <div className="grid flex-1 grid-cols-3 gap-3 sm:flex sm:gap-10">
            <div className="flex flex-col">
              <span className="stat-label">Time Remaining</span>
              <span className={`mt-1 font-mono text-xl font-medium tabular-nums sm:text-3xl ${timeLeft <= 10 ? 'text-error' : 'text-secondary'}`}>
                00:{String(timeLeft).padStart(2, '0')}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="stat-label">Words Per Minute</span>
              <span className="mt-1 font-mono text-xl font-medium tabular-nums text-secondary sm:text-3xl">{wpm}</span>
            </div>
            <div className="flex flex-col">
              <span className="stat-label">Accuracy</span>
              <span className={`mt-1 font-mono text-xl font-medium tabular-nums sm:text-3xl ${accuracy >= 95 ? 'text-tertiary' : accuracy >= 80 ? 'text-secondary' : 'text-error'}`}>
                {accuracy}%
              </span>
            </div>
          </div>
          <div className="ml-3 flex items-center gap-2 sm:gap-4">
            <button
              onClick={resetGame}
              className="p-2 rounded hover:bg-surface-variant text-on-surface-variant transition-colors"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
            <div className="hidden h-8 w-px bg-white/10 sm:block" />
            <div className="hidden items-center gap-2 rounded-full bg-surface-container-high px-4 py-1.5 sm:flex">
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
              className="mono-focus relative cursor-text select-none overflow-hidden text-xl leading-[1.85] text-on-surface-variant sm:text-2xl lg:text-3xl"
              style={{ maxHeight: guestMode ? '36vh' : '42vh' }}
              onClick={() => hiddenInputRef.current?.focus()}
            >
              {renderedText}
            </div>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="w-full py-6 sm:py-8">
          <div className="h-1.5 w-full bg-surface-container-lowest rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary to-tertiary rounded-full shadow-[0_0_12px_rgba(0,238,252,0.4)]"
              style={{
                width: '100%',
                transform: `scaleX(${progress / 100})`,
                transformOrigin: 'left',
                transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          </div>
          <div className="flex justify-between mt-3">
            <span className="stat-label">Session Progress</span>
            <span className="stat-label">{progress}% Complete</span>
          </div>
        </div>

        {/* ── Keyboard hint ── */}
        <div className="flex items-center justify-between pb-4">
          <button onClick={resetGame} className="rounded-lg bg-surface-container-highest px-3 py-1.5 font-mono text-xs text-secondary outline-none transition-colors hover:bg-surface-bright focus-visible:ring-2 focus-visible:ring-secondary">
            reset test
          </button>
          <div className="flex items-center gap-2 text-on-surface-variant/40">
            <Keyboard size={14} />
            <span className="text-xs">Click the text, then start typing</span>
          </div>
        </div>
      </div>

      {showResults && <ResultsOverlay />}
    </div>
  );
};

export default SinglePlayer;
