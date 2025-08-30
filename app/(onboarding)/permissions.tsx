import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function PermissionsScreen() {
  const [locationGranted, setLocationGranted] = useState(false);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationGranted(true);
      } else {
        Alert.alert(
          'Location Required',
          'Auris needs location access to show you nearby whispers and let you leave location-based messages.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const handleContinue = () => {
    if (locationGranted || Platform.OS === 'web') {
      router.push('/(onboarding)/tutorial');
    } else {
      Alert.alert(
        'Location Required',
        'Location access is essential for the Auris experience.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <LinearGradient
      colors={['#e0e7ff', '#ddd6fe', '#fdf2f8']}
      style={{ 
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32
      }}
    >
      <View style={{ width: '100%', maxWidth: 384 }}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: '#be185d',
          textAlign: 'center',
          marginBottom: 32
        }}>
          Let's Get Started
        </Text>

        <View style={{ marginBottom: 48 }}>
          {/* Location Permission */}
          <TouchableOpacity
            onPress={requestLocationPermission}
            style={{
              padding: 24,
              borderRadius: 16,
              backgroundColor: locationGranted ? '#dcfce7' : 'white',
              borderWidth: 2,
              borderColor: locationGranted ? '#86efac' : '#e5e7eb',
              marginBottom: 24
            }}
            disabled={locationGranted}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <Ionicons 
                name={locationGranted ? "checkmark-circle" : "location"} 
                size={24} 
                color={locationGranted ? "#10b981" : "#6b7280"} 
              />
              <Text style={{
                marginLeft: 12,
                fontSize: 18,
                fontWeight: '600',
                color: '#374151'
              }}>
                Location Access
              </Text>
            </View>
            <Text style={{
              color: '#4b5563',
              fontSize: 14,
              lineHeight: 20
            }}>
              {locationGranted 
                ? "Perfect! You can now discover whispers around you."
                : "Discover whispers left by others and share your own at meaningful locations."
              }
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          style={{
            paddingVertical: 16,
            borderRadius: 25,
            backgroundColor: (locationGranted || Platform.OS === 'web') ? '#ec4899' : '#d1d5db'
          }}
          disabled={!locationGranted && Platform.OS !== 'web'}
        >
          <Text style={{
            color: 'white',
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}