// backend/server.js
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, "data");
const CLICK_FILE = path.join(DATA_DIR, "clicks.ndjson");

// Enhanced CORS setup for production deployment
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

// Enhanced proxy trust configuration for better IP detection
app.set('trust proxy', true); // Trust all proxies for IP detection

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

// Enhanced function to get real client IP (works with Render, Netlify, Vercel, etc.)
function getRealClientIP(req) {
  // Check multiple headers in order of preference
  let ip = 
    req.headers['cf-connecting-ip'] ||          // Cloudflare
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || // Standard proxy header
    req.headers['x-real-ip'] ||                 // Nginx proxy
    req.headers['x-client-ip'] ||               // Apache proxy
    req.headers['x-forwarded'] ||               // General forwarded
    req.headers['x-cluster-client-ip'] ||       // Cluster
    req.connection?.remoteAddress ||            // Connection
    req.socket?.remoteAddress ||                // Socket
    req.connection?.socket?.remoteAddress ||    // Connection socket
    req.ip ||                                   // Express IP
    'unknown';

  // Clean up IPv6 mapped IPv4 addresses
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  // Handle localhost for development
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return '127.0.0.1';
  }

  // Remove port numbers if present
  if (ip && ip.includes(':') && !ip.includes('::')) {
    ip = ip.split(':')[0];
  }

  return ip || 'unknown';
}

// Enhanced geo lookup with multiple fallbacks
async function getGeoLocation(ip) {
  if (!ip || ip === '127.0.0.1' || ip === 'localhost' || ip === 'unknown') {
    return { 
      city: "Local", 
      region: "Local", 
      country: "Localhost", 
      countryCode: "LC",
      latitude: null,
      longitude: null 
    };
  }

  const geoServices = [
    `https://ipapi.co/${ip}/json/`,
    `https://ipinfo.io/${ip}/json`,
    `https://ip-api.com/json/${ip}`
  ];

  for (const serviceUrl of geoServices) {
    try {
      console.log(`Attempting geo lookup for IP: ${ip} using ${serviceUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(serviceUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'GamePro-Tracker/1.0'
        }
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const geoData = await response.json();
        console.log(`Geo data received from ${serviceUrl}:`, geoData);
        
        // Handle different API response formats
        let geo = {};
        
        if (serviceUrl.includes('ipapi.co')) {
          if (geoData.error) {
            console.log('ipapi.co error:', geoData.reason);
            continue;
          }
          geo = {
            city: geoData.city || null,
            region: geoData.region || null,
            country: geoData.country_name || null,
            countryCode: geoData.country_code || null,
            latitude: geoData.latitude || null,
            longitude: geoData.longitude || null,
          };
        } else if (serviceUrl.includes('ipinfo.io')) {
          const loc = geoData.loc ? geoData.loc.split(',') : [null, null];
          geo = {
            city: geoData.city || null,
            region: geoData.region || null,
            country: geoData.country || null,
            countryCode: geoData.country || null,
            latitude: loc[0] ? parseFloat(loc[0]) : null,
            longitude: loc[1] ? parseFloat(loc[1]) : null,
          };
        } else if (serviceUrl.includes('ip-api.com')) {
          if (geoData.status === 'fail') {
            console.log('ip-api.com error:', geoData.message);
            continue;
          }
          geo = {
            city: geoData.city || null,
            region: geoData.regionName || null,
            country: geoData.country || null,
            countryCode: geoData.countryCode || null,
            latitude: geoData.lat || null,
            longitude: geoData.lon || null,
          };
        }
        
        return geo;
      } else {
        console.log(`Geo API ${serviceUrl} response not ok:`, response.status);
      }
    } catch (error) {
      console.error(`Geo lookup failed for ${serviceUrl}:`, error.message);
    }
  }

  // Return unknown if all services fail
  return { 
    city: "Unknown", 
    region: "Unknown", 
    country: "Unknown", 
    countryCode: "XX",
    latitude: null,
    longitude: null,
    error: "All geo services failed"
  };
}

// ----------------- Enhanced Tracking Endpoint -----------------
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

    // Get the real client IP using enhanced detection
    const clientIP = getRealClientIP(req);
    
    console.log('=== TRACKING REQUEST ===');
    console.log('Client IP detected:', clientIP);
    console.log('Game Title:', gameTitle);
    console.log('User ID:', userId);
    console.log('All Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request IP info:', {
      'req.ip': req.ip,
      'connection.remoteAddress': req.connection?.remoteAddress,
      'socket.remoteAddress': req.socket?.remoteAddress,
    });

    // Enhanced geo lookup with multiple service fallbacks
    const geo = await getGeoLocation(clientIP);

    // Duration calculation
    let duration = timeSpent;
    if (eventType === "session_end" && startTime) {
      duration = Math.floor(
        (Date.now() - new Date(startTime).getTime()) / 1000
      );
    }

    // Create comprehensive entry
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
      // Add comprehensive server info for debugging
      server: {
        environment: process.env.NODE_ENV || 'development',
        platform: 'render',
        headers: {
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'x-real-ip': req.headers['x-real-ip'],
          'cf-connecting-ip': req.headers['cf-connecting-ip'],
          'x-client-ip': req.headers['x-client-ip'],
        },
        expressIP: req.ip,
        connectionIP: req.connection?.remoteAddress,
      }
    };

    console.log('Entry created successfully:', JSON.stringify(entry, null, 2));
    console.log('======================');

    await persistClick(entry);
    return res.status(201).json({ 
      ok: true, 
      ip: clientIP, 
      geo,
      message: 'Tracked successfully',
      debug: {
        detectedIP: clientIP,
        geoService: geo.error ? 'failed' : 'success',
        timestamp: entry.timestamp
      }
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

// Catch-all for undefined routes
// ✅ Express v5+ catch-all syntax
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


// ----------------- Start Server -----------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Tracking server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Backend URL: https://gameproback.onrender.com`);
  console.log(`🔍 Enhanced IP detection enabled`);
  console.log(`🛡️  Trust proxy: enabled for accurate IP detection`);
});
