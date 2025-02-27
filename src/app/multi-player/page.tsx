'use client'

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useGameStore from '@/store/useGameStore';
import { Copy, Home, LogIn, RefreshCw, Send, Swords, Target, Timer, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface Player {
  userId: string;
  username: string;
  isReady?: boolean;
  progress?: number;
  wpm?: number;
  accuracy?: number;
  finished?: boolean;
}

interface Room {
  roomId: string;
  playerCount: number;
}

interface Friend {
  userId: string;
  username: string;
}

const GAME_TIME = 60; // 60 seconds for multiplayer

const MultiPlayer: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [gameText, setGameText] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_TIME);
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [totalCharacters, setTotalCharacters] = useState<number>(0);
  const [correctCharacters, setCorrectCharacters] = useState<number>(0);
  const [correctWords, setCorrectWords] = useState<number>(0);
  const [roomId, setRoomId] = useState<string>('');
  const [inRoom, setInRoom] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [onlineFriends, setOnlineFriends] = useState<Friend[]>([]);
  const [friendInviteId, setFriendInviteId] = useState<string>('');
  const [results, setResults] = useState<Player[]>([]);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [userFinishPosition, setUserFinishPosition] = useState<number | null>(null);

  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const { setGameState, setGameMode, user } = useGameStore();
  const router = useRouter();

  // Initialize socket connection
  useEffect(() => {
    console.log('user from game store in multi-player:', user);
    if (!user || !user.id) {
      toast.error('Please log in to play multiplayer mode');
      //router.push('/login');
      return;
    }

    const socketInstance = io(process.env.SERVER_URI || 'http://localhost:5000');
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');

      // Authenticate with socket
      socketInstance.emit('authenticate', {
        userId: user.id,
        username: user.username,
      });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    // Cleanup function
    return () => {
      if (roomId) {
        socketInstance.emit('leaveRoom', { roomId });
      }
      socketInstance.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('onlineFriends', (friends) => {
      setOnlineFriends(friends);
    });
    
    socket.on('userOnline', (user) => {
      setOnlineFriends(prev => [...prev, user]);
    });
    
    socket.on('userOffline', ({ userId }) => {
      setOnlineFriends(prev => prev.filter(friend => friend.userId !== userId));
    });
    
    socket.on('roomCreated', ({ roomId }) => {
      setRoomId(roomId);
      setInRoom(true);
      toast("Room Created", {
        description: `Room ID: ${roomId}`,
      });
    });
    
    socket.on('roomAvailable', (room) => {
      setAvailableRooms(prev => {
        if (!prev.some(r => r.roomId === room.roomId)) {
          return [...prev, room];
        }
        return prev;
      });
    });
    
    socket.on('roomClosed', ({ roomId }) => {
      setAvailableRooms(prev => prev.filter(room => room.roomId !== roomId));
    });
    
    socket.on('playerJoined', ({ players }) => {
      setPlayers(players);
      toast("Player Joined", {
        description: `${players[players.length - 1].username} joined the room`,
      });
    });
    
    socket.on('playerLeft', ({ userId }) => {
      setPlayers(prev => prev.filter(player => player.userId !== userId));
      toast("Player Left", {
        description: "A player has left the room",
      });
    });
    
    socket.on('playerReadyState', ({ userId, isReady }) => {
      setPlayers(prev => prev.map(player => 
        player.userId === userId ? { ...player, isReady } : player
      ));
    });
    
    socket.on('gameCountdown', ({ countdown }) => {
      setCountdown(countdown);
    });
    
    socket.on('gameStart', ({ text, gameTime }) => {
      setGameText(text);
      setTimeLeft(gameTime);
      setCountdown(null);
      setIsActive(true);
      hiddenInputRef.current?.focus();
    });
    
    socket.on('playerProgress', ({ userId, progress, wpm, accuracy, finished, position }) => {
      console.log(position);
      setPlayers(prev => prev.map(player => 
        player.userId === userId ? { ...player, progress, wpm, accuracy, finished } : player
      ));
    });
    
    socket.on('playerFinished', ({ position }) => {
      setUserFinishPosition(position);
    });
    
    socket.on('gameResults', ({ results }) => {
      setResults(results);
      setIsActive(false);
      setGameEnded(true);
      setShowResults(true);
    });
    
    socket.on('roomReset', () => {
      resetGame();
    });
    
    socket.on('battleInvitation', ({ roomId, from }) => {
      toast.loading("Battle Invitation",{
        description: `${from.username} invited you to a typing battle!`,
        action: (
          <Button onClick={() => joinRoom(roomId)}>Join</Button>
        ),
        cancel: (
          <Button onClick={() => toast.dismiss(`invite-${roomId}`)}>Ignore</Button>
        ),
        icon: <Swords/>,
        id: `invite-${roomId}`
      });
    });
    
    socket.on('error', ({ message }) => {
      toast.error("Error",{
        description: message
      });
    });
    
    return () => {
      socket.off('onlineFriends');
      socket.off('userOnline');
      socket.off('userOffline');
      socket.off('roomCreated');
      socket.off('roomAvailable');
      socket.off('roomClosed');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('playerReadyState');
      socket.off('gameCountdown');
      socket.off('gameStart');
      socket.off('playerProgress');
      socket.off('playerFinished');
      socket.off('gameResults');
      socket.off('roomReset');
      socket.off('battleInvitation');
      socket.off('error');
    };
  }, [socket]);
  
  // Focus the hidden input
  useEffect(() => {
    hiddenInputRef.current?.focus();
    
    const handleClick = () => {
      hiddenInputRef.current?.focus();
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  
  // Game timer
  useEffect(() => {
    let intervalId;
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
  
  // Calculate WPM and accuracy
  useEffect(() => {
    if (isActive && userInput.length > 0 && gameText) {
      const minutes = (GAME_TIME - timeLeft) / 60;
      
      let correctChars = 0;
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === gameText[i]) correctChars++;
      }
      
      let correctWordsCount = 0;
      let wordFlag = true;
      
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] !== gameText[i]) {
          wordFlag = false;
        }
        
        if (i < gameText.length && userInput[i] === gameText[i] && userInput[i] === ' ' && wordFlag) {
          correctWordsCount++;
          wordFlag = true;
        }
      }
      
      setCorrectWords(correctWordsCount);
      setCorrectCharacters(correctChars);
      setTotalCharacters(userInput.length);
      
      const currentAccuracy = Math.round((correctChars / userInput.length) * 100);
      const currentWpm = Math.round(correctWordsCount / Math.max(minutes, 1/60));
      
      setWpm(currentWpm);
      setAccuracy(currentAccuracy);
      
      // Calculate progress percentage
      const progress = Math.min(100, Math.round((userInput.length / gameText.length) * 100));
      
      // Send progress update to server
      if (socket && roomId) {
        socket.emit('progressUpdate', { 
          roomId, 
          progress, 
          wpm: currentWpm, 
          accuracy: currentAccuracy 
        });
      }
      
      // Check if typing test is complete
      if (userInput.length >= gameText.length) {
        endGame();
      }
    }
  }, [userInput, isActive, gameText]);
  
  const handleInputChange = (e) => {
    if (isActive && timeLeft > 0) {
      setUserInput(e.target.value);
    }
  };
  
  const endGame = () => {
    setIsActive(false);
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
    setIsReady(false);
    setUserFinishPosition(null);
    setGameEnded(false);
    hiddenInputRef.current?.focus();
  };
  
  const homeButton = () => {
    if (socket && roomId) {
      socket.emit('leaveRoom', { roomId });
    }
    setGameState('menu');
    setGameMode(null);
    router.push('/menu');
  };
  
  const createRoom = (isPrivate = false) => {
    if (!socket) return;
    socket.emit('createRoom', { isPrivate });
  };
  
  const joinRoom = (roomIdToJoin: string) => {
    if (!socket) return;
    socket.emit('joinRoom', { roomId: roomIdToJoin });
    setRoomId(roomIdToJoin);
    setInRoom(true);
  };
  
  const leaveRoom = () => {
    if (!socket || !roomId) return;
    socket.emit('leaveRoom', { roomId });
    setRoomId('');
    setInRoom(false);
    setPlayers([]);
    resetGame();
  };
  
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Copied!", {
      description: "Room ID copied to clipboard"
    });
  }

  const toggleReady = () => {
    if (!socket || !roomId) return;
    const newReadyState = !isReady;
    socket.emit('playerReady', { roomId, ready: newReadyState });
    setIsReady(newReadyState);
  };
  
  const inviteFriend = () => {
    if (!socket || !roomId || !friendInviteId) return;
    socket.emit('inviteFriend', { friendId: friendInviteId, roomId });
    toast("Invitation Sent",{
      description: "Your friend has been invited to the game",
    });
  };
  
  const renderText = () => {
    if (!gameText) return <p className="text-gray-400">Waiting for game to start...</p>;
    
    return gameText.split('').map((char, index) => {
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
  
  const LobbyView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Multiplayer Typing Battle</h2>
      
      {!inRoom ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Create a Room</h3>
              <div className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={() => createRoom(false)}
                >
                  Create Public Room
                </Button>
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => createRoom(true)}
                >
                  Create Private Room
                </Button>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Available Rooms</h3>
              {availableRooms.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableRooms.map(room => (
                    <div key={room.roomId} className="flex justify-between items-center">
                      <span>Room {room.roomId.substring(0, 8)}... ({room.playerCount} players)</span>
                      <Button 
                        size="sm"
                        onClick={() => joinRoom(room.roomId)}
                      >
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No public rooms available</p>
              )}
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Join by Room ID</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Room ID"
                className="flex-1 p-2 border rounded"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
              />
              <Button 
                onClick={() => joinRoom(roomId)}
                disabled={!roomId}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Join
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Online Friends</h3>
            {onlineFriends.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {onlineFriends.map(friend => (
                  <div key={friend.userId} className="flex justify-between items-center">
                    <span>{friend.username}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        createRoom(true);
                        setFriendInviteId(friend.userId);
                        // We'll send the invite after the room is created
                        setTimeout(() => inviteFriend(), 500);
                      }}
                    >
                      Invite to Battle
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No friends online</p>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <span className='flex'>
              <h3 className="text-xl font-semibold">Room: {roomId.substring(0, 20)}...  </h3><button title='Copy Room Id' onClick={copyRoomId}><Copy className="h-4 w-4 mx-4"/></button></span>
              <Button 
                variant="outline"
                size="sm"
                onClick={leaveRoom}
                title='Leave Room'
              >
                Leave Room
              </Button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Players:</h4>
              <div className="space-y-2">
                {players.map(player => (
                  <div key={player.userId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-medium">{player.username}</span>
                      {player.isReady && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Ready
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4">
              <Button
                className="w-full"
                onClick={toggleReady}
                variant={isReady ? "outline" : "default"}
              >
                {isReady ? "Not Ready" : "Ready"}
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Invite Friends</h3>
            {onlineFriends.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {onlineFriends.map(friend => (
                  <div key={friend.userId} className="flex justify-between items-center">
                    <span>{friend.username}</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        setFriendInviteId(friend.userId);
                        inviteFriend();
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No friends online</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
  
  const CountdownView = () => (
    <div className="flex flex-col items-center justify-center h-64">
      <h2 className="text-4xl font-bold mb-8">Get Ready!</h2>
      <div className="text-7xl font-bold text-indigo-600 animate-pulse">
        {countdown}
      </div>
    </div>
  );
  
  const GameView = () => (
    <div className="space-y-8">
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
      
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Battle Progress</h3>
        <div className="space-y-4">
          {players.map(player => (
            <div key={player.userId} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">{player.username}</span>
                <span className="text-sm text-gray-500">
                  {player.wpm || 0} WPM | {player.accuracy || 0}% Accuracy
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${player.progress || 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      <input
        title='Start Typing'
        ref={hiddenInputRef}
        value={userInput}
        onChange={handleInputChange}
        className="opacity-0 absolute top-0 left-0 h-0 w-0"
        autoFocus
      />
    </div>
  );
  
  const ResultsView = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
      <Card className="w-full max-w-2xl p-8 bg-white bg-opacity-90 backdrop-blur">
        <div className="text-center space-y-6">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800">
            {userFinishPosition === 1 ? 'You Won!' : 'Game Results'}
          </h2>
          
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WPM
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={result.userId} className={user?.id === result.userId ? "bg-indigo-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{index + 1}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {result.username}
                        {user?.id === result.userId && " (You)"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{result.wpm}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{result.accuracy}%</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              onClick={() => {
                setShowResults(false);
                setIsReady(false);
              }}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {!isConnected ? (
          <div className="text-center p-8">
            <p className="text-xl">Connecting to server...</p>
          </div>
        ) : (
          <>
            {!inRoom && <LobbyView />}
            {inRoom && !isActive && !gameEnded && countdown === null && <LobbyView />}
            {inRoom && countdown !== null && <CountdownView />}
            {inRoom && isActive && <GameView />}
            {showResults && <ResultsView />}
          </>
        )}
      </div>
    </div>
  );
};

export default MultiPlayer;
