import React from 'react';
import { View, Text } from 'react-native';
import { Whisper } from '@/types';

interface MapViewNativeProps {
  region: any;
  mapRef: any;
  onRegionChangeComplete: (region: any) => void;
  breakupMode: boolean;
  location: any;
  whispers: Whisper[];
  onMarkerPress: (whisper: Whisper) => void;
}

export const MapViewNative: React.FC<MapViewNativeProps> = () => {
  return (
    <View 
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        backgroundColor: '#fdf2f8' // whisper-50
      }}
    >
      <Text 
        style={{
          fontSize: 24,
          color: '#be185d', // whisper-700
          textAlign: 'center',
          marginBottom: 16,
          fontWeight: '600'
        }}
      >
        Map View Available on Mobile
      </Text>
      <Text 
        style={{
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: 24,
          fontSize: 16
        }}
      >
        The interactive map with location-based whispers is available when running on iOS or Android devices.
        For now, enjoy exploring the other features of Whisper Walls!
      </Text>
    </View>
  );
};
