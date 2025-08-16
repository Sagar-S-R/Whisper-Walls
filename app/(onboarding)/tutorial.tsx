import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const tutorialSteps = [
  {
    icon: 'map',
    title: 'Discover Whispers',
    description: 'Explore the map to find whispers left by others. Each pin represents an anonymous message waiting to be discovered.',
  },
  {
    icon: 'heart',
    title: 'Leave Your Mark',
    description: 'Share your emotions, thoughts, or encouragement by leaving whispers at meaningful locations.',
  },
  {
    icon: 'time',
    title: 'Proximity Reveals',
    description: 'Get close to a whisper pin and dwell for 60-180 seconds to unlock and read the message.',
  },
  {
    icon: 'notifications',
    title: 'Stay Connected',
    description: 'Receive gentle notifications when you discover new whispers or someone reacts to yours.',
  },
];

export default function TutorialScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = async () => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({
        x: nextStep * width,
        animated: true,
      });
    } else {
      // Mark onboarding as completed
      try {
        await AsyncStorage.setItem('has_completed_onboarding', 'true');
      } catch (error) {
        console.error('Error saving onboarding completion:', error);
      }
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    // Mark onboarding as completed even if skipped
    try {
      await AsyncStorage.setItem('has_completed_onboarding', 'true');
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient
      colors={['#ddd6fe', '#fdf2f8', '#e0e7ff']}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, paddingTop: 64, paddingBottom: 32 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 24,
          marginBottom: 32
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#be185d'
          }}>
            How It Works
          </Text>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={{
              color: '#6b7280',
              fontSize: 16
            }}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginBottom: 32,
          gap: 8
        }}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: index <= currentStep ? '#ec4899' : '#d1d5db'
              }}
            />
          ))}
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={{ flex: 1 }}
        >
          {tutorialSteps.map((step, index) => (
            <View key={index} style={{
              width,
              paddingHorizontal: 32,
              justifyContent: 'center'
            }}>
              <Animated.View 
                entering={FadeInUp}
                exiting={FadeOutDown}
                style={{ alignItems: 'center' }}
              >
                <View style={{
                  width: 96,
                  height: 96,
                  backgroundColor: 'white',
                  borderRadius: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 32,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 8
                }}>
                  <Ionicons name={step.icon as any} size={36} color="#ec4899" />
                </View>
                
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#1f2937',
                  textAlign: 'center',
                  marginBottom: 16
                }}>
                  {step.title}
                </Text>
                
                <Text style={{
                  color: '#4b5563',
                  textAlign: 'center',
                  lineHeight: 24,
                  fontSize: 16,
                  paddingHorizontal: 16
                }}>
                  {step.description}
                </Text>
              </Animated.View>
            </View>
          ))}
        </ScrollView>

        {/* Navigation */}
        <View style={{ paddingHorizontal: 32, paddingTop: 32 }}>
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: '#ec4899',
              paddingVertical: 16,
              borderRadius: 25,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              textAlign: 'center'
            }}>
              {currentStep === tutorialSteps.length - 1 ? 'Start Exploring' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}