'use strict'
const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = 3003
const JWT_SECRET = process.env.IK_JWT_SECRET || 'paketciniz-ik-vardiya-secret-2026'
const DB_PATH = path.join(__dirname, 'ik.db')

app.use(cors())
app.use(express.json())

// ── SQLite helpers ────────────────────────────────────────────────────────────
const db = new sqlite3.Database(DB_PATH)
const run = (sql, p = []) => new Promise((res, rej) =>
  db.run(sql, p, function (e) { e ? rej(e) : res({ lastID: this.lastID, changes: this.changes }) }))
const get = (sql, p = []) => new Promise((res, rej) =>
  db.get(sql, p, (e, r) => e ? rej(e) : res(r)))
const all = (sql, p = []) => new Promise((res, rej) =>
  db.all(sql, p, (e, r) => e ? rej(e) : res(r)))
const wrap = fn => async (req, res, next) => { try { await fn(req, res, next) } catch (e) { next(e) } }

// ── Date helpers ─────────────────────────────────────────────────────────────
const GUN_ADLARI = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

function pad(n) { return n < 10 ? `0${n}` : `${n}` }
function toISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
// Monday of the week containing the given ISO date
function haftaBaslangic(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  const day = d.getDay() // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toISO(d)
}
function gunTarih(haftaIso, gun) {
  const d = new Date(haftaIso + 'T00:00:00')
  d.setDate(d.getDate() + gun)
  return toISO(d)
}
// Duration in hours, handling overnight shifts (bitis <= baslangic => +24h)
function vardiyaSaat(baslangic, bitis) {
  if (!baslangic || !bitis) return 0
  const [bh, bm] = baslangic.split(':').map(Number)
  const [eh, em] = bitis.split(':').map(Number)
  let start = bh * 60 + bm
  let end = eh * 60 + em
  if (end <= start) end += 24 * 60
  return (end - start) / 60
}

// ── DB Init ───────────────────────────────────────────────────────────────────
async function initDb() {
  await run(`CREATE TABLE IF NOT EXISTS ik_admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    sifre_hash TEXT NOT NULL,
    olusturma TEXT DEFAULT (datetime('now','localtime'))
  )`)
  await run(`CREATE TABLE IF NOT EXISTS ik_bolgeler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad TEXT NOT NULL,
    il TEXT,
    aciklama TEXT,
    renk TEXT DEFAULT '#2563eb',
    aktif INTEGER DEFAULT 1,
    olusturma TEXT DEFAULT (datetime('now','localtime'))
  )`)
  await run(`CREATE TABLE IF NOT EXISTS ik_personel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_soyad TEXT NOT NULL,
    telefon TEXT,
    email TEXT,
    tc_no TEXT,
    pozisyon TEXT DEFAULT 'Kurye',
    bolge_id INTEGER REFERENCES ik_bolgeler(id) ON DELETE SET NULL,
    ise_giris_tarihi TEXT,
    durum TEXT DEFAULT 'Aktif',
    maas REAL,
    adres TEXT,
    notlar TEXT,
    olusturma TEXT DEFAULT (datetime('now','localtime'))
  )`)
  await run(`CREATE TABLE IF NOT EXISTS ik_vardiyalar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personel_id INTEGER NOT NULL REFERENCES ik_personel(id) ON DELETE CASCADE,
    hafta_baslangic TEXT NOT NULL,
    gun INTEGER NOT NULL,
    baslangic TEXT,
    bitis TEXT,
    off INTEGER DEFAULT 0,
    UNIQUE(personel_id, hafta_baslangic, gun)
  )`)
  await run(`CREATE TABLE IF NOT EXISTS ik_izinler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personel_id INTEGER NOT NULL REFERENCES ik_personel(id) ON DELETE CASCADE,
    baslangic_tarih TEXT NOT NULL,
    bitis_tarih TEXT NOT NULL,
    tur TEXT DEFAULT 'Yıllık İzin',
    aciklama TEXT,
    durum TEXT DEFAULT 'Beklemede',
    olusturma TEXT DEFAULT (datetime('now','localtime'))
  )`)
  await run(`CREATE TABLE IF NOT EXISTS ik_basvurular (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_soyad TEXT NOT NULL,
    telefon TEXT NOT NULL,
    email TEXT,
    pozisyon TEXT,
    sehir TEXT,
    dogum_tarihi TEXT,
    ehliyet TEXT,
    arac TEXT,
    deneyim TEXT,
    mesaj TEXT,
    durum TEXT DEFAULT 'Yeni',
    notlar TEXT,
    olusturma TEXT DEFAULT (datetime('now','localtime'))
  )`)
  await run(`CREATE TABLE IF NOT EXISTS ik_duyurular (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    baslik TEXT NOT NULL,
    icerik TEXT NOT NULL,
    bolge_id INTEGER REFERENCES ik_bolgeler(id) ON DELETE CASCADE,
    onem TEXT DEFAULT 'Normal',
    olusturma TEXT DEFAULT (datetime('now','localtime'))
  )`)

  const existing = await get('SELECT COUNT(*) as c FROM ik_admin')
  if (existing.c === 0) await seed()
}

