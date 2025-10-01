const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://gamepro_db_user:PwNiJGMwNyX9L1Aw@gamepro.jhvzauc.mongodb.net/gamepro_db?retryWrites=true&w=majority';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();
// Schemas
const gameproUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'simpleuser'], default: 'simpleuser' },
  profilePicture: { type: String, default: '' },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Postback schema
const postbackSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  offer_id: { type: String, required: true },
  offer_name: { type: String, default: '' },
  payout: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  ip_address: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
  conversion_id: { type: String, default: '' },
  click_id: { type: String, default: '' },
  sub_id: { type: String, default: '' },
  source: { type: String, default: '' },
  country: { type: String, default: '' },
  device_type: { type: String, default: '' },
  browser: { type: String, default: '' },
  os: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  processed: { type: Boolean, default: false },
  processed_at: { type: Date },
  error_message: { type: String, default: '' },
  raw_data: { type: mongoose.Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// User Activity schema
const userActivitySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  activityType: { type: String, required: true }, // 'offer_completion', 'survey_completion', 'referral', etc.
  description: { type: String, required: true },
  pointsEarned: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

// Offer Log schema
const offerLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  offerName: { type: String, required: true },
  offerUrl: { type: String, default: '' },
  offerPartner: { type: String, default: '' },
  rewardAmount: { type: Number, default: 0 },
  clickedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  completionTime: { type: Number, default: 0 }, // in seconds
  status: { type: String, enum: ['clicked', 'completed', 'abandoned'], default: 'clicked' },
  userIP: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

// Create models
const GameProUser = mongoose.model('GameProUser', gameproUserSchema);
const Postback = mongoose.model('Postback', postbackSchema);
const UserActivity = mongoose.model('UserActivity', userActivitySchema);
const OfferLog = mongoose.model('OfferLog', offerLogSchema);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'gamepro_secret_key_2024';

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000',
      'https://localhost:3001'
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API endpoint working', timestamp: new Date().toISOString() });
});

