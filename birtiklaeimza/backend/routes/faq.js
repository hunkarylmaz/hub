'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

function parseFaq(row) {
  if (!row) return null;
  return { ...row, active: Boolean(row.active) };
}

// GET /api/faq  – public, active entries
router.get('/', (req, res) => {
  const db = getDb();
  const { category } = req.query;

  let query = 'SELECT * FROM faq WHERE active = 1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY order_num ASC, id ASC';

  const rows = db.prepare(query).all(...params);
  return res.json(rows.map(parseFaq));
});

// GET /api/faq/all  – admin, all entries
router.get('/all', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM faq ORDER BY order_num ASC, id ASC').all();
  return res.json(rows.map(parseFaq));
});

// GET /api/faq/categories  – public, distinct active categories
router.get('/categories', (req, res) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT DISTINCT category FROM faq WHERE active = 1 AND category IS NOT NULL ORDER BY category'
  ).all();
  return res.json(rows.map((r) => r.category));
});

// GET /api/faq/:id  – admin
router.get('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM faq WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'SSS kaydı bulunamadı.' });
  return res.json(parseFaq(row));
});

// POST /api/faq  – admin
router.post('/', authenticate, adminOnly, (req, res) => {
  const { question, answer, category, order_num, active } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Soru ve cevap zorunludur.' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO faq (question, answer, category, order_num, active)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    question.trim(), answer.trim(),
    category || 'genel',
    order_num || 0,
    active !== undefined ? (active ? 1 : 0) : 1
  );

  const created = db.prepare('SELECT * FROM faq WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(parseFaq(created));
});

// PUT /api/faq/:id  – admin
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM faq WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'SSS kaydı bulunamadı.' });

  const { question, answer, category, order_num, active } = req.body;

  db.prepare(`
    UPDATE faq SET
      question  = ?,
      answer    = ?,
      category  = ?,
      order_num = ?,
      active    = ?
    WHERE id = ?
  `).run(
    question  !== undefined ? question.trim()  : existing.question,
    answer    !== undefined ? answer.trim()    : existing.answer,
    category  !== undefined ? category         : existing.category,
    order_num !== undefined ? order_num        : existing.order_num,
    active    !== undefined ? (active ? 1 : 0) : existing.active,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM faq WHERE id = ?').get(req.params.id);
  return res.json(parseFaq(updated));
});

// DELETE /api/faq/:id  – admin
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM faq WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'SSS kaydı bulunamadı.' });

  db.prepare('DELETE FROM faq WHERE id = ?').run(req.params.id);
  return res.json({ message: 'SSS kaydı silindi.' });
});

// PUT /api/faq/:id/toggle  – admin
router.put('/:id/toggle', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id, active FROM faq WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'SSS kaydı bulunamadı.' });

  const newActive = existing.active ? 0 : 1;
  db.prepare('UPDATE faq SET active = ? WHERE id = ?').run(newActive, req.params.id);
  return res.json({ id: existing.id, active: Boolean(newActive) });
});

module.exports = router;
