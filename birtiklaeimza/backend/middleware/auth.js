'use strict';

const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'birtiklaeimza-super-secret-jwt-key-2024';

/**
 * Verifies the Bearer token and attaches the user to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkilendirme başlığı eksik veya hatalı.' });
  }

  const token = authHeader.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' });
    }
    return res.status(401).json({ error: 'Geçersiz token.' });
  }

  const db = getDb();
  const user = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(payload.id);
  if (!user) {
    return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });
  }

  req.user = user;
  next();
}

/**
 * Requires the authenticated user to have the 'admin' role.
 * Must be used AFTER authenticate middleware.
 */
function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Kimlik doğrulama gerekli.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' });
  }
  next();
}

module.exports = { authenticate, adminOnly, JWT_SECRET };
