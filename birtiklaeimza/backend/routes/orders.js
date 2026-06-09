'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders  – public, submit an order/inquiry
router.post('/', (req, res) => {
  const { name, email, phone, company, product_id, product_name, notes } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Ad, e-posta ve telefon zorunludur.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin.' });
  }

  const db = getDb();

  // Resolve product_name if product_id is provided but product_name is not
  let resolvedProductName = product_name || null;
  let resolvedProductId = product_id || null;

  if (product_id && !product_name) {
    const product = db.prepare('SELECT name FROM products WHERE id = ?').get(product_id);
    if (product) resolvedProductName = product.name;
  }

  const result = db.prepare(`
    INSERT INTO orders (name, email, phone, company, product_id, product_name, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
  `).run(
    name.trim(), email.trim(), phone.trim(),
    company || null, resolvedProductId, resolvedProductName,
    notes || null
  );

  return res.status(201).json({
    message: 'Siparişiniz alındı. Ekibimiz en kısa sürede sizinle iletişime geçecektir.',
    id: result.lastInsertRowid
  });
});

// GET /api/orders  – admin, list all with filters
router.get('/', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const { status, product_id, search, page = 1, limit = 20 } = req.query;

  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (product_id) {
    query += ' AND product_id = ?';
    params.push(product_id);
  }

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countQuery).get(...params);

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
  const offset = (pageNum - 1) * limitNum;

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limitNum, offset);

  const rows = db.prepare(query).all(...params);

  return res.json({
    data: rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// GET /api/orders/:id  – admin
router.get('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Sipariş bulunamadı.' });
  return res.json(row);
});

// PUT /api/orders/:id/status  – admin
router.put('/:id/status', authenticate, adminOnly, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['new', 'processing', 'completed', 'cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Geçerli durum değerleri: ${validStatuses.join(', ')}` });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Sipariş bulunamadı.' });

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  return res.json(updated);
});

// DELETE /api/orders/:id  – admin
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Sipariş bulunamadı.' });

  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Sipariş silindi.' });
});

module.exports = router;
