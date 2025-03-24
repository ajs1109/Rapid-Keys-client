'use client'

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, User as UserIcon, Keyboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout, verifyUser } from '@/lib/api';
import { useAuthStore } from '@/store/useGameStore';
import { User } from '@/types/auth';
interface HeaderProps {
  user: User | null | undefined;
}

const Header: React.FC<HeaderProps> = ({user}) => {
  const router = useRouter();
  const {setStoreUser} = useAuthStore();

  const getUserFromServer = () => {
    verifyUser().then(res => setStoreUser(res));
  };
  useEffect(() => {
    getUserFromServer();
    console.log('object', user);
  }, [])
  
  const handleLogout = async () => {
    try {
      await logout();
      //clearUser();
      console.log('logged out');
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile');
  };
  

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Keyboard className="h-6 w-6 text-violet-600" />
          <span className="text-xl font-bold text-violet-600">Rapid Keys</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Hi, <span className="font-medium">{user?.username}</span> 
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEditProfile} className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;