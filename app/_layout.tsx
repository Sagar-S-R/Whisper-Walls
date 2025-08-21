import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SessionProvider } from '@/contexts/SessionContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import '../global.css';
import React from 'react';
import { View, Text } from 'react-native';

function AppContent() {
  useFrameworkReady();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#fdf2f8'
      }}>
        <Text style={{ 
          fontSize: 24, 
          fontWeight: 'bold', 
          color: '#ec4899',
          marginBottom: 16
        }}>
          Whisper Walls
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: '#6b7280'
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <Stack.Screen name="(onboarding)" />
      )}
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SessionProvider>
          <LocationProvider>
            <AppContent />
            <StatusBar style="auto" />
          </LocationProvider>
        </SessionProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}