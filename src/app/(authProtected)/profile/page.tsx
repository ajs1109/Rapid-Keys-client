'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Loader2, Trash2, X, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/useGameStore';
import { updateProfile, deleteScores, checkUsernameAvailability, checkEmailAvailability } from '@/lib/api';
import { EditUser } from '@/types/edit';

const ProfilePage = () => {
  const { user, setAuthUser, setGameState, logout } = useGameStore();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState({
    update: false,
    delete: false,
    logout: false,
    usernameCheck: false,
    emailCheck: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  // Username and email availability states
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  
  // Debounce timeouts refs
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store original values for comparison
  const [originalValues] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
    
    // Cleanup timeouts on component unmount
    return () => {
      if (usernameTimeoutRef.current) clearTimeout(usernameTimeoutRef.current);
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
    };
  }, [user, router]);

  // Check username availability
  const checkUsername = async (username: string) => {
    // Skip check if username hasn't changed from the original
    if (username === originalValues.username) {
      setUsernameAvailable(null);
      return;
    }
    
    if (!username.trim()) {
      setUsernameAvailable(null);
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, usernameCheck: true }));
      const result = await checkUsernameAvailability(username);
      setUsernameAvailable(result.available);
      
      if (!result.available) {
        setErrors(prev => ({
          ...prev,
          username: result.message || 'Username already taken'
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.username;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setLoading(prev => ({ ...prev, usernameCheck: false }));
    }
  };

  // Check email availability
  const checkEmail = async (email: string) => {
    // Skip check if email hasn't changed from the original
    if (email === originalValues.email) {
      setEmailAvailable(null);
      return;
    }
    
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailAvailable(null);
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, emailCheck: true }));
      const result = await checkEmailAvailability(email);
      setEmailAvailable(result.available);
      
      if (!result.available) {
        setErrors(prev => ({
          ...prev,
          email: result.message || 'Email already registered'
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking email:', error);
    } finally {
      setLoading(prev => ({ ...prev, emailCheck: false }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Debounce username check
    if (name === 'username') {
      // Reset availability state while typing
      setUsernameAvailable(null);
      
      // Clear previous timeout
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }
      
      // Set new timeout for checking
      usernameTimeoutRef.current = setTimeout(() => {
        checkUsername(value);
      }, 500);
    }
    
    // Debounce email check
    if (name === 'email') {
      // Reset availability state while typing
      setEmailAvailable(null);
      
      // Clear previous timeout
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
      
      // Set new timeout for checking
      emailTimeoutRef.current = setTimeout(() => {
        checkEmail(value);
      }, 500);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (usernameAvailable === false && formData.username !== originalValues.username) {
      newErrors.username = 'Username is already taken';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    } else if (emailAvailable === false && formData.email !== originalValues.email) {
      newErrors.email = 'Email is already registered';
    }
    
    if (showPasswordFields) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      
      // if (formData.newPassword && formData.newPassword.length < 6) {
      //   newErrors.newPassword = 'Password must be at least 6 characters';
      // }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    
    if (!validateForm()) return;
    
    try {
      setLoading(prev => ({ ...prev, update: true }));
      
      const updatePayload: EditUser = {
        username: formData.username,
        email: formData.email
      };
      
      if (showPasswordFields && formData.newPassword) {
        updatePayload.password = formData.currentPassword;
        updatePayload.newPassword = formData.newPassword;
      }
      
      const updatedUser = await updateProfile(updatePayload);
      if(updatedUser.user){
        setAuthUser(updatedUser.user);
      }
      
      // Update original values after successful update
      originalValues.username = formData.username;
      originalValues.email = formData.email;
      
      // Reset availability states
      setUsernameAvailable(null);
      setEmailAvailable(null);
      
      setSuccess('Profile updated successfully!');
      setShowPasswordFields(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'Failed to update profile'
      });
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  const handleClearScores = async () => {
    try {
      setLoading(prev => ({ ...prev, delete: true }));
      await deleteScores();
      
      // Update local user state
      if (user) {
        setAuthUser({
          ...user,
          gamesPlayed: 0,
          highestWPM: 0,
          highestAccuracy: 0
        });
      }
      
      setSuccess('Your scores have been cleared successfully!');
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'Failed to clear scores'
      });
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500/10 to-purple-500/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and statistics
          </p>
        </div>
        
        {errors.form && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      className={
                        usernameAvailable === true && formData.username !== originalValues.username
                          ? 'pr-10 border-green-500 focus:ring-green-500'
                          : usernameAvailable === false && formData.username !== originalValues.username
                          ? 'pr-10 border-red-500 focus:ring-red-500'
                          : 'pr-10'
                      }
                    />
                    {loading.usernameCheck && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {!loading.usernameCheck && usernameAvailable === true && formData.username !== originalValues.username && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                    {!loading.usernameCheck && usernameAvailable === false && formData.username !== originalValues.username && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <X className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                  {usernameAvailable === true && formData.username !== originalValues.username && !errors.username && (
                    <p className="mt-1 text-sm text-green-600">Username is available</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={
                        emailAvailable === true && formData.email !== originalValues.email
                          ? 'pr-10 border-green-500 focus:ring-green-500'
                          : emailAvailable === false && formData.email !== originalValues.email
                          ? 'pr-10 border-red-500 focus:ring-red-500'
                          : 'pr-10'
                      }
                    />
                    {loading.emailCheck && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {!loading.emailCheck && emailAvailable === true && formData.email !== originalValues.email && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                    {!loading.emailCheck && emailAvailable === false && formData.email !== originalValues.email && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <X className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                  {emailAvailable === true && formData.email !== originalValues.email && !errors.email && (
                    <p className="mt-1 text-sm text-green-600">Email is available</p>
                  )}
                </div>
              </div>
              
              {!showPasswordFields ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordFields(true)}
                >
                  Change Password
                </Button>
              ) : (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                    />
                    {errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                    />
                    {errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordFields(false);
                        setFormData(prev => ({
                          ...prev,
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        }));
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              <CardFooter className="flex justify-end px-0 pb-0">
                <Button 
                  type="submit" 
                  disabled={
                    loading.update || 
                    loading.usernameCheck || 
                    loading.emailCheck || 
                    (usernameAvailable === false && formData.username !== originalValues.username) ||
                    (emailAvailable === false && formData.email !== originalValues.email)
                  }
                >
                  {loading.update ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Games Played</p>
                <p className="text-2xl font-semibold">{user.gamesPlayed}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Highest WPM</p>
                <p className="text-2xl font-semibold">{user.highestWPM}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Highest Accuracy</p>
                <p className="text-2xl font-semibold">{user.highestAccuracy}%</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              variant="destructive"
              onClick={handleClearScores}
              disabled={loading.delete}
            >
              {loading.delete ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Scores
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={loading.logout}
          >
            {loading.logout ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Logout'
            )}
          </Button>
        </div> */}
      </div>
    </div>
  );
};

export default ProfilePage;