// Server info endpoint
app.get('/api/server-info', (req, res) => {
  res.json({
    message: 'Server is running with MongoDB integration',
    timestamp: new Date().toISOString(),
    version: '2.0-mongodb'
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await GameProUser.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ User logged in:', username);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profilePicture: user.profilePicture,
        points: user.points,
        level: user.level
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, fullName, role = 'simpleuser' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const existingUser = await GameProUser.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new GameProUser({
      username,
      email,
      password: hashedPassword,
      fullName,
      role,
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || username)}&background=random&color=fff&size=100`
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ New user registered:', username, 'Role:', role);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        profilePicture: newUser.profilePicture,
        points: newUser.points,
        level: newUser.level
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Verify JWT token endpoint
app.post('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const user = await GameProUser.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profilePicture: user.profilePicture,
        points: user.points,
        level: user.level
      }
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await GameProUser.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profilePicture: user.profilePicture,
        points: user.points,
        level: user.level,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
});

// Update user profile
app.put('/api/auth/update-profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, email, profilePicture } = req.body;
    const userId = req.user.userId;

    console.log('🔄 Profile update request for user:', req.user.username);
    console.log('🔄 Update data:', { fullName, email, profilePicture });

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    updateData.updatedAt = new Date();

    const updatedUser = await GameProUser.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Profile updated successfully for user:', updatedUser.username);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
        points: updatedUser.points,
        level: updatedUser.level,
        isActive: updatedUser.isActive,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

// Get user statistics
app.get('/api/auth/user-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await GameProUser.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedOffers = await UserActivity.countDocuments({
      userId: userId,
      activityType: 'offer_completed',
      status: 'completed'
    });

    const totalEarnings = await UserActivity.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          activityType: 'earning',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const recentEarnings = await UserActivity.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          activityType: 'earning',
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const referrals = await UserReferral.countDocuments({
      referrerId: userId,
      status: { $in: ['active', 'completed'] }
    });

    const stats = {
      totalEarnings: user.points || (totalEarnings[0]?.total || 0),
      completedOffers: completedOffers,
      usersReferred: referrals,
      earningsLast30Days: recentEarnings[0]?.total || 0
    };

    console.log('✅ User stats retrieved for:', user.username, stats);

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics', details: error.message });
  }
});

// Complete offer endpoint - automatically updates points
app.post('/api/auth/complete-offer', authenticateToken, async (req, res) => {
  try {
    const { offerName, offerPartner, amount, metadata } = req.body;
    const userId = req.user.userId;

    console.log('🎯 Offer completion request:', { offerName, offerPartner, amount, userId });

    // Create offer completion activity
    const offerActivity = new UserActivity({
      userId: userId,
      activityType: 'offer_completed',
      offerName: offerName,
      offerPartner: offerPartner,
      amount: amount || 0,
      status: 'completed',
      metadata: metadata,
      completedAt: new Date()
    });

    await offerActivity.save();

    // Create earning activity
    if (amount && amount > 0) {
      const earningActivity = new UserActivity({
        userId: userId,
        activityType: 'earning',
        offerName: offerName,
        offerPartner: offerPartner,
        amount: amount,
        status: 'completed',
        metadata: metadata,
        completedAt: new Date()
      });

      await earningActivity.save();

      // Update user points
      const user = await GameProUser.findById(userId);
      if (user) {
        user.points = (user.points || 0) + amount;
        user.updatedAt = new Date();
        await user.save();
        console.log(`✅ User ${user.username} earned ${amount} points. Total: ${user.points}`);
      }
    }

    res.json({
      success: true,
      message: 'Offer completed successfully',
      pointsEarned: amount || 0,
      activities: [offerActivity._id]
    });

  } catch (error) {
    console.error('❌ Error completing offer:', error);
    res.status(500).json({ error: 'Failed to complete offer', details: error.message });
  }
});

// Create sample activities for testing
app.post('/api/auth/create-sample-activities', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('📊 Creating sample activities for user:', req.user.username);

    const sampleActivities = [
      {
        userId: userId,
        activityType: 'offer_completed',
        offerName: 'Survey Completion',
        offerPartner: 'SurveyMonkey',
        amount: 50,
        status: 'completed',
        completedAt: new Date()
      },
      {
        userId: userId,
        activityType: 'earning',
        offerName: 'Survey Completion',
        offerPartner: 'SurveyMonkey',
        amount: 50,
        status: 'completed',
        completedAt: new Date()
      },
      {
        userId: userId,
        activityType: 'offer_completed',
        offerName: 'App Download',
        offerPartner: 'GameHub',
        amount: 100,
        status: 'completed',
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        userId: userId,
        activityType: 'earning',
        offerName: 'App Download',
        offerPartner: 'GameHub',
        amount: 100,
        status: 'completed',
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];

    const createdActivities = await UserActivity.insertMany(sampleActivities);

    // Update user points
    const totalEarnings = sampleActivities
      .filter(a => a.activityType === 'earning')
      .reduce((sum, a) => sum + a.amount, 0);

    const user = await GameProUser.findById(userId);
    if (user) {
      user.points = (user.points || 0) + totalEarnings;
      user.updatedAt = new Date();
      await user.save();
    }

    console.log('✅ Sample activities created:', createdActivities.length);

    res.json({
      success: true,
      message: 'Sample activities created successfully',
      activitiesCreated: createdActivities.length,
      pointsAdded: totalEarnings
    });

  } catch (error) {
    console.error('❌ Error creating sample activities:', error);
    res.status(500).json({ error: 'Failed to create sample activities', details: error.message });
  }
});

// Upload avatar endpoint
app.post('/api/auth/upload-avatar', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const profilePictureUrl = `/uploads/${req.file.filename}`;

    const updatedUser = await GameProUser.findByIdAndUpdate(
      userId,
      { profilePicture: profilePictureUrl, updatedAt: new Date() },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Avatar uploaded for user:', updatedUser.username);

    res.json({
      message: 'Avatar uploaded successfully',
      profilePicture: profilePictureUrl,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
        points: updatedUser.points,
        level: updatedUser.level
      }
    });

  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar', details: error.message });
  }
});

// ===== GAMES AND SURVEYS ENDPOINTS =====

// Get games/offers endpoint
app.get('/api/games', async (req, res) => {
  try {
    // Return sample games/offers data
    const sampleGames = [
      {
        id: 'game1',
        title: 'Water Color Sort',
        type: 'offers',
        genre: 'Puzzle',
        rating: 4.5,
        reward: 14.41,
        partner: 'Gaming Co',
        image: 'https://placehold.co/120x80/4CAF50/FFFFFF?text=WCS',
        link: 'https://example.com/water-color-sort',
        description: 'Sort colored water in tubes to complete levels'
      },
      {
        id: 'game2',
        title: 'Grand Hotel Mania',
        type: 'offers',
        genre: 'Simulation',
        rating: 4.2,
        reward: 5.89,
        partner: 'Hotel Games',
        image: 'https://placehold.co/120x80/FF9800/FFFFFF?text=GHM',
        link: 'https://example.com/grand-hotel-mania',
        description: 'Manage your own hotel empire'
      },
      {
        id: 'game3',
        title: 'Colorwood Sort',
        type: 'offers',
        genre: 'Puzzle',
        rating: 4.3,
        reward: 6.02,
        partner: 'Puzzle Inc',
        image: 'https://placehold.co/120x80/9C27B0/FFFFFF?text=CWS',
        link: 'https://example.com/colorwood-sort',
        description: 'Sort wooden blocks by color'
      },
      {
        id: 'game4',
        title: 'Multi Color Water',
        type: 'offers',
        genre: 'Puzzle',
        rating: 4.7,
        reward: 17.81,
        partner: 'Water Games',
        image: 'https://placehold.co/120x80/2196F3/FFFFFF?text=MCW',
        link: 'https://example.com/multi-color-water',
        description: 'Mix and sort colorful water'
      },
      {
        id: 'game5',
        title: 'North Tower',
        type: 'offers',
        genre: 'Strategy',
        rating: 4.1,
        reward: 3.73,
        partner: 'Tower Games',
        image: 'https://placehold.co/120x80/607D8B/FFFFFF?text=NT',
        link: 'https://example.com/north-tower',
        description: 'Build and defend your tower'
      }
    ];

    res.json(sampleGames);
  } catch (error) {
    console.error('❌ Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games', details: error.message });
  }
});

// Get active surveys endpoint
app.get('/api/surveys/active', async (req, res) => {
  try {
    // Read surveys from survey_links.json (created by Dashboard)
    const fs = require('fs').promises;
    const path = require('path');
    const surveyLinksFile = path.join(__dirname, 'survey_links.json');
    
    let surveyLinks = [];
    try {
      const data = await fs.readFile(surveyLinksFile, 'utf8');
      surveyLinks = JSON.parse(data);
    } catch (error) {
      console.log('No survey_links.json found, using empty array');
      surveyLinks = [];
    }
    
    // Filter only active surveys and convert to home page format
    const activeSurveys = surveyLinks
      .filter(survey => survey.status === 'Active')
      .map(survey => ({
        id: survey.id,
        title: survey.name,
        type: 'surveys',
        shortTitle: survey.name.length > 15 ? survey.name.substring(0, 15) + '...' : survey.name,
        description: survey.content || `Complete this survey to earn $${survey.payout}`,
        fullDescription: survey.content || `This survey offers a reward of $${survey.payout}. Complete all sections to earn your reward.`,
        completionSteps: ['Click "Start Survey"', 'Complete all sections', 'Submit'],
        estimatedTime: Math.max(5, Math.floor(survey.payout / 2)), // Estimate time based on payout
        reward: survey.payout,
        partner: 'Survey Provider',
        image: `https://placehold.co/120x80/4CAF50/FFFFFF?text=${survey.name.substring(0, 3).toUpperCase()}`,
        link: survey.link,
        category: survey.section || 'general',
        country: survey.country || '',
        isRecommended: survey.isRecommended || false,
        createdAt: survey.createdAt,
        updatedAt: survey.updatedAt
      }));

    console.log(`📊 Loaded ${activeSurveys.length} active surveys from survey_links.json`);
    res.json(activeSurveys);
  } catch (error) {
    console.error('❌ Error fetching surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys', details: error.message });
  }
});

