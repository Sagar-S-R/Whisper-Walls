import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Dimensions, Platform } from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/contexts/SessionContext';
import { useLocation } from '@/contexts/LocationContext';
import { WhisperService } from '@/services/WhisperService';
import { WhisperModal } from '@/components/WhisperModal';
import { WhisperCardsModal } from '@/components/WhisperCardsModal';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { SmartMapView } from '@/components/SmartMapView';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { Whisper } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '@/config/api';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function DiscoverScreen() {
  const { session } = useSession();
  const { location, requestLocation } = useLocation();
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [selectedWhisper, setSelectedWhisper] = useState<Whisper | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [breakupMode, setBreakupMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState<any>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const mapRef = useRef<any>(null);
  const fabScale = useSharedValue(1);

  // Initialize map and load whispers on first load
  useEffect(() => {
    console.log('🗺️ Initializing map...');
    initializeMap();
  }, []);

  // Update region when location changes
  useEffect(() => {
    console.log('🗺️ Location changed:', location);
    if (location) {
      setRegion({
        ...region,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      loadNearbyWhispers();
    }
  }, [location]);

  // Reload whispers when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (location) {
        loadNearbyWhispers();
      }
    }, [location])
  );

  const initializeMap = async () => {
    if (Platform.OS !== 'web') {
      await requestLocation();
    }
  };

  const loadNearbyWhispers = async () => {
    if (!location) {
      return;
    }

    setLoading(true);
    try {
      const nearbyWhispers = await WhisperService.getNearbyWhispers(
        location.latitude,
        location.longitude,
        5000 // 5km radius
      );
      
      // Validate whisper data structure
      const validWhispers = nearbyWhispers.filter(whisper => {
        if (!whisper._id || !whisper.text || !whisper.location) {
          return false;
        }
        return true;
      });
      
      if (validWhispers.length === 0) {
        // Show test whispers if no real ones
        const testWhispers: Whisper[] = [
          {
            _id: 'test1',
            text: 'This is a test whisper to verify the map is working!',
            tone: 'Joy',
            location: {
              latitude: location.latitude + 0.001,
              longitude: location.longitude + 0.001,
            },
            whyHere: 'Testing the map functionality',
            sessionId: 'test_session',
            createdAt: new Date().toISOString(),
            reactions: [],
            discoveredBy: [],
          },
          {
            _id: 'test2',
            text: 'Another test whisper nearby - tap to see more!',
            tone: 'Gratitude',
            location: {
              latitude: location.latitude - 0.001,
              longitude: location.longitude - 0.001,
            },
            whyHere: 'Testing the modal functionality',
            sessionId: 'test_session',
            createdAt: new Date().toISOString(),
            reactions: [],
            discoveredBy: [],
          }
        ];
        setWhispers(testWhispers);
      } else {
        setWhispers(validWhispers);
      }
    } catch (error) {
      console.error('Error loading whispers:', error);
      // Show test whispers on error
      const testWhispers: Whisper[] = [
        {
          _id: 'error_test1',
          text: 'Test whisper (API error) - tap to see more!',
          tone: 'Joy',
          location: {
            latitude: location.latitude + 0.001,
            longitude: location.longitude + 0.001,
          },
          whyHere: 'Testing the map functionality',
          sessionId: 'test_session',
          createdAt: new Date().toISOString(),
          reactions: [],
          discoveredBy: [],
        }
      ];
      setWhispers(testWhispers);
    } finally {
      setLoading(false);
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

    // Mark as discovered if within 50 meters
    if (distance <= 50) {
      try {
        await WhisperService.markAsDiscovered(whisper._id, session?.id || 'anonymous');
        console.log('Whisper marked as discovered');
      } catch (error) {
        console.error('Error marking whisper as discovered:', error);
      }
    }

    setSelectedWhisper(whisper);
    setModalVisible(true);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const toggleBreakupMode = () => {
    setBreakupMode(!breakupMode);
  };

  const handleRefresh = () => {
    loadNearbyWhispers();
  };

  const getTimeBasedColors = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return ['#fef3c7', '#fde68a']; // Morning - warm yellow
    } else if (hour >= 12 && hour < 18) {
      return ['#dbeafe', '#93c5fd']; // Afternoon - cool blue
    } else if (hour >= 18 && hour < 22) {
      return ['#fce7f3', '#f9a8d4']; // Evening - soft pink
    } else {
      return ['#1e293b', '#334155']; // Night - deep blue
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={breakupMode ? ['#6b7280', '#374151'] as any : getTimeBasedColors() as any}
        style={{ flex: 1 }}
      >
        <SmartMapView
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
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Debug Button */}
            <TouchableOpacity
              onPress={() => {
                console.log('🗺️ Debug Info:', {
                  location,
                  region,
                  whispersCount: whispers.length,
                  breakupMode
                });
                Alert.alert('Debug Info', `Location: ${location ? 'Yes' : 'No'}\nWhispers: ${whispers.length}\nRegion: ${JSON.stringify(region)}`);
              }}
              style={{ 
                backgroundColor: '#10b981',
                padding: 12,
                borderRadius: 999,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>🐛</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={loading}
              style={{ 
                backgroundColor: '#ffffff',
                padding: 12,
                borderRadius: 999,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Ionicons 
                name={loading ? "hourglass" : "refresh"} 
                size={20} 
                color={loading ? "#9ca3af" : "#6b7280"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Whisper Cards Button */}
        <TouchableOpacity
          onPress={() => {
            if (whispers.length === 0) {
              Alert.alert('No Whispers', 'No whispers found in your area. Try refreshing or moving to a different location.');
              return;
            }
            // Navigate to whisper cards page instead of modal
            router.push('/whisper-cards');
          }}
          style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 180 : 160,
            right: 20,
            backgroundColor: whispers.length === 0 ? '#9ca3af' : '#8b5cf6',
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="library" size={24} color={whispers.length === 0 ? "#6b7280" : "white"} />
          
          {whispers.length > 0 && (
            <View style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: '#ef4444',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: 'white',
            }}>
              <Text style={{
                color: 'white',
                fontSize: 12,
                fontWeight: 'bold',
              }}>
                {whispers.length > 99 ? '99+' : whispers.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

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