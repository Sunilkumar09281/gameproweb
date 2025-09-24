const mongoose = require('mongoose');

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://gamepro_db_user:PwNiJGMwNyX9L1Aw@gamepro.jhvzauc.mongodb.net/gamepro_db?retryWrites=true&w=majority';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  userName: { type: String, required: true },
  userEmail: { type: String },
  platform: { type: String, default: 'Unknown Platform' },
  points: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  profilePicture: { type: String },
  country: { type: String, default: 'Unknown' },
  rank: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Postback Schema
const postbackSchema = new mongoose.Schema({
  postbackId: { type: String, required: true, unique: true },
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

// Create Models
const User = mongoose.model('User', userSchema);
const Postback = mongoose.model('Postback', postbackSchema);
const Partner = mongoose.model('Partner', partnerSchema);
const SurveyProvider = mongoose.model('SurveyProvider', surveyProviderSchema);
const Survey = mongoose.model('Survey', surveySchema);

module.exports = {
  connectDB,
  User,
  Postback,
  Partner,
  SurveyProvider,
  Survey
};