// ===== SURVEY MANAGEMENT ENDPOINTS (for Dashboard) =====

// Helper functions for survey links
const fs = require('fs').promises;

async function loadSurveyLinks() {
  try {
    const surveyLinksFile = path.join(__dirname, 'survey_links.json');
    const data = await fs.readFile(surveyLinksFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveSurveyLinks(links) {
  try {
    const surveyLinksFile = path.join(__dirname, 'survey_links.json');
    await fs.writeFile(surveyLinksFile, JSON.stringify(links, null, 2));
  } catch (error) {
    console.error('Error saving survey links:', error);
    throw error;
  }
}

// Get all survey links (for Dashboard)
app.get('/api/survey-links', async (req, res) => {
  try {
    const links = await loadSurveyLinks();
    res.json(links);
  } catch (error) {
    console.error('Error loading survey links:', error);
    res.status(500).json({ error: 'Failed to load survey links' });
  }
});

// Create a new survey link (for Dashboard)
app.post('/api/survey-links', async (req, res) => {
  try {
    console.log('Survey Link POST request body:', req.body);
    const { 
      name, payout, link, linkOfferId, linkKeys, providerId, 
      redirectLink, country, isRecommended, content, status, section 
    } = req.body;

    if (!name || !payout || !link) {
      return res.status(400).json({ 
        error: 'Name, Payout, and Link are required' 
      });
    }

    const links = await loadSurveyLinks();
    const newLink = {
      id: uuidv4(),
      name,
      payout: parseFloat(payout),
      link,
      linkOfferId: linkOfferId || '',
      linkKeys: linkKeys || '',
      providerId: providerId || '',
      redirectLink: redirectLink || '',
      country: country || '',
      isRecommended: isRecommended === 'true' || isRecommended === true,
      content: content || '',
      status: status || 'Active',
      section: section || 'Featured Surveys',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    links.push(newLink);
    await saveSurveyLinks(links);
    
    console.log(`✅ Created new survey link: ${newLink.name} - $${newLink.payout}`);
    res.status(201).json(newLink);
  } catch (error) {
    console.error('Error creating survey link:', error);
    res.status(500).json({ error: 'Failed to create survey link' });
  }
});

// Update a survey link (for Dashboard)
app.put('/api/survey-links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, payout, link, linkOfferId, linkKeys, providerId, 
      redirectLink, country, isRecommended, content, status, section 
    } = req.body;

    if (!name || !payout || !link) {
      return res.status(400).json({ error: 'Name, Payout, and Link are required' });
    }

    const links = await loadSurveyLinks();
    const linkIndex = links.findIndex(l => l.id === id);
    
    if (linkIndex === -1) {
      return res.status(404).json({ error: 'Survey link not found' });
    }

    links[linkIndex] = {
      ...links[linkIndex],
      name,
      payout: parseFloat(payout),
      link,
      linkOfferId: linkOfferId || '',
      linkKeys: linkKeys || '',
      providerId: providerId || '',
      redirectLink: redirectLink || '',
      country: country || '',
      isRecommended: isRecommended === 'true' || isRecommended === true,
      content: content || '',
      status: status || 'Active',
      section: section || links[linkIndex].section || 'Featured Surveys',
      updatedAt: new Date().toISOString()
    };

    await saveSurveyLinks(links);
    
    console.log(`✅ Updated survey link: ${links[linkIndex].name} - $${links[linkIndex].payout}`);
    res.json(links[linkIndex]);
  } catch (error) {
    console.error('Error updating survey link:', error);
    res.status(500).json({ error: 'Failed to update survey link' });
  }
});

// Delete a survey link (for Dashboard)
app.delete('/api/survey-links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const links = await loadSurveyLinks();
    const filteredLinks = links.filter(l => l.id !== id);
    
    if (filteredLinks.length === links.length) {
      return res.status(404).json({ error: 'Survey link not found' });
    }

    await saveSurveyLinks(filteredLinks);
    
    console.log(`✅ Deleted survey link with ID: ${id}`);
    res.json({ message: 'Survey link deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey link:', error);
    res.status(500).json({ error: 'Failed to delete survey link' });
  }
});

