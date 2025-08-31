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
  // Store creator's user ID if they're authenticated
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
  
  // Statistics - Updated to use likesReceived instead of reactionsReceived
  stats: {
    whispersCreated: { type: Number, default: 0 },
    whispersDiscovered: { type: Number, default: 0 },
    reactionsGiven: { type: Number, default: 0 },
    likesReceived: { type: Number, default: 0 } // Changed from reactionsReceived
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

// Helper function to update user's likes received count
const updateUserLikesReceived = async (userId) => {
  try {
    if (!userId) return;
    
    // Get all whispers created by this user
    const userWhispers = await Whisper.find({ creatorId: userId });
    
    // Calculate total likes received
    const totalLikes = userWhispers.reduce((sum, whisper) => {
      return sum + (whisper.reactions?.length || 0);
    }, 0);
    
    // Update user stats
    await User.findByIdAndUpdate(userId, {
      'stats.likesReceived': totalLikes
    });
    
    log(`Updated user ${userId} likes received: ${totalLikes}`);
  } catch (error) {
    log('Error updating user likes received:', error.message);
  }
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

    // Recalculate likes received to ensure accuracy
    await updateUserLikesReceived(user._id);
    
    // Fetch updated user with new stats
    const updatedUser = await User.findById(req.user.userId)
      .populate('createdWhispers', 'text tone createdAt reactions')
      .select('-passwordHash');

    res.json({
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        sessionId: updatedUser.currentSessionId,
        stats: updatedUser.stats,
        createdWhispers: updatedUser.createdWhispers,
        createdAt: updatedUser.createdAt
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

    const whisperData = {
      text,
      tone,
      location: geoLocation,
      whyHere,
      sessionId,
      reactions: [],
      discoveredBy: []
    };

    // If user is authenticated, add creatorId
    if (req.user) {
      whisperData.creatorId = req.user.userId;
    }

    const whisper = new Whisper(whisperData);
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

// index.js (Backend)

// Delete user account
app.delete('/api/user/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    log(`DELETE /api/user/${id}`);

    // Verify user exists
    const user = await User.findById(id);
    if (!user) {
      log(`  user ${id} not found`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user-related data (excluding anonymous whispers)
    await User.deleteOne({ _id: id });
    
    // Delete user preferences and history if collections exist
    try {
      const db = mongoose.connection.db;
      if (db) {
        await db.collection('user_preferences').deleteMany({ user_id: id });
        await db.collection('user_history').deleteMany({ user_id: id });
      }
    } catch (collectionError) {
      // Collections might not exist, continue with user deletion
      log('  Note: user_preferences or user_history collections not found, skipping');
    }

    log(`  user ${id} deleted successfully`);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset user data (delete whispers and clear discoveries)
app.post('/api/user/:id/reset', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    log(`POST /api/user/${id}/reset`);

    // Verify user exists
    const user = await User.findById(id);
    if (!user) {
      log(`  user ${id} not found`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all whisper IDs that need to be deleted
    const whisperIdsToDelete = [...user.createdWhispers];

    // Delete all whispers created by this user from the database
    if (whisperIdsToDelete.length > 0) {
      const deleteResult = await Whisper.deleteMany({ _id: { $in: whisperIdsToDelete } });
      log(`  deleted ${deleteResult.deletedCount} created whispers from database`);
    }

    // Also delete any whispers that have this user's creatorId (in case they weren't linked to profile)
    const creatorDeleteResult = await Whisper.deleteMany({ creatorId: id });
    log(`  deleted ${creatorDeleteResult.deletedCount} whispers by creatorId from database`);

    // Clear user's whispers and discoveries arrays and reset stats
    await User.findByIdAndUpdate(id, {
      $set: {
        createdWhispers: [],
        discoveredWhispers: [],
        stats: {
          whispersCreated: 0,
          whispersDiscovered: 0,
          reactionsGiven: 0,
          likesReceived: 0
        }
      }
    });

    log(`  user ${id} data reset successfully - whispers deleted from database`);
    res.status(200).json({ message: 'User data reset successfully' });
  } catch (error) {
    console.error('Reset user data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's whispers - For authenticated users, returns ALL whispers from their account
app.get('/api/whispers/user/:sessionId', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    log(`GET /api/whispers/user/${sessionId}`);

    let whispers = [];

    // If user is authenticated, get ALL whispers from their account (ignore sessionId)
    if (req.user) {
      try {
        const user = await User.findById(req.user.userId).populate('createdWhispers');
        if (user) {
          whispers = user.createdWhispers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          log(`  found ${whispers.length} whispers from user profile array`);

          // If no whispers in profile array, also search by creatorId (fallback for unlinked whispers)
          if (whispers.length === 0) {
            const unlinkedWhispers = await Whisper.find({ creatorId: req.user.userId }).sort({ createdAt: -1 });
            if (unlinkedWhispers.length > 0) {
              whispers = unlinkedWhispers;
              log(`  found ${whispers.length} unlinked whispers by creatorId`);

              // Optionally re-link them to the user's profile
              try {
                await User.findByIdAndUpdate(req.user.userId, {
                  $push: { createdWhispers: { $each: unlinkedWhispers.map(w => w._id) } }
                });
                log(`  re-linked ${unlinkedWhispers.length} whispers to user profile`);
              } catch (linkError) {
                log('  failed to re-link whispers:', linkError.message);
              }
            }
          }
        } else {
          log(`  authenticated user not found`);
        }
      } catch (userError) {
        log('  error fetching authenticated user whispers:', userError.message);
      }
    } else {
      // Anonymous user - lookup by sessionId
      whispers = await Whisper.find({ sessionId }).sort({ createdAt: -1 });
      log(`  found ${whispers.length} whispers for anonymous user`);
    }

    res.json(whispers);
  } catch (error) {
    console.error('Get user whispers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get discovered whispers - For authenticated users, returns ALL discovered whispers from their account
app.get('/api/whispers/discovered/:sessionId', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    log(`GET /api/whispers/discovered/${sessionId}`);
    
    let whispers = [];
    
    // If user is authenticated, get ALL discoveries from their account (ignore sessionId)
    if (req.user) {
      try {
        const user = await User.findById(req.user.userId).populate('discoveredWhispers');
        if (user) {
          whispers = user.discoveredWhispers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          log(`  found ${whispers.length} discovered whispers from user profile array`);

          // If no discoveries in profile array, also search by discoveredBy array (fallback)
          if (whispers.length === 0) {
            const unlinkedDiscoveries = await Whisper.find({ discoveredBy: req.user.userId.toString() }).sort({ createdAt: -1 });
            if (unlinkedDiscoveries.length > 0) {
              whispers = unlinkedDiscoveries;
              log(`  found ${whispers.length} unlinked discoveries by discoveredBy`);

              // Optionally re-link them to the user's profile
              try {
                await User.findByIdAndUpdate(req.user.userId, {
                  $push: { discoveredWhispers: { $each: unlinkedDiscoveries.map(w => w._id) } }
                });
                log(`  re-linked ${unlinkedDiscoveries.length} discoveries to user profile`);
              } catch (linkError) {
                log('  failed to re-link discoveries:', linkError.message);
              }
            }
          }
        } else {
          log(`  authenticated user not found`);
        }
      } catch (userError) {
        log('  error fetching authenticated user discoveries:', userError.message);
      }
    } else {
      // Anonymous user - lookup by sessionId
      whispers = await Whisper.find({ discoveredBy: sessionId }).sort({ createdAt: -1 });
      log(`  found ${whispers.length} discovered whispers for anonymous user`);
    }
    
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

// Add reaction to whisper - Updated to recalculate likes received
app.post('/api/whispers/:id/react', optionalAuth, async (req, res) => {
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
    
    // Update the creator's likes received count if they're an authenticated user
    if (whisper.creatorId) {
      await updateUserLikesReceived(whisper.creatorId);
    }
    
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
  log(`Auris backend running on port ${PORT}`);
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
