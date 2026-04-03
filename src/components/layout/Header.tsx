// components/layout/Header.tsx
'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, User, Keyboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/useGameStore';

interface HeaderProps {
  username?: string;
}

const Header: React.FC<HeaderProps> = ({ username = 'Guest' }) => {
  const { logout } = useGameStore()
  const router = useRouter();
  const handleLogout = async () => {
    try {
      logout();
      console.log('logged out');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile');
  };
  console.log('object', username);

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Keyboard className="h-6 w-6 text-violet-600" />
          <span className="text-xl font-bold text-violet-600">Rapid Keys</span>
        </div>

        <div className="flex items-center space-x-4">
          {username !== "Guest" && (
            <div className="text-sm text-gray-600">
              Hi, <span className="font-medium">{username}</span>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={handleEditProfile}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600"
              >
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