// ===== SURVEY COMPLETION TRACKING =====

// Complete survey and update user profile
app.post('/api/survey/complete', authenticateToken, async (req, res) => {
  try {
    const { surveyId, surveyName, surveyPayout, completionData } = req.body;
    const userId = req.user.userId;

    // Get user info
    const user = await GameProUser.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the survey in survey_links.json to get details
    const surveyLinks = await loadSurveyLinks();
    const survey = surveyLinks.find(s => s.id === surveyId);
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Update user points
    const pointsEarned = parseFloat(survey.payout);
    user.points = (user.points || 0) + pointsEarned;
    
    // Update level based on points (every 100 points = 1 level)
    user.level = Math.floor(user.points / 100) + 1;
    
    await user.save();

    // Create UserActivity record for tracking
    const userActivity = new UserActivity({
      userId: userId,
      username: user.username,
      activityType: 'survey_completion',
      description: `Completed survey: ${survey.name}`,
      pointsEarned: pointsEarned,
      metadata: {
        surveyId: survey.id,
        surveyName: survey.name,
        surveySection: survey.section,
        surveyCountry: survey.country,
        completionData: completionData || {},
        completedAt: new Date()
      },
      createdAt: new Date()
    });

    await userActivity.save();

    // Update or create OfferLog for survey tracking
    const offerLog = new OfferLog({
      userId: userId,
      username: user.username,
      offerName: survey.name,
      offerUrl: survey.link,
      offerPartner: 'Survey Provider',
      rewardAmount: pointsEarned,
      clickedAt: new Date(), // Assume clicked when completed
      completedAt: new Date(),
      completionTime: 0, // Survey completion time not tracked separately
      status: 'completed',
      userIP: req.ip || req.connection.remoteAddress || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown',
      metadata: {
        type: 'survey',
        section: survey.section,
        country: survey.country,
        browser: req.headers['user-agent'] ? req.headers['user-agent'].split(' ')[0] : 'Unknown',
        device: req.headers['user-agent'] && req.headers['user-agent'].includes('Mobile') ? 'Mobile' : 'Desktop'
      }
    });

    await offerLog.save();

    console.log(`✅ Survey completed: ${user.username} earned $${pointsEarned} from "${survey.name}"`);

    res.json({
      success: true,
      message: 'Survey completed successfully',
      pointsEarned: pointsEarned,
      totalPoints: user.points,
      newLevel: user.level,
      surveyName: survey.name,
      user: {
        id: user._id,
        username: user.username,
        points: user.points,
        level: user.level
      }
    });

  } catch (error) {
    console.error('❌ Error completing survey:', error);
    res.status(500).json({ error: 'Failed to complete survey', details: error.message });
  }
});

