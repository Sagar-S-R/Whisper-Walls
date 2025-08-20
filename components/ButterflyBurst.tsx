import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface ButterflyBurstProps {
  top: number;
  left: number;
  size: number;
  source: any;
  loop?: boolean;
  onAnimationFinish?: () => void;
}

export const ButterflyBurst: React.FC<ButterflyBurstProps> = ({ top, left, size, source, loop = false, onAnimationFinish }) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    animationRef.current?.play();
  }, []);

  return (
    <View style={[styles.container, { top, left, width: size, height: size }]}>
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
