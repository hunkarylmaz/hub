'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

function parseTestimonial(row) {
  if (!row) return null;
  return { ...row, active: Boolean(row.active) };
}

// GET /api/testimonials  – public, only active
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM testimonials WHERE active = 1 ORDER BY order_num ASC, id ASC'
  ).all();
  return res.json(rows.map(parseTestimonial));
});

// GET /api/testimonials/all  – admin, all
router.get('/all', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM testimonials ORDER BY order_num ASC, id ASC').all();
  return res.json(rows.map(parseTestimonial));
});

// GET /api/testimonials/:id  – admin
router.get('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Referans bulunamadı.' });
  return res.json(parseTestimonial(row));
});

// POST /api/testimonials  – admin
router.post('/', authenticate, adminOnly, (req, res) => {
  const { name, company, position, text, rating, avatar, active, order_num } = req.body;

  if (!name || !text) {
    return res.status(400).json({ error: 'Ad ve yorum metni zorunludur.' });
  }

  const ratingNum = parseInt(rating, 10);
  if (ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Puan 1-5 arasında olmalıdır.' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO testimonials (name, company, position, text, rating, avatar, active, order_num)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(), company || null, position || null, text.trim(),
    ratingNum || 5, avatar || null,
    active !== undefined ? (active ? 1 : 0) : 1,
    order_num || 0
  );

  const created = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(parseTestimonial(created));
});

// PUT /api/testimonials/:id  – admin
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Referans bulunamadı.' });

  const { name, company, position, text, rating, avatar, active, order_num } = req.body;

  if (rating !== undefined) {
    const ratingNum = parseInt(rating, 10);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Puan 1-5 arasında olmalıdır.' });
    }
  }

  db.prepare(`
    UPDATE testimonials SET
      name      = ?,
      company   = ?,
      position  = ?,
      text      = ?,
      rating    = ?,
      avatar    = ?,
      active    = ?,
      order_num = ?
    WHERE id = ?
  `).run(
    name      !== undefined ? name.trim()     : existing.name,
    company   !== undefined ? company         : existing.company,
    position  !== undefined ? position        : existing.position,
    text      !== undefined ? text.trim()     : existing.text,
    rating    !== undefined ? parseInt(rating, 10) : existing.rating,
    avatar    !== undefined ? avatar          : existing.avatar,
    active    !== undefined ? (active ? 1 : 0) : existing.active,
    order_num !== undefined ? order_num       : existing.order_num,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(req.params.id);
  return res.json(parseTestimonial(updated));
});

// DELETE /api/testimonials/:id  – admin
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM testimonials WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Referans bulunamadı.' });

  db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Referans silindi.' });
});

// PUT /api/testimonials/:id/toggle  – admin
router.put('/:id/toggle', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id, active FROM testimonials WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Referans bulunamadı.' });

  const newActive = existing.active ? 0 : 1;
  db.prepare('UPDATE testimonials SET active = ? WHERE id = ?').run(newActive, req.params.id);
  return res.json({ id: existing.id, active: Boolean(newActive) });
});

module.exports = router;