// Get user's survey completion history
app.get('/api/survey/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get survey activities from UserActivity
    const surveyActivities = await UserActivity.find({
      userId: userId,
      activityType: 'survey_completion'
    }).sort({ createdAt: -1 }).limit(50);

    // Get survey logs from OfferLog
    const surveyLogs = await OfferLog.find({
      userId: userId,
      'metadata.type': 'survey'
    }).sort({ completedAt: -1 }).limit(50);

    res.json({
      success: true,
      activities: surveyActivities,
      logs: surveyLogs,
      totalSurveysCompleted: surveyActivities.length,
      totalPointsFromSurveys: surveyActivities.reduce((sum, activity) => sum + activity.pointsEarned, 0)
    });

  } catch (error) {
    console.error('❌ Error fetching survey history:', error);
    res.status(500).json({ error: 'Failed to fetch survey history', details: error.message });
  }
});

// ===== POSTBACK ENDPOINTS =====

// Receive postback (webhook endpoint for external services)
app.post('/api/postback', async (req, res) => {
  try {
    console.log('📥 Received postback:', req.body);
    
    const {
      user_id,
      offer_id,
      offer_name,
      payout,
      currency = 'USD',
      status = 'completed',
      conversion_id,
      click_id,
      sub_id,
      source
    } = req.body;

    if (!user_id || !offer_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id and offer_id' 
      });
    }

    // Create postback record
    const postback = new Postback({
      user_id,
      offer_id,
      offer_name: offer_name || `Offer ${offer_id}`,
      payout: parseFloat(payout) || 0,
      currency,
      status,
      conversion_id: conversion_id || '',
      click_id: click_id || '',
      sub_id: sub_id || '',
      source: source || 'external',
      ip_address: req.ip || req.connection.remoteAddress || 'Unknown',
      device_type: req.headers['user-agent'] && req.headers['user-agent'].includes('Mobile') ? 'Mobile' : 'Desktop',
      browser: req.headers['user-agent'] ? req.headers['user-agent'].split(' ')[0] : 'Unknown',
      raw_data: req.body,
      processed: false
    });

    await postback.save();

    // If status is completed, process the completion
    if (status === 'completed' && payout > 0) {
      await processPostbackCompletion(postback);
    }

    console.log(`✅ Postback saved: ${user_id} - ${offer_name} - $${payout}`);
    res.json({ 
      success: true, 
      message: 'Postback received successfully',
      postback_id: postback._id
    });

  } catch (error) {
    console.error('❌ Error processing postback:', error);
    res.status(500).json({ error: 'Failed to process postback', details: error.message });
  }
});

// Get received postbacks (for admin dashboard)
app.get('/api/received-postbacks', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    const user_id = req.query.user_id;
    const processed = req.query.processed;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (user_id) filter.user_id = user_id;
    if (processed !== undefined) filter.processed = processed === 'true';

    // Get postbacks with pagination
    const postbacks = await Postback.find(filter)
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalPostbacks = await Postback.countDocuments(filter);

    // Get statistics
    const stats = {
      totalPostbacks: await Postback.countDocuments(),
      completedPostbacks: await Postback.countDocuments({ status: 'completed' }),
      pendingPostbacks: await Postback.countDocuments({ status: 'pending' }),
      processedPostbacks: await Postback.countDocuments({ processed: true }),
      totalPayout: await Postback.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$payout' } } }
      ]).then(result => result[0]?.total || 0)
    };

    res.json({
      success: true,
      postbacks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPostbacks / limit),
        totalPostbacks,
        limit
      },
      statistics: stats
    });

  } catch (error) {
    console.error('❌ Error fetching postbacks:', error);
    res.status(500).json({ error: 'Failed to fetch postbacks', details: error.message });
  }
});

