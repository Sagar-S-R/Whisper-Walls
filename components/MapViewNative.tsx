import React, { useState } from 'react';
import { View, Text, Platform, ActivityIndicator } from 'react-native';
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
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  const colors = {
    Joy: '#10b981',
    Longing: '#ec4899',
    Gratitude: '#f59e0b',
    Apology: '#8b5cf6',
    Heartbreak: '#ef4444',
  };

  const handleMapReady = () => {
    console.log('🗺️ OpenStreetMap loaded successfully!');
    setIsLoading(false);
    setMapError(false);
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
    <View style={{ flex: 1 }}>
      {/* Loading overlay */}
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <ActivityIndicator size="large" color="#be185d" />
          <Text style={{ marginTop: 16, color: '#6b7280', fontSize: 16 }}>
            Loading OpenStreetMap (No API Key Needed!)
          </Text>
        </View>
      )}

      {/* Error fallback */}
      {mapError && (
        <View style={{
          flex: 1,
          backgroundColor: '#f3f4f6',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#be185d', marginBottom: 16 }}>
            🗺️ Map Loading Failed
          </Text>
          <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 16 }}>
            OpenStreetMap couldn't load. Try using the grid view instead.
          </Text>
        </View>
      )}

      {/* The actual map */}
      {!mapError && (
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          region={region}
          onRegionChangeComplete={onRegionChangeComplete}
          onLongPress={onLongPress}
          onMapReady={handleMapReady}
          showsUserLocation={true}
          showsMyLocationButton={true}
          mapType="standard"
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
      )}
    </View>
  );
};
