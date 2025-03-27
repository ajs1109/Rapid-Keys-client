'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Timer, RotateCcw, Home, Trophy, Target, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useGameStore from '@/store/useGameStore';
import { useRouter } from 'next/navigation';
import { generateWords, updateScore } from '@/lib/api';

const SAMPLE_TEXT = `Technology continues to transform the way we live and work in unprecedented ways. As artificial intelligence becomes more sophisticated, it opens up new possibilities for innovation and efficiency. However, we must carefully consider the ethical implications of these advances. The rapid pace of digital transformation requires us to adapt quickly while maintaining our human connections. Despite the challenges, this era of technological revolution presents exciting opportunities for those who are willing to embrace change and learn continuously. The future belongs to those who can balance technical skills with human creativity.`;
const GAME_TIME = 5;

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
  const [correctWords, setCorrectWords] = useState(0);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  
  const { setGameState, setGameMode, user, setHighScore,highestAccuracy, highestWPM, setGamesPlayed, gamesPlayed } = useGameStore();
  const router = useRouter();
  const getWords = async () => {
    try {
      console.log('in try');
      const {words} = await generateWords(200);
      setText(words);
    } catch (error) {
      console.log("Error occured in singleplayer while generating words from server", error);
    }
  }
  useEffect(() => {
    hiddenInputRef.current?.focus();
    
    const handleClick = () => {
      hiddenInputRef.current?.focus();
    };
    document.addEventListener('click', handleClick);
    getWords();
    
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Game timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((time: number) => {
          if (time <= 1) {
            clearInterval(intervalId);
            endGame();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (!isActive && userInput.length > 0) {
      setIsActive(true);
    }
  }, [userInput, isActive]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const minutes = (GAME_TIME - timeLeft) / 60;
      
      let correctChars = 0;
      let correctWordsCount = 0;
      let currentWord = '';
      let expectedWord = '';
      
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === text[i]) {
          correctChars++;
          
          // Word tracking
          currentWord += userInput[i];
          expectedWord += text[i];
          
          // Check for complete word
          if (userInput[i] === ' ') {
            if (currentWord.trim() === expectedWord.trim()) {
              correctWordsCount++;
            }
            currentWord = '';
            expectedWord = '';
          }
        } else {
          currentWord = '';
          expectedWord = '';
        }
      }

      setCorrectWords(correctWordsCount);
      setCorrectCharacters(correctChars);
      setTotalCharacters(userInput.length);
      
      const currentAccuracy = userInput.length > 0 
        ? Math.round((correctChars / userInput.length) * 100) 
        : 100;
      
      const currentWpm = Math.round(correctWordsCount / Math.max(minutes, 1/60));
      
      setWpm(currentWpm);
      setAccuracy(currentAccuracy);
    }
  }, [userInput, isActive, timeLeft]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (timeLeft > 0) {
      setUserInput(e.target.value);
    }
  };
  
  const endGame = async () => {
    setIsActive(false);
    if(wpm *accuracy > highestAccuracy * highestWPM || (wpm * accuracy === (highestWPM * highestAccuracy) && wpm > highestWPM)){
      setHighScore(wpm, accuracy);
      setIsHighScore(true);
    }
    setGamesPlayed(gamesPlayed + 1);
    try {
      await updateScore(user?.id ?? "", wpm, accuracy, gamesPlayed);
    } catch (error) {
      console.log('could not update score:', error);
    }
    setShowResults(true);
  };

  const resetGame = () => {
    setUserInput('');
    setIsActive(false);
    setTimeLeft(GAME_TIME);
    setWpm(0);
    setAccuracy(100);
    setShowResults(false);
    setTotalCharacters(0);
    setCorrectCharacters(0);
    setCorrectWords(0);
    setIsHighScore(false);
    getWords();
    hiddenInputRef.current?.focus();
  };

  const homeButton = () => {
    setGameState('menu');
    setGameMode(null);
    router.push('/menu');
  }

  const renderText = () => {
    return text.split('').map((char, index) => {
      let className = 'transition-colors duration-150 text-lg font-mono ';
      
      if (index < userInput.length) {
        // Correct character
        if (userInput[index] === char) {
          className += 'text-green-500 font-bold';
        } 
        // Incorrect character
        else {
          className += 'text-red-500 bg-red-100';
        }
      } 
      // Current character (cursor position)
      else if (index === userInput.length) {
        className += 'bg-gray-200 animate-pulse';
      }
      
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  const ResultsPopup = () => {
    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
      <Card className="w-full max-w-md p-8 bg-white bg-opacity-90 backdrop-blur">
        <div className="text-center space-y-6">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800">Time&apos;s Up!</h2>
          
          <div className="grid grid-cols-2 gap-4 my-8">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-indigo-600">{wpm}</p>
              <p className="text-sm text-gray-600">Words per Minute</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-indigo-600">{accuracy}%</p>
              <p className="text-sm text-gray-600">Accuracy</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-indigo-600">{correctCharacters}</p>
              <p className="text-sm text-gray-600">Correct Characters</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-indigo-600">{totalCharacters}</p>
              <p className="text-sm text-gray-600">Total Characters</p>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={homeButton}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button 
              onClick={resetGame}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )};

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <input
          title='Start Typing'
          ref={hiddenInputRef}
          value={userInput}
          onChange={handleInputChange}
          className="opacity-0 absolute top-0 left-0 h-0 w-0"
          autoFocus
        />
        
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-6 flex items-center space-x-4">
            <Timer className="h-6 w-6 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-500">Time Left</p>
              <p className="text-2xl font-bold text-indigo-600">{timeLeft}s</p>
            </div>
          </Card>
          
          <Card className="p-6 flex items-center space-x-4">
            <Target className="h-6 w-6 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-500">WPM</p>
              <p className="text-2xl font-bold text-indigo-600">{wpm}</p>
            </div>
          </Card>
          
          <Card className="p-6 flex items-center space-x-4">
            <Trophy className="h-6 w-6 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-500">Accuracy</p>
              <p className="text-2xl font-bold text-indigo-600">{accuracy}%</p>
            </div>
          </Card>
        </div>

        <Card className="p-8">
          <div className="leading-relaxed">
            {renderText()}
          </div>
        </Card>

        <div className="flex justify-center">
          <Button 
            onClick={resetGame}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset {user?.id}</span>
          </Button>
        </div>

        {showResults && <ResultsPopup />}
      </div>
    </div>
  );
};

export default SinglePlayer;