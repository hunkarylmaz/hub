'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

function parseAnnouncement(row) {
  if (!row) return null;
  return { ...row, active: Boolean(row.active) };
}

// GET /api/announcements  – public, active announcements
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM announcements WHERE active = 1 ORDER BY order_num ASC, id ASC'
  ).all();
  return res.json(rows.map(parseAnnouncement));
});

// GET /api/announcements/all  – admin, all
router.get('/all', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM announcements ORDER BY order_num ASC, id ASC').all();
  return res.json(rows.map(parseAnnouncement));
});

// GET /api/announcements/:id  – admin
router.get('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Duyuru bulunamadı.' });
  return res.json(parseAnnouncement(row));
});

// POST /api/announcements  – admin
router.post('/', authenticate, adminOnly, (req, res) => {
  const { text, color, active, order_num } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Duyuru metni zorunludur.' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO announcements (text, color, active, order_num)
    VALUES (?, ?, ?, ?)
  `).run(
    text.trim(),
    color || '#3B82F6',
    active !== undefined ? (active ? 1 : 0) : 1,
    order_num || 0
  );

  const created = db.prepare('SELECT * FROM announcements WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(parseAnnouncement(created));
});

// PUT /api/announcements/:id  – admin
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Duyuru bulunamadı.' });

  const { text, color, active, order_num } = req.body;

  db.prepare(`
    UPDATE announcements SET
      text      = ?,
      color     = ?,
      active    = ?,
      order_num = ?
    WHERE id = ?
  `).run(
    text      !== undefined ? text.trim()      : existing.text,
    color     !== undefined ? color            : existing.color,
    active    !== undefined ? (active ? 1 : 0) : existing.active,
    order_num !== undefined ? order_num        : existing.order_num,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
  return res.json(parseAnnouncement(updated));
});

// DELETE /api/announcements/:id  – admin
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM announcements WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Duyuru bulunamadı.' });

  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Duyuru silindi.' });
});

// PUT /api/announcements/:id/toggle  – admin
router.put('/:id/toggle', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id, active FROM announcements WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Duyuru bulunamadı.' });

  const newActive = existing.active ? 0 : 1;
  db.prepare('UPDATE announcements SET active = ? WHERE id = ?').run(newActive, req.params.id);
  return res.json({ id: existing.id, active: Boolean(newActive) });
});

module.exports = router;
