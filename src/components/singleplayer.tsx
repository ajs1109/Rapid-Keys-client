'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Timer, RotateCcw, Home, Trophy, Target, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useGameStore from '@/store/useGameStore';
import { useRouter } from 'next/navigation';
import { generateText } from '@/lib/api';

const GAME_TIME = 5;
const SinglePlayer = () => {
  const [userInput, setUserInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [sampleText, setSampleText] = useState('');
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [showResults, setShowResults] = useState(false);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [correctCharacters, setCorrectCharacters] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  
  const { setGameState, setGameMode } = useGameStore();
  const router = useRouter();
  useEffect(() => {
    hiddenInputRef.current?.focus();
    
    const handleClick = () => {
      hiddenInputRef.current?.focus();
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    generateParagraph();
  }, []);
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            clearInterval(intervalId);
            endGame();
            return 0;
          }
          return time - 1;
        });
        
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isActive]);

  useEffect(() => {
    if (isActive && userInput.length > 0) {
      const minutes = (GAME_TIME - timeLeft) / 60;
      
      let correctChars = 0;
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === sampleText[i]) correctChars++;
      }

      let correctWordsCount = 0;
      for(let i = 0; i < userInput.length; i++) {
        let wordFlag: boolean = true;
        if(userInput[i] !== sampleText[i]){
          wordFlag = false;
        }
        if(i < sampleText.length && userInput[i] === sampleText[i] && userInput[i] === ' ' && wordFlag) {
          correctWordsCount++;
          wordFlag = true;
        }
      }
      setCorrectWords(correctWordsCount);
      setCorrectCharacters(correctChars);
      setTotalCharacters(userInput.length);
      const currentAccuracy = Math.round((correctChars / userInput.length) * 100);
      
      const currentWpm = Math.round(correctWords / Math.max(minutes, 1/60));
      setWpm(currentWpm);
      setAccuracy(currentAccuracy);
    }
  }, [userInput, isActive]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isActive) {
      setIsActive(true);
    }
    if(timeLeft > 0){
      setUserInput(e.target.value);
    }
  };
  
  const endGame = () => {
    setIsActive(false);
    setShowResults(true);
  };

  const generateParagraph = async () => {
    let SAMPLE_TEXT = await generateText(150);
    setSampleText(SAMPLE_TEXT);
  }

  const resetGame = () => {
    console.log('reset game called');
    generateParagraph();
    setUserInput('');
    setIsActive(false);
    setTimeLeft(GAME_TIME);
    setWpm(0);
    setAccuracy(100);
    setShowResults(false);
    setTotalCharacters(0);
    setCorrectCharacters(0);
    hiddenInputRef.current?.focus();
  };

  const homeButton = () => {
    setGameState('menu');
    setGameMode(null);
    router.push('/menu');
  }

  const renderText = () => {
    return sampleText.split('').map((char: string, index: number) => {
      let className = 'transition-colors duration-150 text-lg font-mono ';
      if (index < userInput.length) {
        className += userInput[index] === char 
          ? 'text-green-500 font-bold' 
          : 'text-red-500 bg-red-100';
      } else if (index === userInput.length) {
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
    const finalStats = {
      wpm: wpm,
      accuracy: accuracy,
      correctChars: correctCharacters,
      totalChars: totalCharacters
    };
    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
      <Card className="w-full max-w-md p-8 bg-white bg-opacity-90 backdrop-blur">
        <div className="text-center space-y-6">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800">Time's Up!</h2>
          
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
            <span>Reset</span>
          </Button>
        </div>

        {showResults && <ResultsPopup />}
      </div>
    </div>
  );
};

export default SinglePlayer;