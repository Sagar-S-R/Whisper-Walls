import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { session, clearSession } = useSession();
  const [notifications, setNotifications] = useState(true);
  const [breakupMode, setBreakupMode] = useState(false);
  const [proximityRadius, setProximityRadius] = useState(100);

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will clear all your whispers, discoveries, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              clearSession();
              router.replace('/(onboarding)');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data export will be prepared and shared. This includes your created whispers and discovery history.',
      [
        { text: 'Cancel' },
        { text: 'Export', onPress: () => console.log('Export initiated') },
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void,
    rightElement?: React.ReactNode,
    destructive = false
  ) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{
          width: 40,
          height: 40,
          backgroundColor: '#f3f4f6',
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12
        }}>
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={destructive ? '#ef4444' : '#6b7280'} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: destructive ? '#dc2626' : '#1f2937'
          }}>
            {title}
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#6b7280',
            marginTop: 4
          }}>
            {subtitle}
          </Text>
        </View>
      </View>
      {rightElement || (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color="#9ca3af" 
        />
      )}
    </TouchableOpacity>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginHorizontal: 16,
        marginBottom: 12
      }}>
        {title}
      </Text>
      <View style={{
        backgroundColor: 'white',
        marginHorizontal: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        overflow: 'hidden'
      }}>
        {children}
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#fdf2f8', '#e0e7ff']}
      style={{ flex: 1 }}
    >
      <View style={{ paddingTop: 64, paddingBottom: 16 }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#be185d',
          textAlign: 'center'
        }}>
          Settings
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Account Info */}
        <View style={{
          backgroundColor: 'white',
          marginHorizontal: 16,
          marginBottom: 24,
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2
        }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 64,
              height: 64,
              backgroundColor: '#fdf2f8',
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              <Ionicons name="person" size={28} color="#ec4899" />
            </View>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              Anonymous Explorer
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#6b7280'
            }}>
              ID: {session.anonymousId.substring(0, 8)}...
            </Text>
          </View>
        </View>

        {/* Preferences */}
        {renderSection(
          'Preferences',
          <>
            {renderSettingItem(
              'notifications',
              'Push Notifications',
              'Get notified about new discoveries and reactions',
              () => {},
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#f3f4f6', true: '#fce7f3' }}
                thumbColor={notifications ? '#ec4899' : '#9ca3af'}
              />
            )}
            <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />
            {renderSettingItem(
              'heart-dislike',
              'Gentle Mode',
              'Muted colors and softer interactions for sensitive times',
              () => {},
              <Switch
                value={breakupMode}
                onValueChange={setBreakupMode}
                trackColor={{ false: '#f3f4f6', true: '#f3f4f6' }}
                thumbColor={breakupMode ? '#6b7280' : '#9ca3af'}
              />
            )}
          </>
        )}

        {/* Privacy */}
        {renderSection(
          'Privacy & Data',
          <>
            {renderSettingItem(
              'shield-checkmark',
              'Privacy Policy',
              'Learn how we protect your anonymous data',
              () => console.log('Privacy policy')
            )}
            <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />
            {renderSettingItem(
              'download',
              'Export Data',
              'Download your whispers and discovery history',
              handleExportData
            )}
          </>
        )}

        {/* Support */}
        {renderSection(
          'Support',
          <>
            {renderSettingItem(
              'help-circle',
              'Help & Tutorial',
              'Learn how to use Whisper Walls',
              () => router.push('/(onboarding)/tutorial')
            )}
            <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />
            {renderSettingItem(
              'mail',
              'Contact Support',
              'Get help or share feedback',
              () => console.log('Contact support')
            )}
            <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />
            {renderSettingItem(
              'star',
              'Rate the App',
              'Share your experience on the App Store',
              () => console.log('Rate app')
            )}
          </>
        )}

        {/* Danger Zone */}
        {renderSection(
          'Account',
          renderSettingItem(
            'trash',
            'Reset All Data',
            'Clear all whispers, discoveries, and start fresh',
            handleResetData,
            undefined,
            true
          )
        )}

        {/* App Info */}
        <View style={{
          backgroundColor: '#f9fafb',
          marginHorizontal: 16,
          marginBottom: 32,
          borderRadius: 16,
          padding: 16
        }}>
          <Text style={{
            textAlign: 'center',
            fontSize: 14,
            color: '#6b7280',
            marginBottom: 8
          }}>
            Whisper Walls v1.0.0
          </Text>
          <Text style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#9ca3af',
            lineHeight: 18
          }}>
            Made with ❤️ for anonymous emotional connection.{'\n'}
            Your whispers are stored anonymously and cannot be traced back to you.
          </Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </LinearGradient>
  );
}