async function seed() {
  const hash = bcrypt.hashSync('Paketciniz2026!', 10)
  await run('INSERT INTO ik_admin (ad,email,sifre_hash) VALUES (?,?,?)',
    ['Hünkar Yılmaz', 'admin@paketciniz.com', hash])

  const insertBolge = (ad, il, aciklama, renk) =>
    run('INSERT INTO ik_bolgeler (ad,il,aciklama,renk) VALUES (?,?,?,?)', [ad, il, aciklama, renk])

  const { lastID: bIzmir }  = await insertBolge('İzmir Merkez',     'İzmir',          'Merkez dağıtım ve kurye ekibi', '#2563eb')
  const { lastID: bAfyon }  = await insertBolge('Afyonkarahisar',   'Afyonkarahisar', 'Afyon bölge ekibi',             '#16a34a')
  const { lastID: bBursa }  = await insertBolge('Bursa',            'Bursa',          'Bursa bölge ekibi',             '#d97706')
  const { lastID: bMugla }  = await insertBolge('Muğla / Bodrum',   'Muğla',          'Bodrum bölge ekibi',            '#7c3aed')
  await insertBolge('Osmaniye', 'Osmaniye', 'Osmaniye bölge ekibi', '#db2777')
  await insertBolge('Kütahya',  'Kütahya',  'Kütahya bölge ekibi',  '#0891b2')

  const insertPersonel = (ad, telefon, pozisyon, bolge_id, tarih, maas) =>
    run(`INSERT INTO ik_personel (ad_soyad,telefon,email,pozisyon,bolge_id,ise_giris_tarihi,durum,maas)
         VALUES (?,?,?,?,?,?,?,?)`,
      [ad, telefon, `${ad.toLowerCase().replace(/[^a-zçğıöşü]+/gi, '.')}@paketciniz.com`, pozisyon, bolge_id, tarih, 'Aktif', maas])

  const { lastID: p1 } = await insertPersonel('Ahmet Kaya',         '0532 111 22 01', 'Kurye', bIzmir, '2024-03-10', 24000)
  const { lastID: p2 } = await insertPersonel('Ali Nur Ata',        '0532 111 22 02', 'Kurye', bIzmir, '2024-04-02', 24000)
  const { lastID: p3 } = await insertPersonel('Aykut Köroğlu',      '0532 111 22 03', 'Kurye', bIzmir, '2023-11-15', 23000)
  const { lastID: p4 } = await insertPersonel('İrfan Aydınlar',     '0532 111 22 04', 'Kurye', bIzmir, '2024-01-20', 21000)
  const { lastID: p5 } = await insertPersonel('Mehmet Fatih Şeker', '0532 111 22 05', 'Kurye', bIzmir, '2023-09-05', 25000)
  const { lastID: p6 } = await insertPersonel('Samet Özçelik',      '0532 111 22 06', 'Kurye', bIzmir, '2024-06-01', 23000)
  const { lastID: p7 } = await insertPersonel('Şafak Zeytin',       '0532 111 22 07', 'Kurye', bIzmir, '2023-12-12', 24500)
  const { lastID: p8 } = await insertPersonel('Şahin Zeytin',       '0532 111 22 08', 'Kurye', bIzmir, '2024-02-18', 25000)

  await insertPersonel('Burak Demir',   '0533 222 33 01', 'Bölge Sorumlusu', bAfyon, '2023-05-10', 28000)
  await insertPersonel('Caner Şahin',   '0533 222 33 02', 'Kurye',           bAfyon, '2024-02-01', 22000)
  await insertPersonel('Emre Yıldız',   '0534 333 44 01', 'Kurye',           bBursa, '2024-03-22', 22000)
  await insertPersonel('Onur Polat',    '0535 444 55 01', 'Kurye',           bMugla, '2024-05-15', 22500)
  await insertPersonel('Murat Aksoy',   null,             'Kurye',           null,   '2024-06-10', 21000)

  // Seed current week's shift plan for İzmir Merkez (matches sample schedule)
  const hafta = haftaBaslangic(toISO(new Date()))
  const shifts = {
    [p1]: ['16:00-00:00','16:00-00:00','16:00-00:00','16:00-00:00','OFF','16:00-04:00','16:00-00:00'],
    [p2]: ['23:00-04:00','23:00-04:00','23:00-04:00','23:00-04:00','OFF','23:00-04:00','23:00-04:00'],
    [p3]: ['20:00-02:00','20:00-02:00','OFF','20:00-02:00','20:00-02:00','20:00-02:00','20:00-02:00'],
    [p4]: ['11:00-16:00','11:00-16:00','OFF','11:00-16:00','11:00-16:00','11:00-16:00','11:00-16:00'],
    [p5]: ['19:00-02:00','19:00-02:00','19:00-02:00','19:00-02:00','19:00-02:00','19:00-02:00','OFF'],
    [p6]: ['OFF','11:00-17:00','11:00-17:00','11:00-17:00','11:00-17:00','11:00-17:00','11:00-17:00'],
    [p7]: ['11:00-18:00','11:00-18:00','11:00-18:00','OFF','11:00-18:00','11:00-18:00','11:00-18:00'],
    [p8]: ['16:00-04:00','OFF','13:00-22:00','13:00-22:00','15:00-22:00','15:00-22:00','15:00-22:00'],
  }
  for (const [pid, days] of Object.entries(shifts)) {
    for (let gun = 0; gun < 7; gun++) {
      const cell = days[gun]
      if (cell === 'OFF') {
        await run('INSERT OR REPLACE INTO ik_vardiyalar (personel_id,hafta_baslangic,gun,baslangic,bitis,off) VALUES (?,?,?,?,?,1)',
          [pid, hafta, gun, null, null])
      } else {
        const [b, e] = cell.split('-')
        await run('INSERT OR REPLACE INTO ik_vardiyalar (personel_id,hafta_baslangic,gun,baslangic,bitis,off) VALUES (?,?,?,?,?,0)',
          [pid, hafta, gun, b, e])
      }
    }
  }

  // Sample leave requests
  await run(`INSERT INTO ik_izinler (personel_id,baslangic_tarih,bitis_tarih,tur,aciklama,durum) VALUES (?,?,?,?,?,?)`,
    [p4, toISO(new Date(Date.now() + 5 * 86400000)), toISO(new Date(Date.now() + 7 * 86400000)), 'Yıllık İzin', 'Aile ziyareti', 'Beklemede'])
  await run(`INSERT INTO ik_izinler (personel_id,baslangic_tarih,bitis_tarih,tur,aciklama,durum) VALUES (?,?,?,?,?,?)`,
    [p6, toISO(new Date(Date.now() - 10 * 86400000)), toISO(new Date(Date.now() - 8 * 86400000)), 'Sağlık Raporu', 'Doktor raporu ekte', 'Onaylandı'])

  // Sample job applications
  const insertBasvuru = (ad, tel, email, poz, sehir, ehliyet, arac, deneyim, mesaj, durum, gunOnce) =>
    run(`INSERT INTO ik_basvurular (ad_soyad,telefon,email,pozisyon,sehir,ehliyet,arac,deneyim,mesaj,durum,olusturma)
         VALUES (?,?,?,?,?,?,?,?,?,?, datetime('now','localtime','-${gunOnce} days'))`,
      [ad, tel, email, poz, sehir, ehliyet, arac, deneyim, mesaj, durum])

  await insertBasvuru('Kerem Albayrak', '0541 123 45 67', 'kerem.albayrak@gmail.com', 'Kurye', 'İzmir', 'A2', 'Motosiklet (kendine ait)', '2 yıl kurye deneyimi', 'Akşam vardiyasında çalışabilirim.', 'Yeni', 0)
  await insertBasvuru('Derya Coşkun', '0542 234 56 78', 'derya.coskun@gmail.com', 'Operasyon Sorumlusu', 'Bursa', 'B', 'Araç yok', '4 yıl lojistik operasyon', 'Tam zamanlı ofis pozisyonu arıyorum.', 'Değerlendiriliyor', 1)
  await insertBasvuru('Tolga Er', '0543 345 67 89', 'tolga.er@gmail.com', 'Kurye', 'İzmir', 'A1', 'Motosiklet (kendine ait)', 'Yeni mezun', 'Hafta sonu da çalışabilirim.', 'Yeni', 2)
  await insertBasvuru('Pınar Yalçın', '0544 456 78 90', 'pinar.yalcin@gmail.com', 'Çağrı Merkezi', 'Afyonkarahisar', '-', 'Araç yok', '1 yıl müşteri hizmetleri', 'Esnek çalışma saatlerine uygunum.', 'Olumsuz', 4)
  await insertBasvuru('Serkan Bulut', '0545 567 89 01', 'serkan.bulut@gmail.com', 'Kurye', 'Muğla', 'A2', 'Motosiklet (kendine ait)', '3 yıl kurye deneyimi', 'Bodrum bölgesinde ikamet ediyorum.', 'İşe Alındı', 8)

  // Sample announcements
  await run(`INSERT INTO ik_duyurular (baslik,icerik,bolge_id,onem) VALUES (?,?,?,?)`,
    ['Yaz Sezonu Vardiya Düzenlemesi', 'Haziran-Ağustos döneminde hafta sonu vardiyalarına ek personel planlanacaktır. Bölge sorumluları personel taleplerini İK ile paylaşsın.', null, 'Önemli'])
  await run(`INSERT INTO ik_duyurular (baslik,icerik,bolge_id,onem) VALUES (?,?,?,?)`,
    ['İzmir Merkez - Yeni Ekipman Teslimi', 'Yeni termal çantalar depo görevlisinden teslim alınabilir.', bIzmir, 'Normal'])
}

