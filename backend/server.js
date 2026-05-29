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

// ── Start ─────────────────────────────────────────────────────────────────────
initDb()
  .then(() => app.listen(PORT, () => console.log(`Paketçi B2B Backend → http://localhost:${PORT}`)))
  .catch((err) => { console.error('DB init hatası:', err); process.exit(1) })
