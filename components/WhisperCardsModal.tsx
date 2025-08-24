import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Whisper } from '@/types';

const { width, height } = Dimensions.get('window');

interface WhisperCardsModalProps {
  whispers: Whisper[];
  visible: boolean;
  onClose: () => void;
}

const toneColors = {
  'Joy': '#10b981',
  'Longing': '#ec4899',
  'Gratitude': '#f59e0b',
  'Apology': '#8b5cf6',
  'Heartbreak': '#ef4444',
};

const toneIcons = {
  'Joy': 'happy',
  'Longing': 'heart',
  'Gratitude': 'star',
  'Apology': 'hand-left',
  'Heartbreak': 'sad',
};

export function WhisperCardsModal({ whispers, visible, onClose }: WhisperCardsModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Debug logging

  // Reset index when modal opens
  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
  // modal opened
    }
  }, [visible]);

  const goToNext = () => {
    if (currentIndex < whispers.length - 1) {
      setCurrentIndex(currentIndex + 1);
  // next whisper
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
  // previous whisper
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 16,
    onPanResponderMove: (_, g) => {
      translateY.value = g.dy;
      opacity.value = Math.max(0.3, 1 - Math.abs(g.dy) / (height * 0.35));
    },
    onPanResponderRelease: (_, g) => {
      const threshold = height * 0.22;
      if (Math.abs(g.dy) > threshold) {
        if (g.dy > 0) runOnJS(goToNext)(); else runOnJS(goToPrevious)();
      }
      translateY.value = withSpring(0);
      opacity.value = withSpring(1);
    },
  });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (whispers.length === 0) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 30, margin: 20, alignItems: 'center' }}>
            <Ionicons name="search" size={48} color="#6b7280" />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginTop: 16, marginBottom: 8 }}>No Whispers Found</Text>
            <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 }}>No whispers were found in your area. Be the first to leave one!</Text>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: '#ec4899', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 }}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const currentWhisper = whispers[currentIndex];
  if (!currentWhisper || !currentWhisper.text) {
    console.error('❌ Invalid whisper data:', currentWhisper);
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 30, margin: 20, alignItems: 'center' }}>
            <Ionicons name="warning" size={48} color="#ef4444" />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginTop: 16, marginBottom: 8 }}>Data Error</Text>
            <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 }}>Unable to display whisper data. Please try again.</Text>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: '#ec4899', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 }}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const toneColor = toneColors[currentWhisper.tone as keyof typeof toneColors] || '#6b7280';
  const toneIcon = toneIcons[currentWhisper.tone as keyof typeof toneIcons] || 'heart';

  // Next card subtle preview for deck feel
  const hasNext = currentIndex < whispers.length - 1;
  const nextWhisper = hasNext ? whispers[currentIndex + 1] : null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: width - 40, maxHeight: height * 0.75, borderRadius: 20 }}>
          {/* Next card preview (stacked underneath) */}
          {nextWhisper && (
            <View style={{ position: 'absolute', top: 12, left: 12, right: 12, borderRadius: 18, overflow: 'hidden', transform: [{ scale: 0.98 }] }}>
              <LinearGradient colors={[toneColors[nextWhisper.tone as keyof typeof toneColors] || '#6b7280', '#ffffff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
                <Text numberOfLines={2} style={{ color: 'white', fontWeight: '600' }}>{nextWhisper.tone}</Text>
                <Text numberOfLines={2} style={{ color: 'white', opacity: 0.9, marginTop: 6 }}>
                  "{nextWhisper.text}"
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* Active card */}
          <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: 'white' }}>
            <LinearGradient colors={[toneColor, toneColor + '80']} style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={toneIcon as any} size={24} color="white" />
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>{currentWhisper.tone}</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>

            <Animated.View style={[{ padding: 20 }, animatedCardStyle]} {...panResponder.panHandlers}>
              <Text style={{ fontSize: 18, lineHeight: 26, color: '#1f2937', marginBottom: 16, fontFamily: 'serif' }}>
                "{currentWhisper.text}"
              </Text>

              {currentWhisper.whyHere && (
                <View style={{ backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontStyle: 'italic', color: '#6b7280' }}>Why here: {currentWhisper.whyHere}</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>{formatTimeAgo(currentWhisper.createdAt)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="heart" size={16} color="#ef4444" />
                  <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 4 }}>{currentWhisper.reactions?.length || 0}</Text>
                </View>
              </View>
            </Animated.View>

            {/* Footer nav */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
              <TouchableOpacity onPress={goToPrevious} disabled={currentIndex === 0} style={{ backgroundColor: currentIndex === 0 ? '#f3f4f6' : toneColor, padding: 10, borderRadius: 22 }}>
                <Ionicons name="chevron-up" size={18} color={currentIndex === 0 ? '#9ca3af' : 'white'} />
              </TouchableOpacity>
              <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '500' }}>{currentIndex + 1} of {whispers.length}</Text>
              <TouchableOpacity onPress={goToNext} disabled={currentIndex === whispers.length - 1} style={{ backgroundColor: currentIndex === whispers.length - 1 ? '#f3f4f6' : toneColor, padding: 10, borderRadius: 22 }}>
                <Ionicons name="chevron-down" size={18} color={currentIndex === whispers.length - 1 ? '#9ca3af' : 'white'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
