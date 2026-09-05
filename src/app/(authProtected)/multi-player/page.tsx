'use client'

import { Button } from '@/components/ui/button';
import { SERVER_URI } from '@/config';
import useGameStore from '@/store/useGameStore';
import { Friend, Player, Room } from '@/types/multiplayer';
import { errorToast, successToast } from '@/utils/customToast';
import { Copy, Home, Lock, LogIn, Plus, RefreshCw, Send, Swords, Target, Timer, Trophy, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

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
  const [roomId, setRoomId] = useState<string>('');
  const [inRoom, setInRoom] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [onlineFriends, setOnlineFriends] = useState<Friend[]>([]);
  const [results, setResults] = useState<Player[]>([]);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [userFinishPosition, setUserFinishPosition] = useState<number | null>(null);

  const hiddenInputRef = useRef<HTMLInputElement>(null);
  // Refs to give socket handlers access to always-current values
  const roomIdRef = useRef<string>('');
  const playersRef = useRef<Player[]>([]);
  const pendingFriendInviteRef = useRef<string>('');
  const { setGameState, setGameMode, user } = useGameStore();
  const router = useRouter();

  // Keep refs in sync for use inside socket handlers
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { playersRef.current = players; }, [players]);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !user.id) {
      errorToast('Please log in to play multiplayer mode');
      return;
    }

    const socketInstance = io(SERVER_URI, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('authenticate', {
        userId: user.id,
        username: user.username,
      });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('reconnect', () => {
      setIsConnected(true);
      socketInstance.emit('authenticate', {
        userId: user.id,
        username: user.username,
      });
      if (roomIdRef.current) {
        socketInstance.emit('rejoinRoom', { roomId: roomIdRef.current });
      }
    });

    return () => {
      if (roomIdRef.current) {
        socketInstance.emit('leaveRoom', { roomId: roomIdRef.current });
      }
      socketInstance.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    
    const socketListeners = {
      'onlineFriends': (friends: Friend[]) => setOnlineFriends(friends),
      'userOnline': (user: Friend) => setOnlineFriends(prev => [...prev, user]),
      'userOffline': ({ userId }: { userId: string }) => 
        setOnlineFriends(prev => prev.filter(friend => friend.userId !== userId)),
      'roomCreated': ({ roomId, newRoom }: { roomId: string, newRoom: Room  }) => {
        roomIdRef.current = roomId; // sync immediately before any potential emit
        setRoomId(roomId);
        setPlayers(newRoom.players);
        setInRoom(true);
        successToast("Room Created", `Room ID: ${roomId}` );
        // Auto-invite friend that was pending before the room existed
        if (pendingFriendInviteRef.current) {
          socket.emit('inviteFriend', {
            friendId: pendingFriendInviteRef.current,
            roomId,
            from: { userId: user?.id, username: user?.username }
          });
          pendingFriendInviteRef.current = '';
        }
      },
      'roomAvailable': (newRoom: Room) => {
        setAvailableRooms(prev =>
          prev.some(r => r.id === newRoom.id) ? prev : [...prev, newRoom]
        );
      },
      'roomClosed': ({ roomId }: { roomId: string }) => {
        setAvailableRooms(prev => prev.filter(room => room.id !== roomId));
      },
      'playerJoined': ({players: newplayers}: {players: Player[]}) => {
        setPlayers(newplayers);
        toast("Player Joined", {
          description: `${newplayers[newplayers.length - 1].username} joined the room`,
        });
      },
      'playerLeft': ({ userId }: { userId: string }) => {
        const playerLeftUsername = playersRef.current.find(player => player.id === userId)?.username;
        setPlayers(prev => prev.filter(player => player.id !== userId));
        toast("Player Left", { description: `${playerLeftUsername ?? "A player"} has left the room` });
      },
      'playerReadyState': ({ userId, isReady }: { userId: string, isReady: boolean }) => {
        setPlayers(prev => prev.map(player => 
          player.id === userId ? { ...player, isReady } : player
        ));
      },
      'gameCountdown': ({ countdown }: { countdown: number }) => setCountdown(countdown),
      'gameStart': ({ text, gameTime }: { text: string, gameTime: number }) => {
        setGameText(text);
        setTimeLeft(gameTime);
        setCountdown(null);
        setIsActive(true);
        setPlayers(prev => prev.map(player => ({ ...player, isReady: false })));
        setTimeout(() => hiddenInputRef.current?.focus(), 100);
      },
      'playerProgress': ({ userId, progress, wpm, accuracy, finished }: 
        { userId: string, progress: number, wpm: number, accuracy: number, finished: boolean }) => {
        setPlayers(prev => prev.map(player => 
          player.id === userId ? { 
            ...player, 
            progress, 
            wpm, 
            accuracy, 
            finished 
          } : player
        ));
      },
      'playerFinished': ({ position }: { position: number }) => {
        setUserFinishPosition(position);
      },
      'gameResults': ({ results }: { results: Player[] }) => {
        setResults(results);
        setUserFinishPosition(results.find(result => result.username === user?.username)?.position ?? -1);
        setIsActive(false);
        setGameEnded(true);
        setShowResults(true);
      },
      'roomReset': () => resetGame(),
      'battleInvitation': ({ roomId, from }: { roomId: string, from: Friend }) => {
        toast("Battle Invitation", {
          description: `${from.username} invited you to a typing battle!`,
          action: (
            <Button onClick={() => { joinRoom(roomId); toast.dismiss(); }}>Join</Button>
          ),
          cancel: (
            <Button variant="outline" onClick={() => toast.dismiss()}>Ignore</Button>
          ),
          icon: <Swords/>,
        });
      },
      'error': ({ message }: { message: string }) => {
        toast.error("Error", { description: message });
        if(message === 'Room not found') {
          setRoomId('');
          setInRoom(false);
        }
      },
      'availableRooms': (rooms: Room[]) => {
        setAvailableRooms(rooms);
      }
    };

    Object.entries(socketListeners).forEach(([event, handler]) => {
      socket.on(event, handler as (...args: unknown[]) => void);
    });

    return () => {
      Object.entries(socketListeners).forEach(([event, handler]) => {
        socket.off(event, handler as (...args: unknown[]) => void);
      });
    };
  }, [socket]);
  
  // Game timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, timeLeft]);
  
  // Calculate WPM and accuracy
  useEffect(() => {
    if (isActive && userInput.length > 0 && gameText) {
      const minutes = (GAME_TIME - timeLeft) / 60;
      
      let correctChars = 0;
      let correctWordsCount = 0;
      let currentWord = '';
      let expectedWord = '';
      
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === gameText[i]) {
          correctChars++;
          
          // Word tracking
          currentWord += userInput[i];
          expectedWord += gameText[i];
          
          // Check for complete word
          if (userInput[i] === ' ' || i === userInput.length - 1) {
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

      const currentAccuracy = userInput.length > 0 
        ? Math.round((correctChars / userInput.length) * 100) 
        : 100;
      
      const currentWpm = Math.round(correctWordsCount / Math.max(minutes, 1/60));
      
      setWpm(currentWpm);
      setAccuracy(currentAccuracy);
      
      const progress = Math.min(100, Math.round((userInput.length / gameText.length) * 100));
      
      if (socket && roomId) {
        socket.emit('progressUpdate', { 
          roomId, 
          progress, 
          wpm: currentWpm, 
          accuracy: currentAccuracy,
          finished: userInput.length >= gameText.length
        });
      }
      
      if (userInput.length >= gameText.length) {
        endGame();
      }
    }
  }, [userInput, isActive, gameText]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (isActive && timeLeft > 0) {
      setUserInput(e.target.value);
    }
  };

  const handleRoomIdInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    e.preventDefault();
    setRoomId(e.target.value);
  }

  const handlePlayAgain = () => initiateRoomReset();

  // Emits resetRoom to the server so ALL players reset in sync.
  // Falls back to local resetGame() if not in a room.
  const initiateRoomReset = () => {
    if (socket && roomId) {
      socket.emit('resetRoom', { roomId });
    } else {
      resetGame();
    }
  };

  const endGame = () => {
    setIsActive(false);
    //setShowResults(true);
    const progress = Math.min(100, Math.round((userInput.length / gameText.length) * 100));
    if(socket)
    socket.emit('progressUpdate', { 
      roomId, 
      progress, 
      wpm, 
      accuracy,
      finished: true
    });

  };
  
  const resetGame = () => {
    setUserInput('');
    setIsActive(false);
    setTimeLeft(GAME_TIME);
    setWpm(0);
    setAccuracy(100);
    setShowResults(false);
    setIsReady(false);
    setUserFinishPosition(null);
    setGameEnded(false);
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

    socket.once('roomJoined', ({players: newplayers}: {players: Player[]}) => {
      setPlayers(newplayers);
      setRoomId(roomIdToJoin);
      setInRoom(true);
    });
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
    toast.success("Copied!", { description: "Room ID copied to clipboard" });
  };

  const toggleReady = () => {
    if (!socket || !roomId) return;
    const newReadyState = !isReady;
    socket.emit('playerReady', { roomId, ready: newReadyState });
    setIsReady(newReadyState);
  };
  
  const inviteFriend = (targetId?: string) => {
    const id = targetId;
    if (!socket || !roomIdRef.current || !id) return;

    // Check if friend is already in the room
    if (players.some(p => p.id === id)) {
      toast.error("Friend is already in the room");
      return;
    }

    socket.emit('inviteFriend', {
      friendId: id,
      roomId: roomIdRef.current,
      from: {
        userId: user?.id,
        username: user?.username
      }
    });

    toast("Invitation Sent", { description: "Your friend has been invited to the game" });
  };
  
  const renderedText = useMemo(() => {
    if (!gameText) return <p className="text-on-surface-variant">Waiting for game to start…</p>;
    return gameText.split('').map((char, index) => {
      let cls = 'transition-colors duration-75 ';
      if (index < userInput.length) {
        cls += userInput[index] === char ? 'text-on-surface' : 'text-error bg-error/10';
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
  }, [gameText, userInput]);
  
  // ── Lobby View ────────────────────────────────────────────────────────
  const LobbyView = () => (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <div className="mb-10 space-y-2">
        <h1 className="text-5xl font-bold font-headline text-on-surface tracking-tight">Battle Lobby</h1>
        <p className="text-on-surface-variant font-medium">Select your arena. Compete in high-stakes typing sprints.</p>
      </div>

      {!inRoom ? (
        <div className="bento-grid">
          {/* ── Create a Room ── */}
          <div className="col-span-12 lg:col-span-8 glass-panel p-8 flex flex-col justify-between relative group overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Plus className="text-primary" size={28} />
                <h2 className="text-2xl font-bold font-headline">Create a Room</h2>
              </div>
              <p className="text-on-surface-variant max-w-md mb-8">
                Host your own battle. Set it public so anyone can join, or go private for an invite-only showdown.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              <button
                onClick={() => createRoom(false)}
                className="shiny-btn-mask flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary-dim text-on-primary-fixed font-headline font-extrabold rounded-lg shadow-glow-primary hover:brightness-110 active:scale-95 transition-all"
              >
                <Swords size={18} /> Start Public Battle
              </button>
              <button
                onClick={() => createRoom(true)}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-secondary/10 border border-secondary/30 text-secondary font-headline font-bold rounded-lg hover:bg-secondary/20 hover:shadow-glow-secondary transition-all active:scale-95"
              >
                <Lock size={18} /> Create Private Room
              </button>
            </div>
          </div>

          {/* ── Join by Room ID ── */}
          <div className="col-span-12 lg:col-span-4 glass-panel p-8 flex flex-col justify-center border-2 border-transparent hover:border-secondary/20 transition-all">
            <h3 className="text-xl font-bold font-headline mb-4 flex items-center gap-2">
              <LogIn className="text-secondary" size={20} />
              Join by Room ID
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="e.g. ALPHA-SPEED-99"
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg py-4 px-4 font-mono text-secondary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                value={roomId}
                onChange={handleRoomIdInput}
              />
              <button
                onClick={() => joinRoom(roomId)}
                disabled={!roomId}
                className="w-full bg-secondary text-on-secondary px-6 py-4 rounded-lg font-headline font-bold hover:bg-secondary-dim active:scale-95 transition-all shadow-lg disabled:opacity-40"
              >
                Join Room
              </button>
            </div>
          </div>

          {/* ── Live Lobby List ── */}
          <div className="col-span-12 glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Swords className="text-tertiary" size={20} />
                <h3 className="text-xl font-bold font-headline">Live Lobby</h3>
              </div>
              <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse" />
                {availableRooms.length} rooms live
              </span>
            </div>
            {availableRooms.length > 0 ? (
              <div className="divide-y divide-white/5">
                {availableRooms.map(room => (
                  <div key={room.id} className="grid grid-cols-12 items-center p-4 hover:bg-white/[0.03] transition-all">
                    <div className="col-span-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary font-mono font-bold text-sm">
                        {room.id.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">Room {room.id}</p>
                        <p className="text-xs text-on-surface-variant font-mono">ID: {room.id}</p>
                      </div>
                    </div>
                    <div className="col-span-4 text-center">
                      <span className="text-sm font-medium text-on-surface-variant">
                        {room.players?.length ?? 0} / 8 Players
                      </span>
                    </div>
                    <div className="col-span-2 text-center">
                      {room.isGameInProgress ? (
                        <span className="px-3 py-1 rounded bg-error/10 text-error text-[10px] uppercase font-bold tracking-widest">In Battle</span>
                      ) : (
                        <span className="px-3 py-1 rounded bg-tertiary/10 text-tertiary text-[10px] uppercase font-bold tracking-widest">Open</span>
                      )}
                    </div>
                    <div className="col-span-2 text-right">
                      <button
                        onClick={() => joinRoom(room.id)}
                        disabled={room.isGameInProgress}
                        className="px-6 py-2 rounded bg-surface-container-highest text-on-surface hover:bg-primary hover:text-on-primary-fixed transition-all font-bold text-sm disabled:opacity-40"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-14 flex flex-col items-center gap-3 text-on-surface-variant">
                <Swords size={36} className="opacity-20" />
                <p className="text-sm">No public rooms right now. Create one!</p>
              </div>
            )}
          </div>

          {/* ── Online Friends ── */}
          {onlineFriends.length > 0 && (
            <div className="col-span-12 glass-panel p-6">
              <h3 className="text-xl font-bold font-headline mb-4 flex items-center gap-2">
                <Users className="text-secondary" size={20} />
                Friends Online
                <span className="ml-2 text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded font-mono">{onlineFriends.length}</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {onlineFriends.map(friend => (
                  <div key={friend.userId} className="flex items-center justify-between bg-surface-container-highest rounded-lg px-4 py-3">
                    <span className="text-on-surface text-sm font-medium">{friend.username}</span>
                    <button
                      onClick={() => { pendingFriendInviteRef.current = friend.userId; createRoom(true); }}
                      className="text-xs text-secondary hover:text-secondary-dim transition-colors font-bold"
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── In-Room Waiting View ── */
        <div className="px-8 py-10 max-w-6xl mx-auto space-y-6">
          <div className="glass-panel p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-headline font-bold text-on-surface mb-1">Waiting Room</h2>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-secondary text-lg">{roomId}</span>
                  <button
                    title="Copy Room ID"
                    onClick={copyRoomId}
                    className="text-on-surface-variant hover:text-secondary transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <button
                onClick={leaveRoom}
                className="px-5 py-2 border border-error/30 text-error rounded-lg hover:bg-error/10 transition-all text-sm font-bold"
              >
                Leave Room
              </button>
            </div>

            {/* Players */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {players.map(player => {
                const isSelf = user?.id === player.id;
                const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(player.username)}`;
                return (
                  <div
                    key={player.id}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                      player.isReady
                        ? 'bg-tertiary/10 border-tertiary/30'
                        : 'bg-surface-container-highest border-white/5'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl} alt={player.username} className="w-12 h-12 rounded-full border-2 border-surface-variant" />
                    <span className={`text-sm font-bold ${isSelf ? 'text-primary' : 'text-on-surface'}`}>
                      {player.username}{isSelf && ' (You)'}
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                      player.isReady ? 'text-tertiary bg-tertiary/10' : 'text-on-surface-variant bg-surface-variant/50'
                    }`}>
                      {player.isReady ? 'Ready' : 'Not Ready'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Ready button */}
            <div className="flex justify-center">
              <button
                onClick={toggleReady}
                className={`shiny-btn-mask px-12 py-4 rounded-lg font-headline font-bold text-lg transition-all active:scale-95 ${
                  isReady
                    ? 'bg-surface-container-highest text-on-surface border border-white/10 hover:bg-surface-bright'
                    : 'bg-gradient-to-r from-primary to-primary-dim text-on-primary-fixed shadow-glow-primary hover:brightness-110'
                }`}
              >
                {isReady ? '✕ Cancel Ready' : '⚡ Ready Up!'}
              </button>
            </div>
          </div>

          {/* Invite friends */}
          {onlineFriends.filter(f => !players.find(p => p.id === f.userId)).length > 0 && (
            <div className="glass-panel p-6">
              <h3 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <Users size={18} className="text-secondary" /> Invite Friends
              </h3>
              <div className="flex flex-wrap gap-3">
                {onlineFriends.filter(f => !players.find(p => p.id === f.userId)).map(friend => (
                  <button
                    key={friend.userId}
                    onClick={() => inviteFriend(friend.userId)}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-lg text-sm hover:bg-secondary/10 hover:text-secondary border border-white/5 transition-all"
                  >
                    <Send size={14} />
                    {friend.username}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Countdown View ────────────────────────────────────────────────────
  const CountdownView = () => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
      <p className="text-on-surface-variant uppercase tracking-[0.4em] text-sm font-headline mb-8">Get Ready!</p>
      <div
        key={countdown}
        className="text-9xl font-headline font-extrabold text-secondary animate-count-in"
        style={{ textShadow: '0 0 60px rgba(0,238,252,0.5)' }}
      >
        {countdown}
      </div>
    </div>
  );

  // ── Game View ─────────────────────────────────────────────────────────
  const GameView = () => (
    <div
      className="flex flex-col h-[calc(100vh-80px)] px-8 py-4 gap-4 w-full overflow-hidden"
      onClick={() => hiddenInputRef.current?.focus()}
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'r') {
          e.preventDefault();
          initiateRoomReset();
        }
      }}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={-1}
    >

      {/* Race Track Section */}
      <section className="shrink-0 bg-surface-container rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6">
          {players.map((player, idx) => {
            const isSelf = player.id === user?.id;
            const isLeading = idx === 0;
            const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(player.username)}`;
            const clampedProgress = Math.min(100, Math.max(0, player.progress || 0));
            return (
              <div key={player.id} className="relative flex items-center h-12">
                <div className="absolute inset-y-0 left-0 w-full self-center" style={{ height: 2, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.04)' }} />
                <div
                  className="absolute left-0 self-center"
                  style={{
                    height: 2, top: '50%', transform: 'translateY(-50%)',
                    width: `${clampedProgress}%`,
                    transition: 'width 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                    background: isSelf
                      ? 'linear-gradient(to right, #de8eff, transparent)'
                      : isLeading
                        ? 'linear-gradient(to right, #00eefc, transparent)'
                        : 'linear-gradient(to right, #8b909e, transparent)',
                    boxShadow: isSelf ? '0 0 15px rgba(222,142,255,0.5)' : isLeading ? '0 0 15px rgba(0,238,252,0.3)' : 'none',
                  }}
                />
                <div
                  className="absolute -translate-x-1/2 flex flex-col items-center gap-1"
                  style={{ left: `${clampedProgress}%` }}
                >
                  {isSelf ? (
                    <span className="px-3 py-0.5 bg-primary text-on-primary text-[9px] font-bold rounded-full shadow-lg shadow-primary/20">YOU</span>
                  ) : (
                    <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase ${isLeading ? 'bg-secondary/20 text-secondary' : 'bg-surface-variant text-on-surface-variant'}`}>
                      {player.username.slice(0, 8)}
                    </span>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl} alt={player.username} className={`rounded-full object-cover ${isSelf ? 'h-9 w-9 border-2 border-primary' : 'h-7 w-7 border border-white/20'}`} />
                </div>
                <div className={`absolute right-0 font-mono text-sm font-bold ${isSelf ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {clampedProgress}%
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Typing area */}
      <div className="glass-panel p-6 relative flex flex-col flex-1 min-h-0">
        <div className="absolute top-4 right-4 opacity-5">
          <span className="text-6xl font-headline select-none">⌨</span>
        </div>
        <div className="mono-focus text-2xl text-on-surface-variant select-none flex-1 overflow-hidden">
          {renderedText}
        </div>
        <div className="mt-auto pt-6 flex items-center justify-between">
          <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs font-mono text-secondary">ctrl + r to reset</span>
          <div className="flex gap-4">
            <button
              onClick={initiateRoomReset}
              className="flex items-center gap-2 px-6 py-3 bg-surface-container-highest hover:bg-surface-variant text-on-surface rounded-xl transition-all active:scale-95"
            >
              <RefreshCw size={14} />
              <span className="font-headline font-bold text-sm tracking-widest uppercase">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="shrink-0 grid grid-cols-3 gap-6">
        <div className="bg-surface-container-high rounded-2xl p-6 flex items-center justify-between shadow-xl">
          <div>
            <div className="stat-label mb-1">Time Left</div>
            <div className={`text-4xl font-headline font-bold ${timeLeft <= 10 ? 'text-error drop-shadow-[0_0_8px_rgba(255,110,132,0.4)]' : 'text-secondary'}`}>
              00:{String(timeLeft).padStart(2, '0')}
            </div>
          </div>
          <Timer size={28} className={timeLeft <= 10 ? 'text-error/60' : 'text-secondary/60'} />
        </div>
        <div className="bg-surface-container-high rounded-2xl p-6 flex items-center justify-between shadow-xl">
          <div>
            <div className="stat-label mb-1">Speed</div>
            <div className="text-4xl font-headline font-bold text-secondary">{wpm}</div>
            <div className="text-xs text-on-surface-variant mt-0.5">WPM</div>
          </div>
          <Target size={28} className="text-secondary/60" />
        </div>
        <div className="bg-surface-container-high rounded-2xl p-6 flex items-center justify-between shadow-xl">
          <div>
            <div className="stat-label mb-1">Accuracy</div>
            <div className={`text-4xl font-headline font-bold ${accuracy >= 95 ? 'text-tertiary' : accuracy >= 80 ? 'text-secondary' : 'text-error'}`}>{accuracy}%</div>
          </div>
          <Trophy size={28} className="text-tertiary/60" />
        </div>
      </div>

      <input
        title="Start Typing"
        ref={hiddenInputRef}
        value={userInput}
        onChange={handleInputChange}
        className="opacity-0 absolute top-0 left-0 h-0 w-0 pointer-events-none"
        autoFocus={isActive}
      />
    </div>
  );

  // ── Results View ──────────────────────────────────────────────────────
  const ResultsView = () => (
    <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-md flex items-center justify-center p-6">
      <div className="glass-modal w-full max-w-3xl p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-secondary/10 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-5xl font-headline font-bold tracking-tight text-on-surface mb-2">BATTLE OVER</h2>
              <p className="text-on-surface-variant uppercase tracking-[0.3em] text-sm">Final Standings</p>
            </div>
            {userFinishPosition === 1 && (
              <div className="flex items-center gap-3 bg-tertiary/10 border border-tertiary/30 px-6 py-3 rounded-xl">
                <Trophy size={20} className="text-tertiary" />
                <span className="text-tertiary font-headline font-bold text-lg uppercase italic">Victory!</span>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/5 mb-10">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-high">
                  <th className="stat-label px-6 py-4 text-left">Rank</th>
                  <th className="stat-label px-6 py-4 text-left">Player</th>
                  <th className="stat-label px-6 py-4 text-right">WPM</th>
                  <th className="stat-label px-6 py-4 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {results.map((result, index) => {
                  const isSelf = user?.id === result.id;
                  return (
                    <tr key={result.id} className={isSelf ? 'bg-primary/5' : 'bg-surface-container'}>
                      <td className="px-6 py-4">
                        <span className={`font-headline font-bold text-2xl ${index === 0 ? 'text-tertiary' : index === 1 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold text-sm ${isSelf ? 'text-primary' : 'text-on-surface'}`}>
                          {result.username}{isSelf && ' (You)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-secondary">{result.wpm}</td>
                      <td className="px-6 py-4 text-right font-mono text-on-surface-variant">{result.accuracy}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              onClick={homeButton}
              className="flex items-center gap-2 px-6 py-3 bg-surface-container-highest text-on-surface rounded-xl hover:bg-surface-bright transition-all font-bold"
            >
              <Home size={16} /> Home
            </button>
            <button
              onClick={handlePlayAgain}
              className="shiny-btn-mask flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary-dim text-on-primary-fixed rounded-xl font-headline font-bold shadow-glow-primary hover:brightness-110 active:scale-95 transition-all"
            >
              <RefreshCw size={16} /> Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative">
      {!(isConnected && user) ? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-on-surface-variant">
          <div className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
          <p className="text-sm">Connecting to server…</p>
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
  );
};

export default MultiPlayer;