// Process postback completion (internal function)
async function processPostbackCompletion(postback) {
  try {
    console.log(`🔄 Processing completion for postback: ${postback.user_id} - ${postback.offer_name}`);

    // Find user by user_id (could be username or MongoDB _id)
    let user = await GameProUser.findById(postback.user_id);
    if (!user) {
      user = await GameProUser.findOne({ username: postback.user_id });
    }

    if (!user) {
      console.log(`⚠️ User not found for postback: ${postback.user_id}`);
      postback.processed = true;
      postback.processed_at = new Date();
      postback.error_message = 'User not found';
      await postback.save();
      return;
    }

    // Update user points
    const pointsEarned = parseFloat(postback.payout);
    user.points = (user.points || 0) + pointsEarned;
    user.level = Math.floor(user.points / 100) + 1;
    await user.save();

    // Create UserActivity record
    const userActivity = new UserActivity({
      userId: user._id.toString(),
      username: user.username,
      activityType: 'postback_completion',
      description: `Completed offer via postback: ${postback.offer_name}`,
      pointsEarned: pointsEarned,
      metadata: {
        postbackId: postback._id,
        offerId: postback.offer_id,
        offerName: postback.offer_name,
        conversionId: postback.conversion_id,
        clickId: postback.click_id,
        source: postback.source,
        completedAt: new Date()
      },
      createdAt: new Date()
    });

    await userActivity.save();

    // Update or create OfferLog
    let offerLog = await OfferLog.findOne({
      userId: user._id.toString(),
      offerName: postback.offer_name,
      status: { $in: ['clicked', 'pending'] }
    });

    if (offerLog) {
      // Update existing log
      offerLog.status = 'completed';
      offerLog.completedAt = new Date();
      offerLog.completionTime = Math.floor((new Date() - offerLog.clickedAt) / 1000);
      offerLog.rewardAmount = pointsEarned;
      offerLog.metadata = {
        ...offerLog.metadata,
        postbackId: postback._id,
        conversionId: postback.conversion_id,
        completionMethod: 'postback'
      };
      await offerLog.save();
    } else {
      // Create new log entry
      offerLog = new OfferLog({
        userId: user._id.toString(),
        username: user.username,
        offerName: postback.offer_name,
        offerUrl: '',
        offerPartner: postback.source || 'External Provider',
        rewardAmount: pointsEarned,
        clickedAt: postback.created_at,
        completedAt: new Date(),
        completionTime: 0,
        status: 'completed',
        userIP: postback.ip_address,
        userAgent: postback.browser,
        metadata: {
          type: 'postback_completion',
          postbackId: postback._id,
          offerId: postback.offer_id,
          conversionId: postback.conversion_id,
          clickId: postback.click_id,
          source: postback.source,
          device: postback.device_type,
          completionMethod: 'postback'
        }
      });
      await offerLog.save();
    }

    // Mark postback as processed
    postback.processed = true;
    postback.processed_at = new Date();
    await postback.save();

    console.log(`✅ Postback processed successfully: ${user.username} earned $${pointsEarned} from "${postback.offer_name}"`);

  } catch (error) {
    console.error('❌ Error processing postback completion:', error);
    
    // Mark postback as processed with error
    postback.processed = true;
    postback.processed_at = new Date();
    postback.error_message = error.message;
    await postback.save();
  }
}

