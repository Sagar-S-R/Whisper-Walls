import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Whisper } from '@/types';

interface MapViewWebProps {
  location: any;
  whispers: Whisper[];
  onMarkerPress: (whisper: Whisper) => void;
  breakupMode: boolean;
}

export const MapViewWeb: React.FC<MapViewWebProps> = ({ location, whispers, onMarkerPress }) => {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#be185d', marginBottom: 8 }}>Nearby Whispers</Text>
      <Text style={{ color: '#6b7280', marginBottom: 16 }}>The interactive map is not available in the web preview; tap a whisper to open it.</Text>

      <ScrollView>
        {whispers.map(w => (
          <TouchableOpacity key={w._id} onPress={() => onMarkerPress(w)} style={{
            backgroundColor: 'white',
            padding: 12,
            marginBottom: 12,
            borderRadius: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Text style={{ fontWeight: '600', color: '#374151' }}>{w.tone}</Text>
            <Text style={{ color: '#6b7280' }} numberOfLines={2}>{w.text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
