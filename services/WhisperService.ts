import { Whisper, CreateWhisperData } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';

console.log('[WhisperService] Using API_BASE_URL =', API_BASE_URL);

const MOCK_DATA_KEY = 'whisper_walls_mock_data';

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const token = await AsyncStorage.getItem('whisper_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {}
  return {};
}

class WhisperServiceClass {
  private mockWhispers: Whisper[] = [];

  constructor() {
    this.initializeMockData();
  }

  private async initializeMockData() {
    try {
      const stored = await AsyncStorage.getItem(MOCK_DATA_KEY);
      if (stored) {
        this.mockWhispers = JSON.parse(stored);
      } else {
        // Initialize with default San Francisco coordinates
        this.mockWhispers = this.getInitialMockWhispers(37.78825, -122.4324);
        await this.saveMockData();
      }
    } catch (error) {
      console.error('Error initializing mock data:', error);
      this.mockWhispers = this.getInitialMockWhispers(37.78825, -122.4324);
    }
  }

  private async saveMockData() {
    try {
      await AsyncStorage.setItem(MOCK_DATA_KEY, JSON.stringify(this.mockWhispers));
    } catch (error) {
      console.error('Error saving mock data:', error);
    }
  }

  // Normalize whisper coming from API (GeoJSON Point -> { latitude, longitude })
  private normalizeWhisper(raw: any): Whisper {
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (raw?.location?.type === 'Point' && Array.isArray(raw.location.coordinates)) {
      // GeoJSON is [lng, lat]
      longitude = raw.location.coordinates[0];
      latitude = raw.location.coordinates[1];
    } else if (raw?.location && typeof raw.location.latitude === 'number' && typeof raw.location.longitude === 'number') {
      latitude = raw.location.latitude;
      longitude = raw.location.longitude;
    }

    return {
      _id: String(raw._id),
      text: raw.text,
      tone: raw.tone,
      location: {
        latitude: latitude as any,
        longitude: longitude as any,
      },
      whyHere: raw.whyHere,
      sessionId: raw.sessionId,
      createdAt: raw.createdAt,
      reactions: raw.reactions,
      discoveredBy: raw.discoveredBy,
      unlockConditions: raw.unlockConditions,
    };
  }

  async createWhisper(whisperData: CreateWhisperData): Promise<Whisper> {
    try {
      // Log the target URL for easier debugging when requests fail
      const targetUrl = `${API_BASE_URL}/whispers`;
      console.log('[WhisperService] POST ->', targetUrl, whisperData);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify(whisperData),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to create whisper: ${response.status} ${text}`);
      }

      const raw = await response.json();
      return this.normalizeWhisper(raw);
    } catch (error) {
      const errAny: any = error;
      console.error('[WhisperService] createWhisper error:', errAny && (errAny.message || errAny));
      
      // Optional fallback to mock data for local/offline development
      if (process.env.EXPO_USE_MOCK_DATA === '1') {
        console.log('[WhisperService] Using mock data for create whisper (EXPO_USE_MOCK_DATA=1)');
        return this.createMockWhisper(whisperData);
      }

      // Re-throw so callers (UI) can detect and show errors
      throw error;
    }
  }

  async getNearbyWhispers(latitude: number, longitude: number, radius: number): Promise<Whisper[]> {
    try {
      const targetUrl = `${API_BASE_URL}/whispers/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`;
      
      const headers = await getAuthHeaders();
      
      const response = await fetch(targetUrl, { headers });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to fetch nearby whispers: ${response.status} ${text}`);
      }

