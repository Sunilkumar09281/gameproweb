const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const bodyParser = require('body-parser');
const { connectDB, User, Postback, Partner, UserData } = require('./database');
const rateLimit = require('express-rate-limit');
const proxyRouter = require('./proxy');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cheerio = require('cheerio');
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// File paths
const postbacksFile = path.join(__dirname, 'postbacks.json');
const partnersFile = path.join(__dirname, 'partners.json');
const gamesFile = path.join(__dirname, 'games.json');
const apiKeysFile = path.join(__dirname, 'api_keys.json');
const campaignsFile = path.join(__dirname, 'campaigns.json');
const schedulesFile = path.join(__dirname, 'offer_schedules.json');
const playResponsesFile = path.join(__dirname, 'play_responses.json');
const fetchHistoryFile = path.join(__dirname, 'fetch_history.json');
const emailConfigFile = path.join(__dirname, 'email_config.json');
const surveyProvidersFile = path.join(__dirname, 'survey_providers.json');
const surveyLinksFile = path.join(__dirname, 'survey_links.json');

// Load/save postbacks
async function loadPostbacks() {
  try {
    const data = await fs.readFile(postbacksFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function savePostbacks(postbacks) {
  await fs.writeFile(postbacksFile, JSON.stringify(postbacks, null, 2));
}

// Load/save partners
async function loadPartners() {
  try {
    const data = await fs.readFile(partnersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function savePartners(partners) {
  await fs.writeFile(partnersFile, JSON.stringify(partners, null, 2));
}

// Load/save games
async function loadGames() {
  try {
    const data = await fs.readFile(gamesFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveGames(games) {
  await fs.writeFile(gamesFile, JSON.stringify(games, null, 2));
}

// Load/save API keys
async function loadApiKeys() {
  try {
    const data = await fs.readFile(API_KEYS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveApiKeys(keys) {
  await fs.writeFile(API_KEYS_FILE, JSON.stringify(keys, null, 2));
}

// Load/save play responses
async function loadPlayResponses() {
  try {
    const data = await fs.readFile(PLAY_RESPONSES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function savePlayResponses(responses) {
  await fs.writeFile(PLAY_RESPONSES_FILE, JSON.stringify(responses, null, 2));
}

// Load/save fetch history
async function loadFetchHistory() {
  try {
    const data = await fs.readFile(FETCH_HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveFetchHistory(history) {
  await fs.writeFile(FETCH_HISTORY_FILE, JSON.stringify(history, null, 2));
}

// Load/save email config
async function loadEmailConfig() {
  try {
    const data = await fs.readFile(EMAIL_CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      host: '',
      port: 465,
      secure: true,
      user: '',
      pass: '',
      from: ''
    };
  }
}

async function saveEmailConfig(config) {
  await fs.writeFile(EMAIL_CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Load/save schedules
async function loadSchedules() {
  try {
    const data = await fs.readFile(SCHEDULES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveSchedules(schedules) {
  await fs.writeFile(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));
}

// Load email config from file if exists
let emailConfig;
try {
  if (fs.existsSync(EMAIL_CONFIG_FILE)) {
    emailConfig = fs.readFile(EMAIL_CONFIG_FILE, 'utf8');
  } else {
    emailConfig = {
      host: '',
      port: 465,
      secure: true,
      user: '',
      pass: '',
      from: ''
    };
  }
} catch {
  emailConfig = {
    host: '',
    port: 465,
    secure: true,
    user: '',
    pass: '',
    from: ''
  };
}

// Load/save survey providers
async function loadSurveyProviders() {
  try {
    const data = await fs.readFile(surveyProvidersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveSurveyProviders(providers) {
  await fs.writeFile(surveyProvidersFile, JSON.stringify(providers, null, 2));
}

// Load/save survey links
async function loadSurveyLinks() {
  try {
    const data = await fs.readFile(surveyLinksFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveSurveyLinks(links) {
  await fs.writeFile(surveyLinksFile, JSON.stringify(links, null, 2));
}

// Rate limiter: 10 requests per IP per day for public API
const publicApiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'API rate limit exceeded. You are allowed 10 requests per day.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// CORS configuration for both development and production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000',
      'https://localhost:3001',
      // Add your frontend URLs here
      'https://gamepro.onrender.com',
      'https://gameproweb.onrender.com',
      'https://gameproback.onrender.com',
      'https://gamepro.pw',
      'https://www.gamepro.pw',
      'http://gamepro.pw',
      'http://www.gamepro.pw',
      // Add any other domains you might use
      /\.onrender\.com$/,
      /\.netlify\.app$/,
      /\.vercel\.app$/,
      /\.herokuapp\.com$/
    ];
    
    // Check if origin is in allowed list or matches regex patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log(`CORS allowed origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key'
  ]
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Trust proxy for accurate IP detection
app.set('trust proxy', true);

// Serve static files (for the MongoDB dashboard)
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add proxy routes
app.use('/api', proxyRouter);

// Legacy proxy endpoints for backward compatibility
app.get('/proxy-postback', async (req, res) => {
  const { target } = req.query;
  
  if (!target) {
    return res.status(400).json({ error: 'Target URL is required' });
  }

  // Validate URL format
  try {
    new URL(target);
  } catch (urlError) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    console.log(`[${new Date().toISOString()}] Proxying GET request to: ${target}`);
    
    const startTime = Date.now();
    const response = await fetch(target, { 
      method: 'GET',
      headers: {
        'User-Agent': 'PostbackProxy/1.0',
        'Accept': 'application/json, text/plain, */*'
      },
      timeout: 10000 // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    // Save the postback with enhanced metadata
    const postbacks = await loadPostbacks();
    postbacks.push({
      id: require('uuid').v4(),
      method: 'GET',
      receivedAt: new Date().toISOString(),
      url: target,
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
      headers: Object.fromEntries(response.headers.entries()),
      body: data,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown'
    });
    await savePostbacks(postbacks);

    console.log(`[${new Date().toISOString()}] GET request completed: ${response.status} (${responseTime}ms)`);
    res.status(response.status).send(text);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Proxy GET error:`, error.message);
    res.status(500).json({ 
      error: 'Failed to proxy request',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/proxy-postback', async (req, res) => {
  const { url, data } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (urlError) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    console.log(`[${new Date().toISOString()}] Proxying POST request to: ${url}`);
    console.log('Payload:', JSON.stringify(data, null, 2));
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PostbackProxy/1.0',
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify(data || {}),
      timeout: 10000 // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    const text = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(text);
    } catch {
      responseData = text;
    }

    // Save the postback with enhanced metadata
    const postbacks = await loadPostbacks();
    postbacks.push({
      id: require('uuid').v4(),
      method: 'POST',
      receivedAt: new Date().toISOString(),
      url: url,
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
      headers: Object.fromEntries(response.headers.entries()),
      requestBody: data || {},
      responseBody: responseData,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown'
    });
    await savePostbacks(postbacks);

    console.log(`[${new Date().toISOString()}] POST request completed: ${response.status} (${responseTime}ms)`);
    
    res.status(response.status).json({
      success: true,
      status_code: response.status,
      status_text: response.statusText,
      response_text: responseData,
      response_time: `${responseTime}ms`,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Proxy POST error:`, error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to proxy request',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Load/save user leaderboard data
const leaderboardFile = path.join(__dirname, 'leaderboard.json');

async function loadLeaderboard() {
  try {
    const data = await fs.readFile(leaderboardFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveLeaderboard(leaderboard) {
  await fs.writeFile(leaderboardFile, JSON.stringify(leaderboard, null, 2));
}

// Endpoint to receive postbacks (both GET and POST) with MongoDB integration
app.all('/api/receive-postback', async (req, res) => {
  console.log('--- NEW POSTBACK RECEIVED ---');
  console.log(`[${new Date().toISOString()}] Method: ${req.method}, IP: ${req.ip}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('-----------------------------');

  try {
    const partnerId = req.query.partner_id || req.body?.partner_id || 'unknown';
    console.log(`[DEBUG] Partner ID identified as: ${partnerId}`);
    
    // Find partner info if partner_id is provided
    let partnerInfo = null;
    if (partnerId !== 'unknown') {
      console.log(`[DEBUG] Searching for partner with ID: ${partnerId}`);
      partnerInfo = await Partner.findOne({ partnerId: partnerId });
      if (partnerInfo) {
        console.log(`[DEBUG] Found partner: ${partnerInfo.name}`);
      } else {
        console.log(`[DEBUG] Partner with ID ${partnerId} not found in database.`);
      }
    }
    
    // Extract user data from postback with flexible field mapping
    const userData = {
      userId: req.query.user_id || req.body?.user_id || req.query.uid || req.body?.uid || 
              req.query.id || req.body?.id || req.body?.name || req.query.name, // Use name as fallback ID
      userName: req.query.user_name || req.body?.user_name || req.query.name || req.body?.name ||
                req.query.username || req.body?.username,
      userEmail: req.query.user_email || req.body?.user_email || req.query.email || req.body?.email,
      platform: req.query.platform || req.body?.platform || partnerInfo?.name || 'Unknown Platform',
      points: parseFloat(req.query.points || req.body?.points || req.query.amount || req.body?.amount || 
                        req.query.reward || req.body?.reward || 0),
      profilePicture: req.query.profile_picture || req.body?.profile_picture || 
                     req.query.avatar || req.body?.avatar ||
                     req.query.profile || req.body?.profile ||
                     req.query.image || req.body?.image,
      level: parseInt(req.query.level || req.body?.level || 1),
      country: req.query.country || req.body?.country || 'Unknown'
    };
    console.log('[DEBUG] Extracted User Data:', JSON.stringify(userData, null, 2));
    
    const postbackId = uuidv4();
    
    // Save postback to MongoDB
    const postback = new Postback({
      postbackId: postbackId,
      method: req.method,
      partnerId: partnerId,
      partnerName: partnerInfo?.name || 'Unknown Partner',
      userData: userData,
      query: req.query,
      body: req.body,
      headers: req.headers,
      ip: req.ip,
      receivedAt: new Date()
    });
    
    console.log('[DEBUG] Saving postback log to database...');
    await postback.save();
    console.log('[SUCCESS] Postback log saved successfully.');
    
    // Update leaderboard if we have user data
    if (userData.userId && userData.userName && userData.points > 0) {
      console.log(`[DEBUG] Valid user data found. Updating leaderboard for user: ${userData.userName}`);
      
      // Find existing user or create new one
      let user = await User.findOne({ userId: userData.userId });
      
      if (user) {
        console.log(`[DEBUG] Existing user found. Updating points. Current: ${user.points}, Adding: ${userData.points}`);
        // Update existing user
        user.points += userData.points;
        user.totalEarnings += userData.points;
        user.completedTasks += 1;
        user.lastActivity = new Date();
        if (userData.level) user.level = Math.max(user.level, userData.level);
        if (userData.profilePicture) user.profilePicture = userData.profilePicture;
        if (userData.userEmail) user.userEmail = userData.userEmail;
        if (userData.country && userData.country !== 'Unknown') user.country = userData.country;
        
        await user.save();
        console.log(`[SUCCESS] User ${user.userName} updated. New points: ${user.points}`);
      } else {
        console.log(`[DEBUG] New user. Creating entry for: ${userData.userName}`);
        // Create new user
        user = new User({
          userId: userData.userId,
          userName: userData.userName,
          userEmail: userData.userEmail,
          platform: userData.platform,
          points: userData.points,
          totalEarnings: userData.points,
          completedTasks: 1,
          level: userData.level || 1,
          profilePicture: userData.profilePicture || `https://ui-avatars.io/api/?name=${encodeURIComponent(userData.userName)}&background=random`,
          country: userData.country,
          joinedAt: new Date(),
          lastActivity: new Date()
        });
        
        await user.save();
        console.log(`[SUCCESS] New user ${user.userName} created with ${user.points} points.`);
      }
      
      // Update ranks for all users
      console.log('[DEBUG] Updating ranks for all users...');
      await updateUserRanks();
      console.log('[SUCCESS] Ranks updated.');
    } else {
        console.log('[INFO] Leaderboard update skipped. Conditions not met:');
        console.log(`- Has userId?: ${!!userData.userId}`);
        console.log(`- Has userName?: ${!!userData.userName}`);
        console.log(`- Has points > 0?: ${userData.points > 0}`);
    }
    
    // Update partner stats if partner exists
    if (partnerInfo) {
      console.log(`[DEBUG] Updating stats for partner: ${partnerInfo.name}`);
      partnerInfo.totalPostbacks = (partnerInfo.totalPostbacks || 0) + 1;
      partnerInfo.lastPostbackAt = new Date();
      await partnerInfo.save();
      console.log('[SUCCESS] Partner stats updated.');
    }
    
    // Save to UserData collection for home page display
    try {
      console.log('[DEBUG] Saving to UserData collection for home page...');
      
      // Enhanced IP address extraction
      const getClientIP = (req) => {
        return req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.headers['x-client-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               req.ip || 
               'Unknown';
      };

      // Enhanced country detection from IP or headers
      const getCountry = async (req, ip) => {
        // Check query/body parameters first (highest priority)
        const countryFromParams = req.query.country || req.body?.country || 
                                 req.query.geo_country || req.body?.geo_country ||
                                 req.query.user_country || req.body?.user_country ||
                                 req.query.countryCode || req.body?.countryCode ||
                                 req.query.country_code || req.body?.country_code;
        
        if (countryFromParams) {
          console.log('[DEBUG] Country from parameters:', countryFromParams);
          return countryFromParams;
        }
        
        // Check headers for country info (second priority)
        const countryFromHeaders = req.headers['cf-ipcountry'] || // Cloudflare
                                  req.headers['x-country-code'] || // Some proxies
                                  req.headers['geoip-country-code'] || // GeoIP headers
                                  req.headers['x-forwarded-country'] || // Some platforms
                                  req.headers['x-user-country']; // Custom headers
        
        if (countryFromHeaders) {
          console.log('[DEBUG] Country from headers:', countryFromHeaders);
          return countryFromHeaders;
        }
        
        // Try to get country from IP using free geolocation service
        if (ip && ip !== 'Unknown' && !ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('172.') && ip !== '127.0.0.1' && ip !== '::1') {
          try {
            console.log('[DEBUG] Attempting IP geolocation for:', ip);
            // Try multiple geolocation services
            let geoResponse;
            
            // First try ip-api.com
            try {
              geoResponse = await axios.get(`http://ip-api.com/json/${ip}?fields=countryCode,country`, { timeout: 5000 });
              if (geoResponse.data && geoResponse.data.countryCode && geoResponse.data.countryCode !== 'fail') {
                console.log('[DEBUG] IP geolocation result from ip-api:', geoResponse.data.countryCode);
                return geoResponse.data.countryCode;
              }
            } catch (error1) {
              console.log('[DEBUG] ip-api.com failed:', error1.message);
            }
            
            // Fallback to ipapi.co
            try {
              geoResponse = await axios.get(`https://ipapi.co/${ip}/country/`, { timeout: 5000 });
              if (geoResponse.data && typeof geoResponse.data === 'string' && geoResponse.data.length === 2) {
                console.log('[DEBUG] IP geolocation result from ipapi.co:', geoResponse.data);
                return geoResponse.data;
              }
            } catch (error2) {
              console.log('[DEBUG] ipapi.co failed:', error2.message);
            }
            
          } catch (geoError) {
            console.log('[DEBUG] All IP geolocation services failed:', geoError.message);
          }
        }
        
        return 'Unknown';
      };

      // Enhanced session ID extraction
      const getSessionId = (req) => {
        return req.query.session_id || req.body?.session_id ||
               req.query.sessionid || req.body?.sessionid ||
               req.query.sid || req.body?.sid ||
               req.query.transaction_id || req.body?.transaction_id ||
               req.query.txn_id || req.body?.txn_id ||
               req.headers['x-session-id'] ||
               postbackId; // fallback to postback ID
      };

      const clientIP = getClientIP(req);
      const country = await getCountry(req, clientIP);
      const sessionId = getSessionId(req);
      
      console.log('[DEBUG] Extracted details:', {
        ip: clientIP,
        country: country,
        sessionId: sessionId,
        detectedFrom: {
          ipForwarded: req.headers['x-forwarded-for'],
          realIP: req.headers['x-real-ip'],
          clientIP: req.headers['x-client-ip'],
          connectionIP: req.connection.remoteAddress,
          requestIP: req.ip
        },
        headers: req.headers,
        query: req.query,
        body: req.body
      });

      const userDataEntry = new UserData({
        name: userData.userName || req.query.name || req.body?.name || 'Unknown User',
        profile: userData.profilePicture || req.query.profile || req.body?.profile || '',
        platform: userData.platform || req.query.platform || req.body?.platform || 'Unknown Platform',
        points: parseInt(userData.points) || parseInt(req.query.points) || parseInt(req.body?.points) || 0,
        // Enhanced details for modal
        ipAddress: clientIP,
        partnerName: partnerInfo?.name || 'Unknown Partner',
        uniqueClick: req.query.click_id || req.body?.click_id || 
                    req.query.clickid || req.body?.clickid ||
                    req.query.unique_id || req.body?.unique_id ||
                    postbackId,
        sessionId: sessionId,
        country: country,
        userAgent: req.headers['user-agent'] || 'Unknown'
      });
      
      await userDataEntry.save();
      console.log('[SUCCESS] UserData saved for home page display:', userDataEntry);
    } catch (userDataError) {
      console.error('[ERROR] Failed to save UserData:', userDataError);
    }
    
    // Return a simple response
    console.log('[SUCCESS] Sending 200 OK response to client.');
    res.status(200).json({ 
      success: true, 
      message: 'Postback received and processed',
      postbackId: postbackId,
      userData: userData
    });
    
  } catch (error) {
    console.error('--- !!! POSTBACK PROCESSING FAILED !!! ---');
    console.error(`[${new Date().toISOString()}] Error details:`, error);
    console.error('------------------------------------------');
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process postback',
      message: error.message
    });
  }
});

// Helper function to update user ranks
async function updateUserRanks() {
  try {
    const users = await User.find({}).sort({ points: -1 });
    
    for (let i = 0; i < users.length; i++) {
      users[i].rank = i + 1;
      await users[i].save();
    }
  } catch (error) {
    console.error('Error updating user ranks:', error);
  }
}

// Endpoint to get all received postbacks from MongoDB
app.get('/api/received-postbacks', async (req, res) => {
  try {
    console.log('📊 Fetching postbacks from MongoDB collection: postbacks');
    console.log('📊 MongoDB connection state:', mongoose.connection.readyState);
    console.log('📊 Database name:', mongoose.connection.db.databaseName);
    
    // Direct access to the postbacks collection
    const db = mongoose.connection.db;
    
    // First, check all collections
    const collections = await db.listCollections().toArray();
    console.log('📊 All collections:', collections.map(c => c.name));
    
    // Check if postbacks collection exists and has data
    const postbacksCollection = db.collection('postbacks');
    const count = await postbacksCollection.countDocuments();
    console.log(`📊 Total documents in postbacks collection: ${count}`);
    
    // Get all postbacks with detailed logging
    const postbacks = await postbacksCollection.find({}).sort({ receivedAt: -1 }).toArray();
    
    console.log(`📊 Found ${postbacks.length} postbacks in 'postbacks' collection`);
    
    if (postbacks.length > 0) {
      console.log('📊 First 3 postback structures:');
      postbacks.slice(0, 3).forEach((postback, index) => {
        console.log(`📊 Postback ${index + 1}:`, JSON.stringify(postback, null, 2));
      });
      
      // Check what fields are available
      const samplePostback = postbacks[0];
      console.log('📊 Available fields in postback:', Object.keys(samplePostback));
      
      // Transform data to match frontend expectations
      const transformedPostbacks = postbacks.map(postback => ({
        _id: postback._id,
        id: postback._id,
        user_name: postback.user_name || postback.userData?.userName || postback.userName,
        user_email: postback.user_email || postback.userData?.userEmail || postback.userEmail,
        points: postback.points || postback.userData?.points || 0,
        platform: postback.platform || postback.userData?.platform || 'Unknown',
        partner_id: postback.partner_id || postback.partnerId,
        transaction_id: postback.transaction_id || postback.transactionId,
        offer_id: postback.offer_id || postback.offerId,
        receivedAt: postback.receivedAt || postback.createdAt || new Date().toISOString(),
        ipAddress: postback.ipAddress || postback.ip_address,
        userData: postback.userData || {},
        // Include all original fields for debugging
        originalData: postback
      }));
      
      console.log('📊 Transformed first postback:', JSON.stringify(transformedPostbacks[0], null, 2));
      
      res.json(transformedPostbacks);
    } else {
      console.log('📊 No postbacks found - checking alternative collection names...');
      const alternativeNames = ['received_postbacks', 'postback_logs', 'user_activities'];
      
      for (const collectionName of alternativeNames) {
        try {
          const altCollection = db.collection(collectionName);
          const altCount = await altCollection.countDocuments();
          if (altCount > 0) {
            console.log(`📊 Found ${altCount} documents in ${collectionName} collection`);
            const altData = await altCollection.find({}).sort({ receivedAt: -1 }).toArray();
            return res.json(altData);
          }
        } catch (err) {
          console.log(`📊 Collection ${collectionName} not accessible`);
        }
      }
      
      res.json([]);
    }
  } catch (error) {
    console.error('❌ Error fetching postbacks:', error);
    res.status(500).json({ error: 'Failed to fetch postbacks', details: error.message });
  }
});

// Simple test endpoint to check server version
app.get('/api/server-info', (req, res) => {
  res.json({
    message: 'Server is running with MongoDB integration',
    timestamp: new Date().toISOString(),
    version: '2.0-mongodb',
    endpoints: [
      '/api/receive-postback',
      '/api/received-postbacks', 
      '/api/mongodb-status',
      '/api/server-info',
      '/api/test-postback-creation'
    ]
  });
});

// Test endpoint to create a sample postback and see the structure
app.post('/api/test-postback-creation', async (req, res) => {
  try {
    console.log('🧪 Creating test postback...');
    
    const testPostback = {
      user_name: 'Test User ' + Date.now(),
      user_email: 'test@example.com',
      points: 100,
      platform: 'Test Platform',
      partner_id: 'test_partner',
      transaction_id: 'txn_' + Date.now(),
      offer_id: 'offer_test',
      receivedAt: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      userData: {
        userName: 'Test User ' + Date.now(),
        userEmail: 'test@example.com',
        points: 100,
        platform: 'Test Platform'
      }
    };
    
    const db = require('mongoose').connection.db;
    const result = await db.collection('postbacks').insertOne(testPostback);
    
    console.log('🧪 Test postback created:', result.insertedId);
    console.log('🧪 Test postback data:', JSON.stringify(testPostback, null, 2));
    
    res.json({
      success: true,
      message: 'Test postback created successfully',
      postbackId: result.insertedId,
      data: testPostback
    });
  } catch (error) {
    console.error('❌ Error creating test postback:', error);
    res.status(500).json({ error: 'Failed to create test postback', details: error.message });
  }
});

// MongoDB connection status endpoint
app.get('/api/mongodb-status', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const postbackCount = await Postback.countDocuments();
    const userCount = await User.countDocuments();
    const partnerCount = await Partner.countDocuments();
    
    res.json({
      status: 'success',
      mongodb: {
        connectionState: states[connectionState],
        connectionStateCode: connectionState,
        database: 'gamepro_db',
        collections: {
          postbacks: postbackCount,
          users: userCount,
          partners: partnerCount
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error checking MongoDB status:', error);
    res.status(500).json({ 
      status: 'error', 
      error: 'Failed to check MongoDB status',
      details: error.message 
    });
  }
});

// Optional: clear postbacks - MongoDB version
app.delete('/api/received-postbacks', async (req, res) => {
  try {
    await Postback.deleteMany({});
    res.json({ message: 'All postbacks cleared' });
  } catch (error) {
    console.error('Error clearing postbacks:', error);
    res.status(500).json({ error: 'Failed to clear postbacks' });
  }
});

// UserData API endpoints for home page display

// Get recent user data for home page cards
app.get('/api/user-data', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get recent user data sorted by creation date (newest first)
    const userData = await UserData.find({})
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Transform data to match UserCard component expectations with enhanced fields
    const transformedData = userData.map((user, index) => ({
      userId: user._id,
      userName: user.name,
      profilePicture: user.profile,
      platform: user.platform,
      points: user.points,
      level: Math.floor(user.points / 100) + 1, // Calculate level based on points
      completedTasks: Math.floor(user.points / 50), // Calculate tasks based on points
      country: user.country || 'Unknown',
      rank: index + 1,
      // Enhanced fields for modal
      ipAddress: user.ipAddress || 'N/A',
      partnerName: user.partnerName || 'Unknown Partner',
      uniqueClick: user.uniqueClick || 'N/A',
      sessionId: user.sessionId || 'N/A',
      userAgent: user.userAgent || 'Unknown',
      createdAt: user.createdAt || user.updatedAt || new Date().toISOString(),
      joinedAt: user.createdAt || user.updatedAt || new Date().toISOString()
    }));
    
    res.json({
      success: true,
      total: userData.length,
      users: transformedData
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Leaderboard API endpoints

// Get leaderboard data from MongoDB
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    // Get users sorted by points (descending)
    const totalUsers = await User.countDocuments();
    const users = await User.find({})
      .sort({ points: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();
    
    // Get top 10 users for home page display
    const topUsers = await User.find({})
      .sort({ points: -1 })
      .limit(10)
      .lean();
    
    res.json({
      total: totalUsers,
      leaderboard: users,
      topUsers: topUsers
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

// Get specific user from leaderboard
app.get('/api/leaderboard/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const leaderboard = await loadLeaderboard();
    
    // Sort by points and update ranks
    leaderboard.sort((a, b) => b.points - a.points);
    leaderboard.forEach((user, index) => {
      user.rank = index + 1;
    });
    
    const user = leaderboard.find(u => u.userId === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found in leaderboard' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user from leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Clear leaderboard (admin only) - MongoDB version
app.delete('/api/leaderboard', async (req, res) => {
  try {
    await User.deleteMany({});
    res.json({ message: 'Leaderboard cleared successfully' });
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
    res.status(500).json({ error: 'Failed to clear leaderboard' });
  }
});

// MongoDB Statistics Dashboard
app.get('/api/mongodb-stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const postbackCount = await Postback.countDocuments();
    const partnerCount = await Partner.countDocuments();
    
    const topUsers = await User.find({}).sort({ points: -1 }).limit(5);
    const recentPostbacks = await Postback.find({}).sort({ receivedAt: -1 }).limit(5);
    
    const totalPoints = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$points" } } }
    ]);

    res.json({
      success: true,
      database: 'MongoDB Atlas',
      collections: {
        users: userCount,
        postbacks: postbackCount,
        partners: partnerCount
      },
      statistics: {
        totalPoints: totalPoints[0]?.total || 0,
        averagePointsPerUser: userCount > 0 ? Math.round((totalPoints[0]?.total || 0) / userCount) : 0
      },
      topUsers: topUsers.map(user => ({
        userName: user.userName,
        points: user.points,
        completedTasks: user.completedTasks,
        rank: user.rank
      })),
      recentActivity: recentPostbacks.map(pb => ({
        user: pb.userData?.userName || 'Unknown',
        points: pb.userData?.points || 0,
        platform: pb.partnerName,
        receivedAt: pb.receivedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching MongoDB stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Quick test endpoint with your exact data - MongoDB version
app.post('/api/test-aahan', async (req, res) => {
  try {
    const testData = {
      name: "aahan",
      profile: "https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=",
      points: "200"
    };

    // Simulate the postback by calling our own endpoint
    const axios = require('axios');
    const response = await axios.post('http://localhost:5000/api/receive-postback', testData, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Also get the current leaderboard to show the result
    const leaderboard = await User.find({}).sort({ points: -1 }).limit(10);
    
    res.json({ 
      success: true, 
      message: 'Test completed with MongoDB', 
      postbackResult: response.data,
      currentLeaderboard: leaderboard
    });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to simulate postback data (for development/testing)
app.post('/api/test-postback', async (req, res) => {
  try {
    const testUsers = [
      {
        user_id: 'test_user_1',
        user_name: 'Naimafak',
        user_email: 'naimafak@example.com',
        platform: 'TimeWall',
        points: 48,
        level: 71,
        country: 'US',
        profile_picture: 'https://ui-avatars.io/api/?name=Naimafak&background=4CAF50'
      },
      {
        user_id: 'test_user_2',
        user_name: 'Kembuh',
        user_email: 'kembuh@example.com',
        platform: 'Torox',
        points: 71,
        level: 45,
        country: 'UK',
        profile_picture: 'https://ui-avatars.io/api/?name=Kembuh&background=00BFFF'
      },
      {
        user_id: 'test_user_3',
        user_name: 'rodolf',
        user_email: 'rodolf@example.com',
        platform: 'AdGateMedia',
        points: 473,
        level: 38,
        country: 'CA',
        profile_picture: 'https://ui-avatars.io/api/?name=rodolf&background=8A2BE2'
      },
      {
        user_id: 'test_user_4',
        user_name: 'oyrtert',
        user_email: 'oyrtert@example.com',
        platform: 'MM Wall',
        points: 225,
        level: 32,
        country: 'AU',
        profile_picture: 'https://ui-avatars.io/api/?name=oyrtert&background=FFD700'
      },
      {
        user_id: 'test_user_5',
        user_name: 'exigible',
        user_email: 'exigible@example.com',
        platform: 'MyChips',
        points: 262,
        level: 28,
        country: 'DE',
        profile_picture: 'https://ui-avatars.io/api/?name=exigible&background=FF69B4'
      }
    ];

    // Simulate multiple postbacks
    for (const user of testUsers) {
      // Create a mock request object
      const mockReq = {
        method: 'POST',
        query: {},
        body: user,
        headers: { 'user-agent': 'Test-Agent/1.0' },
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`
      };

      // Simulate the postback processing
      const partnerId = 'test-partner';
      const partnerInfo = { name: user.platform };
      
      const userData = {
        userId: user.user_id,
        userName: user.user_name,
        userEmail: user.user_email,
        platform: user.platform,
        points: user.points,
        profilePicture: user.profile_picture,
        level: user.level,
        country: user.country
      };
      
      const requestData = {
        id: uuidv4(),
        method: 'POST',
        receivedAt: new Date().toISOString(),
        partnerId: partnerId,
        partnerName: user.platform,
        userData: userData,
        query: {},
        headers: mockReq.headers,
        ip: mockReq.ip,
        body: user
      };

      // Save postback
      const postbacks = await loadPostbacks();
      postbacks.push(requestData);
      await savePostbacks(postbacks);

      // Update leaderboard
      const leaderboard = await loadLeaderboard();
      const existingUserIndex = leaderboard.findIndex(u => u.userId === userData.userId);
      
      if (existingUserIndex !== -1) {
        leaderboard[existingUserIndex].points += userData.points;
        leaderboard[existingUserIndex].lastActivity = new Date().toISOString();
        leaderboard[existingUserIndex].totalEarnings += userData.points;
        leaderboard[existingUserIndex].completedTasks += 1;
        if (userData.level) leaderboard[existingUserIndex].level = Math.max(leaderboard[existingUserIndex].level, userData.level);
      } else {
        leaderboard.push({
          userId: userData.userId,
          userName: userData.userName,
          userEmail: userData.userEmail,
          platform: userData.platform,
          points: userData.points,
          totalEarnings: userData.points,
          completedTasks: 1,
          level: userData.level || 1,
          profilePicture: userData.profilePicture || `https://ui-avatars.io/api/?name=${encodeURIComponent(userData.userName)}&background=random`,
          country: userData.country,
          joinedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          rank: 0
        });
      }
      
      // Sort leaderboard by points and update ranks
      leaderboard.sort((a, b) => b.points - a.points);
      leaderboard.forEach((user, index) => {
        user.rank = index + 1;
      });
      
      await saveLeaderboard(leaderboard);
    }

    res.json({ 
      success: true, 
      message: 'Test postback data created successfully',
      usersCreated: testUsers.length
    });
  } catch (error) {
    console.error('Error creating test postback data:', error);
    res.status(500).json({ error: 'Failed to create test data' });
  }
});

// Partner Management Endpoints

// Get all partners
app.get('/api/partners', async (req, res) => {
  try {
    const partners = await Partner.find({}).sort({ createdAt: -1 }).lean();
    res.json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

// Create a new partner
app.post('/api/partners', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Partner name is required' });
    }
    
    const partnerId = uuidv4();
    const newPartner = new Partner({
      partnerId: partnerId,
      name: name.trim(),
      description: description?.trim() || '',
      createdAt: new Date(),
      totalPostbacks: 0,
      lastPostbackAt: null,
      postbackUrl: `${req.protocol}://${req.get('host')}/api/receive-postback?partner_id=${partnerId}`,
      status: 'active'
    });
    
    await newPartner.save();
    
    res.status(201).json({
      success: true,
      message: 'Partner created successfully',
      partner: newPartner
    });
  } catch (error) {
    console.error('Error creating partner:', error);
    res.status(500).json({ error: 'Failed to create partner' });
  }
});

// Update a partner
app.put('/api/partners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    
    const partner = await Partner.findOne({ partnerId: id });
    
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    if (name) partner.name = name.trim();
    if (description !== undefined) partner.description = description.trim();
    if (status) partner.status = status;
    
    partner.updatedAt = new Date();
    
    await partner.save();
    
    res.json({
      success: true,
      message: 'Partner updated successfully',
      partner: partner
    });
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({ error: 'Failed to update partner' });
  }
});

// Delete a partner
app.delete('/api/partners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const partner = await Partner.findOne({ partnerId: id });
    
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    await Partner.deleteOne({ partnerId: id });
    
    res.json({
      success: true,
      message: 'Partner deleted successfully',
      partner: partner
    });
  } catch (error) {
    console.error('Error deleting partner:', error);
    res.status(500).json({ error: 'Failed to delete partner' });
  }
});

// Get postbacks for a specific partner
app.get('/api/partners/:id/postbacks', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const postbacks = await Postback.find({ partnerId: id })
      .sort({ receivedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();
    
    const total = await Postback.countDocuments({ partnerId: id });
    
    res.json({
      partnerId: id,
      total: total,
      postbacks: postbacks
    });
  } catch (error) {
    console.error('Error fetching partner postbacks:', error);
    res.status(500).json({ error: 'Failed to fetch partner postbacks' });
  }
});

// Get all games
app.get('/api/games', async (req, res) => {
  const games = await loadGames();
  res.json(games);
});

// Add a new game
app.post('/api/games', async (req, res) => {
  const { title, genre, rating, image, link } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const games = await loadGames();
  const newGame = {
    ...req.body, // keep all fields sent from dashboard
    id: req.body.id || Date.now().toString(),
    createdAt: new Date().toISOString()
  };

  games.push(newGame);
  await saveGames(games);
  res.status(201).json(newGame);
});

// Delete a game by id
app.delete('/api/games/:id', async (req, res) => {
  const { id } = req.params;
  let games = await loadGames();
  const initialLength = games.length;
  games = games.filter(g => g.id !== id);
  if (games.length === initialLength) {
    return res.status(404).json({ error: 'Game not found.' });
  }
  await saveGames(games);
  res.json({ message: 'Game deleted.' });
});

// Create a new random API key (no user association)
app.post('/api/apikeys', async (req, res) => {
  const { name } = req.body;
  const keys = await loadApiKeys();
  const newKey = {
    key: require('uuid').v4(),
    name: name || '',
    createdAt: new Date().toISOString(),
    usage: {}
  };
  keys.push(newKey);
  await saveApiKeys(keys);
  res.status(201).json(newKey);
});

let apiKeys = [];

app.get('/api/apikeys', async (req, res) => {
  const keys = await loadApiKeys();
  res.json(keys);
});

// Rename an API key
app.patch('/api/apikeys/:key', async (req, res) => {
  const { key } = req.params;
  const { name } = req.body;
  let keys = await loadApiKeys();
  const idx = keys.findIndex(k => k.key === key);
  if (idx === -1) return res.status(404).json({ error: 'API key not found.' });
  keys[idx].name = name || '';
  await saveApiKeys(keys);
  res.json(keys[idx]);
});

// API endpoint to get all campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    let campaigns = await loadCampaigns();
    if (campaigns.length === 0) {
      // Generate dummy data if no campaigns exist
      campaigns = [
        {
          id: 'campaign1',
          campaignName: 'Summer Sale 2024',
          subjectLine: 'Huge Discounts on All Items!',
          interactions: [
            { type: 'received', email: 'user1@example.com', firstName: 'John', lastName: 'Doe', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'opened', email: 'user1@example.com', firstName: 'John', lastName: 'Doe', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'clicked', email: 'user1@example.com', firstName: 'John', lastName: 'Doe', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'received', email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'opened', email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'received', email: 'user3@example.com', firstName: 'Peter', lastName: 'Jones', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'bounced', email: 'user4@example.com', firstName: 'Alice', lastName: 'Brown', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'replied', email: 'user1@example.com', firstName: 'John', lastName: 'Doe', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        },
        {
          id: 'campaign2',
          campaignName: 'Winter Collection Launch',
          subjectLine: 'Discover Our New Arrivals!',
          interactions: [
            { type: 'received', email: 'user5@example.com', firstName: 'Chris', lastName: 'Green', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'opened', email: 'user5@example.com', firstName: 'Chris', lastName: 'Green', timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'received', email: 'user6@example.com', firstName: 'Sarah', lastName: 'White', timestamp: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'opened', email: 'user6@example.com', firstName: 'Sarah', lastName: 'White', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'clicked', email: 'user6@example.com', firstName: 'Sarah', lastName: 'White', timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        }
      ];
      await saveCampaigns(campaigns);
    }
    res.json(campaigns);
  } catch (error) {
    console.error('Error loading campaigns:', error);
    res.status(500).json({ message: 'Error loading campaigns' });
  }
});

// API endpoint to get all API keys
app.get('/api/api-keys', async (req, res) => {
  const keys = await loadApiKeys();
  res.json(keys);
});

// Delete/revoke an API key
app.delete('/api/apikeys/:key', async (req, res) => {
  const { key } = req.params;
  let keys = await loadApiKeys();
  const initialLength = keys.length;
  keys = keys.filter(k => k.key !== key);
  if (keys.length === initialLength) {
    return res.status(404).json({ error: 'API key not found.' });
  }
  await saveApiKeys(keys);
  res.json({ message: 'API key revoked.' });
});

// Helper: Check API key and rate limit (shared quota for all public endpoints)
async function checkApiKeyAndRateLimit(req, res) {
  const apiKey = req.header('x-api-key');
  if (!apiKey) {
    res.status(401).json({ error: 'API key required in x-api-key header.' });
    return null;
  }
  const keys = await loadApiKeys();
  const keyObj = keys.find(k => k.key === apiKey);
  if (!keyObj) {
    res.status(403).json({ error: 'Invalid API key.' });
    return null;
  }
  // Rate limit: 10 requests per key per day (shared across all public endpoints)
  const today = new Date().toISOString().slice(0, 10);
  if (!keyObj.usage[today]) keyObj.usage[today] = 0;
  if (keyObj.usage[today] >= 10) {
    res.status(429).json({ error: 'API rate limit exceeded for this key. 10 requests per day allowed.' });
    return null;
  }
  keyObj.usage[today]++;
  await saveApiKeys(keys);
  return keyObj;
}

// Public API endpoint for games with API key and per-key rate limiting
app.get('/api/public/games', async (req, res) => {
  const keyObj = await checkApiKeyAndRateLimit(req, res);
  if (!keyObj) return;
  const games = await loadGames();
  res.json(games);
});

// Public API endpoint for postbacks
app.get('/api/public/postbacks', async (req, res) => {
  const keyObj = await checkApiKeyAndRateLimit(req, res);
  if (!keyObj) return;
  const postbacks = await loadPostbacks();
  res.json(postbacks);
});

// Public API endpoint for user stats (placeholder)
app.get('/api/public/users', async (req, res) => {
  const keyObj = await checkApiKeyAndRateLimit(req, res);
  if (!keyObj) return;
  // Placeholder: return static array
  const users = [
    { userId: 'user1', coins: 100, level: 2, completedTasks: 5 },
    { userId: 'user2', coins: 250, level: 4, completedTasks: 20 },
    { userId: 'user3', coins: 50, level: 1, completedTasks: 2 },
  ];
  res.json(users);
});

// Get all schedules
app.get('/api/schedules', async (req, res) => {
  const schedules = await loadSchedules();
  res.json(schedules);
});

// Get schedules for an offer
app.get('/api/schedules/:offerId', async (req, res) => {
  const { offerId } = req.params;
  const schedules = await loadSchedules();
  res.json(schedules.filter(s => String(s.offerId) === String(offerId)));
});

// Add new schedules (bulk)
app.post('/api/schedules', async (req, res) => {
  const { offerIds, url, startDate, endDate, startTime, endTime } = req.body;
  if (!offerIds || !Array.isArray(offerIds) || !url || !startDate || !endDate || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  const schedules = await loadSchedules();
  const newSchedules = offerIds.map(offerId => ({
    id: require('uuid').v4(),
    offerId,
    url,
    startDate,
    endDate,
    startTime,
    endTime
  }));
  await saveSchedules([...schedules, ...newSchedules]);
  res.json({ message: 'Schedules added.', newSchedules });
});

// Delete a schedule
app.delete('/api/schedules/:scheduleId', async (req, res) => {
  const { scheduleId } = req.params;
  let schedules = await loadSchedules();
  const initialLength = schedules.length;
  schedules = schedules.filter(s => s.id !== scheduleId);
  await saveSchedules(schedules);
  res.json({ message: schedules.length < initialLength ? 'Schedule deleted.' : 'Schedule not found.' });
});

// Edit a schedule
app.patch('/api/schedules/:scheduleId', async (req, res) => {
  const { scheduleId } = req.params;
  const { url, startDate, endDate, startTime, endTime } = req.body;
  let schedules = await loadSchedules();
  const idx = schedules.findIndex(s => s.id === scheduleId);
  if (idx === -1) return res.status(404).json({ error: 'Schedule not found.' });
  schedules[idx] = { ...schedules[idx], url, startDate, endDate, startTime, endTime };
  await saveSchedules(schedules);
  res.json({ message: 'Schedule updated.', schedule: schedules[idx] });
});

// Check if a schedule is active
function isScheduleActive(schedule) {
  const now = new Date();
  const start = new Date(`${schedule.startDate}T${schedule.startTime}`);
  const end = new Date(`${schedule.endDate}T${schedule.endTime}`);
  return now >= start && now <= end;
}

// Recursively search for a preview_url or link for a given id in any object/array
function findPreviewUrl(obj, id) {
  if (!obj || typeof obj !== 'object') return null;

  // If this object is keyed by id
  if (obj[id] && (obj[id].preview_url || obj[id].link)) {
    let url = obj[id].preview_url || obj[id].link;
    if (url && url.endsWith('id=')) url = url + id;
    return url;
  }

  // If this object has id as a value
  if ((obj.id === id || obj.offer_id === id || obj._id === id) && (obj.preview_url || obj.link)) {
    let url = obj.preview_url || obj.link;
    if (url && url.endsWith('id=')) url = url + id;
    return url;
  }

  // If this object has an Offer sub-object
  if (obj.Offer && typeof obj.Offer === 'object') {
    const offer = obj.Offer;
    if ((offer.id === id || offer.offer_id === id || offer._id === id) && (offer.preview_url || offer.link)) {
      let url = offer.preview_url || offer.link;
      if (url && url.endsWith('id=')) url = url + id;
      return url;
    }
  }

  // Recursively search all properties
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      const found = findPreviewUrl(obj[key], id);
      if (found) return found;
    }
  }

  // If this is an array, search each element
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findPreviewUrl(item, id);
      if (found) return found;
    }
  }

  return null;
}

// In /go/:id, before redirecting, check for active schedule
app.get('/go/:id', async (req, res) => {
  const { id } = req.params;
  // 1. Check for active schedule
  const schedules = await loadSchedules();
  const active = schedules.find(s => String(s.offerId) === String(id) && isScheduleActive(s));
  if (active) {
    return res.redirect(active.url);
  }
  console.log('Redirect requested for id:', id);

  // 1. Search games.json
  const games = await loadGames();
  let found = games.find(g => g.id === id && g.link);
  if (found) {
    console.log('Found in games.json:', found.link);
    return res.redirect(found.link);
  }

  // 2. Search fetch_history.json for any response with a matching id and preview_url/link
  try {
    const fetchHistory = await fs.promises.readFile(FETCH_HISTORY_FILE, 'utf8');
    const history = JSON.parse(fetchHistory);
    for (const entry of history) {
      const url = findPreviewUrl(entry.response, id);
      if (url) {
        console.log('Redirecting to found preview_url/link:', url);
        return res.redirect(url);
      }
    }
  } catch (e) {
    console.error('Error in /go/:id redirect:', e);
  }
  res.status(404).send('Not found');
});

// Endpoint to get all play responses
app.get('/api/play-responses', async (req, res) => {
  const responses = await loadPlayResponses();
  const games = await loadGames();

  // Attach full game data to each response
  const enriched = responses.map(r => {
    const game = games.find(g => String(g.id) === String(r.gameId));
    return {
      ...r,
      game: game || null // Attach the full game data, or null if not found
    };
  });

  res.json(enriched);
});

// Update a game by id
app.put('/api/games/:id', async (req, res) => {
  const { id } = req.params;
  let games = await loadGames();
  const idx = games.findIndex(g => g.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Game not found.' });

  // Merge updated fields (keep id)
  games[idx] = { ...games[idx], ...req.body, id };
  await saveGames(games);
  res.json(games[idx]);
});

// Duplicate route removed - already defined above

// Endpoint to add a fetch record
app.post('/api/fetch-history', async (req, res) => {
  const { url, method, headers, params, body, response, status, timestamp } = req.body;
  const history = await loadFetchHistory();
  history.push({
    url, method, headers, params, body, response, status, timestamp: timestamp || new Date().toISOString()
  });
  await saveFetchHistory(history);
  res.status(201).json({ message: 'Fetch history recorded' });
});

app.post('/api/play-response', async (req, res) => {
  console.log("hii")
  const {
    gameId,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    userAgent,
    referrer,
    extra,
    screenWidth,
    screenHeight,
    language,
    platform,
    payout,
    payout_type,
    expiration_date,
    monthly_conversion_cap,
    status,
    title,
    genre,
    rating,
    image
    // ...add any other fields you want to store
  } = req.body;


  // Add this line to get the IP address:
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

  // Fetch geolocation info
  let geo = {};
  try {
    const geoRes = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,query,lat,lon`);
    if (geoRes.data.status === 'success') {
      geo = {
        country: geoRes.data.country,
        region: geoRes.data.regionName,
        city: geoRes.data.city,
        lat: geoRes.data.lat,
        lon: geoRes.data.lon,
        ip: geoRes.data.query
      };
    }
  } catch (e) {
    geo = {};
  }

  const data = {
    timestamp: new Date().toISOString(),
    ip,
    gameId,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    userAgent,
    referrer,
    extra,
    screenWidth,
    screenHeight,
    language,
    platform,
    payout,
    payout_type,
    expiration_date,
    monthly_conversion_cap,
    status,
    title,
    genre,
    rating,
    image,
    geo
    // ...add any other fields you want to store
  };

  const responses = await loadPlayResponses();
  responses.push(data);
  await savePlayResponses(responses);
  res.status(200).json({ message: 'Play response recorded', data });
});

// Endpoint to get fetch history
app.get('/api/fetch-history', async (req, res) => {
  const history = await loadFetchHistory();
  res.json(history.reverse()); // newest first
});

// Endpoint to set/update email config
app.post('/api/email-config', async (req, res) => {
  const { host, port, secure, user, pass, from } = req.body;
  if (!host || !port || !user || !pass || !from) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  emailConfig = { host, port, secure, user, pass, from };
  try {
    await saveEmailConfig(emailConfig);
    res.json({ message: 'Email config updated.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save email config', details: e.message });
  }
});

// Endpoint to send an email
app.post('/api/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;
  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: 'To, subject, and text or html are required.' });
  }
  try {
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
      }
    });
    await transporter.sendMail({
      from: emailConfig.from,
      to,
      subject,
      text,
      html
    });
    res.json({ message: 'Email sent.' });
  } catch (e) {
    console.log()
    res.status(500).json({ error: 'Failed to send email', details: e.message });
  }
});

// Endpoint to check if a domain/URL is working
app.post('/api/check-domain', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required.' });

  try {
    // Only follow up to 5 redirects, timeout after 7 seconds
    const response = await fetch(url, { method: 'GET', redirect: 'follow', timeout: 7000 });
    res.json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      finalUrl: response.url
    });
  } catch (e) {
    res.json({
      ok: false,
      error: e.message
    });
  }
});

// gamesFile already declared above

// filepath: backend/server.js (or your backend entry)
app.post('/api/games/bulk', async (req, res) => {
  const offers = req.body.offers;
  if (!Array.isArray(offers)) {
    return res.status(400).json({ error: 'Offers must be an array' });}
  try {
    // Load existing games
    let games = await loadGames();
    // Optionally deduplicate by id
    const existingIds = new Set(games.map(g => g.id || g.offer_id || g._id));
    const newOffers = offers.filter(
      offer => {
        const id = offer.id || offer.offer_id || offer._id;
        return id && !existingIds.has(id);
      }
    );
    // Add new offers
    games = [...games, ...newOffers];
    await saveGames(games);
    res.json({ success: true, added: newOffers.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add offers', details: e.message });
  }
});

// Survey Provider Endpoints

// Get all survey providers
app.get('/api/survey-providers', async (req, res) => {
  try {
    const providers = await loadSurveyProviders();
    res.json(providers);
  } catch (error) {
    console.error('Error loading survey providers:', error);
    res.status(500).json({ error: 'Failed to load survey providers' });
  }
});

// Create a new survey provider
app.post('/api/survey-providers', upload.single('image'), async (req, res) => {
  try {
    console.log('Survey Provider POST request body:', req.body);
    const { name, pointPercentage, content, level, iframeCode, isRecommended, buttonText, colorCode, status } = req.body;
    
    if (!name || !pointPercentage) {
      console.log('Validation failed - Missing required fields:', { name, pointPercentage });
      return res.status(400).json({ 
        error: 'Name and Point Percentage are required',
        received: { name, pointPercentage, hasName: !!name, hasPointPercentage: !!pointPercentage }
      });
    }

    const providers = await loadSurveyProviders();
    const newProvider = {
      id: uuidv4(),
      name,
      pointPercentage: parseFloat(pointPercentage),
      content: content || '',
      level: level || '',
      iframeCode: iframeCode || '',
      isRecommended: isRecommended === 'true' || isRecommended === true,
      buttonText: buttonText || '',
      colorCode: colorCode || '#007bff',
      status: status || 'Active',
      image: req.file ? `/uploads/${req.file.filename}` : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    providers.push(newProvider);
    await saveSurveyProviders(providers);
    res.status(201).json(newProvider);
  } catch (error) {
    console.error('Error creating survey provider:', error);
    res.status(500).json({ error: 'Failed to create survey provider' });
  }
});

// Update a survey provider
app.put('/api/survey-providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pointPercentage, content, level, iframeCode, isRecommended, buttonText, colorCode, status } = req.body;
    
    if (!name || !pointPercentage) {
      return res.status(400).json({ error: 'Name and Point Percentage are required' });
    }

    const providers = await loadSurveyProviders();
    const providerIndex = providers.findIndex(p => p.id === id);
    
    if (providerIndex === -1) {
      return res.status(404).json({ error: 'Survey provider not found' });
    }

    providers[providerIndex] = {
      ...providers[providerIndex],
      name,
      pointPercentage: parseFloat(pointPercentage),
      content: content || '',
      level: level || '',
      iframeCode: iframeCode || '',
      isRecommended: isRecommended || false,
      buttonText: buttonText || '',
      colorCode: colorCode || '#007bff',
      status: status || 'Active',
      updatedAt: new Date().toISOString()
    };

    await saveSurveyProviders(providers);
    res.json(providers[providerIndex]);
  } catch (error) {
    console.error('Error updating survey provider:', error);
    res.status(500).json({ error: 'Failed to update survey provider' });
  }
});

// Delete a survey provider
app.delete('/api/survey-providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const providers = await loadSurveyProviders();
    const filteredProviders = providers.filter(p => p.id !== id);
    
    if (filteredProviders.length === providers.length) {
      return res.status(404).json({ error: 'Survey provider not found' });
    }

    await saveSurveyProviders(filteredProviders);
    res.json({ message: 'Survey provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey provider:', error);
    res.status(500).json({ error: 'Failed to delete survey provider' });
  }
});

// Survey Link Endpoints

// Get all survey links
app.get('/api/survey-links', async (req, res) => {
  try {
    const links = await loadSurveyLinks();
    res.json(links);
  } catch (error) {
    console.error('Error loading survey links:', error);
    res.status(500).json({ error: 'Failed to load survey links' });
  }
});

// Create a new survey link
app.post('/api/survey-links', async (req, res) => {
  try {
    console.log('Survey Link POST request body:', req.body);
    const { 
      name, payout, link, linkOfferId, linkKeys, providerId, 
      redirectLink, country, isRecommended, content, status, section 
    } = req.body;
    
    if (!name || !payout || !link) {
      console.log('Validation failed - Missing required fields:', { name, payout, link });
      return res.status(400).json({ 
        error: 'Name, Payout, and Link are required',
        received: { name, payout, link, hasName: !!name, hasPayout: !!payout, hasLink: !!link }
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
    res.status(201).json(newLink);
  } catch (error) {
    console.error('Error creating survey link:', error);
    res.status(500).json({ error: 'Failed to create survey link' });
  }
});

// Update a survey link
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
    res.json(links[linkIndex]);
  } catch (error) {
    console.error('Error updating survey link:', error);
    res.status(500).json({ error: 'Failed to update survey link' });
  }
});

// Delete a survey link
app.delete('/api/survey-links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const links = await loadSurveyLinks();
    const filteredLinks = links.filter(l => l.id !== id);
    
    if (filteredLinks.length === links.length) {
      return res.status(404).json({ error: 'Survey link not found' });
    }

    await saveSurveyLinks(filteredLinks);
    res.json({ message: 'Survey link deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey link:', error);
    res.status(500).json({ error: 'Failed to delete survey link' });
  }
});

// Removed orphaned code that was causing syntax errors


const PROXY_CONFIG = {
  username: 'spf2gs4v0b',
  password: 'AGn7=Sp15kdwvGp4eg',
  proxy_map: {
    'IN': { host: 'in.decodo.com', port: 10001 },
    'CN': { host: 'cn.decodo.com', port: 30001 },
    'US': { host: 'us.decodo.com', port: 10001 },
    'AU': { host: 'au.decodo.com', port: 30001 },
    'GB': { host: 'gb.decodo.com', port: 30001 },
    'CA': { host: 'ca.decodo.com', port: 20001 },
    'AF': { host: 'af.decodo.com', port: 36001 },
    'AL': { host: 'al.decodo.com', port: 33001 },
    'AD': { host: 'ad.decodo.com', port: 34001 },
    'AO': { host: 'ao.decodo.com', port: 18001 },
    'AR': { host: 'ar.decodo.com', port: 10001 },
    'AM': { host: 'am.decodo.com', port: 42001 },
    'AW': { host: 'aw.decodo.com', port: 21001 },
    'AT': { host: 'at.decodo.com', port: 35001 },
    'AZ': { host: 'az.decodo.com', port: 30001 },
    'BS': { host: 'bs.decodo.com', port: 17001 },
    'BH': { host: 'bh.decodo.com', port: 37001 }
  }
};


const { HttpsProxyAgent } = require('https-proxy-agent');

// Proxy checker endpoint
// app.post('/api/check-proxy', async (req, res) => {
//   const { country, testUrl = 'https://www.google.com' } = req.body;
//   const proxy = PROXY_CONFIG.proxy_map[country];
//   if (!proxy) {
//     return res.status(400).json({ error: 'Proxy not found for this country.' });
//   }
//   const proxyUrl = `http://${PROXY_CONFIG.username}:${PROXY_CONFIG.password}@${proxy.host}:${proxy.port}`;
//   try {
//     const agent = new HttpsProxyAgent(proxyUrl);
//     const response = await axios.get(testUrl, { httpsAgent: agent, timeout: 8000 });
//     res.json({
//       ok: true,
//       status: response.status,
//       statusText: response.statusText,
//       country,
//       proxy: proxyUrl
//     });
//   } catch (e) {
//     res.json({
//       ok: false,
//       error: e.message,
//       country,
//       proxy: proxyUrl
//     });
//   }
// });

app.post('/api/check-proxy', async (req, res) => {
  const { country, url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }
  const proxy = PROXY_CONFIG.proxy_map[country];
  if (!proxy) {
    return res.status(400).json({ error: 'Proxy not found for this country.' });
  }
  const proxyUrl = `http://${PROXY_CONFIG.username}:${PROXY_CONFIG.password}@${proxy.host}:${proxy.port}`;
  try {
    const agent = new HttpsProxyAgent(proxyUrl);
    const response = await axios.get(url, { httpsAgent: agent, timeout: 8000 });
    res.json({
      ok: true,
      status: response.status,
      statusText: response.statusText,
      country,
      proxy: proxyUrl
    });
  } catch (e) {
    res.json({
      ok: false,
      error: e.message,
      country,
      proxy: proxyUrl
    });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Postback backend is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /': 'Health check',
      'GET /proxy-postback': 'Proxy GET requests',
      'POST /proxy-postback': 'Proxy POST requests',
      'GET /api/received-postbacks': 'View received postbacks',
      'POST /api/receive-postback': 'Receive postback',
      'GET /api/games': 'Get games',
      'POST /api/games': 'Add game'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint to see what data would be captured
app.all('/api/debug-postback', async (req, res) => {
  try {
    // Enhanced IP address extraction
    const getClientIP = (req) => {
      return req.headers['x-forwarded-for']?.split(',')[0] || 
             req.headers['x-real-ip'] || 
             req.headers['x-client-ip'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
             req.ip || 
             'Unknown';
    };

    // Enhanced country detection
    const getCountry = async (req, ip) => {
      const countryFromParams = req.query.country || req.body?.country || 
                               req.query.geo_country || req.body?.geo_country ||
                               req.query.user_country || req.body?.user_country;
      
      if (countryFromParams) return countryFromParams;
      
      const countryFromHeaders = req.headers['cf-ipcountry'] || 
                                req.headers['x-country-code'] || 
                                req.headers['geoip-country-code'];
      
      if (countryFromHeaders) return countryFromHeaders;
      
      if (ip && ip !== 'Unknown' && !ip.startsWith('192.168.') && !ip.startsWith('10.') && ip !== '127.0.0.1') {
        try {
          const geoResponse = await axios.get(`http://ip-api.com/json/${ip}?fields=countryCode,country`, { timeout: 3000 });
          if (geoResponse.data && geoResponse.data.countryCode) {
            return geoResponse.data.countryCode;
          }
        } catch (geoError) {
          console.log('Geolocation failed:', geoError.message);
        }
      }
      
      return 'Unknown';
    };

    const clientIP = getClientIP(req);
    const country = await getCountry(req, clientIP);
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      method: req.method,
      extractedData: {
        ipAddress: clientIP,
        country: country,
        sessionId: req.query.session_id || req.body?.session_id || 'Not provided',
        uniqueClick: req.query.click_id || req.body?.click_id || 'Not provided',
        name: req.query.name || req.body?.name || 'Not provided',
        platform: req.query.platform || req.body?.platform || 'Not provided',
        points: req.query.points || req.body?.points || 'Not provided'
      },
      headers: req.headers,
      query: req.query,
      body: req.body,
      rawIP: req.ip,
      connectionIP: req.connection.remoteAddress,
      // Show what would be saved to UserData
      wouldSaveToUserData: {
        name: req.query.name || req.body?.name || 'Unknown User',
        profile: req.query.profile || req.body?.profile || '',
        platform: req.query.platform || req.body?.platform || 'Unknown Platform',
        points: parseInt(req.query.points || req.body?.points || 0),
        ipAddress: clientIP,
        partnerName: 'Unknown Partner',
        uniqueClick: req.query.click_id || req.body?.click_id || 'fallback_id',
        sessionId: req.query.session_id || req.body?.session_id || 'fallback_session',
        country: country,
        userAgent: req.headers['user-agent'] || 'Unknown'
      }
    };

    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to update existing UserData records with proper geolocation
app.post('/api/update-user-data-geolocation', async (req, res) => {
  try {
    console.log('[DEBUG] Updating existing UserData records with geolocation...');
    
    // Find all UserData records with Unknown country
    const usersToUpdate = await UserData.find({ 
      $or: [
        { country: 'Unknown' },
        { country: { $exists: false } }
      ]
    });
    
    console.log(`[DEBUG] Found ${usersToUpdate.length} users to update`);
    
    let updatedCount = 0;
    
    for (const user of usersToUpdate) {
      if (user.ipAddress && user.ipAddress !== 'Unknown' && user.ipAddress !== 'N/A') {
        try {
          // Try to get country from IP
          const geoResponse = await axios.get(`http://ip-api.com/json/${user.ipAddress}?fields=countryCode,country`, { timeout: 5000 });
          if (geoResponse.data && geoResponse.data.countryCode && geoResponse.data.countryCode !== 'fail') {
            await UserData.findByIdAndUpdate(user._id, { 
              country: geoResponse.data.countryCode 
            });
            updatedCount++;
            console.log(`[DEBUG] Updated user ${user.name} with country: ${geoResponse.data.countryCode}`);
          }
        } catch (geoError) {
          console.log(`[DEBUG] Failed to update user ${user.name}:`, geoError.message);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} out of ${usersToUpdate.length} users`,
      updatedCount,
      totalFound: usersToUpdate.length
    });
    
  } catch (error) {
    console.error('[ERROR] Failed to update UserData geolocation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track click endpoint (missing endpoint causing 404)
app.post('/api/track-click', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] Click tracked:`, req.body);
    
    // You can add click tracking logic here
    const clickData = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown',
      ...req.body
    };
    
    // For now, just log the click - you can extend this to save to a file/database
    console.log('Click data:', JSON.stringify(clickData, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Click tracked successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Track click error:`, error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to track click',
      details: error.message 
    });
  }
});

// Get active surveys for home page
app.get('/api/surveys/active', async (req, res) => {
  try {
    const surveyLinks = await loadSurveyLinks();
    const surveyProviders = await loadSurveyProviders();
    
    // Filter only active surveys
    const activeSurveys = surveyLinks.filter(survey => survey.status === 'Active');
    
    // Enhance surveys with provider information
    const enhancedSurveys = activeSurveys.map(survey => {
      const provider = surveyProviders.find(p => p.id === survey.providerId);
      return {
        ...survey,
        providerName: provider ? provider.name : 'Unknown Provider',
        providerButtonText: provider ? provider.buttonText : 'Start Survey',
        providerColorCode: provider ? provider.colorCode : '#3498db'
      };
    });
    
    res.json(enhancedSurveys);
  } catch (error) {
    console.error('Error fetching active surveys:', error);
    res.status(500).json({ error: 'Failed to fetch active surveys' });
  }
});

app.listen(PORT, () => {
  console.log(`Postback receiver server running on http://localhost:${PORT}`);
});
