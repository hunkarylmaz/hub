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

// ── BAYİ ERİŞİM BİLGİLERİ (B2B → Bayi panel credentials) ────────────────────
app.put('/api/bayilikler/:id/bayi-erisim', authMiddleware, wrap(async (req, res) => {
  const b = await get('SELECT * FROM bayilikler WHERE id=? AND user_id=?', [req.params.id, req.user.id])
  if (!b) return res.status(404).json({ message: 'Bulunamadı' })
  const { bayi_email, bayi_sifre } = req.body || {}
  if (!bayi_email) return res.status(400).json({ message: 'Email zorunlu' })
  let hashPass = b.bayi_sifre
  if (bayi_sifre) {
    hashPass = await bcrypt.hash(bayi_sifre, 10)
  }
  await run('UPDATE bayilikler SET bayi_email=?,bayi_sifre=? WHERE id=?', [bayi_email, hashPass, req.params.id])
  res.json({ success: true, bayi_email })
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
  // Restoran extended fields
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN ilce TEXT') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN email TEXT') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN iban TEXT') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN iban_sahibi TEXT') } catch {}
  try { await run("ALTER TABLE bayi_restoranlar ADD COLUMN calisma_tipi TEXT DEFAULT 'Paket Başı'") } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN paket_basi_ucret REAL DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN km_baslangic REAL DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN km_ucret REAL DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN komisyon_yuzdesi REAL DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN saatlik_ucret REAL DEFAULT 0') } catch {}
  try { await run("ALTER TABLE bayi_restoranlar ADD COLUMN coklu_paket TEXT DEFAULT '[]'") } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN hazirlanma_suresi INTEGER DEFAULT 30') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN otomatik_yazdir INTEGER DEFAULT 1') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN kurye_konum_takip INTEGER DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN kurye_numara_goruntu INTEGER DEFAULT 1') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN restoran_teslimat INTEGER DEFAULT 1') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN siparis_hazir INTEGER DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN pos_kullanim INTEGER DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN odeme_duzenleme INTEGER DEFAULT 1') } catch {}
  try { await run('ALTER TABLE bayi_restoranlar ADD COLUMN harita_konum INTEGER DEFAULT 1') } catch {}
  try { await run('ALTER TABLE bayi_kuryeler ADD COLUMN plaka TEXT') } catch {}
  try { await run("ALTER TABLE bayi_kuryeler ADD COLUMN paket_limiti INTEGER DEFAULT 5") } catch {}
  try { await run(`ALTER TABLE bayi_kuryeler ADD COLUMN odeme_tipleri TEXT DEFAULT '["Nakit","Kredi Kartı"]'`) } catch {}
  try { await run("ALTER TABLE bayi_kuryeler ADD COLUMN calisma_tipi TEXT DEFAULT 'Paket Başı'") } catch {}
  try { await run('ALTER TABLE bayi_kuryeler ADD COLUMN paket_basi_ucret REAL DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_kuryeler ADD COLUMN km_baslangic REAL DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_kuryeler ADD COLUMN km_ucret REAL DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_kuryeler ADD COLUMN komisyon_yuzdesi REAL DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_kuryeler ADD COLUMN saatlik_ucret REAL DEFAULT 0') } catch {}
  try { await run("ALTER TABLE bayi_kuryeler ADD COLUMN coklu_paket TEXT DEFAULT '[]'") } catch {}
  try { await run('ALTER TABLE bayi_kuryeler ADD COLUMN paket_iptali INTEGER DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_kuryeler ADD COLUMN odeme_duzenleme INTEGER DEFAULT 1') } catch {}
  try { await run('ALTER TABLE bayi_kuryeler ADD COLUMN lat REAL') } catch {}
  try { await run('ALTER TABLE bayi_kuryeler ADD COLUMN lon REAL') } catch {}
  try { await run('ALTER TABLE bayi_kuryeler ADD COLUMN son_konum_tarihi TEXT') } catch {}

  // Genel Ayarlar extensions for bayi_ayarlar
  try { await run("ALTER TABLE bayi_ayarlar ADD COLUMN calisma_acilis TEXT DEFAULT '11:00'") } catch {}
  try { await run("ALTER TABLE bayi_ayarlar ADD COLUMN calisma_kapanis TEXT DEFAULT '05:00'") } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN lat REAL') } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN lon REAL') } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN ilce TEXT') } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN siparis_tutar_gorunu INTEGER DEFAULT 1') } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN isletmeye_vardim INTEGER DEFAULT 1') } catch {}
  try { await run("ALTER TABLE bayi_ayarlar ADD COLUMN siparis_onay_modu TEXT DEFAULT 'Manuel'") } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN bildirim_gecikmesi INTEGER DEFAULT 6') } catch {}
  try { await run("ALTER TABLE bayi_ayarlar ADD COLUMN bildirim_mesaji TEXT DEFAULT 'Siparişi henüz görmediniz! Lütfen kontrol edin.'") } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN gecmis_kazanc_duzenleme INTEGER DEFAULT 1') } catch {}

  // Bonus periyot columns
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN bonus_gunluk_aktif INTEGER DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN bonus_gunluk_min INTEGER DEFAULT 10') } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN bonus_gunluk_tutar REAL DEFAULT 50') } catch {}
  try { await run("ALTER TABLE bayi_ayarlar ADD COLUMN bonus_gunluk_tip TEXT DEFAULT 'Tutar'") } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN bonus_haftalik_aktif INTEGER DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN bonus_haftalik_min INTEGER DEFAULT 50') } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN bonus_haftalik_tutar REAL DEFAULT 200') } catch {}
  try { await run("ALTER TABLE bayi_ayarlar ADD COLUMN bonus_haftalik_tip TEXT DEFAULT 'Tutar'") } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN bonus_aylik_aktif INTEGER DEFAULT 0') } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN bonus_aylik_min INTEGER DEFAULT 200') } catch {}
  try { await run('ALTER TABLE bayi_ayarlar ADD COLUMN bonus_aylik_tutar REAL DEFAULT 5') } catch {}
  try { await run("ALTER TABLE bayi_ayarlar ADD COLUMN bonus_aylik_tip TEXT DEFAULT 'Yüzde'") } catch {}

  // Bildirimler (bayi → kuryeler)
  await exec(`
    CREATE TABLE IF NOT EXISTS bayi_bildirimler (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bayilik_id INTEGER,
      kurye_id INTEGER,
      baslik TEXT NOT NULL,
      mesaj TEXT NOT NULL,
      olusturma_tarihi TEXT DEFAULT (datetime('now','localtime'))
    );
  `)

  // Bakiye hareketleri
  await exec(`
    CREATE TABLE IF NOT EXISTS bakiye_hareketleri (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bayilik_id INTEGER REFERENCES bayilikler(id),
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      tur TEXT NOT NULL,
      tutar REAL DEFAULT 0,
      tarih TEXT,
      aciklama TEXT,
      faturaya_dahil INTEGER DEFAULT 1,
      olusturma_tarihi TEXT DEFAULT (datetime('now','localtime'))
    );
  `)

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

    CREATE TABLE IF NOT EXISTS bayi_atama_ayarlari (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bayilik_id INTEGER UNIQUE,
      oto_atama_aktif INTEGER DEFAULT 1,
      ilave_paket INTEGER DEFAULT 1,
      kurye_arama_km REAL DEFAULT 6.0,
      isletme_yakinlik_m INTEGER DEFAULT 800,
      teslimat_yakinlik_m INTEGER DEFAULT 500,
      atama_bekleme_dk INTEGER DEFAULT 0,
      paket_birlestirme_dk INTEGER DEFAULT 30,
      atamasiz_tekrar_dk INTEGER DEFAULT 3,
      max_paket_per_kurye INTEGER DEFAULT 4,
      kurye_secim_algo TEXT DEFAULT 'En Yakın Kurye',
      havuz_aktif INTEGER DEFAULT 1,
      havuz_teslimatci_gizle INTEGER DEFAULT 0,
      havuz_mesafe_km REAL DEFAULT 7.0,
      havuz_bekleme_dk INTEGER DEFAULT 3,
      havuz_siparis_adet INTEGER DEFAULT 20,
      havuz_paket_limiti INTEGER DEFAULT 15
    );

    CREATE TABLE IF NOT EXISTS bayi_vardiyalar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bayilik_id INTEGER,
      kurye_id INTEGER,
      tarih TEXT NOT NULL,
      baslangic TEXT,
      bitis TEXT,
      izin INTEGER DEFAULT 0,
      not_text TEXT,
      olusturma_tarihi TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS banka_hesaplari (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      banka_adi TEXT NOT NULL,
      ad_soyad TEXT,
      iban TEXT NOT NULL,
      aktif INTEGER DEFAULT 1
    );
  `)

  await exec(`
    CREATE TABLE IF NOT EXISTS bayi_kullanicilar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bayilik_id INTEGER REFERENCES bayilikler(id),
      ad_soyad TEXT NOT NULL,
      email TEXT NOT NULL,
      telefon TEXT,
      sifre_hash TEXT NOT NULL,
      rol TEXT DEFAULT 'Operasyon',
      sayfa_izinleri TEXT DEFAULT '[]',
      aktif INTEGER DEFAULT 1,
      silinmis INTEGER DEFAULT 0,
      olusturma_tarihi TEXT DEFAULT (datetime('now','localtime'))
    );
  `)

  await exec(`
    CREATE TABLE IF NOT EXISTS bayi_mola_ayarlari (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bayilik_id INTEGER UNIQUE,
      gunluk_mola_hakki INTEGER DEFAULT 2,
      mola_sureleri TEXT DEFAULT '[15,25,35,40]',
      onay_mekanizmasi TEXT DEFAULT 'Manuel Onay',
      yasak_saatler TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS bayi_mola_talepleri (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bayilik_id INTEGER,
      kurye_id INTEGER,
      sure_dk INTEGER NOT NULL,
      durum TEXT DEFAULT 'Bekliyor',
      talep_tarihi TEXT DEFAULT (datetime('now','localtime')),
      baslangic TEXT,
      bitis TEXT
    );
  `)

  const bankCount = await get('SELECT COUNT(*) as c FROM banka_hesaplari')
  if (bankCount.c === 0) {
    await run("INSERT INTO banka_hesaplari (banka_adi,ad_soyad,iban) VALUES (?,?,?)",
      ['Yapıkredi', 'Hünkar Yılmaz', 'TR700006701000000079431847'])
  }

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

  // Seed demo GPS locations for Bodrum area
  await run('UPDATE bayi_kuryeler SET lat=?,lon=?,son_konum_tarihi=datetime("now","localtime") WHERE id=?', [37.0344, 27.4305, k1])
  await run('UPDATE bayi_kuryeler SET lat=?,lon=?,son_konum_tarihi=datetime("now","localtime") WHERE id=?', [37.0381, 27.4258, k2])
  await run('UPDATE bayi_kuryeler SET lat=?,lon=?,son_konum_tarihi=datetime("now","localtime") WHERE id=?', [37.0312, 27.4412, k3])
  await run('UPDATE bayi_kuryeler SET lat=?,lon=?,son_konum_tarihi=datetime("now","localtime") WHERE id=?', [37.0298, 27.4187, k4])
  await run('UPDATE bayi_kuryeler SET lat=?,lon=?,son_konum_tarihi=datetime("now","localtime") WHERE id=?', [37.0421, 27.4355, k5])

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
  const {
    ad, telefon, plaka,
    paket_limiti, odeme_tipleri, calisma_tipi,
    paket_basi_ucret, km_baslangic, km_ucret,
    komisyon_yuzdesi, saatlik_ucret, coklu_paket,
    paket_iptali, odeme_duzenleme, aktif
  } = req.body || {}
  await run(
    `UPDATE bayi_kuryeler SET
      ad=COALESCE(?,ad), telefon=COALESCE(?,telefon), plaka=COALESCE(?,plaka),
      paket_limiti=COALESCE(?,paket_limiti), odeme_tipleri=COALESCE(?,odeme_tipleri),
      calisma_tipi=COALESCE(?,calisma_tipi), paket_basi_ucret=COALESCE(?,paket_basi_ucret),
      km_baslangic=COALESCE(?,km_baslangic), km_ucret=COALESCE(?,km_ucret),
      komisyon_yuzdesi=COALESCE(?,komisyon_yuzdesi), saatlik_ucret=COALESCE(?,saatlik_ucret),
      coklu_paket=COALESCE(?,coklu_paket),
      paket_iptali=COALESCE(?,paket_iptali), odeme_duzenleme=COALESCE(?,odeme_duzenleme),
      aktif=COALESCE(?,aktif)
    WHERE id=?`,
    [
      ad||null, telefon||null, plaka||null,
      paket_limiti!=null?paket_limiti:null,
      odeme_tipleri!=null ? (Array.isArray(odeme_tipleri) ? JSON.stringify(odeme_tipleri) : odeme_tipleri) : null,
      calisma_tipi||null,
      paket_basi_ucret!=null?paket_basi_ucret:null, km_baslangic!=null?km_baslangic:null,
      km_ucret!=null?km_ucret:null, komisyon_yuzdesi!=null?komisyon_yuzdesi:null,
      saatlik_ucret!=null?saatlik_ucret:null,
      coklu_paket!=null ? (Array.isArray(coklu_paket) ? JSON.stringify(coklu_paket) : coklu_paket) : null,
      paket_iptali!=null?paket_iptali:null, odeme_duzenleme!=null?odeme_duzenleme:null,
      aktif!=null?aktif:null,
      req.params.id
    ]
  )
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
  const {
    ad, adres, telefon, aktif, ilce, email, iban, iban_sahibi,
    calisma_tipi, paket_basi_ucret, km_baslangic, km_ucret,
    komisyon_yuzdesi, saatlik_ucret, coklu_paket, hazirlanma_suresi,
    otomatik_yazdir, kurye_konum_takip, kurye_numara_goruntu,
    restoran_teslimat, siparis_hazir, pos_kullanim, odeme_duzenleme, harita_konum
  } = req.body || {}
  const n = (v) => v != null ? v : null
  const j = (v) => v != null ? (Array.isArray(v) ? JSON.stringify(v) : v) : null
  await run(`UPDATE bayi_restoranlar SET
    ad=COALESCE(?,ad), adres=COALESCE(?,adres), telefon=COALESCE(?,telefon), aktif=COALESCE(?,aktif),
    ilce=COALESCE(?,ilce), email=COALESCE(?,email), iban=COALESCE(?,iban), iban_sahibi=COALESCE(?,iban_sahibi),
    calisma_tipi=COALESCE(?,calisma_tipi), paket_basi_ucret=COALESCE(?,paket_basi_ucret),
    km_baslangic=COALESCE(?,km_baslangic), km_ucret=COALESCE(?,km_ucret),
    komisyon_yuzdesi=COALESCE(?,komisyon_yuzdesi), saatlik_ucret=COALESCE(?,saatlik_ucret),
    coklu_paket=COALESCE(?,coklu_paket), hazirlanma_suresi=COALESCE(?,hazirlanma_suresi),
    otomatik_yazdir=COALESCE(?,otomatik_yazdir), kurye_konum_takip=COALESCE(?,kurye_konum_takip),
    kurye_numara_goruntu=COALESCE(?,kurye_numara_goruntu), restoran_teslimat=COALESCE(?,restoran_teslimat),
    siparis_hazir=COALESCE(?,siparis_hazir), pos_kullanim=COALESCE(?,pos_kullanim),
    odeme_duzenleme=COALESCE(?,odeme_duzenleme), harita_konum=COALESCE(?,harita_konum)
    WHERE id=?`,
    [ad||null, adres||null, telefon||null, n(aktif),
     ilce||null, email||null, iban||null, iban_sahibi||null,
     calisma_tipi||null, n(paket_basi_ucret), n(km_baslangic), n(km_ucret),
     n(komisyon_yuzdesi), n(saatlik_ucret), j(coklu_paket), n(hazirlanma_suresi),
     n(otomatik_yazdir), n(kurye_konum_takip), n(kurye_numara_goruntu), n(restoran_teslimat),
     n(siparis_hazir), n(pos_kullanim), n(odeme_duzenleme), n(harita_konum),
     req.params.id])
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
  const {
    atama_modu, max_siparis_per_kurye, bonus_aktif, bonus_miktar, bildirim_email, bildirim_sms,
    bonus_gunluk_aktif, bonus_gunluk_min, bonus_gunluk_tutar, bonus_gunluk_tip,
    bonus_haftalik_aktif, bonus_haftalik_min, bonus_haftalik_tutar, bonus_haftalik_tip,
    bonus_aylik_aktif, bonus_aylik_min, bonus_aylik_tutar, bonus_aylik_tip
  } = req.body || {}
  await run('INSERT OR IGNORE INTO bayi_ayarlar (bayilik_id) VALUES (?)', [req.bayi.bayilikId])
  await run(
    `UPDATE bayi_ayarlar SET
      atama_modu=COALESCE(?,atama_modu), max_siparis_per_kurye=COALESCE(?,max_siparis_per_kurye),
      bonus_aktif=COALESCE(?,bonus_aktif), bonus_miktar=COALESCE(?,bonus_miktar),
      bildirim_email=COALESCE(?,bildirim_email), bildirim_sms=COALESCE(?,bildirim_sms),
      bonus_gunluk_aktif=COALESCE(?,bonus_gunluk_aktif), bonus_gunluk_min=COALESCE(?,bonus_gunluk_min),
      bonus_gunluk_tutar=COALESCE(?,bonus_gunluk_tutar), bonus_gunluk_tip=COALESCE(?,bonus_gunluk_tip),
      bonus_haftalik_aktif=COALESCE(?,bonus_haftalik_aktif), bonus_haftalik_min=COALESCE(?,bonus_haftalik_min),
      bonus_haftalik_tutar=COALESCE(?,bonus_haftalik_tutar), bonus_haftalik_tip=COALESCE(?,bonus_haftalik_tip),
      bonus_aylik_aktif=COALESCE(?,bonus_aylik_aktif), bonus_aylik_min=COALESCE(?,bonus_aylik_min),
      bonus_aylik_tutar=COALESCE(?,bonus_aylik_tutar), bonus_aylik_tip=COALESCE(?,bonus_aylik_tip)
    WHERE bayilik_id=?`,
    [
      atama_modu||null, max_siparis_per_kurye||null, bonus_aktif!=null?bonus_aktif:null, bonus_miktar||null,
      bildirim_email!=null?bildirim_email:null, bildirim_sms!=null?bildirim_sms:null,
      bonus_gunluk_aktif??null, bonus_gunluk_min??null, bonus_gunluk_tutar??null, bonus_gunluk_tip||null,
      bonus_haftalik_aktif??null, bonus_haftalik_min??null, bonus_haftalik_tutar??null, bonus_haftalik_tip||null,
      bonus_aylik_aktif??null, bonus_aylik_min??null, bonus_aylik_tutar??null, bonus_aylik_tip||null,
      req.bayi.bayilikId
    ]
  )
  res.json(await get('SELECT * FROM bayi_ayarlar WHERE bayilik_id=?', [req.bayi.bayilikId]))
}))

// ── BAYİ ATAMA AYARLARI ────────────────────────────────────────────────────────
app.get('/api/bayi/ayarlar/atama', bayiAuthMiddleware, wrap(async (req, res) => {
  let row = await get('SELECT * FROM bayi_atama_ayarlari WHERE bayilik_id=?', [req.bayi.bayilikId])
  if (!row) {
    await run('INSERT OR IGNORE INTO bayi_atama_ayarlari (bayilik_id) VALUES (?)', [req.bayi.bayilikId])
    row = await get('SELECT * FROM bayi_atama_ayarlari WHERE bayilik_id=?', [req.bayi.bayilikId])
  }
  res.json(row)
}))

app.put('/api/bayi/ayarlar/atama', bayiAuthMiddleware, wrap(async (req, res) => {
  const {
    oto_atama_aktif, ilave_paket, kurye_arama_km, isletme_yakinlik_m, teslimat_yakinlik_m,
    atama_bekleme_dk, paket_birlestirme_dk, atamasiz_tekrar_dk, max_paket_per_kurye,
    kurye_secim_algo, havuz_aktif, havuz_teslimatci_gizle, havuz_mesafe_km,
    havuz_bekleme_dk, havuz_siparis_adet, havuz_paket_limiti
  } = req.body || {}
  await run('INSERT OR IGNORE INTO bayi_atama_ayarlari (bayilik_id) VALUES (?)', [req.bayi.bayilikId])
  await run(
    `UPDATE bayi_atama_ayarlari SET
      oto_atama_aktif=COALESCE(?,oto_atama_aktif), ilave_paket=COALESCE(?,ilave_paket),
      kurye_arama_km=COALESCE(?,kurye_arama_km), isletme_yakinlik_m=COALESCE(?,isletme_yakinlik_m),
      teslimat_yakinlik_m=COALESCE(?,teslimat_yakinlik_m), atama_bekleme_dk=COALESCE(?,atama_bekleme_dk),
      paket_birlestirme_dk=COALESCE(?,paket_birlestirme_dk), atamasiz_tekrar_dk=COALESCE(?,atamasiz_tekrar_dk),
      max_paket_per_kurye=COALESCE(?,max_paket_per_kurye), kurye_secim_algo=COALESCE(?,kurye_secim_algo),
      havuz_aktif=COALESCE(?,havuz_aktif), havuz_teslimatci_gizle=COALESCE(?,havuz_teslimatci_gizle),
      havuz_mesafe_km=COALESCE(?,havuz_mesafe_km), havuz_bekleme_dk=COALESCE(?,havuz_bekleme_dk),
      havuz_siparis_adet=COALESCE(?,havuz_siparis_adet), havuz_paket_limiti=COALESCE(?,havuz_paket_limiti)
    WHERE bayilik_id=?`,
    [
      oto_atama_aktif??null, ilave_paket??null, kurye_arama_km??null, isletme_yakinlik_m??null,
      teslimat_yakinlik_m??null, atama_bekleme_dk??null, paket_birlestirme_dk??null, atamasiz_tekrar_dk??null,
      max_paket_per_kurye??null, kurye_secim_algo||null, havuz_aktif??null, havuz_teslimatci_gizle??null,
      havuz_mesafe_km??null, havuz_bekleme_dk??null, havuz_siparis_adet??null, havuz_paket_limiti??null,
      req.bayi.bayilikId
    ]
  )
  res.json(await get('SELECT * FROM bayi_atama_ayarlari WHERE bayilik_id=?', [req.bayi.bayilikId]))
}))

// ── BAYİ GENEL AYARLAR (extended) ─────────────────────────────────────────────
app.put('/api/bayi/ayarlar/genel', bayiAuthMiddleware, wrap(async (req, res) => {
  const {
    calisma_acilis, calisma_kapanis, lat, lon, ilce,
    siparis_tutar_gorunu, isletmeye_vardim, siparis_onay_modu,
    bildirim_gecikmesi, bildirim_mesaji, gecmis_kazanc_duzenleme
  } = req.body || {}
  await run('INSERT OR IGNORE INTO bayi_ayarlar (bayilik_id) VALUES (?)', [req.bayi.bayilikId])
  await run(
    `UPDATE bayi_ayarlar SET
      calisma_acilis=COALESCE(?,calisma_acilis), calisma_kapanis=COALESCE(?,calisma_kapanis),
      lat=COALESCE(?,lat), lon=COALESCE(?,lon), ilce=COALESCE(?,ilce),
      siparis_tutar_gorunu=COALESCE(?,siparis_tutar_gorunu), isletmeye_vardim=COALESCE(?,isletmeye_vardim),
      siparis_onay_modu=COALESCE(?,siparis_onay_modu), bildirim_gecikmesi=COALESCE(?,bildirim_gecikmesi),
      bildirim_mesaji=COALESCE(?,bildirim_mesaji), gecmis_kazanc_duzenleme=COALESCE(?,gecmis_kazanc_duzenleme)
    WHERE bayilik_id=?`,
    [
      calisma_acilis||null, calisma_kapanis||null, lat??null, lon??null, ilce||null,
      siparis_tutar_gorunu??null, isletmeye_vardim??null, siparis_onay_modu||null,
      bildirim_gecikmesi??null, bildirim_mesaji||null, gecmis_kazanc_duzenleme??null,
      req.bayi.bayilikId
    ]
  )
  const ay = await get('SELECT * FROM bayi_ayarlar WHERE bayilik_id=?', [req.bayi.bayilikId])
  const b = await get('SELECT id,ad,bayilik_id,sehir,token,durum,bayi_email FROM bayilikler WHERE id=?', [req.bayi.bayilikId])
  res.json({ ...ay, bayilik: b })
}))

// ── BAYİ VARDİYALAR ────────────────────────────────────────────────────────────
app.get('/api/bayi/vardiyalar', bayiAuthMiddleware, wrap(async (req, res) => {
  const { hafta_baslangic } = req.query
  let where = 'bayilik_id=?'
  const params = [req.bayi.bayilikId]
  if (hafta_baslangic) {
    const bitis = new Date(hafta_baslangic)
    bitis.setDate(bitis.getDate() + 7)
    where += ' AND tarih >= ? AND tarih < ?'
    params.push(hafta_baslangic, bitis.toISOString().slice(0, 10))
  }
  res.json(await all(`SELECT * FROM bayi_vardiyalar WHERE ${where} ORDER BY tarih,kurye_id`, params))
}))

app.post('/api/bayi/vardiyalar', bayiAuthMiddleware, wrap(async (req, res) => {
  const { kurye_id, tarih, baslangic, bitis, izin, not_text } = req.body || {}
  if (!kurye_id || !tarih) return res.status(400).json({ message: 'kurye_id ve tarih zorunlu' })
  // Upsert: delete existing for same kurye+tarih then insert
  await run('DELETE FROM bayi_vardiyalar WHERE bayilik_id=? AND kurye_id=? AND tarih=?', [req.bayi.bayilikId, kurye_id, tarih])
  const { lastID } = await run(
    'INSERT INTO bayi_vardiyalar (bayilik_id,kurye_id,tarih,baslangic,bitis,izin,not_text) VALUES (?,?,?,?,?,?,?)',
    [req.bayi.bayilikId, kurye_id, tarih, baslangic||null, bitis||null, izin||0, not_text||null]
  )
  res.json(await get('SELECT * FROM bayi_vardiyalar WHERE id=?', [lastID]))
}))

app.delete('/api/bayi/vardiyalar/:id', bayiAuthMiddleware, wrap(async (req, res) => {
  await run('DELETE FROM bayi_vardiyalar WHERE id=? AND bayilik_id=?', [req.params.id, req.bayi.bayilikId])
  res.json({ success: true })
}))

// ── BANKA HESAPLARI (public for bayi) ─────────────────────────────────────────
app.get('/api/bayi/banka-hesaplari', bayiAuthMiddleware, wrap(async (req, res) => {
  res.json(await all('SELECT * FROM banka_hesaplari WHERE aktif=1 ORDER BY id'))
}))

// ── KONTÖR TALEP (bayi → B2B) ──────────────────────────────────────────────────
app.post('/api/bayi/kontor-talep', bayiAuthMiddleware, wrap(async (req, res) => {
  const { miktar, gonderen, banka, not_text } = req.body || {}
  if (!miktar || miktar < 500) return res.status(400).json({ message: 'Minimum 500 kontör' })
  const b = await get('SELECT * FROM bayilikler WHERE id=?', [req.bayi.bayilikId])
  if (!b) return res.status(404).json({ message: 'Bayilik bulunamadı' })
  const talep_no = 'KT' + Date.now()
  const { lastID } = await run(
    'INSERT INTO odeme_talepleri (talep_no,bayilik_id,miktar,banka,gonderen,durum,user_id) VALUES (?,?,?,?,?,?,?)',
    [talep_no, b.id, miktar, banka||null, gonderen||null, 'Beklemede', b.user_id]
  )
  res.json(await get('SELECT ot.*,b.ad as bayilik_ad FROM odeme_talepleri ot JOIN bayilikler b ON b.id=ot.bayilik_id WHERE ot.id=?', [lastID]))
}))

app.get('/api/bayi/kontor-talepler', bayiAuthMiddleware, wrap(async (req, res) => {
  const rows = await all(
    'SELECT * FROM odeme_talepleri WHERE bayilik_id=? ORDER BY id DESC',
    [req.bayi.bayilikId]
  )
  res.json(rows)
}))

// ── BAYİ BİLDİRİMLER (bayi → kuryeler) ───────────────────────────────────────
app.post('/api/bayi/bildirimler', bayiAuthMiddleware, wrap(async (req, res) => {
  const { kurye_id, baslik, mesaj } = req.body || {}
  if (!baslik || !mesaj) return res.status(400).json({ message: 'Başlık ve mesaj zorunlu' })
  const { lastID } = await run(
    'INSERT INTO bayi_bildirimler (bayilik_id,kurye_id,baslik,mesaj) VALUES (?,?,?,?)',
    [req.bayi.bayilikId, kurye_id||null, baslik, mesaj]
  )
  res.json(await get('SELECT * FROM bayi_bildirimler WHERE id=?', [lastID]))
}))

app.get('/api/bayi/bildirimler', bayiAuthMiddleware, wrap(async (req, res) => {
  const rows = await all(
    `SELECT bb.*, bk.ad as kurye_ad FROM bayi_bildirimler bb
     LEFT JOIN bayi_kuryeler bk ON bk.id=bb.kurye_id
     WHERE bb.bayilik_id=? ORDER BY bb.id DESC LIMIT 100`,
    [req.bayi.bayilikId]
  )
  res.json(rows)
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

// ── BAYİ BAKİYE HAREKETLERİ ───────────────────────────────────────────────────
app.get('/api/bayi/bakiye-hareketleri', bayiAuthMiddleware, wrap(async (req, res) => {
  const { entity_type, entity_id } = req.query
  const rows = await all(
    'SELECT * FROM bakiye_hareketleri WHERE bayilik_id=? AND entity_type=? AND entity_id=? ORDER BY tarih DESC',
    [req.bayi.bayilikId, entity_type, entity_id]
  )
  res.json(rows)
}))

app.post('/api/bayi/bakiye-hareketleri', bayiAuthMiddleware, wrap(async (req, res) => {
  const { entity_type, entity_id, tur, tutar, tarih, aciklama, faturaya_dahil } = req.body || {}
  if (!entity_type || !entity_id || !tur || !tutar) return res.status(400).json({ message: 'Eksik alan' })
  const { lastID } = await run(
    'INSERT INTO bakiye_hareketleri (bayilik_id,entity_type,entity_id,tur,tutar,tarih,aciklama,faturaya_dahil) VALUES (?,?,?,?,?,?,?,?)',
    [req.bayi.bayilikId, entity_type, entity_id, tur, tutar, tarih || new Date().toISOString(), aciklama || null, faturaya_dahil != null ? faturaya_dahil : 1]
  )
  res.json(await get('SELECT * FROM bakiye_hareketleri WHERE id=?', [lastID]))
}))

app.delete('/api/bayi/bakiye-hareketleri/:id', bayiAuthMiddleware, wrap(async (req, res) => {
  await run('DELETE FROM bakiye_hareketleri WHERE id=? AND bayilik_id=?', [req.params.id, req.bayi.bayilikId])
  res.json({ success: true })
}))

// ── BAYİ PERİYODİK RAPOR – İŞLETME ──────────────────────────────────────────
app.get('/api/bayi/raporlar/isletme', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { isletme_id, baslangic, bitis } = req.query
  if (!isletme_id) return res.status(400).json({ message: 'isletme_id zorunlu' })

  const restoran = await get('SELECT * FROM bayi_restoranlar WHERE id=? AND bayilik_id=?', [isletme_id, bid])
  if (!restoran) return res.status(404).json({ message: 'İşletme bulunamadı' })

  let where = `bayilik_id=? AND restoran_id=? AND durum='Teslim Edildi'`
  const params = [bid, isletme_id]
  if (baslangic) { where += ' AND olusturma_tarihi >= ?'; params.push(baslangic) }
  if (bitis)     { where += ' AND olusturma_tarihi <= ?'; params.push(bitis) }

  const siparisler = await all(`SELECT * FROM bayi_siparisler WHERE ${where} ORDER BY olusturma_tarihi ASC`, params)

  const odemeGruplari = {}
  for (const s of siparisler) {
    const key = s.odeme_yontemi || 'Diğer'
    if (!odemeGruplari[key]) odemeGruplari[key] = { sayi: 0, tutar: 0 }
    odemeGruplari[key].sayi++
    odemeGruplari[key].tutar += s.tutar || 0
  }

  const gunlukMap = {}
  for (const s of siparisler) {
    const gun = s.olusturma_tarihi ? s.olusturma_tarihi.slice(0, 10) : 'Bilinmiyor'
    if (!gunlukMap[gun]) gunlukMap[gun] = { sayi: 0, gelir: 0 }
    gunlukMap[gun].sayi++
    gunlukMap[gun].gelir += s.tutar || 0
  }

  const toplam_paket = siparisler.length
  const toplam_gelir = siparisler.reduce((a, s) => a + (s.tutar || 0), 0)
  const ct = restoran.calisma_tipi || 'Paket Başı'

  // Calculate transport fee by work type
  let tasima_toplam = 0
  let tasima_aciklama = ''
  if (ct === 'Paket Başı') {
    const birim = restoran.paket_basi_ucret || 0
    tasima_toplam = birim * toplam_paket
    tasima_aciklama = `${toplam_paket} adet × ${birim}₺`
  } else if (ct === 'Km Aralığı') {
    const baslangic_km = restoran.km_baslangic || 0
    const km_birim = restoran.km_ucret || 0
    tasima_toplam = (baslangic_km + km_birim) * toplam_paket
    tasima_aciklama = `${toplam_paket} adet × (${baslangic_km}₺ + ${km_birim}₺/km)`
  } else if (ct === 'Komisyon') {
    const oran = restoran.komisyon_yuzdesi || 0
    tasima_toplam = toplam_gelir * (oran / 100)
    tasima_aciklama = `${toplam_gelir.toFixed(2)}₺ × %${oran}`
  } else if (ct === 'Paket + Km') {
    const paket_birim = restoran.paket_basi_ucret || 0
    const km_birim = restoran.km_ucret || 0
    const km_bas = restoran.km_baslangic || 0
    tasima_toplam = (paket_birim + km_bas + km_birim) * toplam_paket
    tasima_aciklama = `${toplam_paket} adet × (${paket_birim}₺ paket + km)`
  } else if (ct === 'Saatlik Ücret') {
    tasima_toplam = restoran.saatlik_ucret || 0
    tasima_aciklama = `Saatlik ücret: ${tasima_toplam}₺`
  } else if (ct === 'Çoklu Paket') {
    let tiers = []
    try { tiers = JSON.parse(restoran.coklu_paket || '[]') } catch {}
    if (tiers.length === 0) tiers = [restoran.paket_basi_ucret || 0]
    // Distribute packages across tiers in groups of tier.length
    const grup = tiers.length
    const tam_grup = Math.floor(toplam_paket / grup)
    const kalan = toplam_paket % grup
    const grup_toplam = tiers.reduce((a, b) => a + (b || 0), 0)
    tasima_toplam = tam_grup * grup_toplam + tiers.slice(0, kalan).reduce((a, b) => a + (b || 0), 0)
    tasima_aciklama = `${toplam_paket} adet çoklu paket (${tiers.join('+')}₺)`
  }

  // Per-day tasima for günlük bazlı
  const gunlukWithTasima = Object.entries(gunlukMap).map(([gun, v]) => {
    let gun_tasima = 0
    if (ct === 'Komisyon') {
      gun_tasima = v.gelir * ((restoran.komisyon_yuzdesi || 0) / 100)
    } else if (ct === 'Saatlik Ücret') {
      gun_tasima = restoran.saatlik_ucret || 0
    } else if (ct === 'Çoklu Paket') {
      let tiers = []
      try { tiers = JSON.parse(restoran.coklu_paket || '[]') } catch {}
      if (tiers.length === 0) tiers = [restoran.paket_basi_ucret || 0]
      const grup = tiers.length
      const tam = Math.floor(v.sayi / grup)
      const kal = v.sayi % grup
      const gTop = tiers.reduce((a, b) => a + (b || 0), 0)
      gun_tasima = tam * gTop + tiers.slice(0, kal).reduce((a, b) => a + (b || 0), 0)
    } else {
      const birim = ct === 'Paket Başı' ? (restoran.paket_basi_ucret || 0)
        : ct === 'Km Aralığı' ? (restoran.km_baslangic || 0) + (restoran.km_ucret || 0)
        : (restoran.paket_basi_ucret || 0) + (restoran.km_baslangic || 0)
      gun_tasima = birim * v.sayi
    }
    return { gun, ...v, tasima: gun_tasima }
  })

  res.json({
    restoran,
    toplam_paket,
    toplam_gelir,
    tasima_toplam,
    tasima_aciklama,
    odeme_gruplari: odemeGruplari,
    gunluk: gunlukWithTasima,
  })
}))

// ── BAYİ PERİYODİK RAPOR – KURYE ─────────────────────────────────────────────
app.get('/api/bayi/raporlar/kurye', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { kurye_id, baslangic, bitis } = req.query
  if (!kurye_id) return res.status(400).json({ message: 'kurye_id zorunlu' })

  const kurye = await get('SELECT * FROM bayi_kuryeler WHERE id=? AND bayilik_id=?', [kurye_id, bid])
  if (!kurye) return res.status(404).json({ message: 'Kurye bulunamadı' })

  let where = `bayilik_id=? AND kurye_id=? AND durum='Teslim Edildi'`
  const params = [bid, kurye_id]
  if (baslangic) { where += ' AND olusturma_tarihi >= ?'; params.push(baslangic) }
  if (bitis)     { where += ' AND olusturma_tarihi <= ?'; params.push(bitis) }

  const siparisler = await all(`SELECT * FROM bayi_siparisler WHERE ${where} ORDER BY olusturma_tarihi ASC`, params)

  const gunlukMap = {}
  for (const s of siparisler) {
    const gun = s.olusturma_tarihi ? s.olusturma_tarihi.slice(0, 10) : 'Bilinmiyor'
    if (!gunlukMap[gun]) gunlukMap[gun] = { sayi: 0 }
    gunlukMap[gun].sayi++
  }

  const toplam_paket = siparisler.length
  const ct = kurye.calisma_tipi || 'Paket Başı'
  const ciro = siparisler.reduce((a, s) => a + (s.tutar || 0), 0)

  let brut_kazanc = 0
  let kazanc_aciklama = ''
  if (ct === 'Paket Başı') {
    brut_kazanc = (kurye.paket_basi_ucret || 0) * toplam_paket
    kazanc_aciklama = `${toplam_paket} adet × ${kurye.paket_basi_ucret || 0}₺`
  } else if (ct === 'Km Aralığı') {
    brut_kazanc = ((kurye.km_baslangic || 0) + (kurye.km_ucret || 0)) * toplam_paket
    kazanc_aciklama = `${toplam_paket} adet × km ücret`
  } else if (ct === 'Komisyon') {
    brut_kazanc = ciro * ((kurye.komisyon_yuzdesi || 0) / 100)
    kazanc_aciklama = `${ciro.toFixed(2)}₺ × %${kurye.komisyon_yuzdesi || 0}`
  } else if (ct === 'Paket + Km') {
    brut_kazanc = ((kurye.paket_basi_ucret || 0) + (kurye.km_baslangic || 0) + (kurye.km_ucret || 0)) * toplam_paket
    kazanc_aciklama = `${toplam_paket} adet × (paket + km)`
  } else if (ct === 'Saatlik Ücret') {
    brut_kazanc = kurye.saatlik_ucret || 0
    kazanc_aciklama = `Saatlik ücret: ${brut_kazanc}₺`
  } else if (ct === 'Çoklu Paket') {
    let tiers = []
    try { tiers = JSON.parse(kurye.coklu_paket || '[]') } catch {}
    if (tiers.length === 0) tiers = [kurye.paket_basi_ucret || 0]
    const grup = tiers.length
    const tam = Math.floor(toplam_paket / grup)
    const kal = toplam_paket % grup
    const gTop = tiers.reduce((a, b) => a + (b || 0), 0)
    brut_kazanc = tam * gTop + tiers.slice(0, kal).reduce((a, b) => a + (b || 0), 0)
    kazanc_aciklama = `${toplam_paket} adet çoklu (${tiers.join('+')}₺)`
  }

  let bhWhere = `bayilik_id=? AND entity_type='kurye' AND entity_id=? AND tur='Aldım' AND faturaya_dahil=1`
  const bhParams = [bid, kurye_id]
  if (baslangic) { bhWhere += ' AND tarih >= ?'; bhParams.push(baslangic) }
  if (bitis)     { bhWhere += ' AND tarih <= ?'; bhParams.push(bitis) }
  const aldim_row = await get(`SELECT COALESCE(SUM(tutar),0) as toplam FROM bakiye_hareketleri WHERE ${bhWhere}`, bhParams)
  const aldim_toplam = aldim_row?.toplam || 0

  // Per-day earnings
  const gunlukWithKazanc = Object.entries(gunlukMap).map(([gun, v]) => {
    let gun_kazanc = 0
    if (ct === 'Komisyon') {
      gun_kazanc = 0 // ciro per day not tracked separately
    } else if (ct === 'Çoklu Paket') {
      let tiers = []
      try { tiers = JSON.parse(kurye.coklu_paket || '[]') } catch {}
      if (tiers.length === 0) tiers = [kurye.paket_basi_ucret || 0]
      const g = tiers.length
      const t = Math.floor(v.sayi / g)
      const k = v.sayi % g
      const gT = tiers.reduce((a, b) => a + (b || 0), 0)
      gun_kazanc = t * gT + tiers.slice(0, k).reduce((a, b) => a + (b || 0), 0)
    } else {
      const birim = ct === 'Paket Başı' ? (kurye.paket_basi_ucret || 0)
        : ct === 'Km Aralığı' ? (kurye.km_baslangic || 0) + (kurye.km_ucret || 0)
        : ct === 'Paket + Km' ? (kurye.paket_basi_ucret || 0) + (kurye.km_baslangic || 0)
        : 0
      gun_kazanc = birim * v.sayi
    }
    return { gun, ...v, kazanc: gun_kazanc }
  })

  res.json({
    kurye,
    toplam_paket,
    brut_kazanc,
    kazanc_aciklama,
    aldim_toplam,
    ciro,
    gunluk: gunlukWithKazanc,
  })
}))

// ── BAYİ DETAYLI RAPORLAR ─────────────────────────────────────────────────────

function hesaplaKuryeKazanc(kurye, toplam_paket, ciro) {
  const ct = kurye.calisma_tipi || 'Paket Başı'
  let brut = 0
  if (ct === 'Paket Başı') brut = (kurye.paket_basi_ucret||0) * toplam_paket
  else if (ct === 'Km Aralığı') brut = ((kurye.km_baslangic||0)+(kurye.km_ucret||0)) * toplam_paket
  else if (ct === 'Komisyon') brut = ciro * ((kurye.komisyon_yuzdesi||0)/100)
  else if (ct === 'Paket + Km') brut = ((kurye.paket_basi_ucret||0)+(kurye.km_baslangic||0)+(kurye.km_ucret||0)) * toplam_paket
  else if (ct === 'Saatlik Ücret') brut = kurye.saatlik_ucret||0
  else if (ct === 'Çoklu Paket') {
    let tiers=[]; try{tiers=JSON.parse(kurye.coklu_paket||'[]')}catch{}
    if(!tiers.length) tiers=[kurye.paket_basi_ucret||0]
    const g=tiers.length, tam=Math.floor(toplam_paket/g), kal=toplam_paket%g
    const gTop=tiers.reduce((a,b)=>a+(b||0),0)
    brut=tam*gTop+tiers.slice(0,kal).reduce((a,b)=>a+(b||0),0)
  }
  return brut
}

function hesaplaRestoranTasima(restoran, toplam_paket, toplam_gelir) {
  const ct = restoran.calisma_tipi || 'Paket Başı'
  let tasima = 0
  if (ct === 'Paket Başı') tasima = (restoran.paket_basi_ucret||0) * toplam_paket
  else if (ct === 'Km Aralığı') tasima = ((restoran.km_baslangic||0)+(restoran.km_ucret||0)) * toplam_paket
  else if (ct === 'Komisyon') tasima = toplam_gelir * ((restoran.komisyon_yuzdesi||0)/100)
  else if (ct === 'Paket + Km') tasima = ((restoran.paket_basi_ucret||0)+(restoran.km_baslangic||0)+(restoran.km_ucret||0)) * toplam_paket
  else if (ct === 'Saatlik Ücret') tasima = restoran.saatlik_ucret||0
  else if (ct === 'Çoklu Paket') {
    let tiers=[]; try{tiers=JSON.parse(restoran.coklu_paket||'[]')}catch{}
    if(!tiers.length) tiers=[restoran.paket_basi_ucret||0]
    const g=tiers.length, tam=Math.floor(toplam_paket/g), kal=toplam_paket%g
    const gTop=tiers.reduce((a,b)=>a+(b||0),0)
    tasima=tam*gTop+tiers.slice(0,kal).reduce((a,b)=>a+(b||0),0)
  }
  return tasima
}

// Endpoint 1: Geçmiş Siparişler (filtrelenebilir, sayfalı)
app.get('/api/bayi/raporlar/gecmis', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const {
    restoran_id, kurye_id, baslangic, bitis,
    odeme_yontemi, durum,
    sayfa = 1, limit: limitRaw = 25
  } = req.query

  const limit = Math.max(1, parseInt(limitRaw) || 25)
  const offset = (Math.max(1, parseInt(sayfa) || 1) - 1) * limit

  let where = 'bs.bayilik_id=?'
  const params = [bid]

  if (restoran_id)    { where += ' AND bs.restoran_id=?';        params.push(restoran_id) }
  if (kurye_id)       { where += ' AND bs.kurye_id=?';           params.push(kurye_id) }
  if (baslangic)      { where += ' AND bs.olusturma_tarihi >= ?'; params.push(baslangic) }
  if (bitis)          { where += ' AND bs.olusturma_tarihi <= ?'; params.push(bitis) }
  if (odeme_yontemi)  { where += ' AND bs.odeme_yontemi=?';      params.push(odeme_yontemi) }
  if (durum)          { where += ' AND bs.durum=?';              params.push(durum) }

  const countRow = await get(
    `SELECT COUNT(*) as toplam FROM bayi_siparisler bs WHERE ${where}`,
    params
  )
  const toplam = countRow?.toplam || 0
  const sayfa_sayisi = Math.ceil(toplam / limit)

  const siparisler = await all(
    `SELECT bs.*,
            br.ad AS restoran_ad,
            bk.ad AS kurye_ad
     FROM bayi_siparisler bs
     LEFT JOIN bayi_restoranlar br ON br.id=bs.restoran_id
     LEFT JOIN bayi_kuryeler bk ON bk.id=bs.kurye_id
     WHERE ${where}
     ORDER BY bs.olusturma_tarihi DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  // Özet: tüm filtrelere uyan satırları (sayfalama olmadan)
  const tumRows = await all(
    `SELECT tutar, odeme_yontemi FROM bayi_siparisler bs WHERE ${where}`,
    params
  )
  const siparis_sayisi = tumRows.length
  const toplam_tutar = tumRows.reduce((a, s) => a + (s.tutar || 0), 0)
  const odeme_gruplari = {}
  for (const s of tumRows) {
    const key = s.odeme_yontemi || 'Diğer'
    if (!odeme_gruplari[key]) odeme_gruplari[key] = { sayi: 0, tutar: 0 }
    odeme_gruplari[key].sayi++
    odeme_gruplari[key].tutar += s.tutar || 0
  }

  res.json({
    siparisler,
    toplam,
    sayfa_sayisi,
    ozet: { siparis_sayisi, toplam_tutar, odeme_gruplari },
  })
}))

