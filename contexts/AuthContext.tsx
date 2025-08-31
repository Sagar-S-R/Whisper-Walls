import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/config/api';

interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Storage helper that uses localStorage on web for full-page persistence
  const storageGet = async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  };

  const storageSet = async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      // ignore
    }
  };

  const storageRemove = async (key: string): Promise<void> => {
    // Remove from both storages when possible to avoid stale values
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        try { window.localStorage.removeItem(key); } catch {}
      }
    } catch {}

    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  };

  const checkAuth = async () => {
    try {
      // On web, prefer localStorage for immediate, cross-tab consistency.
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const localAuth = window.localStorage.getItem('whisper_auth');

        if (localAuth) {
          const authData = JSON.parse(localAuth);
          const now = Date.now();
          const thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
          if (now - authData.timestamp < thirtyDays) {
            setUser(authData.user);
            setIsAuthenticated(true);
          } else {
            // Expired, remove
            window.localStorage.removeItem('whisper_auth');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // If AsyncStorage has stale tokens (from previous runs), remove them so they don't resurrect auth on web
          try { await AsyncStorage.removeItem('whisper_auth'); } catch {}
          setUser(null);
          setIsAuthenticated(false);
        }
        return;
      }

      const authDataStr = await storageGet('whisper_auth');

      if (authDataStr) {
        const authData = JSON.parse(authDataStr);
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
        if (now - authData.timestamp < thirtyDays) {
          setUser(authData.user);
          setIsAuthenticated(true);
        } else {
          // Expired, remove
          await storageRemove('whisper_auth');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.token && data.user) {
        // Save token and user data with timestamp (use platform-appropriate storage)
        const authData = {
          token: data.token,
          user: data.user,
          timestamp: Date.now()
        };
        await storageSet('whisper_auth', JSON.stringify(authData));

        setUser(data.user);
        setIsAuthenticated(true);

        // Check if onboarding is completed
        const hasCompletedOnboarding = await storageGet('has_completed_onboarding');
        if (hasCompletedOnboarding === 'true') {
          // Navigate to main app
          router.replace('/(tabs)');
        } else {
          // Navigate to tutorial
          router.replace('/(onboarding)/tutorial');
        }
        return true;
      } else {
        // Show specific error message
        let errorMessage = 'Invalid email or password. Please try again.';
        if (data.error) {
          if (data.error.includes('Invalid credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else {
            errorMessage = data.error;
          }
        }
        Alert.alert('Login Failed', errorMessage);
        return false;
      }
    } catch (error) {
      Alert.alert('Login Failed', 'Network error. Please check your connection and try again.');
      return false;
    }
  };

  const register = async (username: string, email: string, password: string, displayName?: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, displayName })
      });

      const data = await res.json();

      if (res.ok) {
        // Registration successful, navigate to login
        router.push('/(onboarding)/login');
        return true;
      } else {
        // Show specific error message based on server response
        let errorMessage = 'Registration failed. Please try again.';
        if (data.error) {
          if (data.error.includes('email') && data.error.includes('already exists')) {
            errorMessage = 'This email is already registered. Please use a different email or try logging in.';
          } else if (data.error.includes('username') && data.error.includes('already exists')) {
            errorMessage = 'This username is already taken. Please choose a different username.';
          } else {
            errorMessage = data.error;
          }
        }
        Alert.alert('Registration Failed', errorMessage);
        return false;
      }
    } catch (error) {
      Alert.alert('Registration Failed', 'Network error. Please check your connection and try again.');
      return false;
    }
  };

  const logout = async () => {
    try {
  // Clear stored data
  await storageRemove('whisper_auth');
  await storageRemove('whisper_token');
  await storageRemove('whisper_user');
  // Also clear the anonymous session storage so web UIs don't restore it
  await storageRemove('whisper_session');
      
      // Reset state
      setUser(null);
      setIsAuthenticated(false);
      
      // Navigate back to onboarding
      router.replace('/(onboarding)');
      
      // Notify other parts of the app (web) to clear in-memory session/state
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new Event('whisper_logout'));
      }
    } catch (error) {
      // Silent error handling for logout
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
