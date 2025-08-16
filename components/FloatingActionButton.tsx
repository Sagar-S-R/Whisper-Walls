import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export function FloatingActionButton() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    
    router.push('/(tabs)/create');
  };

  return (
    <Animated.View 
      style={[
        animatedStyle,
        {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 100 : 80,
          right: 20,
          zIndex: 1000,
        }
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          shadowColor: '#ec4899',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <LinearGradient
          colors={['#ec4899', '#be185d']}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 32,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}