// Endpoint 2: Kuryeler Hakediş Raporu
app.get('/api/bayi/raporlar/kuryeler-hakedis', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { baslangic, bitis } = req.query

  const kuryeler = await all(
    'SELECT * FROM bayi_kuryeler WHERE bayilik_id=? AND aktif=1 ORDER BY ad ASC',
    [bid]
  )

  let gt_paket = 0
  let gt_kazanc = 0

  const kuryelerSonuc = await Promise.all(kuryeler.map(async (kurye) => {
    let sipWhere = `bayilik_id=? AND kurye_id=? AND durum='Teslim Edildi'`
    const sipParams = [bid, kurye.id]
    if (baslangic) { sipWhere += ' AND olusturma_tarihi >= ?'; sipParams.push(baslangic) }
    if (bitis)     { sipWhere += ' AND olusturma_tarihi <= ?'; sipParams.push(bitis) }

    const sipRow = await get(
      `SELECT COUNT(*) as sayi, COALESCE(SUM(tutar),0) as ciro FROM bayi_siparisler WHERE ${sipWhere}`,
      sipParams
    )
    const toplam_paket = sipRow?.sayi || 0
    const ciro = sipRow?.ciro || 0

    const brut_kazanc = hesaplaKuryeKazanc(kurye, toplam_paket, ciro)

    let bhWhere = `bayilik_id=? AND entity_type='kurye' AND entity_id=? AND tur='Aldım' AND faturaya_dahil=1`
    const bhParams = [bid, kurye.id]
    if (baslangic) { bhWhere += ' AND tarih >= ?'; bhParams.push(baslangic) }
    if (bitis)     { bhWhere += ' AND tarih <= ?'; bhParams.push(bitis) }
    const aldimRow = await get(
      `SELECT COALESCE(SUM(tutar),0) as toplam FROM bakiye_hareketleri WHERE ${bhWhere}`,
      bhParams
    )
    const aldim_toplam = aldimRow?.toplam || 0

    gt_paket  += toplam_paket
    gt_kazanc += brut_kazanc

    return {
      id: kurye.id,
      ad: kurye.ad,
      durum: kurye.durum,
      calisma_tipi: kurye.calisma_tipi,
      toplam_paket,
      brut_kazanc,
      aldim_toplam,
      ciro,
    }
  }))

  kuryelerSonuc.sort((a, b) => b.brut_kazanc - a.brut_kazanc)

  res.json({
    kuryeler: kuryelerSonuc,
    toplam_kurye: kuryelerSonuc.length,
    toplam_paket: gt_paket,
    toplam_kazanc: gt_kazanc,
  })
}))

