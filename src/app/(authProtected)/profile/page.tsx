'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Trash2, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/useGameStore';
import { updateProfile, deleteScores, checkUsernameAvailability, checkEmailAvailability, getMyRank } from '@/lib/api';
import { EditUser } from '@/types/edit';
import { errorToast, successToast } from '@/utils/customToast';

const ProfilePage = () => {
  const { user, setAuthUser } = useGameStore();
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
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  // Username and email availability states
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  
  // Debounce timeouts refs
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [rankData, setRankData] = useState<{ rank: number; total: number } | null>(null);

  // Store original values for comparison
  const [originalValues] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });

  useEffect(() => {
    getMyRank().then(setRankData).catch(() => {});
  }, []);

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
      successToast('Profile updated successfully!');
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
      if(user?.highestAccuracy === 0 && user?.highestWPM === 0 && user?.gamesPlayed === 0){
        errorToast('No scores to clear!');
        return;
      }
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
      
      successToast('Scores cleared successfully!');
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
        <div className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(user.username)}`;

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto space-y-8">

      {/* ── User Identity ─────────────────────────────────────── */}
      <div className="glass-panel p-8 flex items-center gap-8">
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt={user.username} className="w-24 h-24 rounded-2xl border-2 border-primary/30" />
          <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold rounded uppercase">
            {user.gamesPlayed >= 100 ? 'Elite' : user.gamesPlayed >= 50 ? 'Pro' : user.gamesPlayed >= 10 ? 'Racer' : 'Novice'}
          </span>
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-headline font-bold text-on-surface">{user.username}</h1>
          <p className="text-on-surface-variant mt-1">{user.email}</p>
          <p className="text-xs text-on-surface-variant/50 mt-2 uppercase tracking-widest">
            {user.gamesPlayed} races completed
          </p>
        </div>
        <button
          onClick={() => setShowPasswordFields(!showPasswordFields)}
          className="px-6 py-3 border border-white/10 text-on-surface rounded-xl hover:bg-surface-container-highest transition-all text-sm font-bold"
        >
          Edit Profile
        </button>
      </div>

      {/* ── Lifetime Stats ────────────────────────────────────── */}
      <div className="bento-grid gap-6" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <div className="bg-surface-container-high rounded-2xl p-6 flex flex-col justify-between" style={{ gridColumn: 'span 1' }}>
          <div className="stat-label">Games</div>
          <div className="text-5xl font-headline font-bold text-on-surface mt-2">{user.gamesPlayed}</div>
          <div className="text-xs text-on-surface-variant mt-1">Played</div>
        </div>
        <div className="bg-surface-container-high rounded-2xl p-6 flex flex-col justify-between" style={{ gridColumn: 'span 2' }}>
          <div className="stat-label">Peak Speed</div>
          <div className="text-5xl font-headline font-bold text-secondary mt-2 drop-shadow-[0_0_12px_rgba(0,238,252,0.4)]">
            {user.highestWPM}
          </div>
          <div className="text-xs text-on-surface-variant mt-1">WPM Personal Best</div>
        </div>
        <div className="bg-surface-container-high rounded-2xl p-6 flex flex-col justify-between" style={{ gridColumn: 'span 1' }}>
          <div className="stat-label">Best Accuracy</div>
          <div className="text-5xl font-headline font-bold text-primary mt-2">{user.highestAccuracy}%</div>
        </div>
        <div className="bg-surface-container-high rounded-2xl p-6 flex flex-col justify-between col-span-2" style={{ gridColumn: 'span 2' }}>
          <div className="stat-label">Rank</div>
          <div className="text-2xl font-headline font-bold text-tertiary mt-2">{rankData ? `#${rankData.rank}` : '-'}</div>
          <div className="text-xs text-on-surface-variant mt-1">{rankData ? `of ${rankData.total} players` : 'Loading rank…'}</div>
        </div>
      </div>

      {/* ── Edit Profile Modal ───────────────────────────────── */}
      {showPasswordFields && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-modal w-full max-w-xl p-10 relative">
            <button
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => setShowPasswordFields(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-headline font-bold text-on-surface mb-8">Edit Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.form && (
                <div className="px-4 py-3 bg-error/10 border border-error/30 text-error text-sm rounded-lg">{errors.form}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="stat-label block mb-2">Username</label>
                  <div className="relative">
                    <input
                      id="username" name="username" type="text"
                      value={formData.username} onChange={handleChange}
                      className={`w-full bg-surface-container-highest text-on-surface rounded-lg px-4 py-3 text-sm outline-none border transition-all focus:ring-2 ${
                        usernameAvailable === true && formData.username !== originalValues.username
                          ? 'border-tertiary/60 focus:ring-tertiary/20'
                          : usernameAvailable === false && formData.username !== originalValues.username
                          ? 'border-error/60 focus:ring-error/20'
                          : 'border-white/5 focus:ring-secondary/20'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      {loading.usernameCheck && <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" />}
                      {!loading.usernameCheck && usernameAvailable === true && formData.username !== originalValues.username && (
                        <Check className="h-4 w-4 text-tertiary" />
                      )}
                      {!loading.usernameCheck && usernameAvailable === false && formData.username !== originalValues.username && (
                        <X className="h-4 w-4 text-error" />
                      )}
                    </div>
                  </div>
                  {errors.username && <p className="mt-1 text-xs text-error">{errors.username}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="stat-label block mb-2">Email</label>
                  <div className="relative">
                    <input
                      id="email" name="email" type="email"
                      value={formData.email} onChange={handleChange}
                      className={`w-full bg-surface-container-highest text-on-surface rounded-lg px-4 py-3 text-sm outline-none border transition-all focus:ring-2 ${
                        emailAvailable === true && formData.email !== originalValues.email
                          ? 'border-tertiary/60 focus:ring-tertiary/20'
                          : emailAvailable === false && formData.email !== originalValues.email
                          ? 'border-error/60 focus:ring-error/20'
                          : 'border-white/5 focus:ring-secondary/20'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      {loading.emailCheck && <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" />}
                      {!loading.emailCheck && emailAvailable === true && formData.email !== originalValues.email && (
                        <Check className="h-4 w-4 text-tertiary" />
                      )}
                      {!loading.emailCheck && emailAvailable === false && formData.email !== originalValues.email && (
                        <X className="h-4 w-4 text-error" />
                      )}
                    </div>
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-error">{errors.email}</p>}
                </div>
              </div>

              {/* Password section */}
              <div className="border-t border-white/5 pt-6 space-y-4">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Change Password</h3>
                <div>
                  <label className="stat-label block mb-2">Current Password</label>
                  <input
                    id="currentPassword" name="currentPassword" type="password"
                    value={formData.currentPassword} onChange={handleChange}
                    className="w-full bg-surface-container-highest text-on-surface rounded-lg px-4 py-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                  {errors.currentPassword && <p className="mt-1 text-xs text-error">{errors.currentPassword}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="stat-label block mb-2">New Password</label>
                    <input
                      id="newPassword" name="newPassword" type="password"
                      value={formData.newPassword} onChange={handleChange}
                      className="w-full bg-surface-container-highest text-on-surface rounded-lg px-4 py-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-secondary/20 transition-all"
                    />
                    {errors.newPassword && <p className="mt-1 text-xs text-error">{errors.newPassword}</p>}
                  </div>
                  <div>
                    <label className="stat-label block mb-2">Confirm Password</label>
                    <input
                      id="confirmPassword" name="confirmPassword" type="password"
                      value={formData.confirmPassword} onChange={handleChange}
                      className="w-full bg-surface-container-highest text-on-surface rounded-lg px-4 py-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-secondary/20 transition-all"
                    />
                    {errors.confirmPassword && <p className="mt-1 text-xs text-error">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleClearScores}
                  disabled={loading.delete}
                  className="flex items-center gap-2 px-5 py-3 border border-error/30 text-error rounded-lg hover:bg-error/10 transition-all text-sm font-bold disabled:opacity-50"
                >
                  {loading.delete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Clear Scores
                </button>
                <button
                  type="submit"
                  disabled={
                    loading.update || loading.usernameCheck || loading.emailCheck ||
                    (usernameAvailable === false && formData.username !== originalValues.username) ||
                    (emailAvailable === false && formData.email !== originalValues.email)
                  }
                  className="shiny-btn-mask flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary-dim text-on-primary-fixed rounded-xl font-headline font-bold shadow-glow-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.update ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
