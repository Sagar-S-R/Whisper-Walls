import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { session, clearSession } = useSession();
  const { user, isAuthenticated, logout, checkAuth } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [breakupMode, setBreakupMode] = useState(false);
  const [proximityRadius, setProximityRadius] = useState(100);

  // Add these functions to your SettingsScreen component:

  const handleDeleteAccount = async () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to delete an account.');
      return;
    }

    Alert.alert(
      'Final Confirmation',
      'Are you absolutely sure you want to delete your account?\n\nThis will:\n• Delete your account permanently\n• Remove all your personal data\n• Keep your anonymous whispers for others to discover\n• Log you out immediately',
      [
        { text: 'Keep Account', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
            onPress: async () => {
            try {
              // Get stored auth data
              const authDataStr = await AsyncStorage.getItem('whisper_auth');
              if (!authDataStr || !user) {
                throw new Error('No auth data found');
              }
              const authData = JSON.parse(authDataStr);
              const token = authData.token;

              // Call API to delete the account
              const res = await fetch(`${API_BASE_URL}/user/${user.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!res.ok) {
                throw new Error('Failed to delete account');
              }

              // Clear local data in both storages and reset session
              await clearAllAppData();
              clearSession();
              await logout();

                Alert.alert(
                  'Account Deleted',
                  'Your account has been permanently deleted. Thank you for using Auris.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(onboarding)')
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert(
                'Error',
                'Failed to delete account. Please try again or contact support.'
              );
            }
          },
        },
      ]
    );
  };

  const handleDataUsage = () => {
    Alert.alert(
      'Data Usage Information',
      'Auris collects minimal data:\n\n• Anonymous session IDs\n• Approximate location for discoveries\n• App usage patterns\n• Optional account details\n\nAll whispers remain completely anonymous and cannot be traced back to you.',
      [{ text: 'Got it' }]
    );
  };

  // Enhanced export data function
  const handleExportData = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Export Data',
        'Sign in to export your account data, or use "Reset All Data" to clear anonymous session data.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Export Your Data',
      'We\'ll prepare a complete export of your data including:\n\n• Account information\n• Your whispers (you created)\n• Discovery history\n• App preferences\n\nThis may take a few minutes. You\'ll receive an email when ready.',
      [
        { text: 'Cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              // Here you would call your API to initiate data export
              // await requestDataExport(user.id);

              Alert.alert(
                'Export Requested',
                'Your data export has been requested. You\'ll receive an email at ' + user?.email + ' when it\'s ready (usually within 24 hours).'
              );
            } catch (error) {
              console.error('Error requesting export:', error);
              Alert.alert(
                'Error',
                'Failed to request data export. Please try again or contact support.'
              );
            }
          }
        },
      ]
    );
  };
  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will clear all your whispers, discoveries, and local settings. You will stay logged in and can continue using the app with a fresh start. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isAuthenticated && user) {
                // Reset user data on server
                const authDataStr = await AsyncStorage.getItem('whisper_auth');
                if (authDataStr) {
                  const authData = JSON.parse(authDataStr);
                  const token = authData.token;
                  
                  const resetResponse = await fetch(`${API_BASE_URL}/user/${user.id}/reset`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });

                  if (resetResponse.ok) {
                    // Update cached user data with reset values
                    const updatedUser = { ...user, createdWhispers: [], discoveredWhispers: [] };
                    const updatedAuthData = {
                      token: authData.token,
                      user: updatedUser,
                      timestamp: Date.now()
                    };
                    await AsyncStorage.setItem('whisper_auth', JSON.stringify(updatedAuthData));
                    
                    // Refresh the authentication state to update the context
                    await checkAuth();
                  }
                }
              }
              
              // Don't clear all app data - just reset user whispers on server
              // await clearAllAppData();
              // clearSession();
              // Don't logout - keep user logged in
              // await logout(); // Removed - user stays logged in
              
              Alert.alert(
                'Data Reset Complete',
                'Your data has been reset successfully. Let\'s get you started with a quick tutorial.',
                [
                  {
                    text: 'Ok',
                    onPress: () => router.replace('/(onboarding)/tutorial')
                  }
                ]
              );
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Clear known app keys from both AsyncStorage and browser localStorage
  const clearAllAppData = async () => {
    const keys = [
      'whisper_auth',
      'whisper_token',
      'whisper_user',
      'whisper_session',
      'whisper_walls_mock_data',
      'has_completed_onboarding'
    ];

    console.log('Clearing all app data from localStorage and AsyncStorage');
    try {
      console.log('Attempting to clear localStorage keys');
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        console.log('localStorage is available');
        for (const k of keys) {
          window.localStorage.removeItem(k);
          console.log(`Removed ${k} from localStorage`);
        }
      } else {
        console.warn('localStorage is not available');
      }
    } catch (e) {
      console.error('Error clearing localStorage keys:', e);
    }

    try {
      await AsyncStorage.multiRemove(keys);
      console.log('Removed keys from AsyncStorage:', keys);
    } catch (e) {
      console.error('Error clearing AsyncStorage keys:', e);
    }
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
              () => { },
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
              () => { },
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
              () => router.push('/(settings)/privacy-policy') // Navigate to privacy policy screen
            )}
            <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />
            {renderSettingItem(
              'document-text',
              'Terms of Service',
              'Read our terms and conditions',
              () => router.push('/(settings)/terms-of-service')
            )}
            <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />
            {renderSettingItem(
              'information-circle',
              'Data Usage',
              'See what data we collect and why',
              () => router.push('/(settings)/data-usage')
            )}
            <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />
            {renderSettingItem(
              'download',
              'Export Data',
              'Download your whispers and discovery history',
              handleExportData
            )}
            <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />
            {renderSettingItem(
              'trash-bin',
              'Delete Account',
              'Permanently remove your account and data',
              () => {
                Alert.alert(
                  'Delete Account',
                  'This will permanently delete your account and all associated data. This action cannot be undone.\n\nYour anonymous whispers will remain in the app for other users to discover, but they can never be traced back to you.',

                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete Account',
                      style: 'destructive',
                      onPress: () => handleDeleteAccount(),
                    },
                  ]
                );
              },
              undefined,
              true
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
              'Learn how to use Auris',
              () => router.push('/(onboarding)/tutorial')
            )}
            <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />
            {renderSettingItem(
              'mail',
              'Contact Support',
              'Get help or share feedback',
              () => Alert.alert('Contact Support', 'Please email contact.auris@gmail.com')
            )}
            <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />
            {renderSettingItem(
              'star',
              'Rate the App',
              'Share your experience on the App Store',
              () => Alert.alert('Rate', 'Thank you for wanting to rate the app!')
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
                  'Clear your session and log out of Auris',
                  () => {
                    Alert.alert(
                      'Logout',
                      'Are you sure you want to log out?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Logout',
                          style: 'destructive',
                          onPress: async () => {
                                      try {
                                        // Ensure both storages are cleared and session reset before navigating
                                        await clearAllAppData();
                                        clearSession();
                                        await logout();
                                        router.replace('/(onboarding)');
                                      } catch (e) {
                                        console.error('Logout error from settings:', e);
                                      }
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
            Auris v1.0.1
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