// ── Auth middleware ───────────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Yetkisiz erişim' })
  try {
    req.admin = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ message: 'Oturum süresi doldu, lütfen tekrar giriş yapın' })
  }
}

// ── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/ik/login', wrap(async (req, res) => {
  const { email, sifre } = req.body
  const user = await get('SELECT * FROM ik_admin WHERE email = ?', [String(email || '').trim().toLowerCase()])
  if (!user || !bcrypt.compareSync(sifre || '', user.sifre_hash)) {
    return res.status(401).json({ message: 'E-posta veya şifre hatalı' })
  }
  const token = jwt.sign({ id: user.id, email: user.email, ad: user.ad }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
}))

app.get('/api/ik/me', auth, wrap(async (req, res) => {
  const user = await get('SELECT id, ad, email FROM ik_admin WHERE id = ?', [req.admin.id])
  if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' })
  res.json(user)
}))

app.put('/api/ik/me/sifre', auth, wrap(async (req, res) => {
  const { eski_sifre, yeni_sifre } = req.body
  if (!yeni_sifre || yeni_sifre.length < 6) return res.status(400).json({ message: 'Yeni şifre en az 6 karakter olmalı' })
  const user = await get('SELECT * FROM ik_admin WHERE id = ?', [req.admin.id])
  if (!bcrypt.compareSync(eski_sifre || '', user.sifre_hash)) return res.status(400).json({ message: 'Mevcut şifre yanlış' })
  await run('UPDATE ik_admin SET sifre_hash = ? WHERE id = ?', [bcrypt.hashSync(yeni_sifre, 10), req.admin.id])
  res.json({ ok: true })
}))

