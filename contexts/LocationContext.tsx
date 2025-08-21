import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

interface LocationData {
  latitude: number;
  longitude: number;
}

interface LocationContextType {
  location: LocationData | null;
  locationPermission: boolean;
  requestLocation: () => Promise<void>;
  updateLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      checkLocationPermission();
    }
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        updateLocation();
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const requestLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, try to get actual location or use a more reasonable default
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 10000,
          });
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
        } catch (webError) {
          // Only use default if we can't get real location
          setLocation({ latitude: 20.5937, longitude: 78.9629 }); // India center
        }
        setLocationPermission(true);
        return;
      }

      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }
      
      setLocationPermission(finalStatus === 'granted');
      
      if (finalStatus === 'granted') {
        await updateLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show nearby whispers. Please enable location services in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.openSettings() }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location:', error);
      Alert.alert('Location Error', 'Failed to get location. Please check your device settings.');
    }
  };

  const updateLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 10000,
          });
          const newLocation = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          };
          setLocation(newLocation);
        } catch (webError) {
          setLocation({ latitude: 20.5937, longitude: 78.9629 }); // India center
        }
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000, // 10 second timeout
      });
      
      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      
      setLocation(newLocation);
    } catch (error) {
      console.error('Error updating location:', error);
      // Don't set fallback location - let the app handle it gracefully
      Alert.alert('Location Error', 'Failed to get your current location. Please check your device settings and try again.');
    }
  };

  return (
    <LocationContext.Provider value={{
      location,
      locationPermission,
      requestLocation,
      updateLocation,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};