// Endpoint 3: Restoranlar Hakediş Raporu
app.get('/api/bayi/raporlar/restoranlar-hakedis', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { baslangic, bitis, sayfa = 1, limit: limitRaw = 20 } = req.query

  const limit = Math.max(1, parseInt(limitRaw) || 20)
  const page  = Math.max(1, parseInt(sayfa) || 1)

  const restoranlar = await all(
    'SELECT * FROM bayi_restoranlar WHERE bayilik_id=? ORDER BY ad ASC',
    [bid]
  )

  const ODEME_KEYS = ['Nakit', 'Kredi Kartı', 'Yemek Kartı', 'Online', 'Diğer']
  let gt_paket = 0, gt_gelir = 0, gt_net = 0

  const restoranlarSonuc = await Promise.all(restoranlar.map(async (restoran) => {
    let sipWhere = `bayilik_id=? AND restoran_id=? AND durum='Teslim Edildi'`
    const sipParams = [bid, restoran.id]
    if (baslangic) { sipWhere += ' AND olusturma_tarihi >= ?'; sipParams.push(baslangic) }
    if (bitis)     { sipWhere += ' AND olusturma_tarihi <= ?'; sipParams.push(bitis) }

    const siparisler = await all(
      `SELECT tutar, odeme_yontemi FROM bayi_siparisler WHERE ${sipWhere}`,
      sipParams
    )

    const paket_sayisi = siparisler.length
    const toplam_gelir = siparisler.reduce((a, s) => a + (s.tutar || 0), 0)

    const odemeMap = { 'Nakit': 0, 'Kredi Kartı': 0, 'Yemek Kartı': 0, 'Online': 0, 'Diğer': 0 }
    for (const s of siparisler) {
      const key = ODEME_KEYS.includes(s.odeme_yontemi) ? s.odeme_yontemi : 'Diğer'
      odemeMap[key] += s.tutar || 0
    }

    const tasima = hesaplaRestoranTasima(restoran, paket_sayisi, toplam_gelir)
    const net_kazanc = tasima

    gt_paket += paket_sayisi
    gt_gelir += toplam_gelir
    gt_net   += net_kazanc

    return {
      id: restoran.id,
      ad: restoran.ad,
      calisma_tipi: restoran.calisma_tipi || 'Paket Başı',
      paket_sayisi,
      nakit: odemeMap['Nakit'],
      kredi_karti: odemeMap['Kredi Kartı'],
      yemek_karti: odemeMap['Yemek Kartı'],
      online: odemeMap['Online'],
      diger: odemeMap['Diğer'],
      toplam_gelir,
      tasima,
      net_kazanc,
    }
  }))

  const toplam_restoran = restoranlarSonuc.length
  const sayfa_sayisi = Math.ceil(toplam_restoran / limit)
  const paginated = restoranlarSonuc.slice((page - 1) * limit, page * limit)

  res.json({
    restoranlar: paginated,
    toplam_restoran,
    toplam_paket: gt_paket,
    toplam_gelir: gt_gelir,
    net_kazanc: gt_net,
    sayfa_sayisi,
  })
}))