// ── DASHBOARD / STATS ────────────────────────────────────────────────────────
app.get('/api/ik/stats', auth, wrap(async (req, res) => {
  const personel = await get(`SELECT COUNT(*) c FROM ik_personel`)
  const aktif = await get(`SELECT COUNT(*) c FROM ik_personel WHERE durum = 'Aktif'`)
  const bolge = await get(`SELECT COUNT(*) c FROM ik_bolgeler WHERE aktif = 1`)
  const yeniBasvuru = await get(`SELECT COUNT(*) c FROM ik_basvurular WHERE durum = 'Yeni'`)
  const bekleyenIzin = await get(`SELECT COUNT(*) c FROM ik_izinler WHERE durum = 'Beklemede'`)

  const hafta = haftaBaslangic(toISO(new Date()))
  const vardiyalar = await all(`SELECT baslangic, bitis, off FROM ik_vardiyalar WHERE hafta_baslangic = ?`, [hafta])
  const buHaftaToplamSaat = vardiyalar.reduce((sum, v) => sum + (v.off ? 0 : vardiyaSaat(v.baslangic, v.bitis)), 0)

  const bolgeDagilim = await all(`
    SELECT b.id, b.ad, b.renk, COUNT(p.id) personel_sayisi
    FROM ik_bolgeler b
    LEFT JOIN ik_personel p ON p.bolge_id = b.id AND p.durum = 'Aktif'
    WHERE b.aktif = 1
    GROUP BY b.id ORDER BY b.ad`)

  const sonBasvurular = await all(`SELECT id, ad_soyad, pozisyon, sehir, durum, olusturma FROM ik_basvurular ORDER BY id DESC LIMIT 5`)

  res.json({
    toplam_personel: personel.c,
    aktif_personel: aktif.c,
    toplam_bolge: bolge.c,
    yeni_basvuru: yeniBasvuru.c,
    bekleyen_izin: bekleyenIzin.c,
    bu_hafta_toplam_saat: Math.round(buHaftaToplamSaat * 10) / 10,
    bolge_dagilim: bolgeDagilim,
    son_basvurular: sonBasvurular,
  })
}))

