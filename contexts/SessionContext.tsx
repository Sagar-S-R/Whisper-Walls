import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const initializeSession = async () => {
    try {
      const savedSession = await AsyncStorage.getItem('whisper_session');
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
        
        await AsyncStorage.setItem('whisper_session', JSON.stringify(newSession));
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

  const generateAnonymousId = () => {
    return 'anon_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
  };

  const updateSession = async (updates: Partial<Session>) => {
    const updatedSession = { ...session, ...updates };
    setSession(updatedSession);
    
    try {
      await AsyncStorage.setItem('whisper_session', JSON.stringify(updatedSession));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem('whisper_session');
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