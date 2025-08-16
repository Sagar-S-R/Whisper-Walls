# Whisper Walls - Location-Based Social App

A romantic, ritual-driven platform where users leave anonymous emotional messages tied to specific locations.

## Features

### Core Functionality
- **Anonymous Messaging**: Leave emotional whispers at meaningful locations without revealing your identity
- **Location-Based Discovery**: Find whispers left by others near your current location
- **Proximity Unlocking**: Get close to whisper pins and dwell for 60-180 seconds to unlock messages
- **Emotional Categorization**: Whispers are categorized by tone (Joy, Longing, Gratitude, Apology, Heartbreak)
- **Gentle Mode**: Muted aesthetics for sensitive times like breakups

### User Experience
- **Poetic Onboarding**: Beautiful welcome flow with fade-in animations and tutorials
- **Dynamic Map**: Real-time map with clustered whisper pins and time-based color themes
- **Micro-Interactions**: Smooth animations including tap-to-unfold cards and ripple effects
- **Multi-Step Creation**: Intuitive whisper creation workflow with text, tone, and location context
- **Personal History**: Track your created whispers and discoveries

### Technical Features
- **Offline Capability**: View previously discovered whispers without internet
- **Push Notifications**: Get notified about new discoveries and reactions
- **Geospatial Indexing**: Efficient location-based queries with MongoDB
- **Session-Based Auth**: Anonymous user identification without accounts
- **Real-time Updates**: Live map updates and reaction notifications

## Tech Stack

### Frontend
- **React Native** with Expo SDK 53
- **NativeWind** for Tailwind CSS styling
- **React Native Reanimated** for smooth animations
- **React Native Maps** for interactive mapping
- **Lottie** for complex animations
- **AsyncStorage** for local data persistence

### Backend
- **Node.js** with Express.js REST API
- **MongoDB** with Mongoose ODM
- **Geospatial Indexing** for location queries
- **CORS** enabled for cross-origin requests

## Installation & Deployment

### For Development (Local)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd whisper-walls-bolt
   ```

2. **Setup Frontend**
   ```bash
   npm install
   cp .env.example .env
   # Edit .env and set your local IP address
   npx expo start
   ```

3. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB connection
   npm start
   ```

### For Production (Shared with Friends)

1. **Deploy Backend** (Render/Railway/Vercel)
   - Create MongoDB Atlas cluster
   - Deploy server/ folder to cloud platform
   - Set environment variables:
     - `MONGODB_URI`: Your Atlas connection string
     - `PORT`: 3000 (or platform default)

2. **Build Mobile App**
   ```bash
   # Set production API URL
   echo "EXPO_PUBLIC_API_URL=https://your-backend-url.com/api" > .env
   
   # Build for production
   npx expo build:android  # or build:ios
   ```

3. **Share with Friends**
   - Send them the APK file, or
   - Publish to Expo: `npx expo publish`
   - They scan QR code with Expo Go app

### Environment Variables

**Frontend (.env)**
```
EXPO_PUBLIC_API_URL=https://your-backend-url.com/api
```

**Backend (server/.env)**
```
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/whisper-walls
```

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to server directory:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB URI:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/whisper-walls
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

## Development

### Project Structure
```
/
├── app/                    # Expo Router pages
│   ├── (onboarding)/      # Welcome flow
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── contexts/              # React contexts
├── services/              # API services
├── types/                 # TypeScript types
├── server/                # Backend API
└── README.md
```

### Key Components
- **SessionContext**: Anonymous user session management
- **LocationContext**: GPS location handling
- **WhisperService**: API communication layer
- **WhisperModal**: Animated whisper display
- **FloatingActionButton**: Creation trigger

## Database Schema

### Whisper Document
```javascript
{
  text: String,              // The whisper content (max 280 chars)
  tone: String,              // Emotional category
  location: {                // GPS coordinates
    latitude: Number,
    longitude: Number
  },
  whyHere: String,           // Optional context (max 150 chars)
  sessionId: String,         // Anonymous user identifier
  reactions: [{              // User reactions
    type: String,            // Currently only "hug"
    sessionId: String,
    createdAt: Date
  }],
  discoveredBy: [String],    // Session IDs who found this
  unlockConditions: {        // Discovery requirements
    proximityRequired: Number,
    dwellTime: Number,
    timeDelay: Number
  },
  createdAt: Date
}
```

## API Endpoints

### Whispers
- `POST /api/whispers` - Create a new whisper
- `GET /api/whispers/nearby` - Get whispers near coordinates
- `GET /api/whispers/user/:sessionId` - Get user's whispers
- `GET /api/whispers/discovered/:sessionId` - Get discovered whispers
- `POST /api/whispers/:id/discover` - Mark whisper as discovered
- `POST /api/whispers/:id/react` - Add reaction to whisper

### Utility
- `GET /api/health` - Health check endpoint

## Deployment

### Frontend (Expo)
1. Build for production:
   ```bash
   expo build:web
   ```

2. Deploy to Expo hosting or your preferred platform

### Backend
1. Set up MongoDB (MongoDB Atlas recommended)
2. Deploy to Heroku, Railway, or your preferred platform
3. Update environment variables for production

## Privacy & Security

- **Anonymous by Design**: No user accounts or personal data collection
- **Session-Based**: Temporary anonymous identifiers for functionality
- **Location Privacy**: Coordinates stored for functionality, not tracking
- **No Message Attribution**: Whispers cannot be traced back to creators
- **Data Minimization**: Only essential data is collected and stored

## Contributing

This is a demonstration project built for showcasing React Native and location-based app development. The code is provided as-is for educational purposes.

## License

MIT License - feel free to use this code for learning and development.

---

*"In every corner of this world, there are untold stories waiting to be whispered, and hearts ready to listen."*