// Endpoint 4: Ödeme Dağılımı Raporu
app.get('/api/bayi/raporlar/odeme-dagilimi', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { baslangic, bitis, restoran_id, kurye_id } = req.query

  let where = `bs.bayilik_id=? AND bs.durum='Teslim Edildi'`
  const params = [bid]
  if (baslangic)   { where += ' AND bs.olusturma_tarihi >= ?'; params.push(baslangic) }
  if (bitis)       { where += ' AND bs.olusturma_tarihi <= ?'; params.push(bitis) }
  if (restoran_id) { where += ' AND bs.restoran_id=?';         params.push(restoran_id) }
  if (kurye_id)    { where += ' AND bs.kurye_id=?';            params.push(kurye_id) }

  const siparisler = await all(
    `SELECT bs.tutar, bs.odeme_yontemi, bs.kurye_id, bk.ad AS kurye_ad
     FROM bayi_siparisler bs
     LEFT JOIN bayi_kuryeler bk ON bk.id=bs.kurye_id
     WHERE ${where}
     ORDER BY bs.olusturma_tarihi DESC`,
    params
  )

  const ODEME_KEYS = ['Nakit', 'Kredi Kartı', 'Yemek Kartı', 'Online', 'Diğer']
  const gruplari = {}
  let toplam_sayi = 0, toplam_tutar = 0

  for (const s of siparisler) {
    const key = ODEME_KEYS.includes(s.odeme_yontemi) ? s.odeme_yontemi : 'Diğer'
    if (!gruplari[key]) gruplari[key] = { sayi: 0, tutar: 0 }
    gruplari[key].sayi++
    gruplari[key].tutar += s.tutar || 0
    toplam_sayi++
    toplam_tutar += s.tutar || 0
  }

  // Per-courier payment breakdown
  const kuryeMap = {}
  for (const s of siparisler) {
    const kid = s.kurye_id
    if (kid == null) continue
    if (!kuryeMap[kid]) {
      kuryeMap[kid] = { kurye_id: kid, kurye_ad: s.kurye_ad || 'Bilinmiyor' }
      for (const k of ODEME_KEYS) kuryeMap[kid][k] = 0
    }
    const key = ODEME_KEYS.includes(s.odeme_yontemi) ? s.odeme_yontemi : 'Diğer'
    kuryeMap[kid][key] += s.tutar || 0
  }
  const kuryeler = Object.values(kuryeMap)

  res.json({ gruplari, toplam_sayi, toplam_tutar, kuryeler })
}))

