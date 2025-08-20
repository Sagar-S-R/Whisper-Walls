import LottieView from 'lottie-react-native';
import React from 'react';

export default function Animation() {
  return (
    <LottieView source={require('../assets/animations/heartBroke.json')} autoPlay loop />
  );
}