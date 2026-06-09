'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Keys that are safe to expose publicly (non-sensitive)
const PUBLIC_KEYS = new Set([
  'site_title', 'site_description', 'site_url',
  'phone', 'phone_2', 'phone_display',
  'email',
  'address',
  'whatsapp',
  'working_hours',
  'facebook', 'twitter', 'instagram', 'linkedin',
  'footer_text',
  'meta_keywords',
  'logo_text',
  'maintenance_mode'
]);

// GET /api/settings  – public, non-sensitive keys only
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings ORDER BY key').all();

  const result = rows.reduce((acc, row) => {
    if (PUBLIC_KEYS.has(row.key)) {
      acc[row.key] = row.value;
    }
    return acc;
  }, {});

  return res.json(result);
});

// GET /api/settings/all  – admin, all settings
router.get('/all', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM settings ORDER BY key').all();

  const result = rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  return res.json(result);
});

// GET /api/settings/:key  – public for safe keys, admin for others
router.get('/:key', (req, res, next) => {
  const { key } = req.params;
  const db = getDb();
  const row = db.prepare('SELECT key, value, updated_at FROM settings WHERE key = ?').get(key);

  if (!row) return res.status(404).json({ error: 'Ayar bulunamadı.' });

  // Non-public keys require auth — delegate to next handler
  if (!PUBLIC_KEYS.has(key)) {
    return next();
  }

  return res.json({ key: row.key, value: row.value });
}, authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM settings WHERE key = ?').get(req.params.key);
  if (!row) return res.status(404).json({ error: 'Ayar bulunamadı.' });
  return res.json(row);
});

// PUT /api/settings  – admin, update multiple settings at once
// Body: { key: value, key2: value2, ... }  OR  { updates: { key: value, ... } }
router.put('/', authenticate, adminOnly, (req, res) => {
  const db = getDb();

  // Accept both flat body and { updates: {} } format
  const updates = req.body.updates && typeof req.body.updates === 'object'
    ? req.body.updates
    : req.body;

  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ error: 'Geçerli bir ayar nesnesi gönderin.' });
  }

  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key)
    DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  const runAll = db.transaction((entries) => {
    for (const [key, value] of entries) {
      if (key === 'updates') continue; // skip wrapper key if accidentally included
      upsert.run(key, value !== null && value !== undefined ? String(value) : null);
    }
  });

  runAll(Object.entries(updates));

  // Return all updated settings
  const rows = db.prepare('SELECT key, value, updated_at FROM settings ORDER BY key').all();
  const result = rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  return res.json(result);
});

// PUT /api/settings/:key  – admin, update a single setting
router.put('/:key', authenticate, adminOnly, (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  const db = getDb();
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key)
    DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(key, value !== undefined ? String(value) : null);

  const updated = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
  return res.json(updated);
});

module.exports = router;
