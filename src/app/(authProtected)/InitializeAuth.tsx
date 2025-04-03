'use client'

import useStore from '@/store/useGameStore';
import { User } from '@/types/auth'
import React, { useEffect } from 'react'

const InitializeAuth: React.FC<{user: User}> = ({user}) => {
    const {setAuthUser, setGamesPlayed, setHighScore} = useStore();
  useEffect(() => {
    setAuthUser(user);
    setGamesPlayed(user.gamesPlayed);
    setHighScore(user.highestWPM, user.highestAccuracy);
  }, [])
  return (
    <></>
  )
}

export default InitializeAuth