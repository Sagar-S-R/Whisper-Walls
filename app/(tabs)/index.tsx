import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Dimensions, Platform } from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/contexts/SessionContext';
import { useLocation } from '@/contexts/LocationContext';
import { WhisperService } from '@/services/WhisperService';
import { WhisperModal } from '@/components/WhisperModal';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { MapViewNative } from '@/components/MapViewNative';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { Whisper } from '@/types';

const { width, height } = Dimensions.get('window');

export default function DiscoverScreen() {
  const { session } = useSession();
  const { location, requestLocation } = useLocation();
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [selectedWhisper, setSelectedWhisper] = useState<Whisper | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [breakupMode, setBreakupMode] = useState(false);
  const [region, setRegion] = useState<any>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const mapRef = useRef<any>(null);
  const fabScale = useSharedValue(1);

  useEffect(() => {
    initializeMap();
    loadNearbyWhispers();
  }, []);

  useEffect(() => {
    if (location) {
      setRegion({
        ...region,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      loadNearbyWhispers();
    }
  }, [location]);

  const initializeMap = async () => {
    if (Platform.OS !== 'web') {
      await requestLocation();
    }
  };

  const loadNearbyWhispers = async () => {
    try {
      const currentLocation = location || {
        latitude: 37.78825,
        longitude: -122.4324
      };
      
      const nearbyWhispers = await WhisperService.getNearbyWhispers(
        currentLocation.latitude,
        currentLocation.longitude,
        5000 // 5km radius
      );
      
      setWhispers(nearbyWhispers);
    } catch (error) {
      console.error('Error loading whispers:', error);
    }
  };

  const handleMarkerPress = async (whisper: Whisper) => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location to interact with whispers.');
      return;
    }

    // Calculate distance to whisper
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      whisper.location.latitude,
      whisper.location.longitude
    );

    if (distance > 100) { // 100 meters
      Alert.alert(
        'Get Closer',
        `You need to be within 100 meters to read this whisper. You're currently ${Math.round(distance)}m away.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Simulate proximity unlock (in real app, this would be more sophisticated)
    setSelectedWhisper(whisper);
    setModalVisible(true);
    
    // Mark as discovered
    await WhisperService.markAsDiscovered(whisper._id, session.anonymousId);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const getTimeBasedColors = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return ['#fff7ed', '#fed7aa']; // Dawn
    } else if (hour >= 12 && hour < 18) {
      return ['#fdf2f8', '#fce7f3']; // Day
    } else {
      return ['#0f172a', '#334155']; // Dusk/Night
    }
  };

  const toggleBreakupMode = () => {
    setBreakupMode(!breakupMode);
    fabScale.value = withSpring(breakupMode ? 1 : 0.9);
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={breakupMode ? ['#6b7280', '#374151'] as any : getTimeBasedColors() as any}
        style={{ flex: 1 }}
      >
        <MapViewNative
          region={region}
          mapRef={mapRef}
          onRegionChangeComplete={setRegion}
          breakupMode={breakupMode}
          location={location}
          whispers={whispers}
          onMarkerPress={handleMarkerPress}
        />

        {/* Header Controls */}
        <View 
          style={{
            position: 'absolute',
            top: 64,
            left: 16,
            right: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <TouchableOpacity
            onPress={toggleBreakupMode}
            style={{ 
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: breakupMode ? '#6b7280' : '#ffffff',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          >
            
            <Text 
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: breakupMode ? '#ffffff' : '#374151'
              }}
            >
              {breakupMode ? 'Exit Gentle Mode' : 'Gentle Mode'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={loadNearbyWhispers}
            style={{ 
              backgroundColor: '#ffffff',
              padding: 12,
              borderRadius: 999,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          >
            <Ionicons name="refresh" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Floating Action Button */}
        <FloatingActionButton />
      </LinearGradient>

      {/* Whisper Modal */}
      {selectedWhisper && (
        <WhisperModal
          whisper={selectedWhisper}
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedWhisper(null);
          }}
          breakupMode={breakupMode}
        />
      )}
    </View>
  );
}