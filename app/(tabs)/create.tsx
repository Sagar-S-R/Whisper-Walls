import React, { useState, useRef, useEffect } from 'react';
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
import { router, useFocusEffect } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';
import { useLocation } from '@/contexts/LocationContext';
import { WhisperService } from '@/services/WhisperService';
import Animated, { useSharedValue, withSpring, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

// Animation mappings for each tone
const toneAnimations = {
  'Joy': require('../../assets/animations/celeb1.json'),
  'Longing': require('../../assets/animations/hearts.json'),
  'Gratitude': require('../../assets/animations/celeb2.json'), 
  'Apology': require('../../assets/animations/heartBroke.json'),
  'Heartbreak': require('../../assets/animations/heartBroke.json'),
};

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
  const [showAnimation, setShowAnimation] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showQuoteCard, setShowQuoteCard] = useState(false);
  const [currentQuote, setCurrentQuote] = useState('');
  
  const slideAnim = useSharedValue(0);
  const animationOpacity = useSharedValue(0);
  const animationScale = useSharedValue(0.5);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.3);
  const cardRotation = useSharedValue(-15);
  const cardTranslateX = useSharedValue(width);
  const cardTranslateY = useSharedValue(height * 0.3);
  const backgroundBlur = useSharedValue(0);

  // 50 Inspirational quotes (10 per emotion)
  const emotionQuotes = {
    Joy: [
      "Happiness is not by chance, but by choice",
      "Joy is the simplest form of gratitude",
      "Find joy in the ordinary moments",
      "Let your smile change the world",
      "Choose joy, spread light",
      "Happiness blooms from within",
      "Joy shared is joy doubled",
      "Today is a good day for a good day",
      "Be the reason someone smiles today",
      "Joy is a choice you make every morning"
    ],
    Longing: [
      "The heart wants what it wants",
      "Distance means nothing when love means everything",
      "Some people search their whole lives to find what you found",
      "Missing someone is your heart's way of reminding you that you love them",
      "The best love is the one that makes you a better person",
      "Love knows no distance or time",
      "Sometimes the heart sees what is invisible to the eye",
      "True love never has an ending",
      "The greatest thing you'll ever learn is to love and be loved in return",
      "Love bridges any distance and conquers all time"
    ],
    Gratitude: [
      "Gratitude turns what we have into enough",
      "In every moment, there is something to be grateful for",
      "Gratitude is the fairest blossom which springs from the soul",
      "Be thankful for small mercies",
      "Gratitude makes sense of our past and brings peace for today",
      "A grateful heart is a magnet for miracles",
      "Gratitude is not only the greatest virtue but the parent of others",
      "Count blessings, not problems",
      "Grateful hearts are happy hearts",
      "The thankful receiver bears a plentiful harvest"
    ],
    Apology: [
      "Sorry is the first step to healing",
      "A sincere apology has the power to heal relationships",
      "Everyone makes mistakes, but not everyone learns from them",
      "Forgiveness is the fragrance the violet sheds on the heel that crushed it",
      "It takes courage to say sorry and strength to forgive",
      "Mistakes are proof that you're trying",
      "The best apology is changed behavior",
      "Forgiveness doesn't excuse their behavior, but it prevents their behavior from destroying your heart",
      "We all make mistakes, but the wise learn from them",
      "A genuine apology is like a bridge between hearts"
    ],
    Heartbreak: [
      "Pain changes people, but it also makes them stronger",
      "Sometimes good things fall apart so better things can come together",
      "Your heart will heal, and you will love again",
      "Every ending is a new beginning in disguise",
      "Broken hearts still beat with hope",
      "The cure for a broken heart is not found in another person",
      "You are stronger than you think and more resilient than you know",
      "Sometimes you need a broken heart to learn what makes you whole",
      "Healing doesn't mean the damage never existed",
      "Your heart knows how to heal itself, give it time"
    ]
  };

  const getRandomQuote = (tone: string) => {
    const quotes = emotionQuotes[tone as keyof typeof emotionQuotes];
    return quotes ? quotes[Math.floor(Math.random() * quotes.length)] : '';
  };
  
  const textInputRef = useRef<TextInput>(null);

  // Reset form to initial state
  const resetForm = () => {
    setWhisperText('');
    setSelectedTone('');
    setWhyHere('');
    setStep(1);
    setIsSubmitting(false);
    setShowAnimation(false);
    setShowSuccessAnimation(false);
    setShowSuccessPopup(false);
    setShowQuoteCard(false);
    setCurrentQuote('');
    slideAnim.value = 0;
    resetAnimationStates();
  };

  // Reset animation values to initial state
  const resetAnimationStates = () => {
    cardOpacity.value = 0;
    cardScale.value = 0.3;
    cardRotation.value = -15;
    cardTranslateX.value = width;
    cardTranslateY.value = height * 0.3;
    backgroundBlur.value = 0;
    animationOpacity.value = 0;
    animationScale.value = 0.5;
  };

  // Reset form when screen comes into focus (when navigating back to this screen)
  useFocusEffect(
    React.useCallback(() => {
      // Reset form whenever this screen comes into focus
      resetForm();
    }, [])
  );

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

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    setShowSuccessAnimation(false);
    setShowQuoteCard(false);
    backgroundBlur.value = withTiming(0, { duration: 500 });
    animationOpacity.value = withTiming(0, { duration: 500 });
    
    // Reset form completely
    setTimeout(() => {
      resetForm();
    }, 500);
  };

  const showQuoteCardAnimation = () => {
    const quote = getRandomQuote(selectedTone);
    setCurrentQuote(quote);
    setShowQuoteCard(true);
    
    // Background blur
    backgroundBlur.value = withTiming(10, { duration: 800 });
    
    // Card animation from bottom-right with rotation
    cardOpacity.value = withTiming(1, { duration: 600 });
    cardTranslateX.value = withTiming(0, { duration: 800 });
    cardTranslateY.value = withTiming(0, { duration: 800 });
    cardRotation.value = withTiming(0, { duration: 800 });
    cardScale.value = withTiming(1, { duration: 800 });
  };

  const hideQuoteCard = () => {
    // Phase 1: Start fading out the card
    cardOpacity.value = withTiming(0, { duration: 800 });
    
    setTimeout(() => {
      setShowQuoteCard(false);
      
      // Phase 2: Immediately show success animation (background still blurred)
      setShowSuccessAnimation(true);
      animationOpacity.value = withTiming(1, { duration: 500 });
      animationScale.value = withTiming(1, { duration: 800 });
      
      // Phase 3: After success animation plays, show the popup dialog
      setTimeout(() => {
        setShowSuccessAnimation(false);
        animationOpacity.value = withTiming(0, { duration: 500 });
        
        // Show the success popup with buttons
        setTimeout(() => {
          Alert.alert(
            'Whisper Created! 🌟',
            'Your anonymous message has been placed at this location for others to discover.',
            [
              {
                text: 'Create Another',
                onPress: () => {
                  closeSuccessPopup();
                }
              },
              {
                text: 'Explore Map',
                onPress: () => {
                  backgroundBlur.value = withTiming(0, { duration: 500 });
                  resetForm();
                  router.replace('/');
                }
              }
            ]
          );
        }, 500);
      }, 3000); // Show success animation for 3 seconds
    }, 800); // Wait for card to fade out
  };

  const showCreateAnimation = () => {
    setShowAnimation(true);
    animationOpacity.value = withTiming(1, { duration: 300 });
    animationScale.value = withTiming(1, { duration: 500 });
    
    // Hide animation after 3 seconds
    setTimeout(() => {
      hideAnimation();
    }, 3000);
  };

  const hideAnimation = () => {
    animationOpacity.value = withTiming(0, { duration: 500 });
    animationScale.value = withTiming(0.5, { duration: 500 });
    setTimeout(() => {
      setShowAnimation(false);
    }, 500);
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

    // Show quote card animation first
    showQuoteCardAnimation();
    setIsSubmitting(true);
    
    // Start creating whisper while card is showing
    setTimeout(async () => {
      try {
        const whisperData = {
          text: whisperText.trim(),
          tone: selectedTone,
          location: location || { latitude: 37.78825, longitude: -122.4324 },
          whyHere: whyHere.trim(),
          sessionId: session.anonymousId,
        };

        const created = await WhisperService.createWhisper(whisperData);
        console.log('[CreateScreen] createWhisper returned:', created);

        if (!created || !('_id' in created)) {
          throw new Error('createWhisper did not return created object');
        }

        // Hide quote card and show success animation
        hideQuoteCard();
                
      } catch (error) {
        console.error('Error creating whisper:', error);
        // Reset animations on error
        backgroundBlur.value = withTiming(0, { duration: 500 });
        setShowQuoteCard(false);
        resetAnimationStates();
        // Show the actual error message for debugging
        const errorMsg = error && typeof error === 'object' && 'message' in error ? error.message : 'Unknown error';
        Alert.alert('Error Creating Whisper', `Failed to create whisper: ${errorMsg}\n\nCheck Metro logs for more details.`);
      } finally {
        setTimeout(() => {
          setIsSubmitting(false);
        }, 5000);
      }
    }, 2000); // Let the card animation settle
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

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: animationOpacity.value,
    transform: [{ scale: animationScale.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateX: cardTranslateX.value },
      { translateY: cardTranslateY.value },
      { rotate: `${cardRotation.value}deg` },
      { scale: cardScale.value }
    ],
  }));

  const backgroundBlurStyle = useAnimatedStyle(() => ({
    opacity: backgroundBlur.value > 0 ? 0.8 : 0,
  }));

  const renderQuoteCard = () => {
    if (!showQuoteCard) return null;

    const selectedToneData = tones.find(t => t.key === selectedTone);

    return (
      <>
        {/* Background Blur */}
        <Animated.View style={[{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 998,
        }, backgroundBlurStyle]} />

        {/* Quote Card */}
        <Animated.View style={[{
          position: 'absolute',
          top: height * 0.3,
          left: width * 0.1,
          right: width * 0.1,
          zIndex: 999,
        }, cardAnimatedStyle]}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 20,
            borderLeftWidth: 5,
            borderLeftColor: selectedToneData?.color || '#ec4899',
          }}>
            <Text style={{
              fontSize: 18,
              fontStyle: 'italic',
              color: '#1f2937',
              lineHeight: 26,
              textAlign: 'center',
              marginBottom: 16,
            }}>
              "{currentQuote}"
            </Text>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 16,
            }}>
              <View style={{
                backgroundColor: selectedToneData?.color || '#ec4899',
                width: 8,
                height: 8,
                borderRadius: 4,
                marginRight: 8,
              }} />
              <Text style={{
                fontSize: 14,
                color: '#6b7280',
                fontWeight: '500',
              }}>
                Creating your whisper...
              </Text>
            </View>
          </View>
        </Animated.View>
      </>
    );
  };

  const renderCreateAnimation = () => {
    if (!showSuccessAnimation || !selectedTone) return null;

    const animationSource = toneAnimations[selectedTone as keyof typeof toneAnimations];
    
    return (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}>
        <Animated.View style={[{
          alignItems: 'center',
        }, animatedOverlayStyle]}>
          {animationSource && (
            <LottieView
              source={animationSource}
              autoPlay
              loop={false}
              style={{
                width: width * 0.6,
                height: width * 0.6,
                maxWidth: 300,
                maxHeight: 300,
              }}
            />
          )}
        </Animated.View>
      </View>
    );
  };

  const renderSuccessPopup = () => {
    if (!showSuccessPopup) return null;

    return (
      <>
        {/* Background Blur */}
        <Animated.View style={[{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }, backgroundBlurStyle]} />

        {/* Success Animation Above Popup */}
        {showSuccessAnimation && selectedTone && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1001,
            paddingBottom: 200, // Position above the popup
          }}>
            <Animated.View style={[{
              alignItems: 'center',
            }, animatedOverlayStyle]}>
              {toneAnimations[selectedTone as keyof typeof toneAnimations] && (
                <LottieView
                  source={toneAnimations[selectedTone as keyof typeof toneAnimations]}
                  autoPlay
                  loop={false}
                  style={{
                    width: width * 0.4,
                    height: width * 0.4,
                    maxWidth: 200,
                    maxHeight: 200,
                  }}
                />
              )}
            </Animated.View>
          </View>
        )}

        {/* Success Popup */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          paddingHorizontal: 40,
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 30,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#be185d',
              marginBottom: 10,
              textAlign: 'center',
            }}>
              Whisper Created! 🌟
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#666',
              textAlign: 'center',
              marginBottom: 30,
              lineHeight: 22,
            }}>
              Your anonymous message has been placed at this location for others to discover.
            </Text>
            <View style={{
              flexDirection: 'row',
              gap: 15,
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#be185d',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 10,
                }}
                onPress={closeSuccessPopup}
              >
                <Text style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}>
                  Create Another
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#e5e7eb',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 10,
                }}
                onPress={() => {
                  closeSuccessPopup();
                  router.push('/(tabs)');
                }}
              >
                <Text style={{
                  color: '#374151',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}>
                  Explore Map
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </>
    );
  };

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

      {/* Quote Card Animation */}
      {renderQuoteCard()}

      {/* Success Animation */}
      {renderCreateAnimation()}

      {/* Success Popup */}
      {renderSuccessPopup()}
    </LinearGradient>
  );
}