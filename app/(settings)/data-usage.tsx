import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function DataUsageScreen() {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const renderDataCategory = (
    icon: string,
    title: string,
    description: string,
    sectionKey: string,
    details: string[],
    purpose: string,
    retention: string,
    isCollected: boolean = true
  ) => (
    <TouchableOpacity
      onPress={() => toggleSection(sectionKey)}
      style={{
        backgroundColor: isCollected ? 'white' : '#f9fafb',
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: isCollected ? '#ec4899' : '#22c55e'
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{
          width: 40,
          height: 40,
          backgroundColor: isCollected ? '#fdf2f8' : '#f0fdf4',
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12
        }}>
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={isCollected ? '#ec4899' : '#22c55e'} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: 4
          }}>
            {title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: isCollected ? '#fce7f3' : '#dcfce7',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
              marginRight: 8
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: isCollected ? '#be185d' : '#166534'
              }}>
                {isCollected ? 'COLLECTED' : 'NOT COLLECTED'}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons 
          name={expandedSections[sectionKey] ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#9ca3af" 
        />
      </View>
      
      <Text style={{
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginBottom: expandedSections[sectionKey] ? 16 : 0
      }}>
        {description}
      </Text>

      {expandedSections[sectionKey] && (
        <View style={{
          backgroundColor: isCollected ? '#fdf2f8' : '#f0fdf4',
          padding: 12,
          borderRadius: 12,
          marginTop: 8
        }}>
          {isCollected && (
            <>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: 8
              }}>
                What we collect:
              </Text>
              {details.map((detail, index) => (
                <View key={index} style={{ flexDirection: 'row', marginBottom: 4 }}>
                  <Text style={{ color: '#ec4899', marginRight: 8 }}>•</Text>
                  <Text style={{ flex: 1, fontSize: 14, color: '#374151' }}>
                    {detail}
                  </Text>
                </View>
              ))}
              
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#1f2937',
                marginTop: 12,
                marginBottom: 4
              }}>
                Why we need it:
              </Text>
              <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                {purpose}
              </Text>
              
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: 4
              }}>
                How long we keep it:
              </Text>
              <Text style={{ fontSize: 14, color: '#374151' }}>
                {retention}
              </Text>
            </>
          )}
          
          {!isCollected && (
            <Text style={{
              fontSize: 14,
              color: '#166534',
              fontStyle: 'italic'
            }}>
              We deliberately do not collect this type of data to protect your privacy and anonymity.
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#fdf2f8', '#e0e7ff']}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View style={{ 
        paddingTop: 64, 
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{
            marginRight: 16,
            padding: 8
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#be185d" />
        </TouchableOpacity>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#be185d',
          flex: 1
        }}>
          Data Usage
        </Text>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {/* Introduction */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#be185d',
            marginBottom: 12
          }}>
            Transparency in Data Collection
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#374151',
            lineHeight: 24,
            marginBottom: 16
          }}>
            We believe you should know exactly what data we collect and why. Tap any category below to see detailed information about our data practices.
          </Text>
          
          <View style={{
            backgroundColor: '#f0f9ff',
            padding: 12,
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: '#0ea5e9'
          }}>
            <Text style={{
              fontSize: 14,
              color: '#0c4a6e',
              fontWeight: '600'
            }}>
              💡 Remember: All whispers remain completely anonymous and cannot be traced back to you, regardless of what other data we collect.
            </Text>
          </View>
        </View>

        {/* Data Categories - What We Collect */}
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: 16
        }}>
          Data We Collect
        </Text>

        {renderDataCategory(
          'phone-portrait',
          'Device Information',
          'Basic technical information about your device to ensure the app works properly.',
          'device',
          [
            'Device type and model (iPhone 14, Samsung Galaxy, etc.)',
            'Operating system version (iOS 17, Android 13, etc.)',
            'App version you\'re using',
            'Screen size and resolution',
            'Language and region settings'
          ],
          'To optimize the app experience for your device, fix bugs, and ensure compatibility.',
          'Stored until you delete the app or reset your data.'
        )}

        {renderDataCategory(
          'location',
          'Location Data',
          'Approximate location to enable proximity-based whisper discovery.',
          'location',
          [
            'Approximate coordinates (within 100-500 meters)',
            'General area or neighborhood',
            'Timezone information'
          ],
          'To show you whispers from nearby locations and enable the core discovery feature.',
          'Location coordinates are immediately generalized and precise location is never stored.'
        )}

        {renderDataCategory(
          'analytics',
          'Usage Analytics',
          'Anonymous information about how you use the app to improve the experience.',
          'analytics',
          [
            'Which screens you visit most often',
            'How long you spend in the app',
            'Which features you use',
            'App crashes or errors (anonymous)',
            'Time of day you\'re most active'
          ],
          'To understand how people use Whisper Walls and improve the most important features.',
          'Aggregated data is kept indefinitely, but cannot be linked back to you.'
        )}

        {renderDataCategory(
          'person',
          'Account Information',
          'Optional information if you choose to create an account.',
          'account',
          [
            'Username (visible only to you in settings)',
            'Email address (for account recovery)',
            'Display name (optional)',
            'Account creation date',
            'Login timestamps'
          ],
          'To provide account features like data sync and account recovery.',
          'Deleted within 30 days of account deletion. Whispers remain anonymous forever.'
        )}

        {renderDataCategory(
          'document-text',
          'Whisper Content',
          'The anonymous messages you create and interact with.',
          'whispers',
          [
            'Text content of whispers you create',
            'Reactions you give to other whispers',
            'Approximate timestamp and location',
            'Anonymous session ID (changes regularly)'
          ],
          'To display whispers to other users and enable the core app experience.',
          'Whispers are kept indefinitely but remain completely anonymous and untraceable.'
        )}

        {/* Data Categories - What We Don't Collect */}
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1f2937',
          marginTop: 32,
          marginBottom: 16
        }}>
          Data We Never Collect
        </Text>

        {renderDataCategory(
          'people',
          'Personal Contacts',
          'We never access your contact list or social media connections.',
          'contacts',
          [],
          '',
          '',
          false
        )}

        {renderDataCategory(
          'camera',
          'Photos & Media',
          'We don\'t access your camera roll, photos, or other media files.',
          'media',
          [],
          '',
          '',
          false
        )}

        {renderDataCategory(
          'call',
          'Phone & SMS',
          'We never access your phone calls, SMS messages, or phone number.',
          'phone',
          [],
          '',
          '',
          false
        )}

        {renderDataCategory(
          'card',
          'Financial Information',
          'No payment info, bank details, or financial data is collected.',
          'financial',
          [],
          '',
          '',
          false
        )}

        {renderDataCategory(
          'eye',
          'Tracking Data',
          'No advertising IDs, tracking pixels, or cross-app behavior tracking.',
          'tracking',
          [],
          '',
          '',
          false
        )}

        {/* Your Control Section */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 20,
          marginTop: 24,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#be185d',
            marginBottom: 12
          }}>
            You're in Control
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#374151',
            lineHeight: 24,
            marginBottom: 16
          }}>
            You can manage your data at any time:
          </Text>
          
          <View style={{ marginLeft: 8 }}>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Text style={{ color: '#be185d', marginRight: 8 }}>•</Text>
              <Text style={{ flex: 1, fontSize: 16, color: '#374151' }}>
                Turn off location services in your device settings
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Text style={{ color: '#be185d', marginRight: 8 }}>•</Text>
              <Text style={{ flex: 1, fontSize: 16, color: '#374151' }}>
                Export all your data from Settings
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Text style={{ color: '#be185d', marginRight: 8 }}>•</Text>
              <Text style={{ flex: 1, fontSize: 16, color: '#374151' }}>
                Delete your account and personal data
              </Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ color: '#be185d', marginRight: 8 }}>•</Text>
              <Text style={{ flex: 1, fontSize: 16, color: '#374151' }}>
                Use the app completely anonymously without an account
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}