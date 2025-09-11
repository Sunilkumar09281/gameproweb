// backend/server.js
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000; // Use Render's PORT environment variable
const DATA_DIR = path.join(__dirname, "data");
const CLICK_FILE = path.join(DATA_DIR, "clicks.ndjson");

// CORS setup - Include your frontend domain
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || 
  "http://localhost:3000,https://gamepro.pw,https://your-frontend-domain.com,https://your-frontend-domain.netlify.app,https://your-frontend-domain.vercel.app"
).split(",").map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn("Blocked CORS origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    credentials: true,
  })
);

// Trust proxy for Render deployment
app.set('trust proxy', 1);

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ----------------- Helpers -----------------
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error("mkdir error", e);
  }
}

async function persistClick(clickObj) {
  const line = JSON.stringify(clickObj) + "\n";
  await ensureDataDir();
  await fs.appendFile(CLICK_FILE, line, "utf8");
}

// Function to get real client IP (optimized for Render)
function getRealClientIP(req) {
  // Render uses X-Forwarded-For header
  let ip = 
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
    req.headers['x-real-ip'] ||                  
    req.connection?.remoteAddress ||             
    req.socket?.remoteAddress ||                 
    req.connection?.socket?.remoteAddress ||     
    req.ip ||                                    
    'unknown';

  // Clean up IPv6 mapped IPv4 addresses
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  // Handle localhost for development
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return '127.0.0.1';
  }

  return ip;
}

// ----------------- Tracking Endpoint -----------------
app.post("/api/track-click", async (req, res) => {
  try {
    const {
      eventType = "click",
      sessionId = null,
      gameId = null,
      gameTitle = null,
      userId = null,
      startTime = null,
      timeSpent = null,
      conversionId = null,
      metadata = null,
      ua = null,
      device = null,
    } = req.body || {};

    // Get the real client IP
    const clientIP = getRealClientIP(req);
    
    console.log('=== TRACKING REQUEST ===');
    console.log('Client IP detected:', clientIP);
    console.log('Game Title:', gameTitle);
    console.log('User ID:', userId);
    console.log('Headers (relevant):', {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip'],
      'user-agent': req.headers['user-agent'],
      'origin': req.headers['origin']
    });

    // Geo lookup
    let geo = null;
    try {
      if (clientIP && clientIP !== '127.0.0.1' && clientIP !== 'localhost' && clientIP !== 'unknown') {
        console.log(`Attempting geo lookup for IP: ${clientIP}`);
        
        // Add timeout to geo lookup
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`https://ipapi.co/${clientIP}/json/`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const geoData = await response.json();
          console.log('Geo data received:', geoData);
          
          // Check for error in response
          if (geoData.error) {
            console.log('Geo API error:', geoData.reason);
            throw new Error(geoData.reason);
          }
          
          geo = {
            city: geoData.city || null,
            region: geoData.region || null,
            country: geoData.country_name || null,
            countryCode: geoData.country_code || null,
            latitude: geoData.latitude || null,
            longitude: geoData.longitude || null,
          };
        } else {
          console.log('Geo API response not ok:', response.status);
        }
      } else {
        // For localhost/development
        geo = { 
          city: "Local", 
          region: "Local", 
          country: "Localhost", 
          countryCode: "LC" 
        };
      }
    } catch (error) {
      console.error('Geo lookup failed:', error.message);
      geo = { 
        city: "Unknown", 
        region: "Unknown", 
        country: "Unknown", 
        countryCode: "XX",
        error: error.message
      };
    }

    // Duration calculation
    let duration = timeSpent;
    if (eventType === "session_end" && startTime) {
      duration = Math.floor(
        (Date.now() - new Date(startTime).getTime()) / 1000
      );
    }

    // Create entry
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventType,
      sessionId,
      gameId,
      gameTitle,
      userId,
      startTime: startTime || new Date().toISOString(),
      timeSpent: duration,
      conversionId,
      ua: ua || req.headers["user-agent"] || null,
      device: device || null,
      ip: clientIP,
      geo,
      metadata: metadata || null,
      timestamp: new Date().toISOString(),
      // Add server info for debugging
      server: {
        environment: process.env.NODE_ENV || 'development',
        platform: 'render'
      }
    };

    console.log('Entry created successfully');
    console.log('======================');

    await persistClick(entry);
    return res.status(201).json({ 
      ok: true, 
      ip: clientIP, 
      geo,
      message: 'Tracked successfully' 
    });
    
  } catch (err) {
    console.error("=== TRACKING ERROR ===");
    console.error(err);
    console.error("=====================");
    return res.status(500).json({ error: "internal", details: err.message });
  }
});

// ----------------- Clicks Reader -----------------
app.get("/api/clicks", async (req, res) => {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(CLICK_FILE, "utf8").catch(() => "");
    const lines = raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l));

    const { sessionId, eventType, limit = 500 } = req.query;
    let out = lines;
    if (sessionId) out = out.filter((x) => x.sessionId === sessionId);
    if (eventType) out = out.filter((x) => x.eventType === eventType);
    out = out.slice(-Math.min(10000, Number(limit))).reverse();

    res.json(out);
  } catch (err) {
    console.error("GET /api/clicks error:", err);
    res.status(500).json({ error: "cannot read" });
  }
});

// ----------------- Game Endpoints -----------------
const GAMES_FILE = path.join(DATA_DIR, "games.json");

async function readGames() {
  try {
    await ensureDataDir();
    const text = await fs.readFile(GAMES_FILE, "utf8");
    return JSON.parse(text || "[]");
  } catch (e) {
    if (e.code === "ENOENT") return [];
    console.error("readGames error", e);
    return [];
  }
}

async function writeGames(games) {
  await ensureDataDir();
  await fs.writeFile(GAMES_FILE, JSON.stringify(games, null, 2), "utf8");
}

app.get("/api/games", async (req, res) => {
  try {
    const games = await readGames();
    res.json(games);
  } catch (err) {
    console.error("GET /api/games error:", err);
    res.status(500).json({ error: "cannot_read_games" });
  }
});

app.post("/api/games", async (req, res) => {
  try {
    const { title, genre, rating, image, link } = req.body || {};
    if (!title) return res.status(400).json({ error: "title_required" });

    const games = await readGames();
    const id = Date.now().toString();
    const newGame = {
      id,
      title,
      genre: genre || "",
      rating: rating || "",
      image: image || "",
      link: link || "",
      createdAt: new Date().toISOString(),
    };

    games.push(newGame);
    await writeGames(games);
    res.status(201).json(newGame);
  } catch (err) {
    console.error("POST /api/games error:", err);
    res.status(500).json({ error: "cannot_add_game" });
  }
});

app.delete("/api/games/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const games = await readGames();
    const filtered = games.filter((g) => String(g.id) !== String(id));
    await writeGames(filtered);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/games/:id error:", err);
    res.status(500).json({ error: "cannot_delete_game" });
  }
});

// ----------------- Game Endpoints -----------------
// ... your /api/games endpoints ...

// ✅ ADD THIS *ABOVE* the catch-all:
app.get('/', (req, res) => {
  res.send('✅ GamePro tracking backend is running on Render.');
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ----------------- Start Server -----------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Tracking server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Backend URL: https://gameproback.onrender.com`);
  console.log(`📍 Trust proxy enabled for IP detection`);
});

