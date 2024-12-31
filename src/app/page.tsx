'use client'

import React, { useEffect } from 'react';
import AuthForms from '@/components/authForms';
import GameModeSelection from '@/components/gameModeSelection';
import SinglePlayerGame from '@/components/singleplayer';
import useGameStore from '@/store/useGameStore';

const TypingGame: React.FC = () => {
  const { gameState } = useGameStore();
  
  useEffect(() => {
    useGameStore.persist.rehydrate();
  }, []);
  
  const renderGameComponent = () => {
    switch (gameState) {
      case 'auth':
        return <AuthForms />;
      case 'mode-select':
        return <GameModeSelection />;
      case 'single':
        return <SinglePlayerGame />;
      case 'multi':
        return <div>Multiplayer Coming Soon</div>;
      default:
        return <div>Loading...</div>;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {renderGameComponent()}
      </div>
    </div>
  );
};

export default TypingGame;