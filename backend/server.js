'use strict'
const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const path = require('path')

const PORT = 3001
const JWT_SECRET = 'paketci-b2b-jwt-secret-2026'
const DB_PATH = path.join(__dirname, 'data.db')

// ── DB helpers ────────────────────────────────────────────────────────────────
const db = new sqlite3.Database(DB_PATH)

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve({ lastID: this.lastID, changes: this.changes })
    })
  })
}
function get(sql, params = []) {
  return new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  )
}
function all(sql, params = []) {
  return new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])))
  )
}
function exec(sql) {
  return new Promise((resolve, reject) =>
    db.exec(sql, (err) => (err ? reject(err) : resolve()))
  )
}

// ── Init DB ───────────────────────────────────────────────────────────────────
async function initDb() {
  await exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      sifre TEXT NOT NULL,
      ad TEXT NOT NULL,
      rol TEXT DEFAULT 'B2B Partner',
      aktif INTEGER DEFAULT 1,
      olusturma_tarihi TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS bayilikler (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad TEXT NOT NULL,
      bayilik_id TEXT UNIQUE NOT NULL,
      durum TEXT DEFAULT 'Aktif',
      sehir TEXT NOT NULL,
      il TEXT,
      ilce TEXT,
      gunluk_siparis TEXT,
      yetkili_ad TEXT,
      telefon TEXT,
      email TEXT,
      token INTEGER DEFAULT 0,
      ozel_fiyat REAL DEFAULT 2.80,
      user_id INTEGER REFERENCES users(id),
      olusturma_tarihi TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS odeme_talepleri (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      talep_no TEXT UNIQUE NOT NULL,
      bayilik_id INTEGER REFERENCES bayilikler(id),
      miktar REAL NOT NULL,
      banka TEXT,
      gonderen TEXT,
      tarih TEXT DEFAULT (datetime('now','localtime')),
      durum TEXT DEFAULT 'Beklemede',
      user_id INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS kontor_gecmisi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tarih TEXT DEFAULT (datetime('now','localtime')),
      islem_turu TEXT NOT NULL,
      bayilik_id INTEGER REFERENCES bayilikler(id),
      miktar INTEGER NOT NULL,
      kalan_bakiye INTEGER NOT NULL,
      not_text TEXT DEFAULT '-',
      user_id INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ayarlar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id),
      logo_url TEXT,
      favicon_url TEXT,
      kontor_bakiye INTEGER DEFAULT 500,
      toplam_dagitilan INTEGER DEFAULT 0
    );
  `)

  // Seed first user
  const existing = await get('SELECT COUNT(*) as c FROM users')
  if (existing.c === 0) {
    const hash = bcrypt.hashSync('161813mkaA.', 10)
    const { lastID: uid } = await run(
      'INSERT INTO users (email,sifre,ad,rol) VALUES (?,?,?,?)',
      ['hunkaryilmaz@paketci.app', hash, 'Hünkar Yılmaz', 'B2B Partner']
    )
    await run('INSERT INTO ayarlar (user_id,kontor_bakiye,toplam_dagitilan) VALUES (?,?,?)', [uid, 500, 8820])

    const insertB = (ad, bid, durum, sehir, token, fiyat) =>
      run('INSERT INTO bayilikler (ad,bayilik_id,durum,sehir,token,ozel_fiyat,user_id) VALUES (?,?,?,?,?,?,?)',
        [ad, bid, durum, sehir, token, fiyat, uid])

    const { lastID: b1 } = await insertB('TEST JET',            '0FNA19SWUL88F6E', 'Aktif', 'İzmir',         0,    2.80)
    const { lastID: b2 } = await insertB('Paketçiniz Afyon',    'Afyonkarahisar002','Aktif','Afyonkarahisar', 216,  2.80)
    const { lastID: b3 } = await insertB('Moon Courie',         'Bursa009',        'Pasif', 'Bursa',          0,    3.00)
                           await insertB('Paketçiniz Kütahya',  'KUTAHYA003',      'Pasif', 'KÜTAHYA',        0,    3.00)
    const { lastID: b5 } = await insertB('Osmaniye Paketçiniz','OSMANİYE005',     'Aktif', 'Osmaniye',       3130, 2.80)
    const { lastID: b6 } = await insertB('Paketçiniz Bodrum',  'MUGLA002',        'Aktif', 'Muğla',          414,  2.80)

    const insertO = (tno, bid, miktar, banka, gonderen, tarih) =>
      run('INSERT INTO odeme_talepleri (talep_no,bayilik_id,miktar,banka,gonderen,tarih,durum,user_id) VALUES (?,?,?,?,?,?,?,?)',
        [tno, bid, miktar, banka, gonderen, tarih, 'Onaylandı', uid])

    await insertO('ODEME-1778431897637-8', b2, 151.20,   'Garanti',         'Süleyman Doğan', '2026-05-10 19:51')
    await insertO('ODEME-1778431843767-7', b6, 1400.00,  'Garanti',         'Süleyman Doğan', '2026-05-10 19:50')
    await insertO('ODEME-1777996115496-7', b2, 568.40,   'Garanti Bankası', 'Süleyman Doğan', '2026-05-05 18:48')
    await insertO('ODEME-1777996062788-6', b6, 580.00,   'Garanti Bankası', 'Süleyman Doğan', '2026-05-05 18:47')
    await insertO('ODEME-1777985800787-5', b5, 14000.00, 'DENİZBANK',      'ALİ BEÇENE',     '2026-05-05 15:56')
    await insertO('ODEME-1777786785325-3', b1, 1.00,     'Garanti',         'Test test',      '2026-05-03 08:39')

    const insertK = (tarih, turu, bid, miktar, kalan) =>
      run('INSERT INTO kontor_gecmisi (tarih,islem_turu,bayilik_id,miktar,kalan_bakiye,user_id) VALUES (?,?,?,?,?,?)',
        [tarih, turu, bid, miktar, kalan, uid])

    await insertK('2026-05-27 23:38', 'Bayiliğe Dağıtım', b2, -87,  0)
    await insertK('2026-05-27 23:38', 'Bayiliğe Dağıtım', b2, -100, 87)
    await insertK('2026-05-27 23:37', 'Bayiliğe Dağıtım', b6, -500, 187)
    await insertK('2026-05-27 23:37', 'Geri Alma',         b3,  489, 687)
    await insertK('2026-05-26 00:24', 'Bayiliğe Dağıtım', b6, -202, 198)
  }
}

// ── Express setup ─────────────────────────────────────────────────────────────
const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'], credentials: true }))
app.use(express.json())

function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'Yetkisiz erişim' })
  try { req.user = jwt.verify(token, JWT_SECRET); next() }
  catch { return res.status(401).json({ message: 'Geçersiz token' }) }
}

function wrap(fn) {
  return (req, res, next) => fn(req, res, next).catch(next)
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, sifre } = req.body || {}
  if (!email || !sifre) return res.status(400).json({ message: 'Email ve şifre gerekli' })
  const user = await get('SELECT * FROM users WHERE email=? AND aktif=1', [email])
  if (!user || !bcrypt.compareSync(sifre, user.sifre))
    return res.status(401).json({ message: 'Geçersiz email veya şifre' })
  const token = jwt.sign({ id: user.id, email: user.email, ad: user.ad, rol: user.rol }, JWT_SECRET, { expiresIn: '7d' })
  const { sifre: _, ...safe } = user
  res.json({ token, user: safe })
}))

app.get('/api/auth/me', authMiddleware, wrap(async (req, res) => {
  const user = await get('SELECT id,email,ad,rol,aktif,olusturma_tarihi FROM users WHERE id=?', [req.user.id])
  if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' })
  res.json(user)
}))

// ── BAYİLİKLER ───────────────────────────────────────────────────────────────
app.get('/api/bayilikler', authMiddleware, wrap(async (req, res) => {
  const rows = await all('SELECT * FROM bayilikler WHERE user_id=? ORDER BY id ASC', [req.user.id])
  res.json(rows)
}))

app.post('/api/bayilikler', authMiddleware, wrap(async (req, res) => {
  const { ad, il, ilce, gunluk_siparis, yetkili_ad, telefon, ozel_fiyat = 2.80 } = req.body || {}
  if (!ad || !il) return res.status(400).json({ message: 'Firma ismi ve il gerekli' })
  const norm = il.toUpperCase()
    .replace(/Ç/g,'C').replace(/Ğ/g,'G').replace(/İ/g,'I').replace(/Ö/g,'O').replace(/Ş/g,'S').replace(/Ü/g,'U')
    .replace(/[^A-Z]/g, '').slice(0, 8)
  const { c } = await get('SELECT COUNT(*) as c FROM bayilikler WHERE user_id=?', [req.user.id])
  const bayilik_id = `${norm}${String(c + 1).padStart(3, '0')}`
  try {
    const { lastID } = await run(
      'INSERT INTO bayilikler (ad,bayilik_id,sehir,il,ilce,gunluk_siparis,yetkili_ad,telefon,ozel_fiyat,user_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [ad, bayilik_id, il, il, ilce||null, gunluk_siparis||null, yetkili_ad||null, telefon||null, ozel_fiyat, req.user.id]
    )
    res.status(201).json(await get('SELECT * FROM bayilikler WHERE id=?', [lastID]))
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ message: 'Bayilik ID çakışıyor' })
    throw e
  }
}))

app.put('/api/bayilikler/:id', authMiddleware, wrap(async (req, res) => {
  const b = await get('SELECT * FROM bayilikler WHERE id=? AND user_id=?', [req.params.id, req.user.id])
  if (!b) return res.status(404).json({ message: 'Bayilik bulunamadı' })
  const { ad, sehir, ozel_fiyat, yetkili_ad, telefon } = req.body || {}
  await run(
    'UPDATE bayilikler SET ad=COALESCE(?,ad),sehir=COALESCE(?,sehir),ozel_fiyat=COALESCE(?,ozel_fiyat),yetkili_ad=COALESCE(?,yetkili_ad),telefon=COALESCE(?,telefon) WHERE id=?',
    [ad||null, sehir||null, ozel_fiyat||null, yetkili_ad||null, telefon||null, req.params.id]
  )
  res.json(await get('SELECT * FROM bayilikler WHERE id=?', [req.params.id]))
}))

app.delete('/api/bayilikler/:id', authMiddleware, wrap(async (req, res) => {
  const b = await get('SELECT * FROM bayilikler WHERE id=? AND user_id=?', [req.params.id, req.user.id])
  if (!b) return res.status(404).json({ message: 'Bayilik bulunamadı' })
  await run('DELETE FROM bayilikler WHERE id=?', [req.params.id])
  res.json({ message: 'Silindi' })
}))

app.put('/api/bayilikler/:id/toggle-durum', authMiddleware, wrap(async (req, res) => {
  const b = await get('SELECT * FROM bayilikler WHERE id=? AND user_id=?', [req.params.id, req.user.id])
  if (!b) return res.status(404).json({ message: 'Bayilik bulunamadı' })
  const yeni = b.durum === 'Aktif' ? 'Pasif' : 'Aktif'
  await run('UPDATE bayilikler SET durum=? WHERE id=?', [yeni, req.params.id])
  res.json({ ...b, durum: yeni })
}))

app.post('/api/bayilikler/:id/kontor-ekle', authMiddleware, wrap(async (req, res) => {
  const miktar = parseInt(req.body?.miktar, 10)
  if (!miktar || miktar <= 0) return res.status(400).json({ message: 'Geçersiz miktar' })
  const b = await get('SELECT * FROM bayilikler WHERE id=? AND user_id=?', [req.params.id, req.user.id])
  if (!b) return res.status(404).json({ message: 'Bayilik bulunamadı' })
  await run('UPDATE bayilikler SET token=token+? WHERE id=?', [miktar, req.params.id])
  await run('INSERT OR IGNORE INTO ayarlar (user_id) VALUES (?)', [req.user.id])
  await run('UPDATE ayarlar SET toplam_dagitilan=toplam_dagitilan+? WHERE user_id=?', [miktar, req.user.id])
  const ay = await get('SELECT kontor_bakiye FROM ayarlar WHERE user_id=?', [req.user.id])
  await run('INSERT INTO kontor_gecmisi (islem_turu,bayilik_id,miktar,kalan_bakiye,user_id) VALUES (?,?,?,?,?)',
    ['Bayiliğe Dağıtım', b.id, -miktar, ay?.kontor_bakiye ?? 0, req.user.id])
  res.json({ yeni_bakiye: ay?.kontor_bakiye ?? 0 })
}))

app.post('/api/bayilikler/:id/kontor-geri-al', authMiddleware, wrap(async (req, res) => {
  const miktar = parseInt(req.body?.miktar, 10)
  if (!miktar || miktar <= 0) return res.status(400).json({ message: 'Geçersiz miktar' })
  const b = await get('SELECT * FROM bayilikler WHERE id=? AND user_id=?', [req.params.id, req.user.id])
  if (!b) return res.status(404).json({ message: 'Bayilik bulunamadı' })
  if (b.token < miktar) return res.status(400).json({ message: 'Bayilikte yeterli kontör yok' })
  const ay = await get('SELECT * FROM ayarlar WHERE user_id=?', [req.user.id])
  const yeni = (ay?.kontor_bakiye || 0) + miktar
  await run('UPDATE bayilikler SET token=token-? WHERE id=?', [miktar, req.params.id])
  await run('UPDATE ayarlar SET kontor_bakiye=?,toplam_dagitilan=MAX(0,toplam_dagitilan-?) WHERE user_id=?', [yeni, miktar, req.user.id])
  await run('INSERT INTO kontor_gecmisi (islem_turu,bayilik_id,miktar,kalan_bakiye,user_id) VALUES (?,?,?,?,?)',
    ['Geri Alma', b.id, miktar, yeni, req.user.id])
  res.json({ yeni_bakiye: yeni })
}))

// ── ÖDEME TALEPLERİ ──────────────────────────────────────────────────────────
app.get('/api/odeme-talepleri', authMiddleware, wrap(async (req, res) => {
  const rows = await all(
    'SELECT ot.*,b.ad as bayilik_ad,b.bayilik_id as bayilik_kod FROM odeme_talepleri ot LEFT JOIN bayilikler b ON b.id=ot.bayilik_id WHERE ot.user_id=? ORDER BY ot.id DESC',
    [req.user.id]
  )
  res.json(rows)
}))

app.post('/api/odeme-talepleri', authMiddleware, wrap(async (req, res) => {
  const { bayilik_id, miktar, banka, gonderen } = req.body || {}
  if (!bayilik_id || !miktar) return res.status(400).json({ message: 'Bayilik ve miktar gerekli' })
  const talep_no = `ODEME-${Date.now()}-${Math.ceil(Math.random() * 9)}`
  const { lastID } = await run(
    'INSERT INTO odeme_talepleri (talep_no,bayilik_id,miktar,banka,gonderen,user_id) VALUES (?,?,?,?,?,?)',
    [talep_no, bayilik_id, miktar, banka||null, gonderen||null, req.user.id]
  )
  res.status(201).json(await get(
    'SELECT ot.*,b.ad as bayilik_ad,b.bayilik_id as bayilik_kod FROM odeme_talepleri ot LEFT JOIN bayilikler b ON b.id=ot.bayilik_id WHERE ot.id=?',
    [lastID]
  ))
}))

app.put('/api/odeme-talepleri/:id/durum', authMiddleware, wrap(async (req, res) => {
  const { durum } = req.body || {}
  const t = await get('SELECT * FROM odeme_talepleri WHERE id=? AND user_id=?', [req.params.id, req.user.id])
  if (!t) return res.status(404).json({ message: 'Talep bulunamadı' })
  await run('UPDATE odeme_talepleri SET durum=? WHERE id=?', [durum, req.params.id])
  res.json({ ...t, durum })
}))

// ── KONTÖR GEÇMİŞİ ──────────────────────────────────────────────────────────
app.get('/api/kontor-gecmisi', authMiddleware, wrap(async (req, res) => {
  const rows = await all(
    'SELECT kg.*,b.ad as bayilik_ad,b.bayilik_id as bayilik_kod FROM kontor_gecmisi kg LEFT JOIN bayilikler b ON b.id=kg.bayilik_id WHERE kg.user_id=? ORDER BY kg.id DESC',
    [req.user.id]
  )
  res.json(rows)
}))

app.get('/api/kontor-bakiye', authMiddleware, wrap(async (req, res) => {
  const ay = await get('SELECT kontor_bakiye,toplam_dagitilan FROM ayarlar WHERE user_id=?', [req.user.id])
  res.json({ mevcut_bakiye: ay?.kontor_bakiye ?? 0, toplam_dagitilan: ay?.toplam_dagitilan ?? 0 })
}))

// ── RAPORLAR ─────────────────────────────────────────────────────────────────
app.get('/api/raporlar', authMiddleware, wrap(async (req, res) => {
  const stats = await get(`
    SELECT
      SUM(CASE WHEN durum='Onaylandı' THEN miktar ELSE 0 END) as toplam_onaylanan,
      COUNT(CASE WHEN durum='Onaylandı' THEN 1 END) as onaylanan_talep_sayisi,
      SUM(CASE WHEN durum='Beklemede' THEN miktar ELSE 0 END) as bekleyen_odeme,
      AVG(CASE WHEN durum='Onaylandı' THEN miktar END) as ortalama_odeme
    FROM odeme_talepleri WHERE user_id=?`, [req.user.id])

  const aylik = await all(
    "SELECT strftime('%Y-%m', tarih) as ay, SUM(miktar) as toplam FROM odeme_talepleri WHERE user_id=? AND durum='Onaylandı' GROUP BY ay ORDER BY ay ASC",
    [req.user.id]
  )
  const dagilim = await all(
    "SELECT b.ad as name, SUM(ot.miktar) as value FROM odeme_talepleri ot JOIN bayilikler b ON b.id=ot.bayilik_id WHERE ot.user_id=? AND ot.durum='Onaylandı' GROUP BY b.id ORDER BY value DESC",
    [req.user.id]
  )

  const ayAd = { '01':'Oca','02':'Şub','03':'Mar','04':'Nis','05':'May','06':'Haz','07':'Tem','08':'Ağu','09':'Eyl','10':'Eki','11':'Kas','12':'Ara' }
  const aylik_trend = aylik.map(r => ({ month: ayAd[r.ay.split('-')[1]] || r.ay, gelir: r.toplam || 0 }))

  res.json({
    toplam_onaylanan: stats?.toplam_onaylanan || 0,
    onaylanan_talep_sayisi: stats?.onaylanan_talep_sayisi || 0,
    bekleyen_odeme: stats?.bekleyen_odeme || 0,
    ortalama_odeme: stats?.ortalama_odeme || 0,
    aylik_trend,
    bayilik_dagilim: dagilim
  })
}))

// ── AYARLAR ──────────────────────────────────────────────────────────────────
app.get('/api/ayarlar', authMiddleware, wrap(async (req, res) => {
  let ay = await get('SELECT * FROM ayarlar WHERE user_id=?', [req.user.id])
  if (!ay) { await run('INSERT INTO ayarlar (user_id) VALUES (?)', [req.user.id]); ay = await get('SELECT * FROM ayarlar WHERE user_id=?', [req.user.id]) }
  res.json(ay)
}))

app.put('/api/ayarlar', authMiddleware, wrap(async (req, res) => {
  const { logo_url, favicon_url } = req.body || {}
  await run('UPDATE ayarlar SET logo_url=COALESCE(?,logo_url),favicon_url=COALESCE(?,favicon_url) WHERE user_id=?', [logo_url||null, favicon_url||null, req.user.id])
  res.json(await get('SELECT * FROM ayarlar WHERE user_id=?', [req.user.id]))
}))

// ── KULLANICILAR ─────────────────────────────────────────────────────────────
app.get('/api/kullanicilar', authMiddleware, wrap(async (req, res) => {
  res.json(await all('SELECT id,email,ad,rol,aktif,olusturma_tarihi FROM users ORDER BY id ASC'))
}))

app.post('/api/kullanicilar', authMiddleware, wrap(async (req, res) => {
  const { email, sifre, ad, rol = 'B2B Partner' } = req.body || {}
  if (!email || !sifre || !ad) return res.status(400).json({ message: 'Email, şifre ve ad gerekli' })
  const hash = bcrypt.hashSync(sifre, 10)
  try {
    const { lastID } = await run('INSERT INTO users (email,sifre,ad,rol) VALUES (?,?,?,?)', [email, hash, ad, rol])
    await run('INSERT OR IGNORE INTO ayarlar (user_id) VALUES (?)', [lastID])
    res.status(201).json(await get('SELECT id,email,ad,rol,aktif,olusturma_tarihi FROM users WHERE id=?', [lastID]))
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ message: 'Bu email zaten kayıtlı' })
    throw e
  }
}))

app.put('/api/kullanicilar/:id', authMiddleware, wrap(async (req, res) => {
  const u = await get('SELECT * FROM users WHERE id=?', [req.params.id])
  if (!u) return res.status(404).json({ message: 'Kullanıcı bulunamadı' })
  const { ad, email, sifre, rol, aktif } = req.body || {}
  if (sifre) {
    await run('UPDATE users SET ad=COALESCE(?,ad),email=COALESCE(?,email),sifre=?,rol=COALESCE(?,rol),aktif=COALESCE(?,aktif) WHERE id=?',
      [ad||null, email||null, bcrypt.hashSync(sifre, 10), rol||null, aktif!=null?aktif:null, req.params.id])
  } else {
    await run('UPDATE users SET ad=COALESCE(?,ad),email=COALESCE(?,email),rol=COALESCE(?,rol),aktif=COALESCE(?,aktif) WHERE id=?',
      [ad||null, email||null, rol||null, aktif!=null?aktif:null, req.params.id])
  }
  res.json(await get('SELECT id,email,ad,rol,aktif,olusturma_tarihi FROM users WHERE id=?', [req.params.id]))
}))

app.delete('/api/kullanicilar/:id', authMiddleware, wrap(async (req, res) => {
  await run('UPDATE users SET aktif=0 WHERE id=?', [req.params.id])
  res.json({ message: 'Pasifleştirildi' })
}))

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.message)
  res.status(500).json({ message: 'Sunucu hatası' })
})

// ── BAYİ PANEL TABLES & MIGRATIONS ───────────────────────────────────────────
async function initBayiDb() {
  // Migrations: add columns if not exist
  try { await run('ALTER TABLE bayilikler ADD COLUMN bayi_email TEXT') } catch {}
  try { await run('ALTER TABLE bayilikler ADD COLUMN bayi_sifre TEXT') } catch {}

  await exec(`
    CREATE TABLE IF NOT EXISTS bayi_kuryeler (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bayilik_id INTEGER REFERENCES bayilikler(id),
      ad TEXT NOT NULL,
      telefon TEXT,
      durum TEXT DEFAULT 'Müsait',
      aktif INTEGER DEFAULT 1,
      toplam_teslimat INTEGER DEFAULT 0,
      gunluk_teslimat INTEGER DEFAULT 0,
      olusturma_tarihi TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS bayi_restoranlar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bayilik_id INTEGER REFERENCES bayilikler(id),
      ad TEXT NOT NULL,
      adres TEXT,
      telefon TEXT,
      aktif INTEGER DEFAULT 1,
      gunluk_siparis INTEGER DEFAULT 0,
      olusturma_tarihi TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS bayi_siparisler (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bayilik_id INTEGER REFERENCES bayilikler(id),
      siparis_no TEXT UNIQUE NOT NULL,
      restoran_id INTEGER REFERENCES bayi_restoranlar(id),
      kurye_id INTEGER REFERENCES bayi_kuryeler(id),
      musteri_ad TEXT,
      musteri_telefon TEXT,
      teslimat_adresi TEXT,
      tutar REAL DEFAULT 0,
      odeme_yontemi TEXT DEFAULT 'Nakit',
      durum TEXT DEFAULT 'Beklemede',
      atama_zamani TEXT,
      teslim_zamani TEXT,
      olusturma_tarihi TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS bayi_ayarlar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bayilik_id INTEGER UNIQUE REFERENCES bayilikler(id),
      atama_modu TEXT DEFAULT 'Otomatik',
      max_siparis_per_kurye INTEGER DEFAULT 3,
      bonus_aktif INTEGER DEFAULT 0,
      bonus_miktar REAL DEFAULT 0,
      bildirim_email INTEGER DEFAULT 1,
      bildirim_sms INTEGER DEFAULT 0
    );
  `)

  // Seed demo data for TEST JET bayilik
  const tj = await get("SELECT id FROM bayilikler WHERE bayilik_id='0FNA19SWUL88F6E'")
  if (!tj) return

  const existingK = await get('SELECT COUNT(*) as c FROM bayi_kuryeler WHERE bayilik_id=?', [tj.id])
  if (existingK.c > 0) return

  // Seed bayi credentials for TEST JET
  const bayiHash = bcrypt.hashSync('bayi123', 10)
  await run('UPDATE bayilikler SET bayi_email=?,bayi_sifre=? WHERE id=?', ['testjet@paketci.app', bayiHash, tj.id])

  // Seed couriers
  const insertK = (ad, tel, durum, gunluk, toplam) =>
    run('INSERT INTO bayi_kuryeler (bayilik_id,ad,telefon,durum,gunluk_teslimat,toplam_teslimat) VALUES (?,?,?,?,?,?)',
      [tj.id, ad, tel, durum, gunluk, toplam])

  const { lastID: k1 } = await insertK('Ahmet Yılmaz',   '05321234567', 'Dağıtımda', 8, 312)
  const { lastID: k2 } = await insertK('Mehmet Demir',   '05339876543', 'Müsait',    5, 198)
  const { lastID: k3 } = await insertK('Ali Kaya',       '05352223344', 'Dağıtımda', 11, 445)
  const { lastID: k4 } = await insertK('Hasan Çelik',    '05361112233', 'Mola',      3, 87)
  const { lastID: k5 } = await insertK('Emre Şahin',     '05374445566', 'Müsait',    0, 234)
  const { lastID: k6 } = await insertK('Burak Arslan',   '05383334455', 'Çevrimdışı',0, 156)

  // Seed restaurants
  const insertR = (ad, adres, tel, gunluk) =>
    run('INSERT INTO bayi_restoranlar (bayilik_id,ad,adres,telefon,gunluk_siparis) VALUES (?,?,?,?,?)',
      [tj.id, ad, adres, tel, gunluk])

  const { lastID: r1 } = await insertR('Burger Palace',    'Konak Mah. Atatürk Cad. No:12', '02321234567', 45)
  const { lastID: r2 } = await insertR('Pizza House',      'Alsancak Mah. Kıbrıs Şeh. Cad.', '02329876543', 32)
  const { lastID: r3 } = await insertR('Döner Express',    'Bornova Mah. İzmir Cad. No:5',   '02325556677', 67)
  const { lastID: r4 } = await insertR('Sushi Corner',     'Karşıyaka Mah. Cumhuriyet Bul.', '02322223344', 18)
  const { lastID: r5 } = await insertR('Çorba Evi',        'Buca Mah. Zafer Cad. No:22',     '02327778899', 28)

  // Seed orders
  const orders = [
    ['SIP-001', r1, k1, 'Fatma Kaya',   '05301234567', 'Alsancak Mah. No:5',   87.50,  'Nakit',  'Yolda',         '2026-05-29 10:30', null],
    ['SIP-002', r2, k3, 'Ayşe Demir',   '05312345678', 'Bornova Mah. No:12',   124.00, 'Kart',   'Yolda',         '2026-05-29 10:15', null],
    ['SIP-003', r3, null,'Can Yıldız',  '05323456789', 'Konak Mah. No:7',      55.00,  'Nakit',  'Beklemede',     '2026-05-29 10:45', null],
    ['SIP-004', r1, k2, 'Merve Şahin',  '05334567890', 'Karşıyaka Mah. No:3', 210.00, 'Online', 'Teslim Edildi', '2026-05-29 09:00', '2026-05-29 09:45'],
    ['SIP-005', r4, k5, 'Burak Arslan', '05345678901', 'Buca Mah. No:18',      68.00,  'Kart',   'Atandı',        '2026-05-29 10:50', null],
    ['SIP-006', r5, k2, 'Zeynep Çelik', '05356789012', 'Alsancak Mah. No:9',   42.50,  'Nakit',  'Teslim Edildi', '2026-05-29 08:30', '2026-05-29 09:10'],
    ['SIP-007', r2, null,'Serkan Kurt',  '05367890123', 'Konak Mah. No:15',    155.00, 'Nakit',  'Beklemede',     '2026-05-29 11:00', null],
    ['SIP-008', r3, k1, 'Elif Yılmaz',  '05378901234', 'Bornova Mah. No:20',   78.00,  'Kart',   'Yolda',         '2026-05-29 10:55', null],
  ]

  for (const [no, rid, kid, mAd, mTel, adres, tutar, odeme, durum, olusturma, teslim] of orders) {
    await run(
      'INSERT INTO bayi_siparisler (bayilik_id,siparis_no,restoran_id,kurye_id,musteri_ad,musteri_telefon,teslimat_adresi,tutar,odeme_yontemi,durum,atama_zamani,teslim_zamani,olusturma_tarihi) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [tj.id, no, rid, kid, mAd, mTel, adres, tutar, odeme, durum, kid ? olusturma : null, teslim, olusturma]
    )
  }

  await run('INSERT OR IGNORE INTO bayi_ayarlar (bayilik_id) VALUES (?)', [tj.id])
}

// ── BAYİ AUTH MIDDLEWARE ─────────────────────────────────────────────────────
function bayiAuthMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'Yetkisiz erişim' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.type !== 'bayi') return res.status(401).json({ message: 'Geçersiz token tipi' })
    req.bayi = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Geçersiz token' })
  }
}

// ── BAYİ AUTH ────────────────────────────────────────────────────────────────
app.post('/api/bayi/auth/login', wrap(async (req, res) => {
  const { email, sifre } = req.body || {}
  if (!email || !sifre) return res.status(400).json({ message: 'Email ve şifre gerekli' })
  const b = await get('SELECT * FROM bayilikler WHERE bayi_email=? AND durum=?', [email, 'Aktif'])
  if (!b || !b.bayi_sifre || !bcrypt.compareSync(sifre, b.bayi_sifre))
    return res.status(401).json({ message: 'Geçersiz email veya şifre' })
  const token = jwt.sign(
    { type: 'bayi', bayilikId: b.id, bayilikKod: b.bayilik_id, ad: b.ad, sehir: b.sehir, token: b.token },
    JWT_SECRET, { expiresIn: '7d' }
  )
  res.json({ token, bayilik: { id: b.id, ad: b.ad, bayilik_id: b.bayilik_id, sehir: b.sehir, token: b.token, durum: b.durum } })
}))

app.get('/api/bayi/auth/me', bayiAuthMiddleware, wrap(async (req, res) => {
  const b = await get('SELECT id,ad,bayilik_id,sehir,token,durum FROM bayilikler WHERE id=?', [req.bayi.bayilikId])
  if (!b) return res.status(404).json({ message: 'Bayilik bulunamadı' })
  res.json(b)
}))

// ── BAYİ DASHBOARD ───────────────────────────────────────────────────────────
app.get('/api/bayi/dashboard', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const today = new Date().toISOString().slice(0, 10)

  const siparis = await get(
    "SELECT COUNT(*) as toplam, SUM(CASE WHEN durum='Teslim Edildi' THEN 1 ELSE 0 END) as teslim, SUM(CASE WHEN durum='Beklemede' THEN 1 ELSE 0 END) as bekleyen, SUM(CASE WHEN durum='Yolda' THEN 1 ELSE 0 END) as yolda FROM bayi_siparisler WHERE bayilik_id=? AND date(olusturma_tarihi)=?",
    [bid, today]
  )
  const kurye = await get(
    "SELECT COUNT(*) as toplam, SUM(CASE WHEN durum='Müsait' THEN 1 ELSE 0 END) as musait, SUM(CASE WHEN durum='Dağıtımda' THEN 1 ELSE 0 END) as dagitimda, SUM(CASE WHEN durum='Mola' THEN 1 ELSE 0 END) as mola FROM bayi_kuryeler WHERE bayilik_id=? AND aktif=1",
    [bid]
  )
  const bakiye = await get('SELECT token FROM bayilikler WHERE id=?', [bid])
  const aktifSiparisler = await all(
    `SELECT bs.*, br.ad as restoran_ad, bk.ad as kurye_ad
     FROM bayi_siparisler bs
     LEFT JOIN bayi_restoranlar br ON br.id=bs.restoran_id
     LEFT JOIN bayi_kuryeler bk ON bk.id=bs.kurye_id
     WHERE bs.bayilik_id=? AND bs.durum IN ('Beklemede','Atandı','Yolda')
     ORDER BY bs.id DESC LIMIT 20`,
    [bid]
  )

  const toplam = siparis?.toplam || 0
  const teslim = siparis?.teslim || 0
  const mudahale = toplam > 0 ? Math.round((toplam - teslim) / toplam * 100) : 0

  res.json({
    siparis_toplam: toplam,
    siparis_bekleyen: siparis?.bekleyen || 0,
    siparis_yolda: siparis?.yolda || 0,
    siparis_teslim: teslim,
    mudahale_yuzdesi: mudahale,
    kalite_yuzdesi: toplam > 0 ? Math.round(teslim / toplam * 100) : 100,
    yogunluk: toplam > 0 ? (toplam > 30 ? 'Yüksek' : toplam > 15 ? 'Orta' : 'Düşük') : 'Düşük',
    kontor_bakiye: bakiye?.token || 0,
    kurye_toplam: kurye?.toplam || 0,
    kurye_musait: kurye?.musait || 0,
    kurye_dagitimda: kurye?.dagitimda || 0,
    kurye_mola: kurye?.mola || 0,
    aktif_siparisler: aktifSiparisler,
  })
}))

// ── BAYİ KURYELERi ───────────────────────────────────────────────────────────
app.get('/api/bayi/kuryeler', bayiAuthMiddleware, wrap(async (req, res) => {
  res.json(await all('SELECT * FROM bayi_kuryeler WHERE bayilik_id=? ORDER BY id ASC', [req.bayi.bayilikId]))
}))

app.post('/api/bayi/kuryeler', bayiAuthMiddleware, wrap(async (req, res) => {
  const { ad, telefon } = req.body || {}
  if (!ad) return res.status(400).json({ message: 'Kurye adı gerekli' })
  const { lastID } = await run('INSERT INTO bayi_kuryeler (bayilik_id,ad,telefon) VALUES (?,?,?)', [req.bayi.bayilikId, ad, telefon||null])
  res.status(201).json(await get('SELECT * FROM bayi_kuryeler WHERE id=?', [lastID]))
}))

app.put('/api/bayi/kuryeler/:id', bayiAuthMiddleware, wrap(async (req, res) => {
  const k = await get('SELECT * FROM bayi_kuryeler WHERE id=? AND bayilik_id=?', [req.params.id, req.bayi.bayilikId])
  if (!k) return res.status(404).json({ message: 'Kurye bulunamadı' })
  const { ad, telefon } = req.body || {}
  await run('UPDATE bayi_kuryeler SET ad=COALESCE(?,ad),telefon=COALESCE(?,telefon) WHERE id=?', [ad||null, telefon||null, req.params.id])
  res.json(await get('SELECT * FROM bayi_kuryeler WHERE id=?', [req.params.id]))
}))

app.put('/api/bayi/kuryeler/:id/durum', bayiAuthMiddleware, wrap(async (req, res) => {
  const k = await get('SELECT * FROM bayi_kuryeler WHERE id=? AND bayilik_id=?', [req.params.id, req.bayi.bayilikId])
  if (!k) return res.status(404).json({ message: 'Kurye bulunamadı' })
  const { durum } = req.body || {}
  await run('UPDATE bayi_kuryeler SET durum=? WHERE id=?', [durum, req.params.id])
  res.json({ ...k, durum })
}))

app.delete('/api/bayi/kuryeler/:id', bayiAuthMiddleware, wrap(async (req, res) => {
  const k = await get('SELECT * FROM bayi_kuryeler WHERE id=? AND bayilik_id=?', [req.params.id, req.bayi.bayilikId])
  if (!k) return res.status(404).json({ message: 'Kurye bulunamadı' })
  await run('UPDATE bayi_kuryeler SET aktif=0 WHERE id=?', [req.params.id])
  res.json({ success: true })
}))

// ── BAYİ RESTORANLAR ─────────────────────────────────────────────────────────
app.get('/api/bayi/restoranlar', bayiAuthMiddleware, wrap(async (req, res) => {
  res.json(await all('SELECT * FROM bayi_restoranlar WHERE bayilik_id=? ORDER BY id ASC', [req.bayi.bayilikId]))
}))

app.post('/api/bayi/restoranlar', bayiAuthMiddleware, wrap(async (req, res) => {
  const { ad, adres, telefon } = req.body || {}
  if (!ad) return res.status(400).json({ message: 'Restoran adı gerekli' })
  const { lastID } = await run('INSERT INTO bayi_restoranlar (bayilik_id,ad,adres,telefon) VALUES (?,?,?,?)', [req.bayi.bayilikId, ad, adres||null, telefon||null])
  res.status(201).json(await get('SELECT * FROM bayi_restoranlar WHERE id=?', [lastID]))
}))

app.put('/api/bayi/restoranlar/:id', bayiAuthMiddleware, wrap(async (req, res) => {
  const r = await get('SELECT * FROM bayi_restoranlar WHERE id=? AND bayilik_id=?', [req.params.id, req.bayi.bayilikId])
  if (!r) return res.status(404).json({ message: 'Restoran bulunamadı' })
  const { ad, adres, telefon, aktif } = req.body || {}
  await run('UPDATE bayi_restoranlar SET ad=COALESCE(?,ad),adres=COALESCE(?,adres),telefon=COALESCE(?,telefon),aktif=COALESCE(?,aktif) WHERE id=?',
    [ad||null, adres||null, telefon||null, aktif!=null?aktif:null, req.params.id])
  res.json(await get('SELECT * FROM bayi_restoranlar WHERE id=?', [req.params.id]))
}))

app.delete('/api/bayi/restoranlar/:id', bayiAuthMiddleware, wrap(async (req, res) => {
  await run('UPDATE bayi_restoranlar SET aktif=0 WHERE id=?', [req.params.id])
  res.json({ success: true })
}))

// ── BAYİ SİPARİŞLER ─────────────────────────────────────────────────────────
app.get('/api/bayi/siparisler', bayiAuthMiddleware, wrap(async (req, res) => {
  const { durum, tarih } = req.query
  let sql = `SELECT bs.*, br.ad as restoran_ad, bk.ad as kurye_ad
             FROM bayi_siparisler bs
             LEFT JOIN bayi_restoranlar br ON br.id=bs.restoran_id
             LEFT JOIN bayi_kuryeler bk ON bk.id=bs.kurye_id
             WHERE bs.bayilik_id=?`
  const params = [req.bayi.bayilikId]
  if (durum) { sql += ' AND bs.durum=?'; params.push(durum) }
  if (tarih) { sql += ' AND date(bs.olusturma_tarihi)=?'; params.push(tarih) }
  sql += ' ORDER BY bs.id DESC'
  res.json(await all(sql, params))
}))

app.post('/api/bayi/siparisler', bayiAuthMiddleware, wrap(async (req, res) => {
  const { restoran_id, musteri_ad, musteri_telefon, teslimat_adresi, tutar, odeme_yontemi } = req.body || {}
  if (!restoran_id) return res.status(400).json({ message: 'Restoran seçilmeli' })
  const siparis_no = `SIP-${Date.now()}`
  const { lastID } = await run(
    'INSERT INTO bayi_siparisler (bayilik_id,siparis_no,restoran_id,musteri_ad,musteri_telefon,teslimat_adresi,tutar,odeme_yontemi) VALUES (?,?,?,?,?,?,?,?)',
    [req.bayi.bayilikId, siparis_no, restoran_id, musteri_ad||null, musteri_telefon||null, teslimat_adresi||null, tutar||0, odeme_yontemi||'Nakit']
  )
  res.status(201).json(await get(
    `SELECT bs.*, br.ad as restoran_ad, bk.ad as kurye_ad FROM bayi_siparisler bs LEFT JOIN bayi_restoranlar br ON br.id=bs.restoran_id LEFT JOIN bayi_kuryeler bk ON bk.id=bs.kurye_id WHERE bs.id=?`,
    [lastID]
  ))
}))

app.put('/api/bayi/siparisler/:id/kurye-ata', bayiAuthMiddleware, wrap(async (req, res) => {
  const s = await get('SELECT * FROM bayi_siparisler WHERE id=? AND bayilik_id=?', [req.params.id, req.bayi.bayilikId])
  if (!s) return res.status(404).json({ message: 'Sipariş bulunamadı' })
  const { kurye_id } = req.body || {}
  if (!kurye_id) return res.status(400).json({ message: 'Kurye seçilmeli' })
  const k = await get('SELECT * FROM bayi_kuryeler WHERE id=? AND bayilik_id=?', [kurye_id, req.bayi.bayilikId])
  if (!k) return res.status(404).json({ message: 'Kurye bulunamadı' })
  await run('UPDATE bayi_siparisler SET kurye_id=?,durum=?,atama_zamani=datetime("now","localtime") WHERE id=?',
    [kurye_id, 'Atandı', req.params.id])
  await run("UPDATE bayi_kuryeler SET durum='Dağıtımda' WHERE id=?", [kurye_id])
  res.json(await get(
    `SELECT bs.*, br.ad as restoran_ad, bk.ad as kurye_ad FROM bayi_siparisler bs LEFT JOIN bayi_restoranlar br ON br.id=bs.restoran_id LEFT JOIN bayi_kuryeler bk ON bk.id=bs.kurye_id WHERE bs.id=?`,
    [req.params.id]
  ))
}))

app.put('/api/bayi/siparisler/:id/oto-ata', bayiAuthMiddleware, wrap(async (req, res) => {
  const s = await get('SELECT * FROM bayi_siparisler WHERE id=? AND bayilik_id=?', [req.params.id, req.bayi.bayilikId])
  if (!s) return res.status(404).json({ message: 'Sipariş bulunamadı' })
  const kurye = await get("SELECT * FROM bayi_kuryeler WHERE bayilik_id=? AND durum='Müsait' AND aktif=1 LIMIT 1", [req.bayi.bayilikId])
  if (!kurye) return res.status(400).json({ message: 'Müsait kurye bulunamadı' })
  await run('UPDATE bayi_siparisler SET kurye_id=?,durum=?,atama_zamani=datetime("now","localtime") WHERE id=?',
    [kurye.id, 'Atandı', req.params.id])
  await run("UPDATE bayi_kuryeler SET durum='Dağıtımda' WHERE id=?", [kurye.id])
  res.json({ kurye_ad: kurye.ad, kurye_id: kurye.id })
}))

app.put('/api/bayi/siparisler/:id/teslim', bayiAuthMiddleware, wrap(async (req, res) => {
  const s = await get('SELECT * FROM bayi_siparisler WHERE id=? AND bayilik_id=?', [req.params.id, req.bayi.bayilikId])
  if (!s) return res.status(404).json({ message: 'Sipariş bulunamadı' })
  // Deduct 1 kontör from bayilik token
  await run('UPDATE bayilikler SET token=MAX(0,token-1) WHERE id=?', [req.bayi.bayilikId])
  await run('UPDATE bayi_siparisler SET durum=?,teslim_zamani=datetime("now","localtime") WHERE id=?', ['Teslim Edildi', req.params.id])
  if (s.kurye_id) {
    await run('UPDATE bayi_kuryeler SET gunluk_teslimat=gunluk_teslimat+1,toplam_teslimat=toplam_teslimat+1 WHERE id=?', [s.kurye_id])
    // If courier has no more active deliveries, set to Müsait
    const aktifSiparis = await get("SELECT COUNT(*) as c FROM bayi_siparisler WHERE kurye_id=? AND durum IN ('Atandı','Yolda')", [s.kurye_id])
    if (!aktifSiparis || aktifSiparis.c === 0) {
      await run("UPDATE bayi_kuryeler SET durum='Müsait' WHERE id=?", [s.kurye_id])
    }
  }
  // Log kontör deduction
  const b = await get('SELECT token FROM bayilikler WHERE id=?', [req.bayi.bayilikId])
  await run('INSERT INTO kontor_gecmisi (islem_turu,bayilik_id,miktar,kalan_bakiye) VALUES (?,?,?,?)',
    ['Sipariş Teslim', req.bayi.bayilikId, -1, b?.token ?? 0])
  res.json({ success: true, yeni_token: b?.token ?? 0 })
}))

app.put('/api/bayi/siparisler/:id/durum', bayiAuthMiddleware, wrap(async (req, res) => {
  const s = await get('SELECT * FROM bayi_siparisler WHERE id=? AND bayilik_id=?', [req.params.id, req.bayi.bayilikId])
  if (!s) return res.status(404).json({ message: 'Sipariş bulunamadı' })
  const { durum } = req.body || {}
  await run('UPDATE bayi_siparisler SET durum=? WHERE id=?', [durum, req.params.id])
  res.json({ ...s, durum })
}))

// ── BAYİ RAPORLAR ────────────────────────────────────────────────────────────
app.get('/api/bayi/raporlar', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { tip = 'gecmis', baslangic, bitis } = req.query

  let dateFilter = ''
  const params = [bid]
  if (baslangic) { dateFilter += ' AND date(bs.olusturma_tarihi)>=?'; params.push(baslangic) }
  if (bitis) { dateFilter += ' AND date(bs.olusturma_tarihi)<=?'; params.push(bitis) }

  const siparisler = await all(
    `SELECT bs.*, br.ad as restoran_ad, bk.ad as kurye_ad
     FROM bayi_siparisler bs
     LEFT JOIN bayi_restoranlar br ON br.id=bs.restoran_id
     LEFT JOIN bayi_kuryeler bk ON bk.id=bs.kurye_id
     WHERE bs.bayilik_id=?${dateFilter} ORDER BY bs.id DESC`,
    params
  )

  const kurye_hakedis = await all(
    `SELECT bk.ad, bk.durum, COUNT(bs.id) as teslim_sayisi, SUM(bs.tutar) as toplam_tutar
     FROM bayi_kuryeler bk
     LEFT JOIN bayi_siparisler bs ON bs.kurye_id=bk.id AND bs.durum='Teslim Edildi' AND bs.bayilik_id=?
     WHERE bk.bayilik_id=?
     GROUP BY bk.id`,
    [bid, bid]
  )

  const restoran_hakedis = await all(
    `SELECT br.ad, COUNT(bs.id) as siparis_sayisi, SUM(bs.tutar) as toplam_tutar
     FROM bayi_restoranlar br
     LEFT JOIN bayi_siparisler bs ON bs.restoran_id=br.id AND bs.durum='Teslim Edildi' AND bs.bayilik_id=?
     WHERE br.bayilik_id=?
     GROUP BY br.id`,
    [bid, bid]
  )

  const gunluk_trend = await all(
    `SELECT date(olusturma_tarihi) as gun, COUNT(*) as siparis, SUM(tutar) as ciro
     FROM bayi_siparisler WHERE bayilik_id=? AND durum='Teslim Edildi'
     GROUP BY gun ORDER BY gun DESC LIMIT 14`,
    [bid]
  )

  res.json({ siparisler, kurye_hakedis, restoran_hakedis, gunluk_trend })
}))

// ── BAYİ AYARLAR ─────────────────────────────────────────────────────────────
app.get('/api/bayi/ayarlar', bayiAuthMiddleware, wrap(async (req, res) => {
  let ay = await get('SELECT * FROM bayi_ayarlar WHERE bayilik_id=?', [req.bayi.bayilikId])
  if (!ay) {
    await run('INSERT OR IGNORE INTO bayi_ayarlar (bayilik_id) VALUES (?)', [req.bayi.bayilikId])
    ay = await get('SELECT * FROM bayi_ayarlar WHERE bayilik_id=?', [req.bayi.bayilikId])
  }
  const b = await get('SELECT id,ad,bayilik_id,sehir,token,durum,bayi_email FROM bayilikler WHERE id=?', [req.bayi.bayilikId])
  res.json({ ...ay, bayilik: b })
}))

app.put('/api/bayi/ayarlar', bayiAuthMiddleware, wrap(async (req, res) => {
  const { atama_modu, max_siparis_per_kurye, bonus_aktif, bonus_miktar, bildirim_email, bildirim_sms } = req.body || {}
  await run('INSERT OR IGNORE INTO bayi_ayarlar (bayilik_id) VALUES (?)', [req.bayi.bayilikId])
  await run(
    'UPDATE bayi_ayarlar SET atama_modu=COALESCE(?,atama_modu),max_siparis_per_kurye=COALESCE(?,max_siparis_per_kurye),bonus_aktif=COALESCE(?,bonus_aktif),bonus_miktar=COALESCE(?,bonus_miktar),bildirim_email=COALESCE(?,bildirim_email),bildirim_sms=COALESCE(?,bildirim_sms) WHERE bayilik_id=?',
    [atama_modu||null, max_siparis_per_kurye||null, bonus_aktif!=null?bonus_aktif:null, bonus_miktar||null, bildirim_email!=null?bildirim_email:null, bildirim_sms!=null?bildirim_sms:null, req.bayi.bayilikId]
  )
  res.json(await get('SELECT * FROM bayi_ayarlar WHERE bayilik_id=?', [req.bayi.bayilikId]))
}))

// ── BAYİ PERFORMANS ──────────────────────────────────────────────────────────
app.get('/api/bayi/performans', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId

  const kurye_perf = await all(
    `SELECT bk.id, bk.ad, bk.durum, bk.toplam_teslimat, bk.gunluk_teslimat,
     COUNT(CASE WHEN bs.durum='Teslim Edildi' THEN 1 END) as basarili,
     AVG(CASE WHEN bs.teslim_zamani IS NOT NULL
       THEN (julianday(bs.teslim_zamani) - julianday(bs.atama_zamani)) * 24 * 60 END) as ort_sure
     FROM bayi_kuryeler bk
     LEFT JOIN bayi_siparisler bs ON bs.kurye_id=bk.id AND bs.bayilik_id=?
     WHERE bk.bayilik_id=? AND bk.aktif=1
     GROUP BY bk.id`,
    [bid, bid]
  )

  const isletme_perf = await all(
    `SELECT br.ad, COUNT(bs.id) as toplam,
     COUNT(CASE WHEN bs.durum='Teslim Edildi' THEN 1 END) as teslim,
     SUM(bs.tutar) as ciro
     FROM bayi_restoranlar br
     LEFT JOIN bayi_siparisler bs ON bs.restoran_id=br.id AND bs.bayilik_id=?
     WHERE br.bayilik_id=?
     GROUP BY br.id`,
    [bid, bid]
  )

  res.json({ kurye_perf, isletme_perf })
}))

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.message)
  res.status(500).json({ message: 'Sunucu hatası' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
initDb()
  .then(() => initBayiDb())
  .then(() => app.listen(PORT, () => console.log(`Paketçi B2B Backend → http://localhost:${PORT}`)))
  .catch((err) => { console.error('DB init hatası:', err); process.exit(1) })
