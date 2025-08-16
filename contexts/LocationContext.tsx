import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

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
        // For web, we'll just use a default location
        setLocation({ latitude: 37.78825, longitude: -122.4324 });
        setLocationPermission(true);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        await updateLocation();
      }
    } catch (error) {
      console.error('Error requesting location:', error);
    }
  };

  const updateLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        setLocation({ latitude: 37.78825, longitude: -122.4324 });
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      // Fallback to default location
      setLocation({ latitude: 37.78825, longitude: -122.4324 });
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