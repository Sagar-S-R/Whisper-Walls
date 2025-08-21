import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { session, clearSession } = useSession();
  const { user, isAuthenticated, logout } = useAuth();
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
              {user?.username || 'Anonymous Explorer'}
            </Text>
            {user?.displayName && (
              <Text style={{
                fontSize: 16,
                color: '#6b7280',
                marginTop: 4
              }}>
                {user.displayName}
              </Text>
            )}
            <Text style={{
              fontSize: 14,
              color: '#6b7280',
              marginTop: 8,
              textAlign: 'center'
            }}>
              Anonymous ID: {session.anonymousId.substring(0, 8)}...
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#9ca3af',
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 16
            }}>
              {isAuthenticated ? 
                'Your whispers remain completely anonymous.\nOnly you can see your username in settings.' :
                'You are browsing anonymously.\nSign up to save your preferences and discoveries.'
              }
            </Text>
          </View>
        </View>

        {/* User Details - Only show if authenticated */}
        {isAuthenticated && user && (
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
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: 12
            }}>
              Account Details
            </Text>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>Username</Text>
              <Text style={{ fontSize: 16, color: '#1f2937', fontWeight: '500' }}>{user.username}</Text>
            </View>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>Email</Text>
              <Text style={{ fontSize: 16, color: '#1f2937', fontWeight: '500' }}>{user.email}</Text>
            </View>
            {user.displayName && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: '#6b7280' }}>Display Name</Text>
                <Text style={{ fontSize: 16, color: '#1f2937', fontWeight: '500' }}>{user.displayName}</Text>
              </View>
            )}
            <View>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>Member Since</Text>
              <Text style={{ fontSize: 16, color: '#1f2937', fontWeight: '500' }}>
                {new Date(session.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

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

        {/* Account */}
        {renderSection(
          'Account',
          <>
            {isAuthenticated ? (
              <>
                {renderSettingItem(
                  'log-out',
                  'Logout',
                  'Clear your session and log out of Whisper Walls',
                  () => {
                    Alert.alert(
                      'Logout',
                      'Are you sure you want to log out?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Logout',
                          style: 'destructive',
                          onPress: () => {
                            logout();
                            router.replace('/(onboarding)');
                          },
                        },
                      ]
                    );
                  }
                )}
                <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />
              </>
            ) : (
              <>
                {renderSettingItem(
                  'person-add',
                  'Sign Up',
                  'Create an account to save your preferences and discoveries',
                  () => router.push('/(onboarding)/register')
                )}
                <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />
                {renderSettingItem(
                  'log-in',
                  'Sign In',
                  'Log in to your existing account',
                  () => router.push('/(onboarding)/login')
                )}
                <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />
              </>
            )}
            {renderSettingItem(
              'trash',
              'Reset All Data',
              'Clear all whispers, discoveries, and start fresh',
              handleResetData,
              undefined,
              true
            )}
          </>
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
            Made with ❤️ for emotional connection.{'\n'}
            Your profile is visible in settings, but all whispers remain completely anonymous and cannot be traced back to you.
          </Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </LinearGradient>
  );
}