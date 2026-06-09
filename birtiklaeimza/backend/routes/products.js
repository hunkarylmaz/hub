'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

function parseProduct(row) {
  if (!row) return null;
  return {
    ...row,
    features: (() => { try { return JSON.parse(row.features || '[]'); } catch { return []; } })(),
    active: Boolean(row.active)
  };
}

// GET /api/products  – public, only active
router.get('/', (req, res) => {
  const db = getDb();
  const { category } = req.query;

  let query = 'SELECT * FROM products WHERE active = 1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY order_num ASC, id ASC';

  const rows = db.prepare(query).all(...params);
  return res.json(rows.map(parseProduct));
});

// GET /api/products/all  – admin
router.get('/all', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM products ORDER BY order_num ASC, id ASC').all();
  return res.json(rows.map(parseProduct));
});

// GET /api/products/:id  – public
router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Ürün bulunamadı.' });
  return res.json(parseProduct(row));
});

// POST /api/products  – admin
router.post('/', authenticate, adminOnly, (req, res) => {
  const {
    name, slug, short_desc, description, price, old_price,
    category, features, badge, badge_color, icon, image, order_num, active
  } = req.body;

  if (!name || !slug || price === undefined) {
    return res.status(400).json({ error: 'Ad, slug ve fiyat zorunludur.' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
  if (existing) {
    return res.status(400).json({ error: 'Bu slug zaten kullanılıyor.' });
  }

  const result = db.prepare(`
    INSERT INTO products (name, slug, short_desc, description, price, old_price, category, features, badge, badge_color, icon, image, order_num, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, slug, short_desc || null, description || null,
    price, old_price || null, category || null,
    JSON.stringify(Array.isArray(features) ? features : []),
    badge || null, badge_color || '#3B82F6',
    icon || null, image || null,
    order_num || 0, active !== undefined ? (active ? 1 : 0) : 1
  );

  const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(parseProduct(newProduct));
});

// PUT /api/products/:id  – admin
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı.' });

  const {
    name, slug, short_desc, description, price, old_price,
    category, features, badge, badge_color, icon, image, order_num, active
  } = req.body;

  // Check slug uniqueness (excluding this product)
  if (slug && slug !== existing.slug) {
    const slugConflict = db.prepare('SELECT id FROM products WHERE slug = ? AND id != ?').get(slug, req.params.id);
    if (slugConflict) {
      return res.status(400).json({ error: 'Bu slug zaten kullanılıyor.' });
    }
  }

  db.prepare(`
    UPDATE products SET
      name        = ?,
      slug        = ?,
      short_desc  = ?,
      description = ?,
      price       = ?,
      old_price   = ?,
      category    = ?,
      features    = ?,
      badge       = ?,
      badge_color = ?,
      icon        = ?,
      image       = ?,
      order_num   = ?,
      active      = ?
    WHERE id = ?
  `).run(
    name        !== undefined ? name        : existing.name,
    slug        !== undefined ? slug        : existing.slug,
    short_desc  !== undefined ? short_desc  : existing.short_desc,
    description !== undefined ? description : existing.description,
    price       !== undefined ? price       : existing.price,
    old_price   !== undefined ? old_price   : existing.old_price,
    category    !== undefined ? category    : existing.category,
    features    !== undefined ? JSON.stringify(Array.isArray(features) ? features : []) : existing.features,
    badge       !== undefined ? badge       : existing.badge,
    badge_color !== undefined ? badge_color : existing.badge_color,
    icon        !== undefined ? icon        : existing.icon,
    image       !== undefined ? image       : existing.image,
    order_num   !== undefined ? order_num   : existing.order_num,
    active      !== undefined ? (active ? 1 : 0) : existing.active,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  return res.json(parseProduct(updated));
});

// DELETE /api/products/:id  – admin
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı.' });

  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Ürün silindi.' });
});

// PUT /api/products/:id/toggle  – admin, toggle active
router.put('/:id/toggle', authenticate, adminOnly, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id, active FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı.' });

  const newActive = existing.active ? 0 : 1;
  db.prepare('UPDATE products SET active = ? WHERE id = ?').run(newActive, req.params.id);

  return res.json({ id: existing.id, active: Boolean(newActive) });
});

module.exports = router;
