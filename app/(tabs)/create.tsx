import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';
import { useLocation } from '@/contexts/LocationContext';
import { WhisperService } from '@/services/WhisperService';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const tones = [
  { key: 'Joy', label: 'Joy', icon: 'happy', color: '#10b981', description: 'Celebration, happiness, excitement' },
  { key: 'Longing', label: 'Longing', icon: 'heart', color: '#ec4899', description: 'Missing someone, romantic yearning' },
  { key: 'Gratitude', label: 'Gratitude', icon: 'star', color: '#f59e0b', description: 'Thankfulness, appreciation' },
  { key: 'Apology', label: 'Apology', icon: 'hand-left', color: '#8b5cf6', description: 'Seeking forgiveness, regret' },
  { key: 'Heartbreak', label: 'Heartbreak', icon: 'sad', color: '#ef4444', description: 'Loss, sadness, grief' },
];

export default function CreateScreen() {
  const { session } = useSession();
  const { location } = useLocation();
  const [step, setStep] = useState(1);
  const [whisperText, setWhisperText] = useState('');
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [whyHere, setWhyHere] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const slideAnim = useSharedValue(0);
  const textInputRef = useRef<TextInput>(null);

  const handleNext = () => {
    if (step === 1 && whisperText.trim().length < 10) {
      Alert.alert('Too Short', 'Your whisper needs to be at least 10 characters long.');
      return;
    }
    
    if (step === 2 && !selectedTone) {
      Alert.alert('Choose a Tone', 'Please select how your whisper feels.');
      return;
    }

    if (step < 3) {
      setStep(step + 1);
      slideAnim.value = withSpring(-step * width);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      slideAnim.value = withSpring(-(step - 2) * width);
    }
  };

  const handleSubmit = async () => {
    if (!location && Platform.OS !== 'web') {
      Alert.alert('Location Required', 'Please enable location to create a whisper.');
      return;
    }

    if (!whisperText.trim() || !selectedTone) {
      Alert.alert('Incomplete', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const whisperData = {
        text: whisperText.trim(),
        tone: selectedTone,
        location: location || { latitude: 37.78825, longitude: -122.4324 },
        whyHere: whyHere.trim(),
        sessionId: session.anonymousId,
      };

      await WhisperService.createWhisper(whisperData);
      
      Alert.alert(
        'Whisper Created! 🌟',
        'Your anonymous message has been placed at this location for others to discover.',
        [
          {
            text: 'Create Another',
            onPress: () => {
              setWhisperText('');
              setSelectedTone('');
              setWhyHere('');
              setStep(1);
              slideAnim.value = 0;
            }
          },
          {
            text: 'Explore Map',
            onPress: () => router.push('/(tabs)')
          }
        ]
      );
    } catch (error) {
      console.error('Error creating whisper:', error);
      Alert.alert('Error', 'Failed to create whisper. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <View style={{ width, paddingHorizontal: 24, justifyContent: 'center' }}>
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        color: '#be185d',
        textAlign: 'center',
        marginBottom: 8
      }}>
        What's in your heart?
      </Text>
      <Text style={{
        color: '#4b5563',
        textAlign: 'center',
        marginBottom: 32,
        fontSize: 16
      }}>
        Share something meaningful for a stranger to find
      </Text>

      <View style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: 24
      }}>
        <TextInput
          ref={textInputRef}
          value={whisperText}
          onChangeText={setWhisperText}
          placeholder="Type your whisper here..."
          multiline
          maxLength={280}
          style={{
            fontSize: 18,
            color: '#1f2937',
            minHeight: 128,
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
          }}
          autoFocus
        />
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8
        }}>
          <Text style={{
            fontSize: 14,
            color: '#6b7280'
          }}>
            {whisperText.length}/280 characters
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#6b7280'
          }}>
            Min. 10 characters
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleNext}
        style={{
          paddingVertical: 16,
          borderRadius: 25,
          backgroundColor: whisperText.trim().length >= 10 ? '#ec4899' : '#d1d5db'
        }}
        disabled={whisperText.trim().length < 10}
      >
        <Text style={{
          color: 'white',
          fontSize: 18,
          fontWeight: '600',
          textAlign: 'center'
        }}>
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={{ width, paddingHorizontal: 24, justifyContent: 'center' }}>
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        color: '#be185d',
        textAlign: 'center',
        marginBottom: 8
      }}>
        How does it feel?
      </Text>
      <Text style={{
        color: '#4b5563',
        textAlign: 'center',
        marginBottom: 32,
        fontSize: 16
      }}>
        Help others understand your whisper's emotion
      </Text>

      <ScrollView style={{ marginBottom: 24 }} showsVerticalScrollIndicator={false}>
        {tones.map((tone) => (
          <TouchableOpacity
            key={tone.key}
            onPress={() => setSelectedTone(tone.key)}
            style={{
              padding: 16,
              marginBottom: 16,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: selectedTone === tone.key ? '#ec4899' : '#e5e7eb',
              backgroundColor: selectedTone === tone.key ? '#fdf2f8' : 'white'
            }}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8
            }}>
              <View style={{
                backgroundColor: tone.color,
                width: 24,
                height: 24,
                borderRadius: 12,
                marginRight: 12,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Ionicons name={tone.icon as any} size={16} color="white" />
              </View>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#1f2937'
              }}>
                {tone.label}
              </Text>
            </View>
            <Text style={{
              fontSize: 14,
              color: '#4b5563',
              lineHeight: 20
            }}>
              {tone.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 16 }}>
        <TouchableOpacity
          onPress={handleBack}
          style={{
            flex: 1,
            paddingVertical: 16,
            backgroundColor: '#e5e7eb',
            borderRadius: 25
          }}
        >
          <Text style={{
            color: '#374151',
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Back
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNext}
          style={{
            flex: 1,
            paddingVertical: 16,
            borderRadius: 25,
            backgroundColor: selectedTone ? '#ec4899' : '#d1d5db'
          }}
          disabled={!selectedTone}
        >
          <Text style={{
            color: 'white',
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={{ width, paddingHorizontal: 24, justifyContent: 'center' }}>
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        color: '#be185d',
        textAlign: 'center',
        marginBottom: 8
      }}>
        Why here?
      </Text>
      <Text style={{
        color: '#4b5563',
        textAlign: 'center',
        marginBottom: 32,
        fontSize: 16
      }}>
        Optional: Share why this location is meaningful
      </Text>

      <View style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: 24
      }}>
        <TextInput
          value={whyHere}
          onChangeText={setWhyHere}
          placeholder="This place reminds me of..."
          multiline
          maxLength={150}
          style={{
            fontSize: 16,
            color: '#1f2937',
            minHeight: 80
          }}
        />
        <Text style={{
          fontSize: 14,
          color: '#6b7280',
          textAlign: 'right',
          marginTop: 8
        }}>
          {whyHere.length}/150 characters
        </Text>
      </View>

      {/* Preview */}
      <View style={{
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e5e7eb'
      }}>
        <Text style={{
          fontSize: 14,
          color: '#6b7280',
          marginBottom: 8
        }}>
          Preview:
        </Text>
        <Text style={{
          fontSize: 18,
          color: '#1f2937',
          marginBottom: 8
        }}>
          "{whisperText}"
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            backgroundColor: tones.find(t => t.key === selectedTone)?.color,
            width: 16,
            height: 16,
            borderRadius: 8,
            marginRight: 8
          }} />
          <Text style={{
            fontSize: 14,
            color: '#4b5563'
          }}>
            {selectedTone}
          </Text>
        </View>
        {whyHere.trim() && (
          <Text style={{
            fontSize: 14,
            color: '#6b7280',
            marginTop: 8,
            fontStyle: 'italic'
          }}>
            "{whyHere}"
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 16 }}>
        <TouchableOpacity
          onPress={handleBack}
          style={{
            flex: 1,
            paddingVertical: 16,
            backgroundColor: '#e5e7eb',
            borderRadius: 25
          }}
        >
          <Text style={{
            color: '#374151',
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Back
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          style={{
            flex: 1,
            paddingVertical: 16,
            backgroundColor: '#ec4899',
            borderRadius: 25
          }}
          disabled={isSubmitting}
        >
          <Text style={{
            color: 'white',
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            {isSubmitting ? 'Creating...' : 'Create Whisper'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#fdf2f8', '#e0e7ff', '#ddd6fe']}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Progress Indicator */}
        <View style={{ paddingTop: 64, paddingBottom: 16 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8
          }}>
            {[1, 2, 3].map((stepNum) => (
              <View
                key={stepNum}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: stepNum <= step ? '#ec4899' : '#d1d5db'
                }}
              />
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Animated.View 
            style={{ 
              flexDirection: 'row',
              transform: [{ translateX: slideAnim }]
            }}
          >
            {renderStep1()}
            {renderStep2()}
            {renderStep3()}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}