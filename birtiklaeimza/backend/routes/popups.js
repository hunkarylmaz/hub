'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/popups/active - public, returns the active popup (or null)
router.get('/active', (req, res) => {
  const db = getDb();
  const popup = db.prepare('SELECT * FROM popups WHERE active=1 LIMIT 1').get();
  res.json(popup || null);
});

// GET /api/popups - admin, list all
router.get('/', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM popups ORDER BY id DESC').all());
});

// POST /api/popups - admin
router.post('/', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const { title, content, button_text, button_link, button2_text, button2_link, show_delay, show_once, bg_color, active } = req.body;
  if (active) db.prepare('UPDATE popups SET active=0').run();
  const result = db.prepare(
    `INSERT INTO popups (title, content, button_text, button_link, button2_text, button2_link, show_delay, show_once, bg_color, active)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(
    title,
    content,
    button_text || 'Hemen Sipariş Ver',
    button_link || '/urunler',
    button2_text || '',
    button2_link || '',
    show_delay || 3,
    show_once || 1,
    bg_color || 'white',
    active ? 1 : 0
  );
  res.json({ id: result.lastInsertRowid, message: 'Popup oluşturuldu' });
});

// PUT /api/popups/:id - admin
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const { title, content, button_text, button_link, button2_text, button2_link, show_delay, show_once, bg_color, active } = req.body;
  if (active) db.prepare('UPDATE popups SET active=0').run();
  db.prepare(
    `UPDATE popups SET title=?, content=?, button_text=?, button_link=?, button2_text=?, button2_link=?, show_delay=?, show_once=?, bg_color=?, active=? WHERE id=?`
  ).run(
    title,
    content,
    button_text || 'Hemen Sipariş Ver',
    button_link || '/urunler',
    button2_text || '',
    button2_link || '',
    show_delay || 3,
    show_once || 1,
    bg_color || 'white',
    active ? 1 : 0,
    req.params.id
  );
  res.json({ message: 'Popup güncellendi' });
});

// DELETE /api/popups/:id - admin
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM popups WHERE id=?').run(req.params.id);
  res.json({ message: 'Popup silindi' });
});

// PUT /api/popups/:id/toggle - admin
router.put('/:id/toggle', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const popup = db.prepare('SELECT active FROM popups WHERE id=?').get(req.params.id);
  if (!popup) return res.status(404).json({ error: 'Bulunamadı' });
  if (!popup.active) db.prepare('UPDATE popups SET active=0').run(); // deactivate all first
  db.prepare('UPDATE popups SET active=? WHERE id=?').run(popup.active ? 0 : 1, req.params.id);
  res.json({ message: 'Güncellendi', active: !popup.active });
});

module.exports = router;
