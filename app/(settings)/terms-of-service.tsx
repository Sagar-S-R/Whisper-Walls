import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function TermsOfServiceScreen() {
  const renderSection = (title: string, content: string, highlight: boolean = false) => (
    <View style={{ 
      marginBottom: 24,
      backgroundColor: highlight ? '#fef3f2' : 'transparent',
      padding: highlight ? 16 : 0,
      borderRadius: highlight ? 12 : 0,
      borderLeftWidth: highlight ? 4 : 0,
      borderLeftColor: highlight ? '#ef4444' : 'transparent'
    }}>
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: highlight ? '#dc2626' : '#be185d',
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

  const renderBulletSection = (title: string, items: string[], highlight: boolean = false) => (
    <View style={{ 
      marginBottom: 24,
      backgroundColor: highlight ? '#fef3f2' : 'transparent',
      padding: highlight ? 16 : 0,
      borderRadius: highlight ? 12 : 0,
      borderLeftWidth: highlight ? 4 : 0,
      borderLeftColor: highlight ? '#ef4444' : 'transparent'
    }}>
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: highlight ? '#dc2626' : '#be185d',
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
          Terms of Service
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
              Effective Date: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          {/* Introduction */}
          {renderSection(
            'Welcome to Whisper Walls',
            'By using Whisper Walls, you agree to these Terms of Service. Please read them carefully. These terms govern your use of the Whisper Walls mobile application and all related services.'
          )}

          {/* Acceptance */}
          {renderSection(
            'Acceptance of Terms',
            'By downloading, installing, or using Whisper Walls, you confirm that you are at least 17 years old and agree to be bound by these terms. If you do not agree to these terms, please do not use the app.'
          )}

          {/* Service Description */}
          {renderSection(
            'About Whisper Walls',
            'Whisper Walls is an anonymous messaging platform that allows users to share thoughts, feelings, and experiences while discovering similar content from others nearby. All messages (whispers) are completely anonymous and cannot be traced back to their creators.'
          )}

          {/* User Responsibilities */}
          {renderBulletSection(
            'Your Responsibilities',
            [
              'You must be at least 17 years old to use this app',
              'Provide accurate information if you create an account',
              'Keep your account credentials secure',
              'Use the app respectfully and legally',
              'Report inappropriate content or behavior',
              'Respect others\' privacy and anonymity'
            ]
          )}

          {/* Prohibited Conduct */}
          {renderBulletSection(
            'Prohibited Conduct',
            [
              'Harassment, bullying, or threatening other users',
              'Sharing illegal, harmful, or inappropriate content',
              'Attempting to identify other users or break anonymity',
              'Spam, advertising, or promotional content',
              'Impersonating others or providing false information',
              'Using the app to harm minors in any way',
              'Sharing personal information (yours or others\')',
              'Attempting to hack, modify, or disrupt the service'
            ],
            true
          )}

          {/* Content Policy */}
          {renderSection(
            'Content Guidelines',
            'While Whisper Walls celebrates anonymous expression, all content must comply with our community guidelines. We prohibit content that is illegal, harmful, threatening, or violates others\' rights. We reserve the right to remove content and suspend accounts that violate these guidelines.'
          )}

          {/* Anonymity and Privacy */}
          {renderSection(
            'Anonymity Promise',
            'We are committed to maintaining the anonymity of all whispers. However, we may be required to cooperate with law enforcement in cases of illegal activity. Even in such cases, the technical design of our system makes it extremely difficult to trace content back to individual users.'
          )}

          {/* Intellectual Property */}
          {renderSection(
            'Your Content Rights',
            'You retain ownership of the content you create. By using Whisper Walls, you grant us a non-exclusive license to display, store, and distribute your anonymous whispers within the app. Since content is anonymous, this license continues even if you delete your account.'
          )}

          {/* Our Rights */}
          {renderBulletSection(
            'Our Rights and Responsibilities',
            [
              'Modify or discontinue the service at any time',
              'Remove content that violates our guidelines',
              'Suspend or terminate accounts for violations',
              'Update these terms with reasonable notice',
              'Protect the safety and security of all users'
            ]
          )}

          {/* Disclaimers */}
          {renderSection(
            'Service Availability',
            'Whisper Walls is provided "as is" without warranties. We strive for reliable service but cannot guarantee 100% uptime or perfect functionality. We are not responsible for any damages resulting from service interruptions or technical issues.'
          )}

          {/* Age Requirements */}
          {renderSection(
            'Age Requirements',
            'Whisper Walls is intended for users 17 and older. We do not knowingly collect information from users under 17. If you believe a user under 17 is using the app, please contact us immediately.',
            true
          )}

          {/* Limitation of Liability */}
          {renderSection(
            'Limitation of Liability',
            'To the fullest extent permitted by law, Whisper Walls and its creators are not liable for any indirect, incidental, or consequential damages arising from your use of the app. Our total liability is limited to the amount you paid for the service (if any).'
          )}

          {/* Termination */}
          {renderSection(
            'Account Termination',
            'You may delete your account at any time through the app settings. We may suspend or terminate accounts that violate these terms. Upon termination, your personal data will be deleted, but anonymous whispers may remain in the system.'
          )}

          {/* Changes to Terms */}
          {renderSection(
            'Changes to These Terms',
            'We may update these terms from time to time to reflect changes in our service or legal requirements. We will notify users of significant changes through the app. Continued use after changes constitutes acceptance of the new terms.'
          )}

          {/* Governing Law */}
          {renderSection(
            'Governing Law',
            'These terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved through arbitration or in the courts of [Your Jurisdiction]. If any provision of these terms is found invalid, the remaining provisions continue in effect.'
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
              Questions About These Terms?
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#374151',
              lineHeight: 24,
              marginBottom: 12
            }}>
              If you have questions about these Terms of Service or need clarification on any point, please reach out to us:
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#be185d',
              fontWeight: '600',
              marginBottom: 8
            }}>
              legal@whisperwalls.app
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              We typically respond within 48 hours during business days.
            </Text>
          </View>

          {/* Acknowledgment */}
          <View style={{
            backgroundColor: '#f0f9ff',
            padding: 16,
            borderRadius: 12,
            marginTop: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#0ea5e9'
          }}>
            <Text style={{
              fontSize: 16,
              color: '#0c4a6e',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              By using Whisper Walls, you acknowledge that you have read, understood, and agree to these Terms of Service.
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}