import React from 'react';
import { Platform } from 'react-native';
import { OpenStreetMapView } from './OpenStreetMapView';
import { MapViewNative } from './MapViewNative';
import { MapViewWeb } from './MapViewWeb';
import { Whisper } from '@/types';

interface SmartMapViewProps {
  region: any;
  mapRef: any;
  onRegionChangeComplete: (region: any) => void;
  breakupMode: boolean;
  location: any;
  whispers: Whisper[];
  onMarkerPress: (whisper: Whisper) => void;
  onLongPress?: (event: any) => void;
}

export const SmartMapView: React.FC<SmartMapViewProps> = (props) => {
  // Always use OpenStreetMap for Android and web (no API key needed)
  // Only use Apple Maps for iOS (which has built-in support)
  if (Platform.OS === 'ios') {
    // Use Apple Maps for iOS
    return <MapViewNative {...props} />;
  }

  if (Platform.OS === 'web') {
    // Use a web-friendly map component (not WebView)
    return (
      <MapViewWeb
        location={props.location}
        whispers={props.whispers}
        onMarkerPress={props.onMarkerPress}
        breakupMode={props.breakupMode}
      />
    );
  }

  // Default (Android and others): OpenStreetMap via WebView/native
  return (
    <OpenStreetMapView
      location={props.location}
      whispers={props.whispers}
      onMarkerPress={props.onMarkerPress}
      breakupMode={props.breakupMode}
    />
  );
};
