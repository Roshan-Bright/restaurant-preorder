// backend/server.js
require('dotenv').config();

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');

const authRoutes        = require('./routes/auth');
const restaurantRoutes  = require('./routes/restaurants');
const orderRoutes       = require('./routes/orders');
const socketHandler     = require('./socket/socketHandler');

// ─── App setup ────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

// Make io accessible in route handlers via req.app.get('io')
app.set('io', io);
socketHandler(io);

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api',              restaurantRoutes);   // /api/locations, /api/restaurants
app.use('/api/orders',       orderRoutes);

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'Restaurant Pre-Order API is running 🍽️' })
);

// ─── 404 handler ──────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` })
);

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO listening for connections`);
});
