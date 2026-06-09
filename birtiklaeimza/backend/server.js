'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');

// ── Database ───────────────────────────────────────────────────────────────
const { initDatabase } = require('./db/database');

// ── Routes ─────────────────────────────────────────────────────────────────
const authRoutes          = require('./routes/auth');
const productRoutes       = require('./routes/products');
const pricingRoutes       = require('./routes/pricing');
const contentRoutes       = require('./routes/content');
const contactRoutes       = require('./routes/contacts');
const orderRoutes         = require('./routes/orders');
const testimonialRoutes   = require('./routes/testimonials');
const faqRoutes           = require('./routes/faq');
const settingsRoutes      = require('./routes/settings');
const announcementRoutes  = require('./routes/announcements');

// ── App Setup ──────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://birtiklaeimza.com',
  'https://www.birtiklaeimza.com'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin '${origin}' not allowed`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Body Parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Bir Tıkla e-İmza API',
    timestamp: new Date().toISOString()
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/products',      productRoutes);
app.use('/api/pricing',       pricingRoutes);
app.use('/api/content',       contentRoutes);
app.use('/api/contacts',      contactRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/testimonials',  testimonialRoutes);
app.use('/api/faq',           faqRoutes);
app.use('/api/settings',      settingsRoutes);
app.use('/api/announcements', announcementRoutes);

// ── Static Frontend (production) ──────────────────────────────────────────
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
const fs = require('fs');

if (process.env.NODE_ENV === 'production' && fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));

  // SPA fallback – serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint bulunamadı.' });
    }
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
} else {
  // Development 404 for unknown routes
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint bulunamadı.' });
    }
    res.status(404).json({ error: 'Kaynak bulunamadı.' });
  });
}

// ── Global Error Handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // CORS errors
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }

  // JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Geçersiz JSON formatı.' });
  }

  console.error('[ERROR]', err.message || err);
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Sunucu hatası oluştu.'
      : (err.message || 'Bilinmeyen hata.')
  });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────
function start() {
  try {
    initDatabase();
    console.log('[DB] Veritabanı başarıyla başlatıldı.');
  } catch (err) {
    console.error('[DB] Veritabanı başlatılamadı:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║        Bir Tıkla e-İmza  –  Backend API          ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Sunucu    : http://localhost:${PORT}                 ║`);
    console.log(`║  Ortam     : ${(process.env.NODE_ENV || 'development').padEnd(36)}║`);
    console.log('║  Endpoints : /api/health  /api/auth  /api/...    ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
  });
}

start();

module.exports = app; // export for testing
