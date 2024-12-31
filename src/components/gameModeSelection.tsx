// components/GameModeSelection.tsx

'use client'

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Keyboard, Users, User, Trophy } from 'lucide-react';
import useGameStore from '@/store/useGameStore';
import type { GameMode } from '@/types/game';

const GameModeSelection: React.FC = () => {
  const { setGameState, setGameMode } = useGameStore();

  const handleModeSelect = (mode: GameMode) => {
    if (mode) {
      setGameMode(mode);
      setGameState(mode);
    }
  };

  const GameCard: React.FC<{
    mode: GameMode;
    icon: React.ReactNode;
    title: string;
    description: string;
  }> = ({ mode, icon, title, description }) => (
    <Card 
      className="w-64 cursor-pointer hover:shadow-lg transition-shadow hover:border-violet-500/50"
      onClick={() => handleModeSelect(mode)}
    >
      <CardHeader>
        <div className="mx-auto">
          {icon}
        </div>
        <CardTitle className="text-center">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
    </Card>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-500/10 to-purple-500/10">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <Keyboard className="h-16 w-16 text-violet-500 mx-auto" />
          <h1 className="text-3xl font-bold">Choose Your Mode</h1>
          <p className="text-gray-600">Practice alone or compete with friends</p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <GameCard
            mode="single"
            icon={<User className="h-8 w-8 text-violet-500" />}
            title="Single Player"
            description="Practice at your own pace"
          />
          
          <GameCard
            mode="multi"
            icon={<Users className="h-8 w-8 text-violet-500" />}
            title="Multiplayer"
            description="Race against others"
          />
        </div>
      </div>
    </div>
  );
};

export default GameModeSelection;