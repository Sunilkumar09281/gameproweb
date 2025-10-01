const mongoose = require('mongoose');

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://gamepro_db_user:PwNiJGMwNyX9L1Aw@gamepro.jhvzauc.mongodb.net/gamepro_db?retryWrites=true&w=majority';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema for storing user data
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  profilePicture: { type: String },
  platform: { type: String, required: true },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  completedTasks: { type: Number, default: 0 },
  country: { type: String, default: 'Unknown' },
  rank: { type: Number },
  ipAddress: { type: String },
  partnerName: { type: String },
  uniqueClick: { type: String },
  sessionId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// GamePro User Schema for authentication
const gameproUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Will be hashed
  role: { 
    type: String, 
    enum: ['admin', 'simpleuser'], 
    default: 'simpleuser' 
  },
  profilePicture: { type: String },
  fullName: { type: String },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Postback Schema
const postbackSchema = new mongoose.Schema({
  method: { type: String, required: true },
  partnerId: { type: String, default: 'unknown' },
  partnerName: { type: String, default: 'Unknown Partner' },
  userData: {
    userId: String,
    userName: String,
    userEmail: String,
    platform: String,
    points: Number,
    profilePicture: String,
    level: Number,
    country: String
  },
  query: { type: mongoose.Schema.Types.Mixed },
  body: { type: mongoose.Schema.Types.Mixed },
  headers: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  receivedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Partner Schema
const partnerSchema = new mongoose.Schema({
  partnerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  postbackUrl: { type: String },
  totalPostbacks: { type: Number, default: 0 },
  lastPostbackAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Survey Provider Schema
const surveyProviderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  buttonText: { type: String, default: 'Start Survey' },
  colorCode: { type: String, default: '#3498db' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Survey Schema
const surveySchema = new mongoose.Schema({
  name: { type: String, required: true },
  link: { type: String, required: true },
  payout: { type: Number, required: true },
  section: { type: String, default: 'Featured Surveys' },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveyProvider' },
  providerName: { type: String },
  providerColorCode: { type: String },
  image: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// UserData Schema - Enhanced for home page display and detailed modal
const userDataSchema = new mongoose.Schema({
  name: { type: String, required: true },
  profile: { type: String, default: '' },
  platform: { type: String, required: true },
  points: { type: Number, default: 0 },
  // Additional details for modal
  ipAddress: { type: String, default: 'Unknown' },
  partnerName: { type: String, default: 'Unknown Partner' },
  uniqueClick: { type: String, default: '' },
  sessionId: { type: String, default: '' },
  country: { type: String, default: 'Unknown' },
  userAgent: { type: String, default: 'Unknown' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// User Activity Schema for tracking offers, earnings, referrals
const userActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameProUser', required: true },
  activityType: { 
    type: String, 
    enum: ['offer_completed', 'earning', 'referral', 'withdrawal', 'bonus'],
    required: true 
  },
  offerName: String,
  offerPartner: String,
  amount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameProUser' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
}, {
  timestamps: true
});

// User Referral Schema
const userReferralSchema = new mongoose.Schema({
  referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameProUser', required: true },
  referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameProUser', required: true },
  referralCode: String,
  status: { 
    type: String, 
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  bonusEarned: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Offer Log Schema for tracking offer clicks and completions
const offerLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameProUser', required: true },
  username: { type: String, required: true },
  offerName: { type: String, required: true },
  offerUrl: { type: String, required: true },
  offerPartner: { type: String, default: 'Unknown' },
  rewardAmount: { type: Number, default: 0 },
  
  // Tracking information
  clickedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  completionTime: { type: Number, default: null }, // Time in seconds to complete
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['clicked', 'completed', 'abandoned'], 
    default: 'clicked' 
  },
  
  // User information at time of click
  userIP: { type: String, default: 'Unknown' },
  userAgent: { type: String, default: 'Unknown' },
  referrer: { type: String, default: 'Direct' },
  
  // Additional metadata
  metadata: {
    source: { type: String, default: 'web_app' },
    device: { type: String, default: 'Unknown' },
    browser: { type: String, default: 'Unknown' },
    country: { type: String, default: 'Unknown' },
    sessionId: { type: String, default: '' }
  },
  
  // Admin notes
  adminNotes: { type: String, default: '' },
  flagged: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Create Models
const User = mongoose.model('User', userSchema);
const GameProUser = mongoose.model('GameProUser', gameproUserSchema);
const Postback = mongoose.model('Postback', postbackSchema);
const Partner = mongoose.model('Partner', partnerSchema);
const UserData = mongoose.model('UserData', userDataSchema);
const SurveyProvider = mongoose.model('SurveyProvider', surveyProviderSchema);
const Survey = mongoose.model('Survey', surveySchema);
const UserActivity = mongoose.model('UserActivity', userActivitySchema);
const UserReferral = mongoose.model('UserReferral', userReferralSchema);
const OfferLog = mongoose.model('OfferLog', offerLogSchema);

// Export models
module.exports = {
  connectDB,
  User,
  GameProUser,
  Postback,
  Partner,
  UserData,
  SurveyProvider,
  Survey,
  UserActivity,
  UserReferral,
  OfferLog
};
