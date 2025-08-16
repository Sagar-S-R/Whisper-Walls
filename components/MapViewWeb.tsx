import React from 'react';
import { View, Text } from 'react-native';

export const MapViewWeb: React.FC = () => {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32
    }}>
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        color: '#be185d',
        textAlign: 'center',
        marginBottom: 16
      }}>
        Map View Available on Mobile
      </Text>
      <Text style={{
        color: '#4b5563',
        textAlign: 'center',
        lineHeight: 24
      }}>
        The interactive map with location-based whispers is available when running on iOS or Android devices.
        For now, enjoy exploring the other features of Whisper Walls!
      </Text>
    </View>
  );
};
