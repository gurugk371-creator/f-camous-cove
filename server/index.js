/* ================================================================
   index.js — Campus Vote Express Server
   Amrapali University Head Boy Election System
   ================================================================ */

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const rateLimit  = require('express-rate-limit');

const connectDB   = require('./config/db');
const seedFromJSON = require('./config/seed');

// Connect Database
connectDB().then(() => {
  // Migrate local JSON to Mongo on first run
  seedFromJSON();
});

// ── Route Modules
const authRoutes       = require('./routes/auth');
const voteRoutes       = require('./routes/vote');
const candidateRoutes  = require('./routes/candidates');
const resultsRoutes    = require('./routes/results');
const electionRoutes   = require('./routes/election');

// ── App & Config
const app  = express();
const PORT = process.env.PORT || 5500;
const ENV  = process.env.NODE_ENV || 'development';

// ─────────────────────────────────────────────
//   MIDDLEWARE
// ─────────────────────────────────────────────

// Security headers
app.use(helmet({
  // Allow inline scripts/styles for the frontend
  contentSecurityPolicy: false
}));

// CORS — allow frontend origin
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? '*' : allowedOrigin.split(',').map(o => o.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
app.use(morgan(ENV === 'production' ? 'combined' : 'dev'));

// Parse JSON bodies
app.use(express.json({ limit: '5mb' }));  // 5MB limit (for base64 photos)
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
//   RATE LIMITING
// ─────────────────────────────────────────────

// General API limiter — relaxed for development/testing
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // increased from 200
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Strict limiter for voting — relaxed for testing
const voteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // increased from 5
  message: { success: false, message: 'Too many vote attempts from this IP.' }
});

// Auth limiter — relaxed for testing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // increased from 10
  message: { success: false, message: 'Too many login attempts. Please try again later.' }
});

// app.use('/api/', generalLimiter); // DISABLED as requested

// ─────────────────────────────────────────────
//   STATIC FILES — Serve the frontend
// ─────────────────────────────────────────────

// Serve the 'client' folder as static
const frontendPath = path.join(__dirname, '..', 'client');
app.use(express.static(frontendPath, {
  // Don't serve the server folder itself
  extensions: ['html', 'css', 'js', 'jpg', 'png', 'gif', 'svg', 'ico', 'json']
}));

// ─────────────────────────────────────────────
//   API ROUTES
// ─────────────────────────────────────────────

app.use('/api/auth',        authRoutes);
app.use('/api/vote',        voteRoutes);
app.use('/api/candidates',  candidateRoutes);
app.use('/api/results',     resultsRoutes);
app.use('/api/election',    electionRoutes);

// Legacy: /api/data (used by original script.js)
app.get('/api/data', async (req, res) => {
  try {
    const Candidate = require('./models/Candidate');
    const cands = await Candidate.find();
    const db = { candidates: {}, votes: {} };
    
    cands.forEach(c => {
      if (!db.candidates[c.course]) db.candidates[c.course] = [];
      if (!db.votes[c.course]) db.votes[c.course] = {};
      
      db.candidates[c.course].push(c);
      db.votes[c.course][c.id] = c.votes;
    });
    
    return res.json(db);
  } catch (err) { res.json({}); }
});

app.post('/api/data', (req, res) => {
  // Deprecated in Mongo mode
  return res.json({ success: true });
});

// ─────────────────────────────────────────────
//   HEALTH CHECK
// ─────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status:  'OK',
    server:  'CampusVote API',
    version: '1.0.0',
    time:    new Date().toISOString(),
    env:     ENV
  });
});

// ─────────────────────────────────────────────
//   CATCH-ALL — Serve frontend index.html
// ─────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ─────────────────────────────────────────────
//   ERROR HANDLER
// ─────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: ENV === 'production' ? 'Internal server error.' : err.message
  });
});

// ─────────────────────────────────────────────
//   START SERVER & REAL-TIME SOCKETS
// ─────────────────────────────────────────────

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigin === '*' ? '*' : allowedOrigin.split(',').map(o => o.trim()),
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('⚡ Client connected to real-time sockets:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected from sockets:', socket.id);
  });
});

// Expose Socket.io instance globally through express application configuration
app.set('io', io);

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║   🗳️  CampusVote Backend Server           ║');
  console.log('  ║   Amrapali University Elections           ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`  🚀  Server    : http://localhost:${PORT}`);
  console.log(`  🌐  Frontend  : http://localhost:${PORT}`);
  console.log(`  📡  API Base  : http://localhost:${PORT}/api`);
  console.log(`  💚  Health    : http://localhost:${PORT}/api/health`);
  console.log(`  🔧  Mode      : ${ENV}`);
  console.log('');
  console.log('  API Endpoints:');
  console.log('  ─────────────────────────────────────────');
  console.log('  POST  /api/auth/faculty-login');
  console.log('  POST  /api/vote');
  console.log('  GET   /api/vote/check?email=&mobile=&rollNo=');
  console.log('  GET   /api/candidates');
  console.log('  GET   /api/candidates/:course');
  console.log('  POST  /api/candidates/:course       [Faculty]');
  console.log('  PUT   /api/candidates/:course/:id   [Faculty]');
  console.log('  DELETE /api/candidates/:course/:id  [Faculty]');
  console.log('  GET   /api/results                  [Faculty]');
  console.log('  GET   /api/results/:course          [Faculty]');
  console.log('  POST  /api/results/reset            [Faculty]');
  console.log('  POST  /api/results/toggle           [Faculty]');
  console.log('  GET   /api/health');
  console.log('  ─────────────────────────────────────────');
  console.log('');
});
