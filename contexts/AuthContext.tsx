import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
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
        console.log('Checking if window and localStorage are available');
        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
          console.log('window and localStorage are available');
        } else {
          console.warn('window or localStorage is not available');
        }

        const localToken = window.localStorage.getItem('whisper_token');
        const localUser = window.localStorage.getItem('whisper_user');

        if (localToken && localUser) {
          setUser(JSON.parse(localUser));
          setIsAuthenticated(true);
        } else {
          // If AsyncStorage has stale tokens (from previous runs), remove them so they don't resurrect auth on web
          try { await AsyncStorage.removeItem('whisper_token'); } catch {}
          try { await AsyncStorage.removeItem('whisper_user'); } catch {}
          setUser(null);
          setIsAuthenticated(false);
        }
        return;
      }

      const token = await storageGet('whisper_token');
      const userData = await storageGet('whisper_user');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
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
  // Save token and user data (use platform-appropriate storage)
  await storageSet('whisper_token', data.token);
  await storageSet('whisper_user', JSON.stringify(data.user));
        
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Navigate to main app
        router.replace('/(tabs)');
        return true;
      } else {
        console.error('Login failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
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
        console.error('Registration failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
  // Clear stored data
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
      console.log('Dispatching whisper_logout event');
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new Event('whisper_logout'));
      } else {
        console.warn('window.dispatchEvent is not available');
      }
    } catch (error) {
      console.error('Logout error:', error);
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
