import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface ButterflyBurstProps {
  top: number;
  left: number;
  size: number;
  source: any;
  loop?: boolean;
  rotation?: number;
  opacity?: number;
  onAnimationFinish?: () => void;
}

export const ButterflyBurst: React.FC<ButterflyBurstProps> = ({ top, left, size, source, loop = false, rotation = 0, opacity = 1, onAnimationFinish }) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    animationRef.current?.play();
  }, []);

  return (
    <View style={[styles.container, { top, left, width: size, height: size, transform: [{ rotate: `${rotation}deg` }], opacity }]}>
      <LottieView
        ref={animationRef}
        source={source}
        autoPlay
        loop={loop}
        onAnimationFinish={onAnimationFinish}
        style={styles.lottie}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 9999, // Ensure it's on top
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
});
