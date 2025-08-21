import React from 'react';
import { Platform } from 'react-native';
import { OpenStreetMapView } from './OpenStreetMapView';
import { MapViewNative } from './MapViewNative';
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
  // Use OpenStreetMap for web and Android, Apple Maps for iOS
  if (Platform.OS === 'ios') {
    // Use Apple Maps for iOS
    return <MapViewNative {...props} />;
  } else {
    // Use OpenStreetMap for web and Android
    return (
      <OpenStreetMapView
        location={props.location}
        whispers={props.whispers}
        onMarkerPress={props.onMarkerPress}
        breakupMode={props.breakupMode}
      />
    );
  }
};