// Endpoint 5: Firma Genel Raporu
app.get('/api/bayi/raporlar/firma', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { baslangic, bitis } = req.query

  let sipWhere = `bayilik_id=? AND durum='Teslim Edildi'`
  const sipParams = [bid]
  if (baslangic) { sipWhere += ' AND olusturma_tarihi >= ?'; sipParams.push(baslangic) }
  if (bitis)     { sipWhere += ' AND olusturma_tarihi <= ?'; sipParams.push(bitis) }

  const siparisler = await all(
    `SELECT * FROM bayi_siparisler WHERE ${sipWhere} ORDER BY olusturma_tarihi ASC`,
    sipParams
  )

  const paket_sayisi = siparisler.length

  // Tasima: loop through restaurants, sum their fee
  const restoranlar = await all('SELECT * FROM bayi_restoranlar WHERE bayilik_id=?', [bid])
  const restoranById = {}
  for (const r of restoranlar) restoranById[r.id] = r

  const restoranPaket = {}, restoranCiro = {}
  for (const s of siparisler) {
    const rid = s.restoran_id
    if (!restoranPaket[rid]) { restoranPaket[rid] = 0; restoranCiro[rid] = 0 }
    restoranPaket[rid]++
    restoranCiro[rid] += s.tutar || 0
  }

  let tasima_ucretleri = 0
  for (const [rid, pkt] of Object.entries(restoranPaket)) {
    const r = restoranById[rid]
    if (!r) continue
    tasima_ucretleri += hesaplaRestoranTasima(r, pkt, restoranCiro[rid])
  }

  // Kurye hakedisleri: loop through couriers
  const kuryeler = await all('SELECT * FROM bayi_kuryeler WHERE bayilik_id=? AND aktif=1', [bid])
  const kuryeById = {}
  for (const k of kuryeler) kuryeById[k.id] = k

  const kuryePaket = {}, kuryeCiro = {}
  for (const s of siparisler) {
    const kid = s.kurye_id
    if (kid == null) continue
    if (!kuryePaket[kid]) { kuryePaket[kid] = 0; kuryeCiro[kid] = 0 }
    kuryePaket[kid]++
    kuryeCiro[kid] += s.tutar || 0
  }

  let kurye_hakedisleri = 0
  for (const [kid, pkt] of Object.entries(kuryePaket)) {
    const k = kuryeById[kid]
    if (!k) continue
    kurye_hakedisleri += hesaplaKuryeKazanc(k, pkt, kuryeCiro[kid])
  }

  const kazanc = tasima_ucretleri - kurye_hakedisleri
  const ort_paket_tasima  = paket_sayisi > 0 ? tasima_ucretleri / paket_sayisi : 0
  const ort_kurye_hakedis = paket_sayisi > 0 ? kurye_hakedisleri / paket_sayisi : 0

  // Günlük breakdown
  const gunlukMap = {}
  for (const s of siparisler) {
    const gun = s.olusturma_tarihi ? s.olusturma_tarihi.slice(0, 10) : 'Bilinmiyor'
    if (!gunlukMap[gun]) gunlukMap[gun] = { paket: 0, tasima: 0, hakedis: 0 }
    gunlukMap[gun].paket++

    const r = restoranById[s.restoran_id]
    if (r) gunlukMap[gun].tasima += hesaplaRestoranTasima(r, 1, s.tutar || 0)

    if (s.kurye_id != null) {
      const k = kuryeById[s.kurye_id]
      if (k) gunlukMap[gun].hakedis += hesaplaKuryeKazanc(k, 1, s.tutar || 0)
    }
  }

  // If no date range given, show only last 7 days
  let gunler = Object.keys(gunlukMap).sort()
  if (!baslangic && !bitis && gunler.length > 7) gunler = gunler.slice(-7)

  const gunluk = gunler.map((gun) => {
    const v = gunlukMap[gun]
    return {
      gun,
      paket: v.paket,
      tasima: v.tasima,
      hakedis: v.hakedis,
      kazanc: v.tasima - v.hakedis,
    }
  })

  res.json({
    paket_sayisi,
    tasima_ucretleri,
    kurye_hakedisleri,
    kazanc,
    ort_paket_tasima,
    ort_kurye_hakedis,
    gunluk,
  })
}))