// Create test postback (for testing)
app.post('/api/test-postback', async (req, res) => {
  try {
    const testPostback = {
      user_id: 'user', // Default test user
      offer_id: 'test_offer_' + Date.now(),
      offer_name: 'Test Survey Completion',
      payout: 25.50,
      currency: 'USD',
      status: 'completed',
      conversion_id: 'conv_' + Date.now(),
      click_id: 'click_' + Date.now(),
      source: 'test_system'
    };

    // Send postback to our own endpoint
    const response = await fetch(`http://localhost:${PORT}/api/postback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPostback)
    });

    const result = await response.json();

    res.json({
      success: true,
      message: 'Test postback created and processed',
      testPostback,
      result
    });

  } catch (error) {
    console.error('❌ Error creating test postback:', error);
    res.status(500).json({ error: 'Failed to create test postback', details: error.message });
  }
});

// ===== PARTNER MANAGEMENT ENDPOINTS =====

// Partner schema (for postback URL generation)
const partnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  postbackUrl: { type: String, default: '' },
  apiKey: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Partner = mongoose.model('Partner', partnerSchema);

// Get all partners
app.get('/api/partners', async (req, res) => {
  try {
    const partners = await Partner.find({}).sort({ createdAt: -1 });
    res.json(partners);
  } catch (error) {
    console.error('❌ Error fetching partners:', error);
    res.status(500).json({ error: 'Failed to fetch partners', details: error.message });
  }
});

// Create new partner
app.post('/api/partners', async (req, res) => {
  try {
    const { name, description, postbackUrl, apiKey } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Partner name is required' });
    }

    const partner = new Partner({
      name,
      description: description || '',
      postbackUrl: postbackUrl || '',
      apiKey: apiKey || '',
      isActive: true
    });

    await partner.save();
    
    console.log(`✅ Created new partner: ${partner.name}`);
    res.status(201).json(partner);
  } catch (error) {
    console.error('❌ Error creating partner:', error);
    res.status(500).json({ error: 'Failed to create partner', details: error.message });
  }
});

// Update partner
app.put('/api/partners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, postbackUrl, apiKey, isActive } = req.body;

    const partner = await Partner.findByIdAndUpdate(
      id,
      {
        name,
        description,
        postbackUrl,
        apiKey,
        isActive,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    console.log(`✅ Updated partner: ${partner.name}`);
    res.json(partner);
  } catch (error) {
    console.error('❌ Error updating partner:', error);
    res.status(500).json({ error: 'Failed to update partner', details: error.message });
  }
});

// Delete partner
app.delete('/api/partners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const partner = await Partner.findByIdAndDelete(id);

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    console.log(`✅ Deleted partner: ${partner.name}`);
    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting partner:', error);
    res.status(500).json({ error: 'Failed to delete partner', details: error.message });
  }
});

// Generate postback URL for partner
app.post('/api/partners/:id/generate-url', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, offerId, offerName, payout } = req.body;

    const partner = await Partner.findById(id);
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Generate unique postback URL
    const baseUrl = `${req.protocol}://${req.get('host')}/api/postback`;
    const postbackUrl = `${baseUrl}?user_id=${userId || '{user_id}'}&offer_id=${offerId || '{offer_id}'}&offer_name=${encodeURIComponent(offerName || '{offer_name}')}&payout=${payout || '{payout}'}&status=completed&partner=${partner.name}&source=${partner.name.toLowerCase().replace(/\s+/g, '_')}`;

    res.json({
      success: true,
      partner: partner.name,
      postbackUrl,
      testUrl: `${baseUrl}?user_id=test_user&offer_id=test_offer_${Date.now()}&offer_name=Test%20Offer&payout=10.50&status=completed&partner=${partner.name}&source=test`
    });
  } catch (error) {
    console.error('❌ Error generating postback URL:', error);
    res.status(500).json({ error: 'Failed to generate postback URL', details: error.message });
  }
});

// Test postback URL
app.post('/api/test-postback-url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Parse URL to extract parameters
    const urlObj = new URL(url);
    const params = Object.fromEntries(urlObj.searchParams);

    // Send postback to our own endpoint
    const response = await fetch(`http://localhost:${PORT}/api/postback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const result = await response.json();

    res.json({
      success: true,
      message: 'Postback URL tested successfully',
      testParams: params,
      postbackResult: result
    });

  } catch (error) {
    console.error('❌ Error testing postback URL:', error);
    res.status(500).json({ error: 'Failed to test postback URL', details: error.message });
  }
});

// Create sample partners for testing
app.post('/api/create-sample-partners', async (req, res) => {
  try {
    const samplePartners = [
      {
        name: 'Survey Provider A',
        description: 'Premium survey provider with high-quality surveys',
        postbackUrl: 'https://surveyprovider-a.com/postback',
        apiKey: 'spa_' + Date.now(),
        isActive: true
      },
      {
        name: 'Offer Wall Network',
        description: 'Multi-vertical offer wall with various offer types',
        postbackUrl: 'https://offerwall.net/callback',
        apiKey: 'own_' + Date.now(),
        isActive: true
      },
      {
        name: 'Gaming Rewards Hub',
        description: 'Gaming-focused rewards and achievements platform',
        postbackUrl: 'https://gamingrewards.io/webhook',
        apiKey: 'grh_' + Date.now(),
        isActive: true
      }
    ];

    const createdPartners = [];
    for (const partnerData of samplePartners) {
      // Check if partner already exists
      const existingPartner = await Partner.findOne({ name: partnerData.name });
      if (!existingPartner) {
        const partner = new Partner(partnerData);
        await partner.save();
        createdPartners.push(partner);
      }
    }

    console.log(`✅ Created ${createdPartners.length} sample partners`);
    res.json({
      success: true,
      message: `Created ${createdPartners.length} sample partners`,
      partners: createdPartners
    });

  } catch (error) {
    console.error('❌ Error creating sample partners:', error);
    res.status(500).json({ error: 'Failed to create sample partners', details: error.message });
  }
});

// ===== LEGACY ENDPOINTS (for backward compatibility) =====

// Legacy track-click endpoint (used by home.jsx)
app.post('/api/track-click', async (req, res) => {
  try {
    console.log('🎮 Legacy track-click called:', req.body);
    
    const { gameId, gameTitle, userId, page, timestamp } = req.body;
    
    // Simple response for game clicks (non-authenticated)
    res.json({
      success: true,
      message: 'Click tracked successfully',
      data: {
        gameId,
        gameTitle,
        userId,
        page,
        timestamp: timestamp || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in legacy track-click:', error);
    res.status(500).json({ error: 'Failed to track click', details: error.message });
  }
});

// ===== OFFER TRACKING ENDPOINTS =====

// Track offer click
app.post('/api/offer/track-click', authenticateToken, async (req, res) => {
  try {
    const { offerName, offerUrl, offerPartner, rewardAmount } = req.body;
    const userId = req.user.userId; // Fixed: use userId instead of id
    
    // Get user info
    const user = await GameProUser.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get request metadata
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const userIP = req.ip || req.connection.remoteAddress || 'Unknown';
    const referrer = req.headers.referer || 'Direct';

    // Create offer log entry
    const offerLog = new OfferLog({
      userId: userId,
      username: user.username,
      offerName: offerName,
      offerUrl: offerUrl,
      offerPartner: offerPartner || 'Unknown',
      rewardAmount: rewardAmount || 0,
      status: 'clicked',
      userIP: userIP,
      userAgent: userAgent,
      referrer: referrer,
      metadata: {
        source: 'web_app',
        device: getDeviceType(userAgent),
        browser: getBrowserName(userAgent),
        country: 'Unknown', // Could integrate with IP geolocation service
        sessionId: req.sessionID || ''
      }
    });

    await offerLog.save();

    res.json({
      success: true,
      message: 'Offer click tracked successfully',
      logId: offerLog._id,
      clickedAt: offerLog.clickedAt
    });

  } catch (error) {
    console.error('❌ Error tracking offer click:', error);
    res.status(500).json({ error: 'Failed to track offer click', details: error.message });
  }
});

// Complete offer (update existing log)
app.post('/api/offer/complete', authenticateToken, async (req, res) => {
  try {
    const { logId, offerName, offerPartner, amount } = req.body;
    const userId = req.user.userId; // Fixed: use userId instead of id

    let offerLog;

    if (logId) {
      // Update existing log
      offerLog = await OfferLog.findById(logId);
      if (!offerLog || offerLog.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Offer log not found' });
      }
    } else {
      // Find most recent clicked offer for this user
      offerLog = await OfferLog.findOne({
        userId: userId,
        offerName: offerName,
        status: 'clicked'
      }).sort({ clickedAt: -1 });

      if (!offerLog) {
        // Create new log if none found
        const user = await GameProUser.findById(userId);
        offerLog = new OfferLog({
          userId: userId,
          username: user.username,
          offerName: offerName,
          offerUrl: 'Unknown',
          offerPartner: offerPartner || 'Unknown',
          rewardAmount: amount || 0,
          status: 'clicked'
        });
        await offerLog.save();
      }
    }

    // Calculate completion time
    const completionTime = Math.floor((new Date() - offerLog.clickedAt) / 1000);

    // Update offer log
    offerLog.status = 'completed';
    offerLog.completedAt = new Date();
    offerLog.completionTime = completionTime;
    offerLog.rewardAmount = amount || offerLog.rewardAmount;
    await offerLog.save();

    // Update user points and create activity
    const user = await GameProUser.findById(userId);
    user.points = (user.points || 0) + (amount || 0);
    await user.save();

    // Create user activity record
    const userActivity = new UserActivity({
      userId: userId,
      activityType: 'offer_completed',
      offerName: offerName,
      offerPartner: offerPartner || 'Unknown',
      amount: amount || 0,
      metadata: {
        completionTime: completionTime,
        logId: offerLog._id
      }
    });
    await userActivity.save();

    res.json({
      success: true,
      message: 'Offer completed successfully',
      pointsEarned: amount || 0,
      completionTime: completionTime,
      totalPoints: user.points,
      logId: offerLog._id
    });

  } catch (error) {
    console.error('❌ Error completing offer:', error);
    res.status(500).json({ error: 'Failed to complete offer', details: error.message });
  }
});

// Get offer logs (Admin only)
app.get('/api/admin/offer-logs', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await GameProUser.findById(req.user.userId); // Fixed: use userId instead of id
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    const username = req.query.username;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (username) filter.username = { $regex: username, $options: 'i' };
    if (startDate || endDate) {
      filter.clickedAt = {};
      if (startDate) filter.clickedAt.$gte = new Date(startDate);
      if (endDate) filter.clickedAt.$lte = new Date(endDate);
    }

    // Get logs with pagination
    const logs = await OfferLog.find(filter)
      .populate('userId', 'username email fullName')
      .sort({ clickedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalLogs = await OfferLog.countDocuments(filter);

    // Get statistics
    const stats = await OfferLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalReward: { $sum: '$rewardAmount' }
        }
      }
    ]);

    res.json({
      logs: logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLogs / limit),
        totalLogs: totalLogs,
        limit: limit
      },
      statistics: stats
    });

  } catch (error) {
    console.error('❌ Error fetching offer logs:', error);
    res.status(500).json({ error: 'Failed to fetch offer logs', details: error.message });
  }
});

// Helper functions
function getDeviceType(userAgent) {
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

function getBrowserName(userAgent) {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
