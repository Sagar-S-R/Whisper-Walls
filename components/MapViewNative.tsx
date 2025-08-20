import React from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Whisper } from '@/types';

interface MapViewNativeProps {
  region: any;
  mapRef: any;
  onRegionChangeComplete: (region: any) => void;
  breakupMode: boolean;
  location: any;
  whispers: Whisper[];
  onMarkerPress: (whisper: Whisper) => void;
  onLongPress?: (event: any) => void;
}

export const MapViewNative: React.FC<MapViewNativeProps> = ({
  region,
  mapRef,
  onRegionChangeComplete,
  breakupMode,
  location,
  whispers,
  onMarkerPress,
  onLongPress,
}) => {
  const colors = {
    Joy: '#10b981',
    Longing: '#ec4899',
    Gratitude: '#f59e0b',
    Apology: '#8b5cf6',
    Heartbreak: '#ef4444',
  };

  const renderMarker = (whisper: Whisper) => (
    <Marker
      key={whisper._id}
      coordinate={{
        latitude: whisper.location.latitude,
        longitude: whisper.location.longitude,
      }}
      onPress={() => onMarkerPress(whisper)}
    >
      <View style={{ alignItems: 'center' }}>
        <View 
          style={{ 
            backgroundColor: breakupMode ? '#9ca3af' : colors[whisper.tone],
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: 'white',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
        />
        <Text style={{
          fontSize: 12,
          marginTop: 4,
          color: '#4b5563',
          fontWeight: 'bold'
        }}>
          {whisper.tone}
        </Text>
      </View>
    </Marker>
  );

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      region={region}
      onRegionChangeComplete={onRegionChangeComplete}
      onLongPress={onLongPress}
      customMapStyle={breakupMode ? [
        {
          "featureType": "all",
          "stylers": [{ "saturation": -100 }, { "gamma": 0.5 }]
        }
      ] : undefined}
    >
      {location && (
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="You are here"
        >
          <View style={{
            width: 16,
            height: 16,
            backgroundColor: '#3b82f6',
            borderRadius: 8,
            borderWidth: 2,
            borderColor: 'white'
          }} />
        </Marker>
      )}
      {whispers.map(renderMarker)}
    </MapView>
  );
};
