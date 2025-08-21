const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Simple logger helper
const log = (...args) => console.log('[server]', ...args);

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for Render deployment
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Capture raw request body so we can log it if JSON parsing fails (useful for debugging)
app.use(express.json({
  verify: (req, res, buf) => {
    try {
      req.rawBody = buf && buf.toString ? buf.toString() : '';
    } catch (e) {
      req.rawBody = '';
    }
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  log(`--> ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    try { log('    body:', JSON.stringify(req.body)); } catch (e) { log('    body: [unserializable]'); }
  }
  next();
});

// JSON parse error handler (must appear after body parsing)
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    log('JSON parse error on request', req.method, req.url);
    log('Raw body:', req.rawBody || '[empty]');
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  next(err);
});

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/whisper-walls';
log('Attempting MongoDB connection to', mongoUri);
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).catch(err => {
  console.error('[mongo] initial connect error:', err && err.message ? err.message : err);
});

// Connection event handlers for richer logging
mongoose.connection.on('connected', () => log('MongoDB connected'));
mongoose.connection.on('error', (err) => console.error('[mongo] connection error:', err));
mongoose.connection.on('disconnected', () => log('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => log('MongoDB reconnected'));

// Whisper Schema
const whisperSchema = new mongoose.Schema({
  text: { type: String, required: true, maxLength: 280 },
  tone: { 
    type: String, 
    required: true, 
    enum: ['Joy', 'Longing', 'Gratitude', 'Apology', 'Heartbreak'] 
  },
  // Store location as GeoJSON Point for proper geospatial queries
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    // [longitude, latitude]
    coordinates: {
      type: [Number],
      required: true
    }
  },
  // Backwards-compatible short location fields (optional)
  lat: { type: Number },
  lng: { type: Number },
  whyHere: { type: String, maxLength: 150 },
  sessionId: { type: String, required: true },
  reactions: [{
    type: { type: String, enum: ['hug'], default: 'hug' },
    sessionId: String,
    createdAt: { type: Date, default: Date.now }
  }],
  discoveredBy: [String],
  unlockConditions: {
    proximityRequired: { type: Number, default: 100 }, // meters
    dwellTime: { type: Number, default: 60 }, // seconds
    timeDelay: Number // optional delay in minutes
  },
  createdAt: { type: Date, default: Date.now }
});

// Add geospatial index
whisperSchema.index({ location: '2dsphere' });

const Whisper = mongoose.model('Whisper', whisperSchema);

// User Schema for authentication and profile management
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  
  // Profile information
  displayName: { type: String, trim: true },
  bio: { type: String, maxLength: 200 },
  
  // User's whisper references (for profile display)
  createdWhispers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Whisper' 
  }],
  
  // User's interactions
  discoveredWhispers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Whisper' 
  }],
  
  // Session management for anonymous posting
  currentSessionId: { type: String },
  
  // Statistics
  stats: {
    whispersCreated: { type: Number, default: 0 },
    whispersDiscovered: { type: Number, default: 0 },
    reactionsGiven: { type: Number, default: 0 },
    reactionsReceived: { type: Number, default: 0 }
  },
  
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Optional authentication middleware (allows both authenticated and anonymous users)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// Routes

// ========== AUTHENTICATION ROUTES ==========

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    log('POST /api/auth/register - registering new user');
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      username,
      email,
      passwordHash,
      displayName: displayName || username,
      currentSessionId: uuidv4()
    });

    await user.save();
    log('  user created successfully');

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        sessionId: user.currentSessionId,
        stats: user.stats
      },
      token
    });

  } catch (error) {
    log('  registration error:', error.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    log('POST /api/auth/login - user login');
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last active time and generate new session if needed
    user.lastActiveAt = new Date();
    if (!user.currentSessionId) {
      user.currentSessionId = uuidv4();
    }
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    log('  user logged in successfully');
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        sessionId: user.currentSessionId,
        stats: user.stats
      },
      token
    });

  } catch (error) {
    log('  login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('createdWhispers', 'text tone createdAt reactions')
      .select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        sessionId: user.currentSessionId,
        stats: user.stats,
        createdWhispers: user.createdWhispers,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    log('  profile fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Generate anonymous session
app.post('/api/auth/anonymous-session', (req, res) => {
  const sessionId = uuidv4();
  log('Generated anonymous session:', sessionId);
  res.json({ sessionId });
});

// ========== WHISPER ROUTES ==========

// Create a new whisper (supports both authenticated and anonymous users)
app.post('/api/whispers', optionalAuth, async (req, res) => {
  try {
    log('POST /api/whispers - creating whisper');
    const { text, tone, location, whyHere, sessionId } = req.body;

    if (!text || !tone || !location || !sessionId) {
      log('  validation failed: missing fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (text.length > 280) {
      log('  validation failed: text too long');
      return res.status(400).json({ error: 'Text too long' });
    }

    // Ensure we store a GeoJSON Point for geospatial queries. Accept either
    // { latitude, longitude } or { type: 'Point', coordinates: [lng, lat] }
    let geoLocation;
    if (location.type === 'Point' && Array.isArray(location.coordinates)) {
      geoLocation = location;
    } else if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
      geoLocation = { type: 'Point', coordinates: [location.longitude, location.latitude] };
    } else {
      log('  invalid location format:', location);
      return res.status(400).json({ error: 'Invalid location format' });
    }

    const whisper = new Whisper({
      text,
      tone,
      // keep original small location field for backwards compatibility
      // and add geo location for queries
      location: geoLocation,
      whyHere,
      sessionId,
      reactions: [],
      discoveredBy: []
    });

    const savedWhisper = await whisper.save();
    
    // If user is authenticated, link whisper to their profile
    if (req.user) {
      try {
        const user = await User.findById(req.user.userId);
        if (user) {
          user.createdWhispers.push(savedWhisper._id);
          user.stats.whispersCreated += 1;
          await user.save();
          log(`  linked whisper to user ${user.username}`);
        }
      } catch (userError) {
        log('  failed to link whisper to user:', userError.message);
        // Don't fail the whisper creation if user linking fails
      }
    }

    log('Whisper created:', savedWhisper._id ? savedWhisper._id.toString() : savedWhisper);
    // Extra explicit log required for debugging frontend invokes
    log('Whisper created in here', savedWhisper._id ? savedWhisper._id.toString() : savedWhisper);
    res.status(201).json(savedWhisper);
  } catch (error) {
    console.error('[api] Create whisper error:', error && error.message ? error.message : error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to create sample whispers
app.post('/api/test/create-sample-whispers', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    
    log(`POST /api/test/create-sample-whispers - lat=${lat} lng=${lng}`);
    
    // Create some test whispers around the given coordinates
    const sampleWhispers = [
      {
        text: 'This is a test whisper to verify the map is working!',
        tone: 'Joy',
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng) + 0.001, parseFloat(lat) + 0.001]
        },
        whyHere: 'Testing the map functionality',
        sessionId: 'test_session_1',
        createdAt: new Date(),
        reactions: [],
        discoveredBy: []
      },
      {
        text: 'Another test whisper nearby - swipe to see more!',
        tone: 'Gratitude',
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng) - 0.001, parseFloat(lat) - 0.001]
        },
        whyHere: 'Testing the modal functionality',
        sessionId: 'test_session_2',
        createdAt: new Date(),
        reactions: [],
        discoveredBy: []
      },
      {
        text: 'Third test whisper - this should be swipeable too!',
        tone: 'Apology',
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng) + 0.002, parseFloat(lat) - 0.002]
        },
        whyHere: 'Testing swipe navigation',
        sessionId: 'test_session_3',
        createdAt: new Date(),
        reactions: [],
        discoveredBy: []
      }
    ];
    
    const savedWhispers = await Whisper.insertMany(sampleWhispers);
    log(`  created ${savedWhispers.length} sample whispers`);
    
    res.json({ 
      success: true, 
      message: `Created ${savedWhispers.length} sample whispers`,
      whispers: savedWhispers 
    });
  } catch (error) {
    console.error('[api] Create sample whispers error:', error && error.message ? error.message : error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get nearby whispers
app.get('/api/whispers/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    log(`GET /api/whispers/nearby - lat=${lat} lng=${lng} radius=${radius}`);

    const whispers = await Whisper.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    }).sort({ createdAt: -1 }).limit(50);

    log(`  found ${whispers.length} whispers nearby`);
    res.json(whispers);
  } catch (error) {
    console.error('[api] Get nearby whispers error:', error && error.message ? error.message : error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's whispers
app.get('/api/whispers/user/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const whispers = await Whisper.find({ sessionId }).sort({ createdAt: -1 });
    res.json(whispers);
  } catch (error) {
    console.error('Get user whispers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get discovered whispers
app.get('/api/whispers/discovered/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const whispers = await Whisper.find({ 
      discoveredBy: sessionId 
    }).sort({ createdAt: -1 });
    res.json(whispers);
  } catch (error) {
    console.error('Get discovered whispers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark whisper as discovered
app.post('/api/whispers/:id/discover', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;
    log(`POST /api/whispers/${id}/discover - sessionId=${sessionId}`);

    const whisper = await Whisper.findById(id);
    if (!whisper) {
      log(`  whisper ${id} not found`);
      return res.status(404).json({ error: 'Whisper not found' });
    }
    
    if (!whisper.discoveredBy.includes(sessionId)) {
      whisper.discoveredBy.push(sessionId);
      await whisper.save();
    }
    // If an authenticated user is present, link discovery to their profile and increment stats
    if (req.user) {
      try {
        const user = await User.findById(req.user.userId);
        if (user) {
          const already = user.discoveredWhispers.find(w => String(w) === String(whisper._id));
          if (!already) {
            user.discoveredWhispers.push(whisper._id);
            user.stats.whispersDiscovered += 1;
            await user.save();
            log(`  linked discovery to user ${user.username}`);
          }
        }
      } catch (userErr) {
        log('  failed to link discovery to user:', userErr && userErr.message ? userErr.message : userErr);
      }
    }
    log(`  whisper ${id} marked discovered by ${sessionId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('[api] Mark as discovered error:', error && error.message ? error.message : error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add reaction to whisper
app.post('/api/whispers/:id/react', async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, type = 'hug' } = req.body;
    log(`POST /api/whispers/${id}/react - sessionId=${sessionId} type=${type}`);

    const whisper = await Whisper.findById(id);
    if (!whisper) {
      log(`  whisper ${id} not found`);
      return res.status(404).json({ error: 'Whisper not found' });
    }
    
    // Check if user already reacted
    const existingReaction = whisper.reactions.find(r => r.sessionId === sessionId);
    if (existingReaction) {
      log(`  session ${sessionId} already reacted`);
      return res.status(400).json({ error: 'Already reacted to this whisper' });
    }
    
    whisper.reactions.push({ type, sessionId });
    await whisper.save();
    log(`  reaction added to whisper ${id} by ${sessionId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('[api] Add reaction error:', error && error.message ? error.message : error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server and log startup status
const server = app.listen(PORT, () => {
  log(`Whisper Walls backend running on port ${PORT}`);
  try {
    const addr = server.address();
    if (addr) {
      // addr.address may be '::' or '0.0.0.0' when listening on all interfaces
      log(`Server listening on ${addr.address}:${addr.port}`);
    }
  } catch (e) {
    // ignore
  }

  if (mongoose.connection.readyState === 1) {
    log('MongoDB readyState = connected');
  } else {
    log('MongoDB readyState =', mongoose.connection.readyState);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('SIGINT received - closing MongoDB connection');
  mongoose.connection.close(() => {
    log('MongoDB connection closed');
    process.exit(0);
  });
});