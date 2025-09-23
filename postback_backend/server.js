const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const proxyRouter = require('./proxy');
const fs = require('fs').promises;
const multer = require('multer');

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
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

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

const cheerio = require('cheerio');

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

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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

// Endpoint to receive postbacks (both GET and POST) with partner tracking
app.all('/api/receive-postback', async (req, res) => {
  const partnerId = req.query.partner_id || req.body?.partner_id || 'unknown';
  
  // Find partner info if partner_id is provided
  let partnerInfo = null;
  if (partnerId !== 'unknown') {
    const partners = await loadPartners();
    partnerInfo = partners.find(p => p.id === partnerId);
  }
  
  const requestData = {
    id: uuidv4(), // Unique ID for this postback
    method: req.method,
    receivedAt: new Date().toISOString(),
    partnerId: partnerId,
    partnerName: partnerInfo?.name || 'Unknown Partner',
    query: req.query,  // Always include query parameters
    headers: req.headers,
    ip: req.ip,
  };

  // For POST/PUT/PATCH with body
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && Object.keys(req.body).length > 0) {
    requestData.body = req.body;
  }
  // For GET/DELETE or when no body is present
  else if (Object.keys(req.query).length > 0) {
    requestData.body = req.query;
  }
  
  const postbacks = await loadPostbacks();
  postbacks.push(requestData);
  await savePostbacks(postbacks);
  
  // Update partner stats if partner exists
  if (partnerInfo) {
    const partners = await loadPartners();
    const partnerIndex = partners.findIndex(p => p.id === partnerId);
    if (partnerIndex !== -1) {
      partners[partnerIndex].totalPostbacks = (partners[partnerIndex].totalPostbacks || 0) + 1;
      partners[partnerIndex].lastPostbackAt = new Date().toISOString();
      await savePartners(partners);
    }
  }
  
  // Return a simple response
  res.status(200).json({ 
    success: true, 
    message: 'Postback received', 
    method: req.method,
    partnerId: partnerId,
    partnerName: requestData.partnerName,
    postbackId: requestData.id,
    data: requestData 
  });
});

// Endpoint to get all received postbacks
app.get('/api/received-postbacks', async (req, res) => {
  const postbacks = await loadPostbacks();
  res.json(postbacks);
});

// Optional: clear postbacks
app.delete('/api/received-postbacks', async (req, res) => {
  await savePostbacks([]);
  res.json({ message: 'All postbacks cleared' });
});

// Partner Management Endpoints

// Get all partners
app.get('/api/partners', async (req, res) => {
  const partners = await loadPartners();
  res.json(partners);
});

// Create a new partner
app.post('/api/partners', async (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Partner name is required' });
  }
  
  const partnerId = uuidv4();
  const newPartner = {
    id: partnerId,
    name: name.trim(),
    description: description?.trim() || '',
    createdAt: new Date().toISOString(),
    totalPostbacks: 0,
    lastPostbackAt: null,
    postbackUrl: `${req.protocol}://${req.get('host')}/api/receive-postback?partner_id=${partnerId}`,
    status: 'active'
  };
  
  const partners = await loadPartners();
  partners.push(newPartner);
  await savePartners(partners);
  
  res.status(201).json({
    success: true,
    message: 'Partner created successfully',
    partner: newPartner
  });
});

// Update a partner
app.put('/api/partners/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  
  const partners = await loadPartners();
  const partnerIndex = partners.findIndex(p => p.id === id);
  
  if (partnerIndex === -1) {
    return res.status(404).json({ error: 'Partner not found' });
  }
  
  if (name) partners[partnerIndex].name = name.trim();
  if (description !== undefined) partners[partnerIndex].description = description.trim();
  if (status) partners[partnerIndex].status = status;
  
  partners[partnerIndex].updatedAt = new Date().toISOString();
  
  await savePartners(partners);
  
  res.json({
    success: true,
    message: 'Partner updated successfully',
    partner: partners[partnerIndex]
  });
});

// Delete a partner
app.delete('/api/partners/:id', async (req, res) => {
  const { id } = req.params;
  
  const partners = await loadPartners();
  const partnerIndex = partners.findIndex(p => p.id === id);
  
  if (partnerIndex === -1) {
    return res.status(404).json({ error: 'Partner not found' });
  }
  
  const deletedPartner = partners.splice(partnerIndex, 1)[0];
  await savePartners(partners);
  
  res.json({
    success: true,
    message: 'Partner deleted successfully',
    partner: deletedPartner
  });
});

// Get postbacks for a specific partner
app.get('/api/partners/:id/postbacks', async (req, res) => {
  const { id } = req.params;
  const { limit = 100, offset = 0 } = req.query;
  
  const postbacks = await loadPostbacks();
  const partnerPostbacks = postbacks
    .filter(p => p.partnerId === id)
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    partnerId: id,
    total: postbacks.filter(p => p.partnerId === id).length,
    postbacks: partnerPostbacks
  });
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
