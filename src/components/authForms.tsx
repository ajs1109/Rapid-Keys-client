'use client'

import React, { useState } from 'react';
import { signUp, login } from '@/lib/api';
import useAuthStore from '@/store/useAuthStore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, Keyboard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import useGameStore from '@/store/useGameStore';

const AuthForms = () => {
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const { setUser, setGameState } = useGameStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const formData = new FormData(e.target);
      const { token, user } = await login(
        formData.get('email') as string,
        formData.get('password') as string
      );
      
      setAuth(user, token);
      setUser(user)
      onAuthSuccess();
    } catch (error) {
      setLoginError(error.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    
    try {
      const formData = new FormData(e.target);
      const { token, user } = await signUp(
        formData.get('username') as string,
        formData.get('email') as string,
        formData.get('password') as string
      );
      
      setAuth(user, token);
      setUser(user);
      onAuthSuccess();
    } catch (error) {
      setSignupError(error.message);
    }
  };

  const onAuthSuccess = () => {
    setGameState('mode-select');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-500/10 to-purple-500/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Keyboard className="h-12 w-12 text-violet-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Rapid Keys</CardTitle>
          <CardDescription>Improve your typing speed with friends</CardDescription>
        </CardHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <CardContent>
              <form onSubmit={handleLogin}>
                {loginError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                </div>
                <CardFooter className="flex justify-end mt-4 px-0">
                  <Button type="submit" className="bg-violet-500 hover:bg-violet-600">Login</Button>
                </CardFooter>
              </form>
            </CardContent>
          </TabsContent>

          <TabsContent value="signup">
            <CardContent>
              <form onSubmit={handleSignup}>
                {signupError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{signupError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      name="username"
                      type="text"
                      placeholder="speedtyper123"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                </div>
                <CardFooter className="flex justify-end mt-4 px-0">
                  <Button type="submit" className="bg-violet-500 hover:bg-violet-600">Sign Up</Button>
                </CardFooter>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AuthForms;