'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/contacts  – public, submit contact form
router.post('/', (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Ad, e-posta ve mesaj zorunludur.' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin.' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO contacts (name, email, phone, subject, message, status)
    VALUES (?, ?, ?, ?, ?, 'new')
  `).run(name.trim(), email.trim(), phone || null, subject || null, message.trim());

  return res.status(201).json({
    message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
    id: result.lastInsertRowid
  });
});

// GET /api/contacts  – admin, list all
router.get('/', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const { status, page = 1, limit = 20 } = req.query;

  let query = 'SELECT * FROM contacts';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
  const offset = (pageNum - 1) * limitNum;

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countQuery).get(...params);

  query += ' LIMIT ? OFFSET ?';
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

// GET /api/contacts/:id  – admin
router.get('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'İletişim kaydı bulunamadı.' });

  // Auto-mark as read when viewed
  if (row.status === 'new') {
    db.prepare("UPDATE contacts SET status = 'read' WHERE id = ?").run(req.params.id);
    row.status = 'read';
  }

  return res.json(row);
});

// PUT /api/contacts/:id/status  – admin
router.put('/:id/status', authenticate, adminOnly, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['new', 'read', 'replied'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Geçerli durum değerleri: ${validStatuses.join(', ')}` });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM contacts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'İletişim kaydı bulunamadı.' });

  db.prepare('UPDATE contacts SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);

  return res.json(updated);
});

// DELETE /api/contacts/:id  – admin
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM contacts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'İletişim kaydı bulunamadı.' });

  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Kayıt silindi.' });
});

module.exports = router;
