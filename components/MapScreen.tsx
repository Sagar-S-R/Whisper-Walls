import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { LongPressEvent } from 'react-native-maps';
import { ButterflyBurst } from '@/components/ButterflyBurst';

const { width, height } = Dimensions.get('window');

interface Animation {
  id: string;
  top: number;
  left: number;
}

export const MapScreen: React.FC = () => {
  const [animations, setAnimations] = useState<Animation[]>([]);

  const handleLongPress = (event: LongPressEvent) => {
    const { coordinate } = event.nativeEvent;
    // Convert map coordinates to screen position (simple mock for demo)
    // In a real app, use map ref and coordinateToPoint
    const top = Math.random() * (height - 100);
    const left = Math.random() * (width - 100);
    setAnimations((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random(), top, left },
    ]);
  };

  const handleAnimationFinish = (id: string) => {
    setAnimations((prev) => prev.filter((anim) => anim.id !== id));
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        onLongPress={handleLongPress}
      />
      {animations.map((anim) => (
        <ButterflyBurst
          key={anim.id}
          top={anim.top}
          left={anim.left}
          size={200}
          source={require('../../assets/animations/butterfly2.json')}
          onAnimationFinish={() => handleAnimationFinish(anim.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({});
