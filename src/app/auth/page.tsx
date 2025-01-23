'use client'

import React, { FormEvent, useState } from 'react';
import { signUp, login } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Keyboard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useGameStore from '@/store/useGameStore';
import { useRouter } from 'next/navigation';

type LoginEvent = FormEvent<HTMLFormElement> & {
  target: HTMLFormElement & {
    elements: {
      email: HTMLInputElement;
      password: HTMLInputElement;
    };
  };
};

type SignUpEvent = FormEvent<HTMLFormElement> & {
  target: HTMLFormElement & {
    elements: {
      username: HTMLInputElement;
      email: HTMLInputElement;
      password: HTMLInputElement;
    };
  };
};

const AuthForms = () => {
  const router = useRouter();
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const { setGameState } = useGameStore();

  const handleLogin = async (e: LoginEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const formData = new FormData(e.target);
      const response = await login(
        formData.get('email') as string,
        formData.get('password') as string
      );
      

      onAuthSuccess(response?.user, response?.token);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const handleSignup = async (e: SignUpEvent) => {
    e.preventDefault();
    setSignupError('');
    
    try {
      const formData = new FormData(e.target);
      const { token, user } = await signUp(
        formData.get('username') as string,
        formData.get('email') as string,
        formData.get('password') as string
      );
      
      onAuthSuccess(user, token);
    } catch (error) {
      setSignupError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const onAuthSuccess = (user: any, token: any) => {
    setGameState('menu');
    window.dispatchEvent(new Event('auth-state-changed'));
    router.push('/menu');
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