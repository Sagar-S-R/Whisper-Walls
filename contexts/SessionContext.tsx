import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface Session {
  anonymousId: string;
  createdAt: Date;
  discoveredWhispers: string[];
  leftWhispers: string[];
}

interface SessionContextType {
  session: Session;
  updateSession: (updates: Partial<Session>) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({
    anonymousId: '',
    createdAt: new Date(),
    discoveredWhispers: [],
    leftWhispers: [],
  });

  useEffect(() => {
    initializeSession();
  }, []);

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

  const initializeSession = async () => {
    try {
      const savedSession = await storageGet('whisper_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        setSession({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
        });
      } else {
        // Create new anonymous session
        const newSession: Session = {
          anonymousId: generateAnonymousId(),
          createdAt: new Date(),
          discoveredWhispers: [],
          leftWhispers: [],
        };
        
        await storageSet('whisper_session', JSON.stringify(newSession));
        setSession(newSession);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      // Fallback to new session
      const fallbackSession: Session = {
        anonymousId: generateAnonymousId(),
        createdAt: new Date(),
        discoveredWhispers: [],
        leftWhispers: [],
      };
      setSession(fallbackSession);
    }
  };

  // Listen for logout events (dispatched by AuthContext) so web tabs/components can reset session
  useEffect(() => {
    const handler = () => {
      console.log('whisper_logout event received, clearing session');
      // Clear stored session and reset in-memory session
      clearSession();
    };
    console.log('Adding whisper_logout event listener');
    try {
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        console.log('whisper_logout event listener added');
        window.addEventListener('whisper_logout', handler as EventListener);
      } else {
        console.warn('window.addEventListener is not available');
      }
    } catch (e) {}

    return () => {
      try {
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
          window.removeEventListener('whisper_logout', handler as EventListener);
        }
      } catch (e) {}
    };
  }, []);

  const generateAnonymousId = () => {
    return 'anon_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
  };

  const updateSession = async (updates: Partial<Session>) => {
    const updatedSession = { ...session, ...updates };
    setSession(updatedSession);
    
    try {
  await storageSet('whisper_session', JSON.stringify(updatedSession));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const clearSession = async () => {
    try {
  // Remove from both storages to avoid stale session restoration
  try { if (typeof window !== 'undefined' && window.localStorage) { window.localStorage.removeItem('whisper_session'); } } catch (e) {}
  try { await AsyncStorage.removeItem('whisper_session'); } catch (e) {}
      const newSession: Session = {
        anonymousId: generateAnonymousId(),
        createdAt: new Date(),
        discoveredWhispers: [],
        leftWhispers: [],
      };
      setSession(newSession);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  return (
    <SessionContext.Provider value={{ session, updateSession, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};