      const raws = await response.json();
      const whispers = Array.isArray(raws) ? raws.map(w => this.normalizeWhisper(w)) : [];
      return whispers;
    } catch (error) {
      const errAny: any = error;
      console.error('[WhisperService] getNearbyWhispers error:', errAny && (errAny.message || errAny));
      
      // Optional fallback to mock data for local/offline development
      if (process.env.EXPO_USE_MOCK_DATA === '1') {
        return this.getMockWhispers(latitude, longitude);
      }
      
      // For now, return empty array instead of mock data so we can see the real error
      return [];
    }
  }

  async getUserWhispers(sessionId: string): Promise<Whisper[]> {
    try {
      const targetUrl = `${API_BASE_URL}/whispers/user/${sessionId}`;
      console.log('[WhisperService] GET user whispers ->', targetUrl);
      
      const response = await fetch(targetUrl, { headers: { ...(await getAuthHeaders()) } });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to fetch user whispers: ${response.status} ${text}`);
      }

      const raws = await response.json();
      const whispers = Array.isArray(raws) ? raws.map(w => this.normalizeWhisper(w)) : [];
      console.log('[WhisperService] Found', whispers.length, 'user whispers');
      return whispers;
    } catch (error) {
      const errAny: any = error;
      console.error('[WhisperService] getUserWhispers error:', errAny && (errAny.message || errAny));
      
      if (process.env.EXPO_USE_MOCK_DATA === '1') {
        console.log('[WhisperService] Using mock data for user whispers (EXPO_USE_MOCK_DATA=1)');
        return this.mockWhispers.filter(w => w.sessionId === sessionId);
      }
      
      console.log('[WhisperService] Returning empty array due to fetch error');
      return [];
    }
  }

  async getProfile(): Promise<any> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/auth/profile`, { headers });
    if (!response.ok) {
      const t = await response.text().catch(() => '');
      throw new Error(`Failed to fetch profile: ${response.status} ${t}`);
    }
    return await response.json();
  }

  async getDiscoveredWhispers(sessionId: string): Promise<Whisper[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/whispers/discovered/${sessionId}`, { headers: { ...(await getAuthHeaders()) } });

      if (!response.ok) {
        throw new Error('Failed to fetch discovered whispers');
      }

      const raws = await response.json();
      return Array.isArray(raws) ? raws.map(w => this.normalizeWhisper(w)) : [];
    } catch (error) {
      console.log('Using mock data for discovered whispers');
      return this.mockWhispers.filter(w => w.discoveredBy?.includes(sessionId));
    }
  }

  async markAsDiscovered(whisperId: string, sessionId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/whispers/${whisperId}/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ sessionId }),
      });
    } catch (error) {
      console.log('Using mock data for mark as discovered');
      const whisper = this.mockWhispers.find(w => w._id === whisperId);
      if (whisper && !whisper.discoveredBy?.includes(sessionId)) {
        whisper.discoveredBy = [...(whisper.discoveredBy || []), sessionId];
        await this.saveMockData();
      }
    }
  }

  async addReaction(whisperId: string, sessionId: string, type: 'hug'): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/whispers/${whisperId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ sessionId, type }),
      });
    } catch (error) {
      console.log('Using mock data for add reaction');
      const whisper = this.mockWhispers.find(w => w._id === whisperId);
      if (whisper) {
        const existingReaction = whisper.reactions?.find(r => r.sessionId === sessionId);
        if (!existingReaction) {
          whisper.reactions = [
            ...(whisper.reactions || []),
            { type, sessionId, createdAt: new Date().toISOString() }
          ];
          await this.saveMockData();
        }
      }
    }
  }

  // Mock data for development
  private createMockWhisper(data: CreateWhisperData): Whisper {
    const newWhisper: Whisper = {
      _id: 'mock_' + Date.now(),
      text: data.text,
      tone: data.tone as any,
      location: data.location,
      whyHere: data.whyHere,
      sessionId: data.sessionId,
      createdAt: new Date().toISOString(),
      reactions: [],
      discoveredBy: [],
    };
    
    this.mockWhispers.push(newWhisper);
    this.saveMockData();
    return newWhisper;
  }

  private getMockWhispers(centerLat: number, centerLng: number): Whisper[] {
    // If we don't have mock data, generate some
    if (this.mockWhispers.length === 0) {
      this.mockWhispers = this.getInitialMockWhispers(centerLat, centerLng);
      this.saveMockData();
    }
    return this.mockWhispers;
  }

  private getInitialMockWhispers(centerLat: number = 37.78825, centerLng: number = -122.4324): Whisper[] {
    const mockWhispers: Whisper[] = [
      {
        _id: 'mock1',
        text: 'I walked past this coffee shop every day for three years before finally going in. Now it\'s my favorite place in the world.',
        tone: 'Joy',
        location: {
          latitude: centerLat + (Math.random() - 0.5) * 0.01,
          longitude: centerLng + (Math.random() - 0.5) * 0.01,
        },
        whyHere: 'This coffee shop changed my daily routine',
        sessionId: 'mock_session',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        reactions: [{ type: 'hug', sessionId: 'other', createdAt: new Date().toISOString() }],
        discoveredBy: [],
      },
      {
        _id: 'mock2',
        text: 'To the person I hurt with my words: I\'m sorry. I was scared and I took it out on you. You deserved so much better.',
        tone: 'Apology',
        location: {
          latitude: centerLat + (Math.random() - 0.5) * 0.01,
          longitude: centerLng + (Math.random() - 0.5) * 0.01,
        },
        whyHere: 'We had our last conversation here',
        sessionId: 'mock_session2',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        reactions: [],
        discoveredBy: [],
      },
      {
        _id: 'mock3',
        text: 'Thank you to the stranger who helped me carry my groceries when my bag broke. Small kindnesses save entire days.',
        tone: 'Gratitude',
        location: {
          latitude: centerLat + (Math.random() - 0.5) * 0.01,
          longitude: centerLng + (Math.random() - 0.5) * 0.01,
        },
        sessionId: 'mock_session3',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        reactions: [
          { type: 'hug', sessionId: 'other1', createdAt: new Date().toISOString() },
          { type: 'hug', sessionId: 'other2', createdAt: new Date().toISOString() },
        ],
        discoveredBy: [],
      },
      {
        _id: 'mock4',
        text: 'I miss how we used to sit here and watch the sunset together. Everything feels different now.',
        tone: 'Longing',
        location: {
          latitude: centerLat + (Math.random() - 0.5) * 0.01,
          longitude: centerLng + (Math.random() - 0.5) * 0.01,
        },
        whyHere: 'Our favorite sunset spot',
        sessionId: 'mock_session4',
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        reactions: [],
        discoveredBy: [],
      },
      {
        _id: 'mock5',
        text: 'The flowers we planted together bloomed beautifully this spring. I wish you could see them.',
        tone: 'Heartbreak',
        location: {
          latitude: centerLat + (Math.random() - 0.5) * 0.01,
          longitude: centerLng + (Math.random() - 0.5) * 0.01,
        },
        whyHere: 'Our garden',
        sessionId: 'mock_session5',
        createdAt: new Date(Date.now() - 432000000).toISOString(),
        reactions: [{ type: 'hug', sessionId: 'other3', createdAt: new Date().toISOString() }],
        discoveredBy: [],
      },
    ];

    return mockWhispers;
  }
}

export const WhisperService = new WhisperServiceClass();