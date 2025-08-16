import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false, // Changed to false for web compatibility
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: false, // Changed to false for web compatibility
      }),
    ]);

    sequence.start();
  }, []);

  const handleContinue = () => {
    router.push('/(onboarding)/permissions');
  };

  return (
    <LinearGradient
      colors={['#fdf2f8', '#e0e7ff', '#ddd6fe']}
      style={{ 
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignItems: 'center',
          paddingHorizontal: 32,
        }}
      >
        <View style={{ width: 192, height: 192, marginBottom: 32 }}>
          <LottieView
            source={{
              uri: 'https://assets5.lottiefiles.com/packages/lf20_jcikwtux.json'
            }}
            autoPlay
            loop
            style={{ width: '100%', height: '100%' }}
          />
        </View>

        <Text style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: '#be185d',
          textAlign: 'center',
          marginBottom: 16
        }}>
          Whisper Walls
        </Text>
        
        <Text style={{
          fontSize: 18,
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: 32,
          lineHeight: 26
        }}>
          Transform the world around you into a canvas of anonymous emotions.
          Leave whispers for strangers to find, discover stories left by hearts
          just like yours.
        </Text>

        <View style={{ marginBottom: 48, paddingHorizontal: 16 }}>
          <Text style={{
            fontSize: 14,
            color: '#9ca3af',
            textAlign: 'center',
            fontStyle: 'italic',
            lineHeight: 22
          }}>
            "In every corner of this world, there are untold stories waiting to be whispered,
            and hearts ready to listen."
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          style={{
            backgroundColor: '#ec4899',
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 999,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          activeOpacity={0.8}
        >
          <Text style={{
            color: '#ffffff',
            fontSize: 18,
            fontWeight: '600'
          }}>Begin Your Journey</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}