// ── BAYİ KULLANICI YÖNETİMİ ──────────────────────────────────────────────────

app.get('/api/bayi/kullanicilar', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { silinmis = '0' } = req.query
  const rows = await all(
    `SELECT id, ad_soyad, email, telefon, rol, sayfa_izinleri, aktif, olusturma_tarihi
     FROM bayi_kullanicilar WHERE bayilik_id=? AND silinmis=? ORDER BY olusturma_tarihi DESC`,
    [bid, silinmis === '1' ? 1 : 0]
  )
  res.json(rows)
}))

app.post('/api/bayi/kullanicilar', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { ad_soyad, email, telefon, sifre, rol = 'Operasyon', sayfa_izinleri = [] } = req.body || {}
  if (!ad_soyad || !email || !sifre) return res.status(400).json({ message: 'Ad soyad, e-posta ve şifre zorunlu' })
  const existing = await get('SELECT id FROM bayi_kullanicilar WHERE bayilik_id=? AND email=? AND silinmis=0', [bid, email])
  if (existing) return res.status(409).json({ message: 'Bu e-posta zaten kullanılıyor' })
  const sifre_hash = bcrypt.hashSync(sifre, 10)
  const { lastID } = await run(
    'INSERT INTO bayi_kullanicilar (bayilik_id,ad_soyad,email,telefon,sifre_hash,rol,sayfa_izinleri) VALUES (?,?,?,?,?,?,?)',
    [bid, ad_soyad, email, telefon||null, sifre_hash, rol, JSON.stringify(sayfa_izinleri)]
  )
  const row = await get('SELECT id,ad_soyad,email,telefon,rol,sayfa_izinleri,aktif,olusturma_tarihi FROM bayi_kullanicilar WHERE id=?', [lastID])
  res.status(201).json(row)
}))

app.put('/api/bayi/kullanicilar/:id', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const u = await get('SELECT * FROM bayi_kullanicilar WHERE id=? AND bayilik_id=?', [req.params.id, bid])
  if (!u) return res.status(404).json({ message: 'Kullanıcı bulunamadı' })
  const { ad_soyad, email, telefon, sifre, rol, sayfa_izinleri, aktif } = req.body || {}
  if (sifre) {
    const sifre_hash = bcrypt.hashSync(sifre, 10)
    await run(
      `UPDATE bayi_kullanicilar SET ad_soyad=COALESCE(?,ad_soyad), email=COALESCE(?,email),
       telefon=COALESCE(?,telefon), sifre_hash=?, rol=COALESCE(?,rol),
       sayfa_izinleri=COALESCE(?,sayfa_izinleri), aktif=COALESCE(?,aktif) WHERE id=?`,
      [ad_soyad||null, email||null, telefon||null, sifre_hash, rol||null,
       sayfa_izinleri ? JSON.stringify(sayfa_izinleri) : null, aktif!=null?aktif:null, req.params.id]
    )
  } else {
    await run(
      `UPDATE bayi_kullanicilar SET ad_soyad=COALESCE(?,ad_soyad), email=COALESCE(?,email),
       telefon=COALESCE(?,telefon), rol=COALESCE(?,rol),
       sayfa_izinleri=COALESCE(?,sayfa_izinleri), aktif=COALESCE(?,aktif) WHERE id=?`,
      [ad_soyad||null, email||null, telefon||null, rol||null,
       sayfa_izinleri ? JSON.stringify(sayfa_izinleri) : null, aktif!=null?aktif:null, req.params.id]
    )
  }
  const row = await get('SELECT id,ad_soyad,email,telefon,rol,sayfa_izinleri,aktif,olusturma_tarihi FROM bayi_kullanicilar WHERE id=?', [req.params.id])
  res.json(row)
}))

app.delete('/api/bayi/kullanicilar/:id', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const u = await get('SELECT id FROM bayi_kullanicilar WHERE id=? AND bayilik_id=?', [req.params.id, bid])
  if (!u) return res.status(404).json({ message: 'Kullanıcı bulunamadı' })
  await run('UPDATE bayi_kullanicilar SET silinmis=1, aktif=0 WHERE id=?', [req.params.id])
  res.json({ message: 'Silindi' })
}))

// ── MOLA YÖNETİMİ ─────────────────────────────────────────────────────────────

app.get('/api/bayi/mola-ayarlari', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  let row = await get('SELECT * FROM bayi_mola_ayarlari WHERE bayilik_id=?', [bid])
  if (!row) {
    await run('INSERT INTO bayi_mola_ayarlari (bayilik_id) VALUES (?)', [bid])
    row = await get('SELECT * FROM bayi_mola_ayarlari WHERE bayilik_id=?', [bid])
  }
  res.json(row)
}))

app.put('/api/bayi/mola-ayarlari', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { gunluk_mola_hakki, mola_sureleri, onay_mekanizmasi, yasak_saatler } = req.body || {}
  let row = await get('SELECT id FROM bayi_mola_ayarlari WHERE bayilik_id=?', [bid])
  if (!row) await run('INSERT INTO bayi_mola_ayarlari (bayilik_id) VALUES (?)', [bid])
  await run(
    `UPDATE bayi_mola_ayarlari SET
      gunluk_mola_hakki=COALESCE(?,gunluk_mola_hakki),
      mola_sureleri=COALESCE(?,mola_sureleri),
      onay_mekanizmasi=COALESCE(?,onay_mekanizmasi),
      yasak_saatler=COALESCE(?,yasak_saatler)
     WHERE bayilik_id=?`,
    [gunluk_mola_hakki!=null?gunluk_mola_hakki:null,
     mola_sureleri?JSON.stringify(mola_sureleri):null,
     onay_mekanizmasi||null,
     yasak_saatler?JSON.stringify(yasak_saatler):null,
     bid]
  )
  res.json(await get('SELECT * FROM bayi_mola_ayarlari WHERE bayilik_id=?', [bid]))
}))

app.get('/api/bayi/mola-talepleri', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { durum } = req.query
  let where = 'mt.bayilik_id=?'
  const params = [bid]
  if (durum && durum !== 'Tümü') {
    if (durum === 'Bekleyen') { where += " AND mt.durum='Bekliyor'"; }
    else { where += ' AND mt.durum=?'; params.push(durum) }
  }
  const rows = await all(
    `SELECT mt.*, bk.ad AS kurye_ad, bk.telefon AS kurye_tel
     FROM bayi_mola_talepleri mt
     LEFT JOIN bayi_kuryeler bk ON bk.id=mt.kurye_id
     WHERE ${where}
     ORDER BY mt.talep_tarihi DESC`,
    params
  )
  res.json(rows)
}))

app.post('/api/bayi/mola-talepleri', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { kurye_id, sure_dk } = req.body || {}
  if (!kurye_id || !sure_dk) return res.status(400).json({ message: 'kurye_id ve sure_dk zorunlu' })
  const { lastID } = await run(
    'INSERT INTO bayi_mola_talepleri (bayilik_id,kurye_id,sure_dk) VALUES (?,?,?)',
    [bid, kurye_id, sure_dk]
  )
  const row = await get(
    `SELECT mt.*, bk.ad AS kurye_ad FROM bayi_mola_talepleri mt
     LEFT JOIN bayi_kuryeler bk ON bk.id=mt.kurye_id WHERE mt.id=?`, [lastID]
  )
  res.status(201).json(row)
}))

app.put('/api/bayi/mola-talepleri/:id/durum', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { durum } = req.body || {}
  const mt = await get('SELECT * FROM bayi_mola_talepleri WHERE id=? AND bayilik_id=?', [req.params.id, bid])
  if (!mt) return res.status(404).json({ message: 'Talep bulunamadı' })
  let update = 'durum=?'
  const params = [durum]
  if (durum === 'Aktif') { update += ', baslangic=datetime("now","localtime")'; }
  if (durum === 'Tamamlandı') { update += ', bitis=datetime("now","localtime")'; }
  params.push(req.params.id)
  await run(`UPDATE bayi_mola_talepleri SET ${update} WHERE id=?`, params)
  res.json(await get('SELECT mt.*, bk.ad AS kurye_ad FROM bayi_mola_talepleri mt LEFT JOIN bayi_kuryeler bk ON bk.id=mt.kurye_id WHERE mt.id=?', [req.params.id]))
}))

