'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Home, LogIn, RotateCcw, Star, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generateWords, updateScore } from '@/lib/api';
import useGameStore from '@/store/useGameStore';

const SAMPLE_TEXT = 'the quick brown fox jumps over the lazy dog while bright ideas move through quiet minds and careful hands build useful things with patience focus and steady practice';
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
  const typingViewportRef = useRef<HTMLDivElement>(null);
  const activeCharacterRef = useRef<HTMLSpanElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const startedRef = useRef(false);
  const textRequestRef = useRef(0);

  const {
    setGameState,
    setGameMode,
    user,
    setHighScore,
    highestAccuracy,
    highestWPM,
    setGamesPlayed,
    gamesPlayed,
  } = useGameStore();
  const router = useRouter();

  const getWords = async () => {
    const requestId = ++textRequestRef.current;
    try {
      const { words } = await generateWords(200);
      if (requestId === textRequestRef.current && !startedRef.current) {
        setText(words);
        if (typingViewportRef.current) typingViewportRef.current.scrollTop = 0;
      }
    } catch {
      // Keep the local fallback when the word service is unavailable.
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

  useEffect(() => {
    let id: NodeJS.Timeout | undefined;
    if (isActive && timeLeft > 0) {
      id = setInterval(() => {
        setTimeLeft((currentTime) => {
          if (currentTime <= 1) {
            clearInterval(id);
            endGame();
            return 0;
          }
          return currentTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [isActive, timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isActive && userInput.length > 0) setIsActive(true);
  }, [userInput, isActive]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    const minutes = (GAME_TIME - timeLeft) / 60;
    let correctChars = 0;
    let correctWordsCount = 0;
    let currentWord = '';
    let expectedWord = '';

    for (let index = 0; index < userInput.length; index++) {
      if (userInput[index] === text[index]) {
        correctChars++;
        currentWord += userInput[index];
        expectedWord += text[index];
        if (userInput[index] === ' ') {
          if (currentWord.trim() === expectedWord.trim()) correctWordsCount++;
          currentWord = '';
          expectedWord = '';
        }
      } else {
        currentWord = '';
        expectedWord = '';
      }
    }

    setCorrectCharacters(correctChars);
    setTotalCharacters(userInput.length);
    setAccuracy(userInput.length > 0 ? Math.round((correctChars / userInput.length) * 100) : 100);
    setWpm(Math.round(correctWordsCount / Math.max(minutes, 1 / 60)));
  }, [userInput, isActive, timeLeft, text]);

  useLayoutEffect(() => {
    const viewport = typingViewportRef.current;
    const activeCharacter = activeCharacterRef.current;
    if (!viewport || !activeCharacter) return;

    if (userInput.length === 0) {
      viewport.scrollTop = 0;
      return;
    }

    const lineHeight = Number.parseFloat(window.getComputedStyle(viewport).lineHeight);
    const viewportRect = viewport.getBoundingClientRect();
    const activeRect = activeCharacter.getBoundingClientRect();
    const lowerReadingLine = viewportRect.top + lineHeight * 3;

    if (activeRect.top >= lowerReadingLine) {
      viewport.scrollTop += activeRect.top - (viewportRect.top + lineHeight);
    } else if (activeRect.top < viewportRect.top) {
      viewport.scrollTop = Math.max(0, viewport.scrollTop - (viewportRect.top - activeRect.top + lineHeight));
    }
  }, [userInput]);

  useEffect(() => {
    if (showResults) resultsHeadingRef.current?.focus();
  }, [showResults]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (timeLeft <= 0) return;
    const nextValue = event.target.value.slice(0, text.length);
    if (nextValue.length > 0) startedRef.current = true;
    setUserInput(nextValue);
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
    try {
      await updateScore(user?.id ?? '', wpm, accuracy, updatedGamesPlayed);
    } catch {
      // A temporary score sync failure should not block the result screen.
    }
    setShowResults(true);
  };

  const resetGame = () => {
    textRequestRef.current++;
    startedRef.current = false;
    setUserInput('');
    setIsActive(false);
    setTimeLeft(GAME_TIME);
    setWpm(0);
    setAccuracy(100);
    setShowResults(false);
    setTotalCharacters(0);
    setCorrectCharacters(0);
    setIsHighScore(false);
    if (typingViewportRef.current) typingViewportRef.current.scrollTop = 0;
    getWords();
    window.requestAnimationFrame(() => hiddenInputRef.current?.focus());
  };

  const homeButton = () => {
    setGameState('menu');
    setGameMode(null);
    router.push('/menu');
  };

  const renderedText = useMemo(() => {
    let absoluteIndex = 0;
    const words = text.split(' ');

    return words.map((word, wordIndex) => {
      const wordStart = absoluteIndex;
      const spaceIndex = wordStart + word.length;
      absoluteIndex += word.length + 1;
      const hasTrailingSpace = wordIndex < words.length - 1;

      return (
        <React.Fragment key={`${wordStart}-${wordIndex}`}>
          <span className="inline-block whitespace-nowrap" data-word-index={wordIndex}>
          {word.split('').map((character, characterIndex) => {
            const index = wordStart + characterIndex;
            const isCurrent = index === userInput.length;
            let className = 'relative transition-colors duration-75 ';

            if (index < userInput.length) {
              className += userInput[index] === character ? 'text-on-surface' : 'text-error bg-error/10';
            } else {
              className += 'text-on-surface-variant';
            }

            return (
              <span
                key={index}
                ref={isCurrent ? activeCharacterRef : undefined}
                className={className}
              >
                {isCurrent && <span className="caret-custom" aria-hidden="true" />}
                {character}
              </span>
            );
          })}
          </span>
          {hasTrailingSpace && (
            <span
              ref={spaceIndex === userInput.length ? activeCharacterRef : undefined}
              className={`relative transition-colors duration-75 ${spaceIndex < userInput.length ? (userInput[spaceIndex] === ' ' ? 'text-on-surface' : 'text-error bg-error/10') : 'text-on-surface-variant'}`}
            >
              {spaceIndex === userInput.length && <span className="caret-custom" aria-hidden="true" />}
              {' '}
            </span>
          )}
        </React.Fragment>
      );
    });
  }, [text, userInput]);

  if (showResults) {
    return (
      <section
        className="min-h-[calc(100svh-7rem)] w-full px-4 py-8 sm:px-8 sm:py-12 lg:px-12"
        aria-labelledby="results-title"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2
                id="results-title"
                ref={resultsHeadingRef}
                tabIndex={-1}
                className="font-headline text-3xl font-semibold tracking-[-0.03em] text-on-surface outline-none sm:text-4xl"
              >
                Test complete
              </h2>
              {isHighScore && (
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-tertiary">
                  <Star size={15} aria-hidden="true" /> New personal best
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={resetGame}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-on-surface-variant outline-none transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <RotateCcw size={17} aria-hidden="true" /> Try again
            </button>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-12 lg:mt-14 lg:max-w-4xl">
            <div>
              <p className="text-sm text-on-surface-variant">Words per minute</p>
              <p className="mt-1 font-mono text-6xl font-medium tracking-[-0.04em] text-secondary sm:text-7xl lg:text-8xl">
                {wpm}<span className="ml-2 text-lg tracking-normal text-on-surface-variant sm:text-xl">wpm</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">Accuracy</p>
              <p className="mt-1 font-mono text-6xl font-medium tracking-[-0.04em] text-on-surface sm:text-7xl lg:text-8xl">
                {accuracy}<span className="text-2xl tracking-normal text-on-surface-variant sm:text-3xl">%</span>
              </p>
            </div>
          </div>

          <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-4 text-sm sm:mt-12">
            <div>
              <dt className="text-on-surface-variant">Correct characters</dt>
              <dd className="mt-1 font-mono text-xl tabular-nums text-on-surface">{correctCharacters}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Characters typed</dt>
              <dd className="mt-1 font-mono text-xl tabular-nums text-on-surface">{totalCharacters}</dd>
            </div>
            {!guestMode && (
              <>
                <div>
                  <dt className="text-on-surface-variant">Best WPM</dt>
                  <dd className="mt-1 font-mono text-xl tabular-nums text-on-surface">{highestWPM}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Best accuracy</dt>
                  <dd className="mt-1 font-mono text-xl tabular-nums text-on-surface">{highestAccuracy}%</dd>
                </div>
              </>
            )}
          </dl>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/5 pt-6 sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
            {guestMode ? (
              <>
                <div>
                  <h3 className="font-headline text-lg font-semibold text-on-surface">Save your score</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">Log in or create an account.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/auth?mode=login&claim=guest"
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-on-surface outline-none transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-secondary"
                  >
                    <LogIn size={16} aria-hidden="true" /> Log in
                  </Link>
                  <Link
                    href="/auth?mode=signup&claim=guest"
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary-fixed outline-none transition-colors hover:bg-primary-dim focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <UserPlus size={16} aria-hidden="true" /> Sign up
                  </Link>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={homeButton}
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-3 text-sm font-semibold text-on-surface outline-none transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <Home size={16} aria-hidden="true" /> Home
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-[calc(100svh-7rem)] w-full flex-col px-4 pb-8 sm:px-8 lg:px-12">
      <input
        title="Start typing"
        ref={hiddenInputRef}
        value={userInput}
        onChange={handleInputChange}
        className="fixed left-[-9999px] top-0 h-px w-px opacity-0"
        autoFocus
        aria-label="Typing test input"
      />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-start pt-[clamp(4rem,10vh,6rem)]">
        <div className="flex items-end justify-between gap-5">
          <div className="grid flex-1 grid-cols-3 gap-4 sm:max-w-xl sm:gap-10">
            <div>
              <span className="stat-label">Time</span>
              <span className={`mt-1 block font-mono text-2xl font-medium tabular-nums sm:text-3xl ${timeLeft <= 10 ? 'text-error' : 'text-secondary'}`}>
                0:{String(timeLeft).padStart(2, '0')}
              </span>
            </div>
            <div>
              <span className="stat-label">WPM</span>
              <span className="mt-1 block font-mono text-2xl font-medium tabular-nums text-on-surface sm:text-3xl">{wpm}</span>
            </div>
            <div>
              <span className="stat-label">Accuracy</span>
              <span className={`mt-1 block font-mono text-2xl font-medium tabular-nums sm:text-3xl ${accuracy < 80 ? 'text-error' : 'text-on-surface'}`}>
                {accuracy}%
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={resetGame}
            className="mb-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant outline-none transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label="Restart test"
            title="Restart test"
          >
            <RotateCcw size={19} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-8 sm:mt-10">
          <div
            ref={typingViewportRef}
            className="mono-focus h-[7.2em] w-full cursor-text select-none overflow-hidden text-[clamp(1.25rem,2.35vw,2rem)] text-on-surface-variant"
            onClick={() => hiddenInputRef.current?.focus()}
            aria-label="Typing passage"
          >
            {renderedText}
          </div>

          {!isActive && userInput.length === 0 && (
            <p className="mt-5 text-center text-sm text-on-surface-variant">Start typing</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default SinglePlayer;
