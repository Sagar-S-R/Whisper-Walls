import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function PrivacyPolicyScreen() {
  const renderSection = (title: string, content: string) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: '#be185d',
        marginBottom: 12
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
        textAlign: 'justify'
      }}>
        {content}
      </Text>
    </View>
  );

  const renderBulletPoint = (text: string) => (
    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
      <Text style={{ color: '#be185d', marginRight: 8, fontSize: 16 }}>•</Text>
      <Text style={{ flex: 1, fontSize: 16, color: '#374151', lineHeight: 24 }}>
        {text}
      </Text>
    </View>
  );

  const renderBulletSection = (title: string, items: string[]) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: '#be185d',
        marginBottom: 12
      }}>
        {title}
      </Text>
      {items.map((item, index) => (
        <View key={index}>
          {renderBulletPoint(item)}
        </View>
      ))}
    </View>
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
          Privacy Policy
        </Text>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {/* Main Content Card */}
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
          {/* Last Updated */}
          <View style={{
            backgroundColor: '#fdf2f8',
            padding: 12,
            borderRadius: 8,
            marginBottom: 24
          }}>
            <Text style={{
              fontSize: 14,
              color: '#be185d',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Last Updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          {/* Introduction */}
          {renderSection(
            'Your Privacy Matters',
            'At Auris, we believe in radical transparency about how we handle your data. This privacy policy explains our commitment to protecting your anonymity while creating meaningful connections through shared experiences.'
          )}

          {/* Core Principle */}
          <View style={{
            backgroundColor: '#f0fdf4',
            padding: 16,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#22c55e',
            marginBottom: 24
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#166534',
              marginBottom: 8
            }}>
              Our Core Promise
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#166534',
              lineHeight: 24
            }}>
              All whispers are completely anonymous. Even we cannot trace a whisper back to its creator. Your identity and your thoughts remain separate by design.
            </Text>
          </View>

          {/* Data We Collect */}
          {renderBulletSection(
            'Information We Collect',
            [
              'Anonymous session data to enable core functionality',
              'Location coordinates (approximate) for proximity-based discoveries',
              'Device information for technical optimization',
              'Usage patterns to improve the app experience',
              'Optional account information if you choose to register'
            ]
          )}

          {/* Data We Don't Collect */}
          {renderBulletSection(
            'What We Never Collect',
            [
              'Personal identifiers linked to your whispers',
              'Precise location data beyond general proximity',
              'Contact lists or social media connections',
              'Browsing history outside the app',
              'Any data that could compromise your anonymity'
            ]
          )}

          {/* How We Protect You */}
          {renderBulletSection(
            'How We Protect Your Privacy',
            [
              'End-to-end encryption for all whisper content',
              'Anonymous ID system that changes periodically',
              'Location data is immediately generalized and never stored precisely',
              'No tracking cookies or advertising identifiers',
              'Regular security audits and privacy reviews'
            ]
          )}

          {/* Your Rights */}
          {renderBulletSection(
            'Your Rights',
            [
              'Request deletion of all your data at any time',
              'Export your data in a readable format',
              'Opt out of location-based features',
              'Control notification preferences',
              'Browse completely anonymously without registration'
            ]
          )}

          {/* Data Sharing */}
          {renderSection(
            'Data Sharing',
            'We never sell, rent, or share your personal data with third parties for marketing purposes. Anonymous, aggregated usage statistics may be shared for research purposes, but this data cannot be used to identify individuals.'
          )}

          {/* Data Retention */}
          {renderSection(
            'Data Retention',
            'Anonymous whispers are retained to maintain the integrity of the discovery experience. Personal account data is deleted within 30 days of account deletion. Location data is immediately anonymized and generalized.'
          )}

          {/* Children\'s Privacy */}
          {renderSection(
            'Children\'s Privacy',
            'Auris is intended for users 17 and older. We do not knowingly collect personal information from children under 17. If you believe a child has provided us with personal information, please contact us immediately.'
          )}

          {/* Changes to Policy */}
          {renderSection(
            'Policy Updates',
            'We may update this privacy policy to reflect changes in our practices or legal requirements. We will notify users of significant changes through the app and provide the updated policy with a new effective date.'
          )}

          {/* Contact Information */}
          <View style={{
            backgroundColor: '#fdf2f8',
            padding: 16,
            borderRadius: 12,
            marginTop: 24
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#be185d',
              marginBottom: 12
            }}>
              Questions or Concerns?
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#374151',
              lineHeight: 24,
              marginBottom: 12
            }}>
              We're committed to transparency. If you have any questions about this privacy policy or how we handle your data, please reach out:
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#be185d',
              fontWeight: '600'
            }}>
              privacy@auris.app
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}