// ── BÖLGELER ─────────────────────────────────────────────────────────────────
app.get('/api/ik/bolgeler', auth, wrap(async (req, res) => {
  const rows = await all(`
    SELECT b.*, (SELECT COUNT(*) FROM ik_personel p WHERE p.bolge_id = b.id) AS personel_sayisi
    FROM ik_bolgeler b ORDER BY b.ad`)
  res.json(rows)
}))

app.post('/api/ik/bolgeler', auth, wrap(async (req, res) => {
  const { ad, il, aciklama, renk } = req.body
  if (!ad) return res.status(400).json({ message: 'Bölge adı zorunlu' })
  const { lastID } = await run('INSERT INTO ik_bolgeler (ad,il,aciklama,renk) VALUES (?,?,?,?)',
    [ad, il || null, aciklama || null, renk || '#2563eb'])
  res.json(await get('SELECT * FROM ik_bolgeler WHERE id = ?', [lastID]))
}))

app.put('/api/ik/bolgeler/:id', auth, wrap(async (req, res) => {
  const { ad, il, aciklama, renk, aktif } = req.body
  const existing = await get('SELECT * FROM ik_bolgeler WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ message: 'Bölge bulunamadı' })
  await run('UPDATE ik_bolgeler SET ad=?, il=?, aciklama=?, renk=?, aktif=? WHERE id=?',
    [ad ?? existing.ad, il ?? existing.il, aciklama ?? existing.aciklama, renk ?? existing.renk,
     aktif !== undefined ? (aktif ? 1 : 0) : existing.aktif, req.params.id])
  res.json(await get('SELECT * FROM ik_bolgeler WHERE id = ?', [req.params.id]))
}))

app.delete('/api/ik/bolgeler/:id', auth, wrap(async (req, res) => {
  const inUse = await get('SELECT COUNT(*) c FROM ik_personel WHERE bolge_id = ?', [req.params.id])
  if (inUse.c > 0) return res.status(400).json({ message: 'Bu bölgede personel bulunduğu için silinemez. Önce personeli başka bölgeye taşıyın.' })
  await run('DELETE FROM ik_bolgeler WHERE id = ?', [req.params.id])
  res.json({ ok: true })
}))

// ── PERSONEL ─────────────────────────────────────────────────────────────────
app.get('/api/ik/personel', auth, wrap(async (req, res) => {
  const { bolge_id, durum, q } = req.query
  let sql = `SELECT p.*, b.ad AS bolge_ad, b.renk AS bolge_renk FROM ik_personel p LEFT JOIN ik_bolgeler b ON b.id = p.bolge_id WHERE 1=1`
  const params = []
  if (bolge_id === 'null') { sql += ' AND p.bolge_id IS NULL' }
  else if (bolge_id) { sql += ' AND p.bolge_id = ?'; params.push(bolge_id) }
  if (durum) { sql += ' AND p.durum = ?'; params.push(durum) }
  if (q) { sql += ' AND (p.ad_soyad LIKE ? OR p.telefon LIKE ? OR p.email LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`) }
  sql += ' ORDER BY p.ad_soyad'
  res.json(await all(sql, params))
}))

app.get('/api/ik/personel/:id', auth, wrap(async (req, res) => {
  const row = await get(`SELECT p.*, b.ad AS bolge_ad FROM ik_personel p LEFT JOIN ik_bolgeler b ON b.id = p.bolge_id WHERE p.id = ?`, [req.params.id])
  if (!row) return res.status(404).json({ message: 'Personel bulunamadı' })
  res.json(row)
}))

app.post('/api/ik/personel', auth, wrap(async (req, res) => {
  const { ad_soyad, telefon, email, tc_no, pozisyon, bolge_id, ise_giris_tarihi, durum, maas, adres, notlar } = req.body
  if (!ad_soyad) return res.status(400).json({ message: 'Ad soyad zorunlu' })
  const { lastID } = await run(`
    INSERT INTO ik_personel (ad_soyad,telefon,email,tc_no,pozisyon,bolge_id,ise_giris_tarihi,durum,maas,adres,notlar)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [ad_soyad, telefon || null, email || null, tc_no || null, pozisyon || 'Kurye', bolge_id || null,
     ise_giris_tarihi || null, durum || 'Aktif', maas || null, adres || null, notlar || null])
  res.json(await get('SELECT * FROM ik_personel WHERE id = ?', [lastID]))
}))

app.put('/api/ik/personel/:id', auth, wrap(async (req, res) => {
  const existing = await get('SELECT * FROM ik_personel WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ message: 'Personel bulunamadı' })
  const f = { ...existing, ...req.body }
  await run(`UPDATE ik_personel SET ad_soyad=?, telefon=?, email=?, tc_no=?, pozisyon=?, bolge_id=?, ise_giris_tarihi=?, durum=?, maas=?, adres=?, notlar=? WHERE id=?`,
    [f.ad_soyad, f.telefon, f.email, f.tc_no, f.pozisyon, f.bolge_id || null, f.ise_giris_tarihi, f.durum, f.maas, f.adres, f.notlar, req.params.id])
  res.json(await get('SELECT * FROM ik_personel WHERE id = ?', [req.params.id]))
}))

app.delete('/api/ik/personel/:id', auth, wrap(async (req, res) => {
  await run('DELETE FROM ik_personel WHERE id = ?', [req.params.id])
  res.json({ ok: true })
}))

// ── VARDİYA PLANLAMA ─────────────────────────────────────────────────────────
// returns personnel of a region with their 7-day shift plan for a given week
app.get('/api/ik/vardiya', auth, wrap(async (req, res) => {
  let { bolge_id, hafta } = req.query
  if (!hafta) hafta = haftaBaslangic(toISO(new Date()))
  else hafta = haftaBaslangic(hafta)

  let personelSql = `SELECT p.*, b.ad AS bolge_ad FROM ik_personel p LEFT JOIN ik_bolgeler b ON b.id = p.bolge_id WHERE p.durum = 'Aktif'`
  const params = []
  if (bolge_id === 'null') { personelSql += ' AND p.bolge_id IS NULL' }
  else if (bolge_id) { personelSql += ' AND p.bolge_id = ?'; params.push(bolge_id) }
  personelSql += ' ORDER BY p.ad_soyad'
  const personeller = await all(personelSql, params)

  const vardiyalar = await all(`SELECT * FROM ik_vardiyalar WHERE hafta_baslangic = ?`, [hafta])
  const vMap = {}
  for (const v of vardiyalar) {
    vMap[`${v.personel_id}-${v.gun}`] = v
  }

  const result = personeller.map(p => {
    let toplamSaat = 0
    const gunler = []
    for (let gun = 0; gun < 7; gun++) {
      const v = vMap[`${p.id}-${gun}`]
      const off = v ? !!v.off : false
      const baslangic = v ? v.baslangic : null
      const bitis = v ? v.bitis : null
      if (!off) toplamSaat += vardiyaSaat(baslangic, bitis)
      gunler.push({ gun, gun_adi: GUN_ADLARI[gun], tarih: gunTarih(hafta, gun), baslangic, bitis, off })
    }
    return {
      id: p.id, ad_soyad: p.ad_soyad, pozisyon: p.pozisyon, telefon: p.telefon,
      bolge_id: p.bolge_id, bolge_ad: p.bolge_ad,
      gunler, haftalik_toplam: Math.round(toplamSaat * 10) / 10,
    }
  })

  res.json({ hafta_baslangic: hafta, gun_adlari: GUN_ADLARI, personeller: result })
}))

// upsert a single shift cell
app.put('/api/ik/vardiya', auth, wrap(async (req, res) => {
  let { personel_id, hafta_baslangic, gun, baslangic, bitis, off } = req.body
  if (personel_id == null || hafta_baslangic == null || gun == null) {
    return res.status(400).json({ message: 'personel_id, hafta_baslangic ve gun zorunlu' })
  }
  hafta_baslangic = haftaBaslangic(hafta_baslangic)
  if (off) { baslangic = null; bitis = null }
  await run(`
    INSERT INTO ik_vardiyalar (personel_id, hafta_baslangic, gun, baslangic, bitis, off)
    VALUES (?,?,?,?,?,?)
    ON CONFLICT(personel_id, hafta_baslangic, gun) DO UPDATE SET baslangic=excluded.baslangic, bitis=excluded.bitis, off=excluded.off`,
    [personel_id, hafta_baslangic, gun, baslangic || null, bitis || null, off ? 1 : 0])
  const row = await get(`SELECT * FROM ik_vardiyalar WHERE personel_id=? AND hafta_baslangic=? AND gun=?`,
    [personel_id, hafta_baslangic, gun])
  res.json({ ...row, saat: vardiyaSaat(row.baslangic, row.bitis) })
}))

// clear a shift cell (no shift defined)
app.delete('/api/ik/vardiya', auth, wrap(async (req, res) => {
  const { personel_id, hafta_baslangic, gun } = req.body
  await run(`DELETE FROM ik_vardiyalar WHERE personel_id=? AND hafta_baslangic=? AND gun=?`,
    [personel_id, haftaBaslangic(hafta_baslangic), gun])
  res.json({ ok: true })
}))

// copy current week's plan to next week for a region
app.post('/api/ik/vardiya/kopyala', auth, wrap(async (req, res) => {
  let { bolge_id, hafta_baslangic } = req.body
  hafta_baslangic = haftaBaslangic(hafta_baslangic)
  const hedefDate = new Date(hafta_baslangic + 'T00:00:00')
  hedefDate.setDate(hedefDate.getDate() + 7)
  const hedef = toISO(hedefDate)

  let personelSql = `SELECT id FROM ik_personel WHERE durum='Aktif'`
  const params = []
  if (bolge_id) { personelSql += ' AND bolge_id = ?'; params.push(bolge_id) }
  const personeller = await all(personelSql, params)

  for (const p of personeller) {
    const rows = await all(`SELECT * FROM ik_vardiyalar WHERE personel_id=? AND hafta_baslangic=?`, [p.id, hafta_baslangic])
    for (const r of rows) {
      await run(`
        INSERT INTO ik_vardiyalar (personel_id, hafta_baslangic, gun, baslangic, bitis, off)
        VALUES (?,?,?,?,?,?)
        ON CONFLICT(personel_id, hafta_baslangic, gun) DO UPDATE SET baslangic=excluded.baslangic, bitis=excluded.bitis, off=excluded.off`,
        [p.id, hedef, r.gun, r.baslangic, r.bitis, r.off])
    }
  }
  res.json({ ok: true, hedef_hafta: hedef })
}))

// ── İZİNLER ──────────────────────────────────────────────────────────────────
app.get('/api/ik/izinler', auth, wrap(async (req, res) => {
  const { durum, personel_id } = req.query
  let sql = `SELECT i.*, p.ad_soyad, p.bolge_id, b.ad AS bolge_ad FROM ik_izinler i
             JOIN ik_personel p ON p.id = i.personel_id
             LEFT JOIN ik_bolgeler b ON b.id = p.bolge_id WHERE 1=1`
  const params = []
  if (durum) { sql += ' AND i.durum = ?'; params.push(durum) }
  if (personel_id) { sql += ' AND i.personel_id = ?'; params.push(personel_id) }
  sql += ' ORDER BY i.baslangic_tarih DESC'
  res.json(await all(sql, params))
}))

app.post('/api/ik/izinler', auth, wrap(async (req, res) => {
  const { personel_id, baslangic_tarih, bitis_tarih, tur, aciklama, durum } = req.body
  if (!personel_id || !baslangic_tarih || !bitis_tarih) return res.status(400).json({ message: 'Personel ve tarih aralığı zorunlu' })
  const { lastID } = await run(`INSERT INTO ik_izinler (personel_id,baslangic_tarih,bitis_tarih,tur,aciklama,durum) VALUES (?,?,?,?,?,?)`,
    [personel_id, baslangic_tarih, bitis_tarih, tur || 'Yıllık İzin', aciklama || null, durum || 'Beklemede'])
  res.json(await get('SELECT * FROM ik_izinler WHERE id = ?', [lastID]))
}))

app.put('/api/ik/izinler/:id', auth, wrap(async (req, res) => {
  const existing = await get('SELECT * FROM ik_izinler WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ message: 'İzin kaydı bulunamadı' })
  const f = { ...existing, ...req.body }
  await run(`UPDATE ik_izinler SET baslangic_tarih=?, bitis_tarih=?, tur=?, aciklama=?, durum=? WHERE id=?`,
    [f.baslangic_tarih, f.bitis_tarih, f.tur, f.aciklama, f.durum, req.params.id])
  res.json(await get('SELECT * FROM ik_izinler WHERE id = ?', [req.params.id]))
}))

app.delete('/api/ik/izinler/:id', auth, wrap(async (req, res) => {
  await run('DELETE FROM ik_izinler WHERE id = ?', [req.params.id])
  res.json({ ok: true })
}))

// ── BAŞVURULAR ───────────────────────────────────────────────────────────────
// Public endpoint - no auth required, used by careers form / external site
app.post('/api/ik/basvuru', wrap(async (req, res) => {
  const { ad_soyad, telefon, email, pozisyon, sehir, dogum_tarihi, ehliyet, arac, deneyim, mesaj } = req.body
  if (!ad_soyad || !telefon) return res.status(400).json({ message: 'Ad soyad ve telefon zorunludur' })
  const { lastID } = await run(`
    INSERT INTO ik_basvurular (ad_soyad,telefon,email,pozisyon,sehir,dogum_tarihi,ehliyet,arac,deneyim,mesaj)
    VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [ad_soyad, telefon, email || null, pozisyon || null, sehir || null, dogum_tarihi || null, ehliyet || null, arac || null, deneyim || null, mesaj || null])
  res.json({ ok: true, id: lastID })
}))

app.get('/api/ik/basvurular', auth, wrap(async (req, res) => {
  const { durum } = req.query
  let sql = 'SELECT * FROM ik_basvurular WHERE 1=1'
  const params = []
  if (durum) { sql += ' AND durum = ?'; params.push(durum) }
  sql += ' ORDER BY id DESC'
  res.json(await all(sql, params))
}))

app.put('/api/ik/basvurular/:id', auth, wrap(async (req, res) => {
  const existing = await get('SELECT * FROM ik_basvurular WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ message: 'Başvuru bulunamadı' })
  const f = { ...existing, ...req.body }
  await run('UPDATE ik_basvurular SET durum=?, notlar=? WHERE id=?', [f.durum, f.notlar, req.params.id])
  res.json(await get('SELECT * FROM ik_basvurular WHERE id = ?', [req.params.id]))
}))

app.delete('/api/ik/basvurular/:id', auth, wrap(async (req, res) => {
  await run('DELETE FROM ik_basvurular WHERE id = ?', [req.params.id])
  res.json({ ok: true })
}))

// convert an application into an employee record
app.post('/api/ik/basvurular/:id/ise-al', auth, wrap(async (req, res) => {
  const basvuru = await get('SELECT * FROM ik_basvurular WHERE id = ?', [req.params.id])
  if (!basvuru) return res.status(404).json({ message: 'Başvuru bulunamadı' })
  const { bolge_id, ise_giris_tarihi, maas, pozisyon } = req.body
  const { lastID } = await run(`
    INSERT INTO ik_personel (ad_soyad,telefon,email,pozisyon,bolge_id,ise_giris_tarihi,durum,maas)
    VALUES (?,?,?,?,?,?,?,?)`,
    [basvuru.ad_soyad, basvuru.telefon, basvuru.email, pozisyon || basvuru.pozisyon || 'Kurye', bolge_id || null,
     ise_giris_tarihi || toISO(new Date()), 'Aktif', maas || null])
  await run(`UPDATE ik_basvurular SET durum='İşe Alındı' WHERE id=?`, [req.params.id])
  res.json(await get('SELECT * FROM ik_personel WHERE id = ?', [lastID]))
}))

// ── DUYURULAR ────────────────────────────────────────────────────────────────
app.get('/api/ik/duyurular', auth, wrap(async (req, res) => {
  const rows = await all(`
    SELECT d.*, b.ad AS bolge_ad FROM ik_duyurular d LEFT JOIN ik_bolgeler b ON b.id = d.bolge_id
    ORDER BY d.id DESC`)
  res.json(rows)
}))

app.post('/api/ik/duyurular', auth, wrap(async (req, res) => {
  const { baslik, icerik, bolge_id, onem } = req.body
  if (!baslik || !icerik) return res.status(400).json({ message: 'Başlık ve içerik zorunlu' })
  const { lastID } = await run('INSERT INTO ik_duyurular (baslik,icerik,bolge_id,onem) VALUES (?,?,?,?)',
    [baslik, icerik, bolge_id || null, onem || 'Normal'])
  res.json(await get('SELECT * FROM ik_duyurular WHERE id = ?', [lastID]))
}))

app.put('/api/ik/duyurular/:id', auth, wrap(async (req, res) => {
  const existing = await get('SELECT * FROM ik_duyurular WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ message: 'Duyuru bulunamadı' })
  const f = { ...existing, ...req.body }
  await run('UPDATE ik_duyurular SET baslik=?, icerik=?, bolge_id=?, onem=? WHERE id=?',
    [f.baslik, f.icerik, f.bolge_id || null, f.onem, req.params.id])
  res.json(await get('SELECT * FROM ik_duyurular WHERE id = ?', [req.params.id]))
}))

app.delete('/api/ik/duyurular/:id', auth, wrap(async (req, res) => {
  await run('DELETE FROM ik_duyurular WHERE id = ?', [req.params.id])
  res.json({ ok: true })
}))

// ── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: err.message || 'Sunucu hatası' })
})

initDb()
  .then(() => app.listen(PORT, () => console.log(`Paketçiniz İK Backend → http://localhost:${PORT}`)))
  .catch(e => { console.error('DB init failed', e); process.exit(1) })
