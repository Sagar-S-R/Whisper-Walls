import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Whisper } from '@/types';
import { WhisperService } from '@/services/WhisperService';
import { useSession } from '@/contexts/SessionContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface WhisperModalProps {
  whisper: Whisper;
  visible: boolean;
  onClose: () => void;
  breakupMode?: boolean;
}

export function WhisperModal({ whisper, visible, onClose, breakupMode = false }: WhisperModalProps) {
  const { session } = useSession();
  const scale = useSharedValue(0);
  const hugScale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 16, stiffness: 150 });
      opacity.value = withSpring(1);
    } else {
      scale.value = withSpring(0);
      opacity.value = withSpring(0);
    }
  }, [visible]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedHugStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hugScale.value }],
  }));

  const handleHugPress = async () => {
    // Animate the hug button
    hugScale.value = withSequence(
      withSpring(1.3, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );

    // Add reaction
    await WhisperService.addReaction(whisper._id, session.anonymousId, 'hug');
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const whisperDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - whisperDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just left';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const getToneColor = (tone: string) => {
    if (breakupMode) return '#9ca3af';
    
    const colors: { [key: string]: string } = {
      Joy: '#10b981',
      Longing: '#ec4899',
      Gratitude: '#f59e0b',
      Apology: '#8b5cf6',
      Heartbreak: '#ef4444',
    };
    return colors[tone] || '#6b7280';
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={20}
            tint={breakupMode ? 'dark' : 'light'}
            style={{ position: 'absolute', width, height }}
          />
        ) : (
          <View 
            style={{ 
              position: 'absolute', 
              width, 
              height, 
              backgroundColor: 'rgba(0,0,0,0.5)' 
            }} 
          />
        )}
        
        <TouchableOpacity
          style={{ position: 'absolute', width, height }}
          onPress={onClose}
          activeOpacity={1}
        />

        <Animated.View style={[animatedModalStyle, { marginHorizontal: 24, maxWidth: 384, width: '100%' }]}>
          <LinearGradient
            colors={breakupMode ? ['#374151', '#4b5563'] : ['#ffffff', '#fafafa']}
            style={{
              borderRadius: 24,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.25,
              shadowRadius: 25,
              elevation: 25,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View 
                  style={{ 
                    backgroundColor: getToneColor(whisper.tone),
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Ionicons 
                    name={whisper.tone === 'Joy' ? 'happy' : 
                          whisper.tone === 'Longing' ? 'heart' :
                          whisper.tone === 'Gratitude' ? 'star' :
                          whisper.tone === 'Apology' ? 'hand-left' : 'sad'} 
                    size={14} 
                    color="white" 
                  />
                </View>
                <View>
                  <Text style={{ 
                    fontWeight: '600',
                    color: breakupMode ? '#f3f4f6' : '#1f2937'
                  }}>
                    {whisper.tone}
                  </Text>
                  <Text style={{ 
                    fontSize: 12,
                    color: breakupMode ? '#d1d5db' : '#6b7280'
                  }}>
                    {formatTimeAgo(whisper.createdAt)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons 
                  name="close" 
                  size={20} 
                  color={breakupMode ? '#d1d5db' : '#6b7280'} 
                />
              </TouchableOpacity>
            </View>

            {/* Whisper Text */}
            <View style={{ marginBottom: 24 }}>
              <Text 
                style={{ 
                  fontSize: 18,
                  lineHeight: 28,
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  color: breakupMode ? '#f3f4f6' : '#1f2937'
                }}
              >
                "{whisper.text}"
              </Text>
            </View>

            {/* Why Here */}
            {whisper.whyHere && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ 
                  fontSize: 14,
                  fontStyle: 'italic',
                  color: breakupMode ? '#d1d5db' : '#4b5563'
                }}>
                  "{whisper.whyHere}"
                </Text>
              </View>
            )}

            {/* Location */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <Ionicons 
                name="location" 
                size={16} 
                color={breakupMode ? '#9ca3af' : '#6b7280'} 
              />
              <Text style={{ 
                marginLeft: 8,
                fontSize: 14,
                color: breakupMode ? '#d1d5db' : '#6b7280'
              }}>
                {whisper.location?.latitude?.toFixed?.(4) || 'N/A'}, {whisper.location?.longitude?.toFixed?.(4) || 'N/A'}
              </Text>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons 
                  name="heart" 
                  size={16} 
                  color={breakupMode ? '#9ca3af' : '#ec4899'} 
                />
                <Text style={{ 
                  marginLeft: 8,
                  fontSize: 14,
                  color: breakupMode ? '#d1d5db' : '#4b5563'
                }}>
                  {whisper.reactions?.length || 0} hugs
                </Text>
              </View>

              <Animated.View style={animatedHugStyle}>
                <TouchableOpacity
                  onPress={handleHugPress}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 25,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: breakupMode ? '#4b5563' : '#fdf2f8'
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="heart" 
                    size={16} 
                    color={breakupMode ? '#d1d5db' : '#ec4899'} 
                  />
                  <Text style={{ 
                    marginLeft: 8,
                    fontWeight: '600',
                    color: breakupMode ? '#f3f4f6' : '#be185d'
                  }}>
                    Send a hug
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}