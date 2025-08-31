import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const success = await register(username, email, password, displayName);
      if (success) {
        Alert.alert('Success', 'Account created! Please login.');
      }
      // Don't show error alert here - AuthContext already handles specific error messages
    } catch (err) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#ec4899', marginBottom: 24 }}>Register</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ width: 280, padding: 12, borderWidth: 1, borderColor: '#ec4899', borderRadius: 8, marginBottom: 12 }}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ width: 280, padding: 12, borderWidth: 1, borderColor: '#ec4899', borderRadius: 8, marginBottom: 12 }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Display Name (optional)"
        value={displayName}
        onChangeText={setDisplayName}
        style={{ width: 280, padding: 12, borderWidth: 1, borderColor: '#ec4899', borderRadius: 8, marginBottom: 12 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={{ width: 280, padding: 12, borderWidth: 1, borderColor: '#ec4899', borderRadius: 8, marginBottom: 24 }}
        secureTextEntry
      />
      <TouchableOpacity
        style={{ backgroundColor: '#ec4899', padding: 14, borderRadius: 8, width: 280, alignItems: 'center' }}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{loading ? 'Registering...' : 'Register'}</Text>
      </TouchableOpacity>
  <TouchableOpacity onPress={() => router.push('/(onboarding)/login')} style={{ marginTop: 18 }}>
        <Text style={{ color: '#8b5cf6', fontWeight: '600' }}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}
