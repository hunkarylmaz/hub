'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

function parsePlan(row) {
  if (!row) return null;
  return {
    ...row,
    features: (() => { try { return JSON.parse(row.features || '[]'); } catch { return []; } })(),
    popular: Boolean(row.popular),
    active: Boolean(row.active)
  };
}

// GET /api/pricing  – public, only active plans
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM pricing_plans WHERE active = 1 ORDER BY order_num ASC, id ASC'
  ).all();
  return res.json(rows.map(parsePlan));
});

// GET /api/pricing/all  – admin, all plans
router.get('/all', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM pricing_plans ORDER BY order_num ASC, id ASC').all();
  return res.json(rows.map(parsePlan));
});

// GET /api/pricing/:id
router.get('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM pricing_plans WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Plan bulunamadı.' });
  return res.json(parsePlan(row));
});

// POST /api/pricing  – admin
router.post('/', authenticate, adminOnly, (req, res) => {
  const { name, description, price, old_price, period, features, popular, color, order_num, active } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Ad ve fiyat zorunludur.' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO pricing_plans (name, description, price, old_price, period, features, popular, color, order_num, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    description || null,
    price,
    old_price || null,
    period || 'yıl',
    JSON.stringify(Array.isArray(features) ? features : []),
    popular ? 1 : 0,
    color || '#3B82F6',
    order_num || 0,
    active !== undefined ? (active ? 1 : 0) : 1
  );

  const newPlan = db.prepare('SELECT * FROM pricing_plans WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(parsePlan(newPlan));
});

// PUT /api/pricing/:id  – admin
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM pricing_plans WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Plan bulunamadı.' });

  const { name, description, price, old_price, period, features, popular, color, order_num, active } = req.body;

  db.prepare(`
    UPDATE pricing_plans SET
      name        = ?,
      description = ?,
      price       = ?,
      old_price   = ?,
      period      = ?,
      features    = ?,
      popular     = ?,
      color       = ?,
      order_num   = ?,
      active      = ?
    WHERE id = ?
  `).run(
    name        !== undefined ? name        : existing.name,
    description !== undefined ? description : existing.description,
    price       !== undefined ? price       : existing.price,
    old_price   !== undefined ? old_price   : existing.old_price,
    period      !== undefined ? period      : existing.period,
    features    !== undefined ? JSON.stringify(Array.isArray(features) ? features : []) : existing.features,
    popular     !== undefined ? (popular ? 1 : 0) : existing.popular,
    color       !== undefined ? color       : existing.color,
    order_num   !== undefined ? order_num   : existing.order_num,
    active      !== undefined ? (active ? 1 : 0) : existing.active,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM pricing_plans WHERE id = ?').get(req.params.id);
  return res.json(parsePlan(updated));
});

// DELETE /api/pricing/:id  – admin
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM pricing_plans WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Plan bulunamadı.' });

  db.prepare('DELETE FROM pricing_plans WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Plan silindi.' });
});

module.exports = router;
