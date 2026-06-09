'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

/**
 * Convert flat DB rows into a nested object keyed by section_key → content_key.
 * e.g. { hero: { title: '...', subtitle: '...' }, about: { title: '...' } }
 */
function rowsToNested(rows) {
  return rows.reduce((acc, row) => {
    if (!acc[row.section_key]) acc[row.section_key] = {};
    acc[row.section_key][row.content_key] = row.value;
    return acc;
  }, {});
}

// GET /api/content  – public, all content as nested object
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT section_key, content_key, value FROM site_content ORDER BY section_key, id').all();
  return res.json(rowsToNested(rows));
});

// GET /api/content/:section  – public, specific section
router.get('/:section', (req, res) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT content_key, value FROM site_content WHERE section_key = ? ORDER BY id'
  ).all(req.params.section);

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Bölüm bulunamadı.' });
  }

  const result = rows.reduce((acc, row) => {
    acc[row.content_key] = row.value;
    return acc;
  }, {});

  return res.json(result);
});

// PUT /api/content  – admin, update single content entry
router.put('/', authenticate, adminOnly, (req, res) => {
  const { section_key, content_key, value } = req.body;

  if (!section_key || !content_key) {
    return res.status(400).json({ error: 'section_key ve content_key zorunludur.' });
  }

  const db = getDb();
  db.prepare(`
    INSERT INTO site_content (section_key, content_key, value, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(section_key, content_key)
    DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(section_key, content_key, value !== undefined ? value : null);

  const updated = db.prepare(
    'SELECT * FROM site_content WHERE section_key = ? AND content_key = ?'
  ).get(section_key, content_key);

  return res.json(updated);
});

// POST /api/content/bulk  – admin, update multiple entries at once
// Body: { updates: [{ section_key, content_key, value }, ...] }
router.post('/bulk', authenticate, adminOnly, (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'updates dizisi gereklidir.' });
  }

  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO site_content (section_key, content_key, value, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(section_key, content_key)
    DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  const runAll = db.transaction((items) => {
    for (const item of items) {
      if (!item.section_key || !item.content_key) continue;
      upsert.run(item.section_key, item.content_key, item.value !== undefined ? item.value : null);
    }
  });

  runAll(updates);

  // Return the updated nested content
  const rows = db.prepare('SELECT section_key, content_key, value FROM site_content ORDER BY section_key, id').all();
  return res.json(rowsToNested(rows));
});

module.exports = router;
