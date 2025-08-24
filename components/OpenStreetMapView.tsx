import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Whisper } from '@/types';

interface OpenStreetMapProps {
  location: any;
  whispers: Whisper[];
  onMarkerPress: (whisper: Whisper) => void;
  breakupMode: boolean;
}

export const OpenStreetMapView: React.FC<OpenStreetMapProps> = ({
  location,
  whispers,
  onMarkerPress,
  breakupMode,
}) => {
  const webViewRef = useRef<any>(null);
  const [mapHtml, setMapHtml] = useState<string>('');

  // Generate initial map HTML
  useEffect(() => {
    const initialHtml = generateMapHTML();
    setMapHtml(initialHtml);
  }, []);

  const colors = {
    Joy: '#10b981',
    Longing: '#ec4899',
    Gratitude: '#f59e0b',
    Apology: '#8b5cf6',
    Heartbreak: '#ef4444',
  };

  const generateMapHTML = () => {
    // Ensure we always have valid coordinates
    const centerLat = location?.latitude || 37.78825;
    const centerLng = location?.longitude || -122.4324;
    
  // generating map with coordinates
    
    const whisperMarkers = whispers.map((whisper, index) => {
      const color = breakupMode ? '#9ca3af' : colors[whisper.tone];
      return `
        L.circleMarker([${whisper.location?.latitude ?? centerLat}, ${whisper.location?.longitude ?? centerLng}], {
          color: 'white',
          weight: 2,
          fillColor: '${color}',
          fillOpacity: 0.9,
          radius: 8
        }).addTo(map)
        .bindPopup(\`
          <div style="text-align: center;">
            <h4 style="margin: 0; color: ${color};">\${whisper.tone}</h4>
            <p style="margin: 5px 0; font-size: 12px;">"\${(whisper.text || '').substring(0, 100)}..."</p>
          </div>
        \`)
        .on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'markerPress',
            whisperId: '${whisper._id}'
          }));
        });
      `;
    }).join('\n');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html, body { height: 100%; margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        // Initialize the map
        var map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);
        
        // Add user location marker
        ${location ? `
        L.marker([${centerLat}, ${centerLng}])
        .addTo(map)
        .bindPopup('You are here!')
        .setIcon(L.divIcon({
          html: '<div style="background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>',
          iconSize: [20, 20],
          className: 'custom-marker'
        }));
        ` : ''}
        
        // Add whisper markers
        ${whisperMarkers}
        
        // Apply grayscale filter for breakup mode
        ${breakupMode ? `
        var mapContainer = document.getElementById('map');
        mapContainer.style.filter = 'grayscale(100%)';
        ` : ''}
      </script>
    </body>
    </html>
    `;
  };

  // Update map HTML whenever whispers or location changes
  useEffect(() => {
  const newMapHtml = generateMapHTML();
  setMapHtml(newMapHtml);
  }, [whispers, location, breakupMode]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerPress') {
        const whisper = whispers.find(w => w._id === data.whisperId);
        if (whisper) {
          onMarkerPress(whisper);
        }
      }
    } catch (error) {
  // error parsing message
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {!mapHtml ? (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f3f4f6',
        }}>
          <Text style={{ fontSize: 18, color: '#be185d', fontWeight: 'bold', marginBottom: 8 }}>
            🌍 Preparing map...
          </Text>
          <Text style={{ color: '#6b7280', textAlign: 'center' }}>
            Loading OpenStreetMap
          </Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={{ flex: 1, zIndex: 0 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          onMessage={handleMessage}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
          onLoadEnd={() => {
            // OpenStreetMap WebView loaded
          }}
          key={mapHtml} // Force re-render when HTML changes
          androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
          renderLoading={() => (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#f3f4f6',
            }}>
              <Text style={{ fontSize: 18, color: '#be185d', fontWeight: 'bold' }}>
                🌍 Loading map...
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};
