'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir.' });
  }

  const db = getDb();
  const user = db.prepare(
    'SELECT id, username, email, password_hash, role, created_at FROM users WHERE username = ? OR email = ?'
  ).get(username, username);

  if (!user) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    }
  });
});

// GET /api/auth/me  (protected)
router.get('/me', authenticate, (req, res) => {
  return res.json({ user: req.user });
});

// PUT /api/auth/change-password  (protected)
router.put('/change-password', authenticate, (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gereklidir.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalıdır.' });
  }

  const db = getDb();
  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);

  const isValid = bcrypt.compareSync(current_password, user.password_hash);
  if (!isValid) {
    return res.status(400).json({ error: 'Mevcut şifre hatalı.' });
  }

  const newHash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

  return res.json({ message: 'Şifre başarıyla güncellendi.' });
});

module.exports = router;
