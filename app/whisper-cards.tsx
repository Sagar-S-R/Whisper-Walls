import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocation } from '@/contexts/LocationContext';
import { WhisperService } from '@/services/WhisperService';
import { Whisper } from '@/types';
import { useSession } from '@/contexts/SessionContext';

const { width, height } = Dimensions.get('window');

export default function WhisperCardsPage() {
  const router = useRouter();
  const { location } = useLocation();
  const { session } = useSession();
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadNearbyWhispers();
  }, []);

  const loadNearbyWhispers = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location to see nearby whispers.');
      return;
    }

    setLoading(true);
    try {
      const nearbyWhispers = await WhisperService.getNearbyWhispers(
        location.latitude,
        location.longitude,
        5000 // 5km radius
      );
      
      // Validate whisper data structure
      const validWhispers = nearbyWhispers.filter(whisper => {
        if (!whisper._id || !whisper.text || !whisper.location) {
          return false;
        }
        return true;
      });
      
      if (validWhispers.length === 0) {
        // Show test whispers if no real ones
        const testWhispers: Whisper[] = [
          {
            _id: 'test1',
            text: 'This is a test whisper to verify the cards are working!',
            tone: 'Joy',
            location: {
              latitude: location.latitude + 0.001,
              longitude: location.longitude + 0.001,
            },
            whyHere: 'Testing the cards functionality',
            sessionId: 'test_session',
            createdAt: new Date().toISOString(),
            reactions: [],
            discoveredBy: [],
          },
          {
            _id: 'test2',
            text: 'Another test whisper - swipe to see more!',
            tone: 'Gratitude',
            location: {
              latitude: location.latitude - 0.001,
              longitude: location.longitude - 0.001,
            },
            whyHere: 'Testing the cards navigation',
            sessionId: 'test_session',
            createdAt: new Date().toISOString(),
            reactions: [],
            discoveredBy: [],
          }
        ];
        setWhispers(testWhispers);
      } else {
        setWhispers(validWhispers);
      }
    } catch (error) {
      console.error('Error loading whispers:', error);
      // Show test whispers on error
      const testWhispers: Whisper[] = [
        {
          _id: 'error_test1',
          text: 'Test whisper (API error) - swipe to see more!',
          tone: 'Joy',
          location: {
            latitude: location.latitude + 0.001,
            longitude: location.longitude + 0.001,
          },
          whyHere: 'Testing the cards functionality',
          sessionId: 'test_session',
          createdAt: new Date().toISOString(),
          reactions: [],
          discoveredBy: [],
        }
      ];
      setWhispers(testWhispers);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (whisper: Whisper) => {
    try {
      await WhisperService.addReaction(whisper._id, 'like', session?.id || 'anonymous');
      
      // Update local state
      setWhispers(prev => prev.map(w => {
        if (w._id === whisper._id) {
          const existingReaction = w.reactions.find(r => r.sessionId === (session?.id || 'anonymous'));
          if (existingReaction) {
            // Remove like if already liked
            return {
              ...w,
              reactions: w.reactions.filter(r => r.sessionId !== (session?.id || 'anonymous'))
            };
          } else {
            // Add like
            return {
              ...w,
              reactions: [...w.reactions, { type: 'like', sessionId: session?.id || 'anonymous' }]
            };
          }
        }
        return w;
      }));
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const goToNext = () => {
    if (currentIndex < whispers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const getTimeBasedColors = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return ['#fef3c7', '#fde68a']; // Morning - warm yellow
    } else if (hour >= 12 && hour < 18) {
      return ['#dbeafe', '#93c5fd']; // Afternoon - cool blue
    } else if (hour >= 18 && hour < 22) {
      return ['#fce7f3', '#f9a8d4']; // Evening - soft pink
    } else {
      return ['#1e293b', '#334155']; // Night - deep blue
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
        <Text style={{ fontSize: 18, color: '#be185d', fontWeight: 'bold' }}>
          Loading whispers...
        </Text>
      </View>
    );
  }

  if (whispers.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
        <Text style={{ fontSize: 18, color: '#be185d', fontWeight: 'bold', marginBottom: 16 }}>
          No whispers found
        </Text>
        <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>
          Try refreshing or moving to a different location
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: '#be185d',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 25,
          }}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentWhisper = whispers[currentIndex];
  const isLiked = currentWhisper.reactions.some(r => r.sessionId === (session?.id || 'anonymous'));

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={getTimeBasedColors() as any}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: 12,
              borderRadius: 25,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#374151',
          }}>
            Nearby Whispers
          </Text>
          
          <View style={{ width: 48 }} />
        </View>

        {/* Whisper Card */}
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 20,
            padding: 24,
            width: width - 40,
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 8,
          }}>
            {/* Tone Badge */}
            <View style={{
              backgroundColor: getToneColor(currentWhisper.tone),
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              marginBottom: 16,
            }}>
              <Text style={{
                color: 'white',
                fontSize: 12,
                fontWeight: '600',
                textTransform: 'uppercase',
              }}>
                {currentWhisper.tone}
              </Text>
            </View>

            {/* Whisper Text */}
            <Text style={{
              fontSize: 18,
              lineHeight: 26,
              color: '#374151',
              marginBottom: 20,
              textAlign: 'center',
            }}>
              "{currentWhisper.text}"
            </Text>

            {/* Why Here */}
            {currentWhisper.whyHere && (
              <View style={{
                backgroundColor: '#f3f4f6',
                padding: 12,
                borderRadius: 12,
                marginBottom: 20,
              }}>
                <Text style={{
                  fontSize: 12,
                  color: '#6b7280',
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}>
                  💭 {currentWhisper.whyHere}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}>
              <TouchableOpacity
                onPress={() => handleLike(currentWhisper)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 25,
                  backgroundColor: isLiked ? '#ef4444' : '#f3f4f6',
                }}
              >
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={20} 
                  color={isLiked ? "white" : "#6b7280"} 
                  style={{ marginRight: 8 }}
                />
                <Text style={{
                  color: isLiked ? "white" : "#6b7280",
                  fontWeight: '600',
                }}>
                  {currentWhisper.reactions.length}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 25,
                  backgroundColor: '#f3f4f6',
                }}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 25,
                  backgroundColor: '#f3f4f6',
                }}
              >
                <Ionicons name="share-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Navigation */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 40,
          paddingBottom: 40,
        }}>
          <TouchableOpacity
            onPress={goToPrevious}
            disabled={currentIndex === 0}
            style={{
              backgroundColor: currentIndex === 0 ? '#d1d5db' : 'rgba(255, 255, 255, 0.9)',
              padding: 16,
              borderRadius: 30,
            }}
          >
            <Ionicons 
              name="chevron-up" 
              size={24} 
              color={currentIndex === 0 ? "#9ca3af" : "#374151"} 
            />
          </TouchableOpacity>

          {/* Progress Indicator */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            {whispers.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: index === currentIndex ? '#be185d' : '#d1d5db',
                  marginHorizontal: 4,
                }}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={goToNext}
            disabled={currentIndex === whispers.length - 1}
            style={{
              backgroundColor: currentIndex === whispers.length - 1 ? '#d1d5db' : 'rgba(255, 255, 255, 0.9)',
              padding: 16,
              borderRadius: 30,
            }}
          >
            <Ionicons 
              name="chevron-down" 
              size={24} 
              color={currentIndex === whispers.length - 1 ? "#9ca3af" : "#374151"} 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

function getToneColor(tone: string): string {
  const colors = {
    Joy: '#10b981',
    Longing: '#ec4899',
    Gratitude: '#f59e0b',
    Apology: '#8b5cf6',
    Heartbreak: '#ef4444',
  };
  return colors[tone] || '#6b7280';
}
