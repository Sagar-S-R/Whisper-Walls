import { Platform } from 'react-native';

// API Configuration
export const API_CONFIG = {
  // For development - local server
  LOCAL: 'https://whisper-walls-back.onrender.com/api',
  
  // For physical devices - replace with your computer's IP address
  DEVICE: 'https://whisper-walls-back.onrender.com/api', // Your computer's IP address
  
  // For production
  PRODUCTION: 'https://whisper-walls-back.onrender.com/api'
};

// Get the appropriate API URL based on environment
export const getApiUrl = (): string => {
  // Check if we're in development mode
  if (__DEV__) {
    // For Android devices, use the DEVICE URL
    // For web/emulator, use LOCAL
    if (Platform.OS === 'android') {
      return API_CONFIG.DEVICE;
    }
    return API_CONFIG.LOCAL;
  }
  
  // Production
  return API_CONFIG.PRODUCTION;
};

// Export the current API URL
export const API_BASE_URL = getApiUrl();
