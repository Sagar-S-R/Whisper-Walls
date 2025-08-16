export interface Whisper {
  _id: string;
  text: string;
  tone: 'Joy' | 'Longing' | 'Gratitude' | 'Apology' | 'Heartbreak';
  location: {
    latitude: number;
    longitude: number;
  };
  whyHere?: string;
  sessionId: string;
  createdAt: string;
  reactions?: Reaction[];
  discoveredBy?: string[];
  unlockConditions?: {
    proximityRequired: number;
    dwellTime: number;
    timeDelay?: number;
  };
}

export interface Reaction {
  type: 'hug';
  sessionId: string;
  createdAt: string;
}

export interface CreateWhisperData {
  text: string;
  tone: string;
  location: {
    latitude: number;
    longitude: number;
  };
  whyHere?: string;
  sessionId: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
}