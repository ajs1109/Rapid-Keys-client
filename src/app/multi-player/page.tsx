'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Timer, Users, Home, Trophy, Target, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { io, Socket } from 'socket.io-client';
import useGameStore from '@/store/useGameStore';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {socket} from '../socket'  
interface Player {
  id: string;
  username: string;
  wpm: number;
  accuracy: number;
  progress: number;
  isComplete?: boolean;
}

interface GameState {
  text: string;
  players: Player[];
}

const GAME_TIME = 60;

const MultiPlayer = () => {
  // const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [sampleText, setSampleText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [showResults, setShowResults] = useState(false);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [correctCharacters, setCorrectCharacters] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const { setGameState, setGameMode } = useGameStore();
  const { user } = useAuthStore();
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
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (gameStarted && userInput.length > 0) {
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

      socket?.emit('updateProgress', {
        roomCode,
        wpm: currentWpm,
        accuracy: currentAccuracy,
        progress: (userInput.length / sampleText.length) * 100,
      });
    }
  }, [userInput, timeLeft, gameStarted, roomCode, sampleText, socket]);

  const startTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleGameEnd(players);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  const createRoom = () => {
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(newRoomCode);
    if (user?.username) {
      socket?.emit('joinRoom', { roomCode: newRoomCode, username: user.username });
    }
  };

  const joinRoom = () => {
    if (roomCode && user?.username) {
      socket?.emit('joinRoom', { roomCode, username: user.username });
    }
  };

  const startGame = () => {
    socket?.emit('startGame', { roomCode });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameStarted && timeLeft > 0) {
      setUserInput(e.target.value);
    }
  };

  const handleGameEnd = (finalPlayers: Player[]) => {
    setShowResults(true);
    setGameStarted(false);
    setPlayers(finalPlayers);
  };

  const homeButton = () => {
    setGameState('menu');
    setGameMode(null);
    router.push('/menu');
  };

  const resetGame = () => {
    setShowResults(false);
    setUserInput('');
    setWpm(0);
    setAccuracy(100);
    setTimeLeft(GAME_TIME);
    setTotalCharacters(0);
    setCorrectCharacters(0);
    setGameStarted(false);
    setPlayers([]);
    if (user?.username) {
      socket?.emit('joinRoom', { roomCode, username: user.username });
    }
  };

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
    const sortedPlayers = [...players].sort((a, b) => b.wpm - a.wpm);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
        <Card className="w-full max-w-2xl p-8 bg-white bg-opacity-90 backdrop-blur">
          <div className="text-center space-y-6">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-800">Game Results</h2>
            
            <div className="space-y-4">
              {sortedPlayers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                    <div className="text-left">
                      <p className="font-semibold">{player.username}</p>
                      <p className="text-sm text-gray-500">
                        Accuracy: {player.accuracy}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">{player.wpm} WPM</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-4 justify-center mt-6">
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
                Play Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Rest of the JSX remains the same
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {!gameStarted && !showResults ? (
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <Button onClick={createRoom}>Create Room</Button>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter Room Code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                  <Button onClick={joinRoom}>Join Room</Button>
                </div>
              </div>
              
              {players.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Players in Room: {roomCode}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {players.map((player, index) => (
                      <Card key={index} className="p-4">
                        <p>{player.username}</p>
                      </Card>
                    ))}
                  </div>
                  {players[0]?.id === socket?.id && (
                    <Button
                      onClick={startGame}
                      className="mt-4"
                      disabled={players.length < 2}
                    >
                      Start Game
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        ) : gameStarted && (
          <>
            <div className="grid grid-cols-4 gap-4">
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

              <Card className="p-6 flex items-center space-x-4">
                <Users className="h-6 w-6 text-indigo-500" />
                <div>
                  <p className="text-sm text-gray-500">Players</p>
                  <p className="text-2xl font-bold text-indigo-600">{players.length}</p>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Players Progress</h3>
              <div className="space-y-4">
                {players.map((player, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span>{player.username}</span>
                      <span>WPM: {player.wpm}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${player.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-8">
              <div className="leading-relaxed">
                {renderText()}
              </div>
            </Card>

            <input
              ref={hiddenInputRef}
              value={userInput}
              onChange={handleInputChange}
              className="opacity-0 absolute top-0 left-0 h-0 w-0"
              autoFocus
            />
          </>
        )}

        {showResults && <ResultsPopup />}
      </div>
    </div>
  );
};

export default MultiPlayer;