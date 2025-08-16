const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/whisper-walls';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Whisper Schema
const whisperSchema = new mongoose.Schema({
  text: { type: String, required: true, maxLength: 280 },
  tone: { 
    type: String, 
    required: true, 
    enum: ['Joy', 'Longing', 'Gratitude', 'Apology', 'Heartbreak'] 
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
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
whisperSchema.index({ "location": "2dsphere" });

const Whisper = mongoose.model('Whisper', whisperSchema);

// Routes

// Create a new whisper
app.post('/api/whispers', async (req, res) => {
  try {
    const { text, tone, location, whyHere, sessionId } = req.body;
    
    if (!text || !tone || !location || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (text.length > 280) {
      return res.status(400).json({ error: 'Text too long' });
    }
    
    const whisper = new Whisper({
      text,
      tone,
      location,
      whyHere,
      sessionId,
      reactions: [],
      discoveredBy: []
    });
    
    const savedWhisper = await whisper.save();
    res.status(201).json(savedWhisper);
  } catch (error) {
    console.error('Create whisper error:', error);
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
    
    res.json(whispers);
  } catch (error) {
    console.error('Get nearby whispers error:', error);
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
app.post('/api/whispers/:id/discover', async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;
    
    const whisper = await Whisper.findById(id);
    if (!whisper) {
      return res.status(404).json({ error: 'Whisper not found' });
    }
    
    if (!whisper.discoveredBy.includes(sessionId)) {
      whisper.discoveredBy.push(sessionId);
      await whisper.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark as discovered error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add reaction to whisper
app.post('/api/whispers/:id/react', async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, type = 'hug' } = req.body;
    
    const whisper = await Whisper.findById(id);
    if (!whisper) {
      return res.status(404).json({ error: 'Whisper not found' });
    }
    
    // Check if user already reacted
    const existingReaction = whisper.reactions.find(r => r.sessionId === sessionId);
    if (existingReaction) {
      return res.status(400).json({ error: 'Already reacted to this whisper' });
    }
    
    whisper.reactions.push({ type, sessionId });
    await whisper.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Whisper Walls backend running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});