app.get('/api/bayi/mola-raporlar', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { baslangic, bitis } = req.query

  let where = 'mt.bayilik_id=? AND mt.durum IN (\'Aktif\',\'Tamamlandı\')'
  const params = [bid]
  if (baslangic) { where += ' AND mt.talep_tarihi >= ?'; params.push(baslangic) }
  if (bitis)     { where += ' AND mt.talep_tarihi <= ?'; params.push(bitis) }

  const rows = await all(
    `SELECT mt.kurye_id, bk.ad AS kurye_ad, bk.telefon AS kurye_tel,
            COUNT(*) AS mola_sayisi,
            SUM(mt.sure_dk) AS toplam_sure_dk
     FROM bayi_mola_talepleri mt
     LEFT JOIN bayi_kuryeler bk ON bk.id=mt.kurye_id
     WHERE ${where}
     GROUP BY mt.kurye_id ORDER BY mola_sayisi DESC`,
    params
  )

  const saatlikRows = await all(
    `SELECT strftime('%H:00',mt.talep_tarihi) AS saat, COUNT(*) AS sayi
     FROM bayi_mola_talepleri mt
     WHERE ${where}
     GROUP BY saat ORDER BY saat ASC`,
    params
  )

  const gunlukRows = await all(
    `SELECT date(mt.talep_tarihi) AS gun, COUNT(*) AS sayi
     FROM bayi_mola_talepleri mt
     WHERE ${where}
     GROUP BY gun ORDER BY gun ASC`,
    params
  )

  res.json({ kurye_siralaması: rows, saatlik: saatlikRows, gunluk: gunlukRows })
}))

// ── MUTABAKAT ─────────────────────────────────────────────────────────────────

app.get('/api/bayi/mutabakat/kuryeler', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { baslangic, bitis, periyot = 'gunluk' } = req.query

  const kuryeler = await all('SELECT * FROM bayi_kuryeler WHERE bayilik_id=? AND aktif=1 ORDER BY ad ASC', [bid])

  let sipWhere = `bs.bayilik_id=? AND bs.durum='Teslim Edildi'`
  const sipParams = [bid]
  if (baslangic) { sipWhere += ' AND bs.olusturma_tarihi >= ?'; sipParams.push(baslangic) }
  if (bitis)     { sipWhere += ' AND bs.olusturma_tarihi <= ?'; sipParams.push(bitis) }

  const siparisler = await all(
    `SELECT bs.kurye_id, bs.tutar, bs.odeme_yontemi, bs.olusturma_tarihi
     FROM bayi_siparisler bs WHERE ${sipWhere}`,
    sipParams
  )

  // Bakiye hareketleri (tur='Aldım' = bayi received from kurye)
  let bakWhere = `bh.bayilik_id=? AND bh.entity_type='kurye'`
  const bakParams = [bid]
  if (baslangic) { bakWhere += ' AND bh.tarih >= ?'; bakParams.push(baslangic) }
  if (bitis)     { bakWhere += ' AND bh.tarih <= ?'; bakParams.push(bitis) }
  const bakiye = await all(`SELECT * FROM bakiye_hareketleri bh WHERE ${bakWhere}`, bakParams)

  const ODEME_KEYS = ['Nakit', 'Kredi Kartı', 'Yemek Kartı', 'Online', 'Diğer']
  const sonuc = kuryeler.map(k => {
    const kSip = siparisler.filter(s => s.kurye_id === k.id)
    const nakit = kSip.filter(s => s.odeme_yontemi === 'Nakit').reduce((a, s) => a + (s.tutar||0), 0)
    const kredi = kSip.filter(s => s.odeme_yontemi === 'Kredi Kartı').reduce((a, s) => a + (s.tutar||0), 0)
    const yemek = kSip.filter(s => s.odeme_yontemi === 'Yemek Kartı').reduce((a, s) => a + (s.tutar||0), 0)
    const online = kSip.filter(s => s.odeme_yontemi === 'Online').reduce((a, s) => a + (s.tutar||0), 0)
    const toplam_tahsilat = nakit + kredi + yemek + online

    const kBak = bakiye.filter(b => b.entity_id === k.id)
    const alinan = kBak.filter(b => b.tur === 'Aldım').reduce((a, b) => a + (b.tutar||0), 0)
    const verilen = kBak.filter(b => b.tur === 'Verdim').reduce((a, b) => a + (b.tutar||0), 0)

    // Kurye owes bayi: nakit (physical cash collected)
    // Electronic payments go directly: no cash owed
    const odenmesi_gereken = nakit
    const net_fark = odenmesi_gereken - alinan + verilen

    const hakedis = hesaplaKuryeKazanc(k, kSip.length, toplam_tahsilat)

    return {
      id: k.id,
      ad: k.ad,
      telefon: k.telefon,
      paket_sayisi: kSip.length,
      nakit,
      kredi_karti: kredi,
      yemek_karti: yemek,
      online,
      toplam_tahsilat,
      odenmesi_gereken,
      alinan,
      verilen,
      net_fark,
      hakedis,
    }
  })

  res.json({ kuryeler: sonuc })
}))

app.get('/api/bayi/mutabakat/restoranlar', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { baslangic, bitis } = req.query

  const restoranlar = await all('SELECT * FROM bayi_restoranlar WHERE bayilik_id=? ORDER BY ad ASC', [bid])

  let sipWhere = `bs.bayilik_id=? AND bs.durum='Teslim Edildi'`
  const sipParams = [bid]
  if (baslangic) { sipWhere += ' AND bs.olusturma_tarihi >= ?'; sipParams.push(baslangic) }
  if (bitis)     { sipWhere += ' AND bs.olusturma_tarihi <= ?'; sipParams.push(bitis) }

  const siparisler = await all(
    `SELECT bs.restoran_id, bs.tutar, bs.odeme_yontemi FROM bayi_siparisler bs WHERE ${sipWhere}`,
    sipParams
  )

  let bakWhere = `bh.bayilik_id=? AND bh.entity_type='restoran'`
  const bakParams = [bid]
  if (baslangic) { bakWhere += ' AND bh.tarih >= ?'; bakParams.push(baslangic) }
  if (bitis)     { bakWhere += ' AND bh.tarih <= ?'; bakParams.push(bitis) }
  const bakiye = await all(`SELECT * FROM bakiye_hareketleri bh WHERE ${bakWhere}`, bakParams)

  const sonuc = restoranlar.map(r => {
    const rSip = siparisler.filter(s => s.restoran_id === r.id)
    const nakit = rSip.filter(s => s.odeme_yontemi === 'Nakit').reduce((a, s) => a + (s.tutar||0), 0)
    const kredi = rSip.filter(s => s.odeme_yontemi === 'Kredi Kartı').reduce((a, s) => a + (s.tutar||0), 0)
    const yemek = rSip.filter(s => s.odeme_yontemi === 'Yemek Kartı').reduce((a, s) => a + (s.tutar||0), 0)
    const online = rSip.filter(s => s.odeme_yontemi === 'Online').reduce((a, s) => a + (s.tutar||0), 0)
    const toplam_satis = nakit + kredi + yemek + online

    const tasima_ucreti = hesaplaRestoranTasima(r, rSip.length, toplam_satis)

    const rBak = bakiye.filter(b => b.entity_id === r.id)
    const alinan = rBak.filter(b => b.tur === 'Aldım').reduce((a, b) => a + (b.tutar||0), 0)
    const verilen = rBak.filter(b => b.tur === 'Verdim').reduce((a, b) => a + (b.tutar||0), 0)

    // Restoran owes bayi: tasima_ucreti
    // net_fark > 0 means restoran still owes, < 0 means we owe them
    const net_fark = tasima_ucreti - alinan + verilen

    return {
      id: r.id,
      ad: r.ad,
      calisma_tipi: r.calisma_tipi || 'Paket Başı',
      paket_sayisi: rSip.length,
      nakit,
      kredi_karti: kredi,
      yemek_karti: yemek,
      online,
      toplam_satis,
      tasima_ucreti,
      alinan,
      verilen,
      net_fark,
    }
  })

  res.json({ restoranlar: sonuc })
}))

// ── KURYE KONUM TAKİP ─────────────────────────────────────────────────────────

// Get all courier locations for the map (includes bayilik center for default map position)
app.get('/api/bayi/kuryeler/konumlar', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId

  const rows = await all(
    `SELECT id, ad, telefon, durum, aktif, lat, lon, son_konum_tarihi,
            gunluk_teslimat, toplam_teslimat
     FROM bayi_kuryeler
     WHERE bayilik_id=? AND aktif=1 AND lat IS NOT NULL AND lon IS NOT NULL
     ORDER BY durum ASC, ad ASC`,
    [bid]
  )

  // Return bayilik's registered location as fallback map center
  const ayarlar = await get('SELECT lat, lon FROM bayi_ayarlar WHERE bayilik_id=?', [bid])
  const b = await get('SELECT sehir FROM bayilikler WHERE id=?', [bid])

  res.json({
    kuryeler: rows,
    merkez: {
      lat: ayarlar?.lat || null,
      lon: ayarlar?.lon || null,
      sehir: b?.sehir || null,
    }
  })
}))

// Update courier GPS location (called by courier mobile app)
app.put('/api/bayi/kuryeler/:id/konum', bayiAuthMiddleware, wrap(async (req, res) => {
  const bid = req.bayi.bayilikId
  const { lat, lon } = req.body || {}
  if (lat == null || lon == null) return res.status(400).json({ message: 'lat ve lon zorunlu' })
  const k = await get('SELECT id FROM bayi_kuryeler WHERE id=? AND bayilik_id=?', [req.params.id, bid])
  if (!k) return res.status(404).json({ message: 'Kurye bulunamadı' })
  await run(
    'UPDATE bayi_kuryeler SET lat=?, lon=?, son_konum_tarihi=datetime("now","localtime") WHERE id=?',
    [lat, lon, req.params.id]
  )
  res.json({ id: Number(req.params.id), lat, lon })
}))

// ═══════════════════════════════════════════════════════════════════════════════
// PAKETÇİNİZ PLUS — Partner & Taşıyıcı sistemi
// ═══════════════════════════════════════════════════════════════════════════════

async function initPlusDb() {
  await run(`CREATE TABLE IF NOT EXISTS plus_partnerler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firma_adi TEXT NOT NULL,
    yetkili_ad TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    sifre_hash TEXT NOT NULL,
    telefon TEXT,
    aktif INTEGER DEFAULT 1,
    olusturma TEXT DEFAULT (datetime('now','localtime'))
  )`)
  await run(`CREATE TABLE IF NOT EXISTS plus_tasiyicilar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    sifre_hash TEXT NOT NULL,
    telefon TEXT,
    arac_tipi TEXT DEFAULT 'Motosiklet',
    aktif INTEGER DEFAULT 1,
    olusturma TEXT DEFAULT (datetime('now','localtime'))
  )`)
  await run(`CREATE TABLE IF NOT EXISTS plus_isler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id INTEGER NOT NULL,
    tasiyici_id INTEGER,
    qr_kodu TEXT UNIQUE NOT NULL,
    durum TEXT DEFAULT 'Havuzda',
    alis_il TEXT NOT NULL,
    alis_ilce TEXT NOT NULL,
    alis_mahalle TEXT,
    alis_adres TEXT NOT NULL,
    birakilis_il TEXT NOT NULL,
    birakilis_ilce TEXT NOT NULL,
    birakilis_mahalle TEXT,
    birakilis_adres TEXT NOT NULL,
    gonderici_ad TEXT NOT NULL,
    gonderici_telefon TEXT NOT NULL,
    alici_ad TEXT NOT NULL,
    alici_telefon TEXT NOT NULL,
    paket_boyutu TEXT NOT NULL,
    aciklama TEXT,
    alinma_saati TEXT NOT NULL,
    olusturma TEXT DEFAULT (datetime('now','localtime')),
    guncelleme TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY(partner_id) REFERENCES plus_partnerler(id),
    FOREIGN KEY(tasiyici_id) REFERENCES plus_tasiyicilar(id)
  )`)
  await run(`CREATE TABLE IF NOT EXISTS plus_hareketler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    is_id INTEGER NOT NULL,
    durum TEXT NOT NULL,
    notlar TEXT,
    tarih TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY(is_id) REFERENCES plus_isler(id)
  )`)

  // Seed demo partner
  const ep = await get('SELECT COUNT(*) as c FROM plus_partnerler')
  if (ep.c === 0) {
    const ph = bcrypt.hashSync('partner123', 10)
    await run(`INSERT INTO plus_partnerler (firma_adi,yetkili_ad,email,sifre_hash,telefon)
               VALUES (?,?,?,?,?)`, ['ABC Lojistik','Ahmet Kaya','partner@plus.com',ph,'05321000000'])
  }
  // Seed demo carrier
  const et = await get('SELECT COUNT(*) as c FROM plus_tasiyicilar')
  if (et.c === 0) {
    const th = bcrypt.hashSync('tasiyici123', 10)
    await run(`INSERT INTO plus_tasiyicilar (ad,email,sifre_hash,telefon,arac_tipi)
               VALUES (?,?,?,?,?)`, ['Mehmet Şahin','tasiyici@plus.com',th,'05331000000','Motosiklet'])
  }
}

