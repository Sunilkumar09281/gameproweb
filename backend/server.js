// backend/server.js
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;
const DATA_DIR = path.join(__dirname, "data");
const CLICK_FILE = path.join(DATA_DIR, "clicks.ndjson");

// ✅ CORS setup
app.use(
  cors({
    origin: "http://localhost:3000", // React frontend
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

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

// ----------------- Tracking Endpoint -----------------
app.post("/api/track-click", async (req, res) => {
  try {
    const {
      eventType = "click", // "session_start" | "click" | "session_end" | "conversion"
      sessionId = null,
      gameId = null,
      gameTitle = null,
      userId = null,
      startTime = null, // passed from frontend
      timeSpent = null, // seconds
      conversionId = null,
      metadata = null,
      ua = null,
      device = null,
    } = req.body || {};

    // capture client IP
    // capture client IP
let rawIp =
  req.headers["x-forwarded-for"]?.split(",")[0] ||
  req.socket.remoteAddress ||
  null;
if (rawIp) rawIp = rawIp.replace(/^::ffff:/, "");
let ip = rawIp === "::1" ? "127.0.0.1" : rawIp;

// === Local dev override (optional) ===
// If you want local requests to resolve to India (for example) replace 103.21.77.246
// with your public IP or remove this override for production.
if (ip === "127.0.0.1") {
  ip = "103.21.77.246";
}


    // ✅ Force India IP in local testing
    let effectiveIp = ip;
    if (ip === "127.0.0.1") {
      effectiveIp = "103.21.77.246"; // Example India IP
    }

    // geo lookup
    let geo = null;
    try {
      if (effectiveIp && effectiveIp !== "127.0.0.1") {
        const r = await fetch(`https://ipapi.co/${effectiveIp}/json/`);
        if (r.ok) {
          const js = await r.json();
          geo = {
            city: js.city || null,
            region: js.region || null,
            country: js.country_name || null,
            countryCode: js.country || js.country_code || null,
          };
        }
      } else {
        geo = { country: "Localhost", countryCode: "LC" };
      }
    } catch {
      geo = null;
    }

    // 🕒 duration calculation (always in seconds)
    let duration = timeSpent;
    if (eventType === "session_end" && startTime) {
      duration = Math.floor(
        (Date.now() - new Date(startTime).getTime()) / 1000
      );
    }

    // save entry
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventType,
      sessionId,
      gameId,
      gameTitle,
      userId,
      startTime: startTime || new Date().toISOString(), // ensure startTime is always present
      timeSpent: duration,
      conversionId,
      ua: ua || req.headers["user-agent"] || null,
      device: device || null,
      ip,
      geo,
      metadata: metadata || null,
      timestamp: new Date().toISOString(),
    };

    await persistClick(entry);
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("track error:", err);
    return res.status(500).json({ error: "internal" });
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

// ----------------- Start Server -----------------
app.listen(PORT, () => {
  console.log(`✅ Tracking server running: http://localhost:${PORT}`);
});
