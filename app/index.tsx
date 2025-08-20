import { useEffect } from 'react';
import { router } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function Index() {
  const { session } = useSession();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem('has_completed_onboarding');
      
      if (hasCompletedOnboarding === 'true') {
        // User has completed onboarding, go to main app
        router.replace('/(tabs)');
      } else {
        // User needs onboarding
        router.replace('/(onboarding)');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Default to onboarding on error
      router.replace('/(onboarding)');
    }
  };

  // Return null since this is just a router component
  return null;
}