// ── Plus Auth Middleware ──────────────────────────────────────────────────────
function plusPartnerAuth(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ message: 'Yetkisiz' })
  try {
    req.partner = jwt.verify(h.slice(7), JWT_SECRET)
    if (req.partner.type !== 'plus_partner') return res.status(401).json({ message: 'Yetkisiz' })
    next()
  } catch { res.status(401).json({ message: 'Geçersiz token' }) }
}

function plusTasiyiciAuth(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ message: 'Yetkisiz' })
  try {
    req.tasiyici = jwt.verify(h.slice(7), JWT_SECRET)
    if (req.tasiyici.type !== 'plus_tasiyici') return res.status(401).json({ message: 'Yetkisiz' })
    next()
  } catch { res.status(401).json({ message: 'Geçersiz token' }) }
}

// ── Partner Auth ──────────────────────────────────────────────────────────────
app.post('/api/plus/partner/login', wrap(async (req, res) => {
  const { email, sifre } = req.body || {}
  if (!email || !sifre) return res.status(400).json({ message: 'Email ve şifre gerekli' })
  const p = await get('SELECT * FROM plus_partnerler WHERE email=? AND aktif=1', [email])
  if (!p || !bcrypt.compareSync(sifre, p.sifre_hash))
    return res.status(401).json({ message: 'Geçersiz email veya şifre' })
  const token = jwt.sign({ id: p.id, email: p.email, firma_adi: p.firma_adi, type: 'plus_partner' }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
}))

app.get('/api/plus/partner/me', plusPartnerAuth, wrap(async (req, res) => {
  const p = await get('SELECT id,firma_adi,yetkili_ad,email,telefon,aktif FROM plus_partnerler WHERE id=?', [req.partner.id])
  if (!p) return res.status(404).json({ message: 'Bulunamadı' })
  res.json(p)
}))

// ── Taşıyıcı Auth ─────────────────────────────────────────────────────────────
app.post('/api/plus/tasiyici/login', wrap(async (req, res) => {
  const { email, sifre } = req.body || {}
  if (!email || !sifre) return res.status(400).json({ message: 'Email ve şifre gerekli' })
  const t = await get('SELECT * FROM plus_tasiyicilar WHERE email=? AND aktif=1', [email])
  if (!t || !bcrypt.compareSync(sifre, t.sifre_hash))
    return res.status(401).json({ message: 'Geçersiz email veya şifre' })
  const token = jwt.sign({ id: t.id, email: t.email, ad: t.ad, type: 'plus_tasiyici' }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
}))

app.get('/api/plus/tasiyici/me', plusTasiyiciAuth, wrap(async (req, res) => {
  const t = await get('SELECT id,ad,email,telefon,arac_tipi,aktif FROM plus_tasiyicilar WHERE id=?', [req.tasiyici.id])
  if (!t) return res.status(404).json({ message: 'Bulunamadı' })
  res.json(t)
}))

// ── İş CRUD (Partner) ─────────────────────────────────────────────────────────
app.post('/api/plus/is', plusPartnerAuth, wrap(async (req, res) => {
  const {
    alis_il, alis_ilce, alis_mahalle, alis_adres,
    birakilis_il, birakilis_ilce, birakilis_mahalle, birakilis_adres,
    gonderici_ad, gonderici_telefon, alici_ad, alici_telefon,
    paket_boyutu, aciklama, alinma_saati
  } = req.body
  if (!alis_il || !alis_ilce || !alis_adres || !birakilis_il || !birakilis_ilce || !birakilis_adres)
    return res.status(400).json({ message: 'Adres bilgileri eksik' })
  if (!gonderici_ad || !gonderici_telefon || !alici_ad || !alici_telefon)
    return res.status(400).json({ message: 'Kişi bilgileri eksik' })
  if (!paket_boyutu || !alinma_saati)
    return res.status(400).json({ message: 'Paket ve zaman bilgisi gerekli' })

  const qr = `PLU-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`
  const { lastID } = await run(`
    INSERT INTO plus_isler
    (partner_id,qr_kodu,alis_il,alis_ilce,alis_mahalle,alis_adres,
     birakilis_il,birakilis_ilce,birakilis_mahalle,birakilis_adres,
     gonderici_ad,gonderici_telefon,alici_ad,alici_telefon,
     paket_boyutu,aciklama,alinma_saati)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [req.partner.id,qr,alis_il,alis_ilce,alis_mahalle||null,alis_adres,
     birakilis_il,birakilis_ilce,birakilis_mahalle||null,birakilis_adres,
     gonderici_ad,gonderici_telefon,alici_ad,alici_telefon,
     paket_boyutu,aciklama||null,alinma_saati])
  await run('INSERT INTO plus_hareketler (is_id,durum) VALUES (?,?)', [lastID,'Havuzda'])
  res.json({ id: lastID, qr_kodu: qr })
}))

app.get('/api/plus/is', plusPartnerAuth, wrap(async (req, res) => {
  const { durum } = req.query
  let q = `SELECT i.*, p.firma_adi as partner_firma, t.ad as tasiyici_ad
           FROM plus_isler i
           LEFT JOIN plus_partnerler p ON p.id=i.partner_id
           LEFT JOIN plus_tasiyicilar t ON t.id=i.tasiyici_id
           WHERE i.partner_id=?`
  const params = [req.partner.id]
  if (durum) { q += ' AND i.durum=?'; params.push(durum) }
  q += ' ORDER BY i.olusturma DESC'
  res.json(await all(q, params))
}))

app.get('/api/plus/is/:id', wrap(async (req, res) => {
  const is = await get(`SELECT i.*, p.firma_adi as partner_firma, t.ad as tasiyici_ad
    FROM plus_isler i
    LEFT JOIN plus_partnerler p ON p.id=i.partner_id
    LEFT JOIN plus_tasiyicilar t ON t.id=i.tasiyici_id
    WHERE i.id=?`, [req.params.id])
  if (!is) return res.status(404).json({ message: 'İş bulunamadı' })
  res.json(is)
}))

app.put('/api/plus/is/:id/iptal', plusPartnerAuth, wrap(async (req, res) => {
  const is = await get('SELECT * FROM plus_isler WHERE id=? AND partner_id=?', [req.params.id, req.partner.id])
  if (!is) return res.status(404).json({ message: 'İş bulunamadı' })
  if (is.durum !== 'Havuzda') return res.status(400).json({ message: 'Sadece havuzdaki işler iptal edilebilir' })
  await run(`UPDATE plus_isler SET durum='İptal', guncelleme=datetime('now','localtime') WHERE id=?`, [req.params.id])
  await run('INSERT INTO plus_hareketler (is_id,durum) VALUES (?,?)', [req.params.id,'İptal'])
  res.json({ success: true })
}))

// ── Havuz (Taşıyıcı) ──────────────────────────────────────────────────────────
app.get('/api/plus/havuz', plusTasiyiciAuth, wrap(async (req, res) => {
  const { il, ilce } = req.query
  let q = `SELECT i.*, p.firma_adi as partner_firma
           FROM plus_isler i
           LEFT JOIN plus_partnerler p ON p.id=i.partner_id
           WHERE i.durum='Havuzda'`
  const params = []
  if (il)   { q += ' AND i.alis_il=?';   params.push(il) }
  if (ilce) { q += ' AND i.alis_ilce=?'; params.push(ilce) }
  q += ' ORDER BY i.alinma_saati ASC'
  res.json(await all(q, params))
}))

app.put('/api/plus/havuz/:id/al', plusTasiyiciAuth, wrap(async (req, res) => {
  const is = await get('SELECT * FROM plus_isler WHERE id=? AND durum=?', [req.params.id,'Havuzda'])
  if (!is) return res.status(400).json({ message: 'Bu iş artık mevcut değil' })
  await run(`UPDATE plus_isler SET durum='Alındı', tasiyici_id=?, guncelleme=datetime('now','localtime') WHERE id=?`,
    [req.tasiyici.id, req.params.id])
  await run('INSERT INTO plus_hareketler (is_id,durum) VALUES (?,?)', [req.params.id,'Alındı'])
  res.json({ success: true })
}))

// ── Taşıyıcı durum güncellemeleri ─────────────────────────────────────────────
app.put('/api/plus/is/:id/yolda', plusTasiyiciAuth, wrap(async (req, res) => {
  const is = await get('SELECT * FROM plus_isler WHERE id=? AND tasiyici_id=? AND durum=?',
    [req.params.id, req.tasiyici.id, 'Alındı'])
  if (!is) return res.status(400).json({ message: 'Geçersiz işlem' })
  await run(`UPDATE plus_isler SET durum='Yolda', guncelleme=datetime('now','localtime') WHERE id=?`, [req.params.id])
  await run('INSERT INTO plus_hareketler (is_id,durum) VALUES (?,?)', [req.params.id,'Yolda'])
  res.json({ success: true })
}))

app.put('/api/plus/is/:id/teslim', plusTasiyiciAuth, wrap(async (req, res) => {
  const is = await get('SELECT * FROM plus_isler WHERE id=? AND tasiyici_id=? AND durum=?',
    [req.params.id, req.tasiyici.id, 'Yolda'])
  if (!is) return res.status(400).json({ message: 'Geçersiz işlem' })
  await run(`UPDATE plus_isler SET durum='Teslim Edildi', guncelleme=datetime('now','localtime') WHERE id=?`, [req.params.id])
  await run('INSERT INTO plus_hareketler (is_id,durum) VALUES (?,?)', [req.params.id,'Teslim Edildi'])
  res.json({ success: true })
}))

app.get('/api/plus/tasiyici/islerim', plusTasiyiciAuth, wrap(async (req, res) => {
  const data = await all(`SELECT i.*, p.firma_adi as partner_firma
    FROM plus_isler i
    LEFT JOIN plus_partnerler p ON p.id=i.partner_id
    WHERE i.tasiyici_id=? AND i.durum IN ('Alındı','Yolda')
    ORDER BY i.guncelleme DESC`, [req.tasiyici.id])
  res.json(data)
}))

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.message)
  res.status(500).json({ message: 'Sunucu hatası' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
initDb()
  .then(() => initBayiDb())
  .then(() => initPlusDb())
  .then(() => app.listen(PORT, () => console.log(`Paketçi B2B Backend → http://localhost:${PORT}`)))
  .catch((err) => { console.error('DB init hatası:', err); process.exit(1) })
