const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const path = require('path')
const QRCode = require('qrcode')

const app = express()
const PORT = 3002
const JWT_SECRET = process.env.JWT_SECRET || 'paketciz-plus-secret-key-2024'
const DB_PATH = path.join(__dirname, 'plus.db')

app.use(cors())
app.use(express.json())

// ── SQLite helpers ────────────────────────────────────────────────────────────
const db = new sqlite3.Database(DB_PATH)
const run = (sql, p = []) => new Promise((res, rej) =>
  db.run(sql, p, function(e) { e ? rej(e) : res({ lastID: this.lastID, changes: this.changes }) }))
const get = (sql, p = []) => new Promise((res, rej) =>
  db.get(sql, p, (e, r) => e ? rej(e) : res(r)))
const all = (sql, p = []) => new Promise((res, rej) =>
  db.all(sql, p, (e, r) => e ? rej(e) : res(r)))
const wrap = fn => async (req, res, next) => { try { await fn(req, res, next) } catch(e) { next(e) } }

// ── DB Init ───────────────────────────────────────────────────────────────────
async function initDb() {
  await run(`CREATE TABLE IF NOT EXISTS plus_adminler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    sifre_hash TEXT NOT NULL,
    aktif INTEGER DEFAULT 1,
    olusturma TEXT DEFAULT (datetime('now','localtime'))
  )`)
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
  await run(`CREATE TABLE IF NOT EXISTS plus_fiyatlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    il TEXT NOT NULL,
    ilce TEXT,
    mahalle TEXT,
    fiyat REAL NOT NULL,
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
    fiyat REAL DEFAULT 0,
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
  await run(`CREATE TABLE IF NOT EXISTS plus_odemeler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id INTEGER NOT NULL,
    miktar REAL NOT NULL,
    aciklama TEXT,
    tarih TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY(partner_id) REFERENCES plus_partnerler(id)
  )`)
  await run(`CREATE TABLE IF NOT EXISTS plus_alt_kullanicilar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id INTEGER NOT NULL,
    ad TEXT NOT NULL,
    unvan TEXT DEFAULT 'Kullanıcı',
    email TEXT UNIQUE NOT NULL,
    sifre_hash TEXT NOT NULL,
    telefon TEXT,
    il TEXT,
    ilce TEXT,
    mahalle TEXT,
    adres TEXT,
    aktif INTEGER DEFAULT 1,
    olusturma TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY(partner_id) REFERENCES plus_partnerler(id)
  )`)
  await run(`CREATE TABLE IF NOT EXISTS plus_ayarlar (
    anahtar TEXT PRIMARY KEY,
    deger TEXT NOT NULL,
    aciklama TEXT
  )`)

  // Migrations — each wrapped so existing columns don't fail
  try { await run('ALTER TABLE plus_isler ADD COLUMN fiyat REAL DEFAULT 0') } catch {}
  try { await run('ALTER TABLE plus_isler ADD COLUMN alt_kullanici_id INTEGER') } catch {}
  try { await run('ALTER TABLE plus_partnerler ADD COLUMN merkez_il TEXT') } catch {}
  try { await run('ALTER TABLE plus_partnerler ADD COLUMN merkez_ilce TEXT') } catch {}
  try { await run('ALTER TABLE plus_partnerler ADD COLUMN merkez_adres TEXT') } catch {}

  // New columns
  try { await run("ALTER TABLE plus_fiyatlar ADD COLUMN tur TEXT DEFAULT 'adres_dagitim'") } catch {}
  try { await run("ALTER TABLE plus_isler ADD COLUMN is_turu TEXT DEFAULT 'adres_dagitim'") } catch {}
  try { await run("ALTER TABLE plus_isler ADD COLUMN fiyat_detay TEXT") } catch {}
  try { await run("ALTER TABLE plus_isler ADD COLUMN kdv_orani REAL DEFAULT 0") } catch {}
  try { await run("ALTER TABLE plus_isler ADD COLUMN kdv_tutari REAL DEFAULT 0") } catch {}
  try { await run("ALTER TABLE plus_adminler ADD COLUMN tip TEXT DEFAULT 'admin'") } catch {}

  // Seed admin
  const ea = await get('SELECT COUNT(*) as c FROM plus_adminler')
  if (ea.c === 0) {
    const ah = bcrypt.hashSync('admin123', 10)
    await run(`INSERT INTO plus_adminler (ad,email,sifre_hash,tip) VALUES (?,?,?,?)`,
      ['Süper Admin', 'admin@plus.com', ah, 'super_admin'])
  } else {
    // Ensure first admin is super_admin if tip column was just added
    await run(`UPDATE plus_adminler SET tip='super_admin' WHERE email='admin@plus.com'`)
  }

  // KDV ve paket çarpanları
  const DEFAULT_AYARLAR = [
    ['kdv_orani',    '20',  'KDV Oranı (%)'],
    ['carpan_Zarf',  '0.7', 'Zarf paket boyutu çarpanı'],
    ['carpan_Küçük', '1.0', 'Küçük paket boyutu çarpanı (baz)'],
    ['carpan_Orta',  '1.4', 'Orta paket boyutu çarpanı'],
    ['carpan_Büyük', '2.0', 'Büyük paket boyutu çarpanı'],
    ['carpan_Koli',  '2.8', 'Koli paket boyutu çarpanı'],
  ]
  for (const [anahtar, deger, aciklama] of DEFAULT_AYARLAR) {
    await run('INSERT OR IGNORE INTO plus_ayarlar (anahtar,deger,aciklama) VALUES (?,?,?)', [anahtar, deger, aciklama])
  }

  // Seed demo partner
  const ep = await get('SELECT COUNT(*) as c FROM plus_partnerler')
  if (ep.c === 0) {
    const ph = bcrypt.hashSync('partner123', 10)
    await run(`INSERT INTO plus_partnerler (firma_adi,yetkili_ad,email,sifre_hash,telefon,merkez_il,merkez_ilce,merkez_adres)
               VALUES (?,?,?,?,?,?,?,?)`,
      ['ABC Lojistik', 'Ahmet Kaya', 'partner@plus.com', ph, '05321000000', 'İstanbul', 'Şişli', 'Büyükdere Cad. 145'])
    // Demo fiyatlar — all 4 service types
    const TYPES = ['adres_dagitim','adres_toplama','otogar_alis','kargo_geri']
    const BASE_FIYATLAR = [
      ['İstanbul','Kadıköy',null,45],['İstanbul',null,null,35],['Ankara',null,null,30],['İzmir',null,null,32]
    ]
    for (const tur of TYPES) {
      for (const [il,ilce,mahalle,fiyat] of BASE_FIYATLAR) {
        await run(`INSERT INTO plus_fiyatlar (il,ilce,mahalle,fiyat,tur) VALUES (?,?,?,?,?)`,
          [il.trim(),ilce||null,mahalle||null,fiyat+(TYPES.indexOf(tur)*10),tur])
      }
    }
  } else {
    // Update existing demo partner with merkez fields if they are NULL
    await run(`UPDATE plus_partnerler
               SET merkez_il   = COALESCE(merkez_il,   'İstanbul'),
                   merkez_ilce = COALESCE(merkez_ilce, 'Şişli'),
                   merkez_adres= COALESCE(merkez_adres,'Büyükdere Cad. 145')
               WHERE email='partner@plus.com'`)
  }

  // Seed demo carrier
  const et = await get('SELECT COUNT(*) as c FROM plus_tasiyicilar')
  if (et.c === 0) {
    const th = bcrypt.hashSync('tasiyici123', 10)
    await run(`INSERT INTO plus_tasiyicilar (ad,email,sifre_hash,telefon,arac_tipi)
               VALUES (?,?,?,?,?)`, ['Mehmet Şahin', 'tasiyici@plus.com', th, '05331000000', 'Motosiklet'])
    await run(`INSERT INTO plus_tasiyicilar (ad,email,sifre_hash,telefon,arac_tipi)
               VALUES (?,?,?,?,?)`, ['Ali Yılmaz', 'ali@plus.com', bcrypt.hashSync('ali123', 10), '05332000000', 'Bisiklet'])
  }

  // Seed demo jobs
  const ei = await get('SELECT COUNT(*) as c FROM plus_isler')
  if (ei.c === 0) {
    const p = await get('SELECT id FROM plus_partnerler LIMIT 1')
    if (p) {
      const jobs = [
        ['Havuzda', 'İstanbul', 'Kadıköy', null, 'Bağdat Cad. No:10', 'İstanbul', 'Üsküdar', null, 'Çamlıca Mah. No:5', 'Ali Demir', '05301000001', 'Veli Kaya', '05301000002', 'Küçük', '10:00', 45.00],
        ['Havuzda', 'İstanbul', 'Beşiktaş', null, 'Barbaros Blv. 20', 'İstanbul', 'Şişli', null, 'Cumhuriyet Cad. 15', 'Ayşe Hanım', '05302000001', 'Fatma Hanım', '05302000002', 'Orta', '11:30', 35.00],
        ['Alındı', 'İstanbul', 'Kadıköy', null, 'Moda Cad. 45', 'İstanbul', 'Ataşehir', null, 'İnönü Mah. 8', 'Kemal Bey', '05303000001', 'Zeynep Hanım', '05303000002', 'Büyük', '09:00', 45.00],
        ['Teslim Edildi', 'İstanbul', 'Fatih', null, 'Divanyolu Cad. 1', 'İstanbul', 'Beyoğlu', null, 'İstiklal Cad. 100', 'Mehmet Bey', '05304000001', 'Selin Hanım', '05304000002', 'Küçük', '08:00', 35.00],
      ]
      for (const [durum, ai, ail, am, aa, bi, bil, bm, ba, ga, gt, aa2, at2, pb, saat, fiyat] of jobs) {
        const qr = `PLU-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`
        const t = await get("SELECT id FROM plus_tasiyicilar LIMIT 1")
        const tasiyici = durum !== 'Havuzda' ? t?.id : null
        const { lastID } = await run(`INSERT INTO plus_isler
          (partner_id,qr_kodu,durum,is_turu,alis_il,alis_ilce,alis_mahalle,alis_adres,
           birakilis_il,birakilis_ilce,birakilis_mahalle,birakilis_adres,
           gonderici_ad,gonderici_telefon,alici_ad,alici_telefon,
           paket_boyutu,alinma_saati,fiyat,tasiyici_id)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [p.id,qr,durum,'adres_dagitim',ai,ail,am||null,aa,bi,bil,bm||null,ba,ga,gt,aa2,at2,pb,saat,fiyat,tasiyici])
        await run('INSERT INTO plus_hareketler (is_id,durum) VALUES (?,?)', [lastID, durum === 'Havuzda' ? 'Havuzda' : durum])
      }
      // Demo payment for partner
      await run('INSERT INTO plus_odemeler (partner_id,miktar,aciklama) VALUES (?,?,?)',
        [p.id, 100.00, 'İlk ödeme'])
    }
  }

  // Seed demo alt kullanıcı
  const eak = await get('SELECT COUNT(*) as c FROM plus_alt_kullanicilar')
  if (eak.c === 0) {
    const demoParter = await get("SELECT id FROM plus_partnerler WHERE email='partner@plus.com'")
    if (demoParter) {
      const dh = bcrypt.hashSync('disci123', 10)
      await run(`INSERT INTO plus_alt_kullanicilar (partner_id,ad,unvan,email,sifre_hash,telefon,il,ilce,adres)
                 VALUES (?,?,?,?,?,?,?,?,?)`,
        [demoParter.id, 'Dr. Ayşe Çelik', 'Diş Hekimi', 'disci@plus.com', dh,
         '05341000000', 'İstanbul', 'Kadıköy', 'Bağdat Cad. 123/A'])
    }
  }

  console.log('✓ DB hazır')
}

// ── Price Calculator ──────────────────────────────────────────────────────────
async function calculatePrice(il, ilce, mahalle, is_turu = 'adres_dagitim', paket_boyutu = 'Orta') {
  // Load KDV and package multiplier in parallel
  const [kdvRow, carpanRow] = await Promise.all([
    get("SELECT deger FROM plus_ayarlar WHERE anahtar='kdv_orani'"),
    get('SELECT deger FROM plus_ayarlar WHERE anahtar=?', [`carpan_${paket_boyutu}`]),
  ])
  const kdv_orani = kdvRow ? parseFloat(kdvRow.deger) : 0
  const carpan    = carpanRow ? parseFloat(carpanRow.deger) : 1.0

  // Location-based base price: mahalle → ilce → il
  let lokasyon_fiyat = 0
  if (mahalle) {
    const f = await get(`SELECT fiyat FROM plus_fiyatlar WHERE il=? AND ilce=? AND mahalle=? AND tur=? AND aktif=1 LIMIT 1`, [il,ilce,mahalle,is_turu])
    if (f) lokasyon_fiyat = f.fiyat
  }
  if (!lokasyon_fiyat) {
    const f = await get(`SELECT fiyat FROM plus_fiyatlar WHERE il=? AND ilce=? AND (mahalle IS NULL OR mahalle='') AND tur=? AND aktif=1 LIMIT 1`, [il,ilce,is_turu])
    if (f) lokasyon_fiyat = f.fiyat
  }
  if (!lokasyon_fiyat) {
    const f = await get(`SELECT fiyat FROM plus_fiyatlar WHERE il=? AND (ilce IS NULL OR ilce='') AND tur=? AND aktif=1 LIMIT 1`, [il,is_turu])
    if (f) lokasyon_fiyat = f.fiyat
  }

  const baz_fiyat  = +(lokasyon_fiyat * carpan).toFixed(2)
  const kdv_tutari = +(baz_fiyat * kdv_orani / 100).toFixed(2)
  const toplam     = +(baz_fiyat + kdv_tutari).toFixed(2)

  return { is_turu, paket_boyutu, lokasyon_fiyat, carpan, baz_fiyat, kdv_orani, kdv_tutari, toplam }
}

// ── Auth Middleware ───────────────────────────────────────────────────────────
function partnerAuth(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ message: 'Yetkisiz' })
  try {
    req.partner = jwt.verify(h.slice(7), JWT_SECRET)
    if (req.partner.type !== 'plus_partner') return res.status(401).json({ message: 'Yetkisiz' })
    next()
  } catch { res.status(401).json({ message: 'Geçersiz token' }) }
}

function tasiyiciAuth(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ message: 'Yetkisiz' })
  try {
    req.tasiyici = jwt.verify(h.slice(7), JWT_SECRET)
    if (req.tasiyici.type !== 'plus_tasiyici') return res.status(401).json({ message: 'Yetkisiz' })
    next()
  } catch { res.status(401).json({ message: 'Geçersiz token' }) }
}

function adminAuth(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ message: 'Yetkisiz' })
  try {
    req.admin = jwt.verify(h.slice(7), JWT_SECRET)
    if (req.admin.type !== 'plus_admin') return res.status(401).json({ message: 'Yetkisiz' })
    next()
  } catch { res.status(401).json({ message: 'Geçersiz token' }) }
}

function superAdminAuth(req, res, next) {
  adminAuth(req, res, async () => {
    const a = await get('SELECT tip FROM plus_adminler WHERE id=?', [req.admin.id])
    if (!a || a.tip !== 'super_admin') return res.status(403).json({ message: 'Süper admin yetkisi gerekli' })
    next()
  })
}

function altAuth(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ message: 'Yetkisiz' })
  try {
    req.alt = jwt.verify(h.slice(7), JWT_SECRET)
    if (req.alt.type !== 'plus_alt') return res.status(401).json({ message: 'Yetkisiz' })
    next()
  } catch { res.status(401).json({ message: 'Geçersiz token' }) }
}

// ── Partner Endpoints ─────────────────────────────────────────────────────────
app.post('/api/plus/partner/login', wrap(async (req, res) => {
  const { email, sifre } = req.body || {}
  if (!email || !sifre) return res.status(400).json({ message: 'Email ve şifre gerekli' })
  const p = await get('SELECT * FROM plus_partnerler WHERE email=? AND aktif=1', [email])
  if (!p || !bcrypt.compareSync(sifre, p.sifre_hash))
    return res.status(401).json({ message: 'Geçersiz email veya şifre' })
  const token = jwt.sign({ id: p.id, email: p.email, firma_adi: p.firma_adi, type: 'plus_partner' }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
}))

app.get('/api/plus/partner/me', partnerAuth, wrap(async (req, res) => {
  const p = await get('SELECT id,firma_adi,yetkili_ad,email,telefon,aktif FROM plus_partnerler WHERE id=?', [req.partner.id])
  if (!p) return res.status(404).json({ message: 'Bulunamadı' })
  res.json(p)
}))

app.post('/api/plus/is', partnerAuth, wrap(async (req, res) => {
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

  const is_turu = req.body.is_turu || 'adres_dagitim'
  const priceInfo = await calculatePrice(alis_il, alis_ilce, alis_mahalle, is_turu, paket_boyutu)

  const qr = `PLU-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`
  const { lastID } = await run(`
    INSERT INTO plus_isler
    (partner_id,qr_kodu,is_turu,alis_il,alis_ilce,alis_mahalle,alis_adres,
     birakilis_il,birakilis_ilce,birakilis_mahalle,birakilis_adres,
     gonderici_ad,gonderici_telefon,alici_ad,alici_telefon,
     paket_boyutu,aciklama,alinma_saati,fiyat,fiyat_detay,kdv_orani,kdv_tutari)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [req.partner.id,qr,is_turu,alis_il,alis_ilce,alis_mahalle||null,alis_adres,
     birakilis_il,birakilis_ilce,birakilis_mahalle||null,birakilis_adres,
     gonderici_ad,gonderici_telefon,alici_ad,alici_telefon,
     paket_boyutu,aciklama||null,alinma_saati,priceInfo.toplam,JSON.stringify(priceInfo),priceInfo.kdv_orani,priceInfo.kdv_tutari])
  await run('INSERT INTO plus_hareketler (is_id,durum) VALUES (?,?)', [lastID,'Havuzda'])
  res.json({ id: lastID, qr_kodu: qr, fiyat: priceInfo.toplam, fiyat_detay: priceInfo })
}))

app.get('/api/plus/is', partnerAuth, wrap(async (req, res) => {
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

app.put('/api/plus/is/:id/iptal', partnerAuth, wrap(async (req, res) => {
  const is = await get('SELECT * FROM plus_isler WHERE id=? AND partner_id=?', [req.params.id, req.partner.id])
  if (!is) return res.status(404).json({ message: 'İş bulunamadı' })
  if (is.durum !== 'Havuzda') return res.status(400).json({ message: 'Sadece havuzdaki işler iptal edilebilir' })
  await run(`UPDATE plus_isler SET durum='İptal', guncelleme=datetime('now','localtime') WHERE id=?`, [req.params.id])
  await run('INSERT INTO plus_hareketler (is_id,durum) VALUES (?,?)', [req.params.id,'İptal'])
  res.json({ success: true })
}))

// ── QR Code Image Endpoint (public) ──────────────────────────────────────────
app.get('/api/plus/qr/:qr_kodu', wrap(async (req, res) => {
  const qr_kodu = req.params.qr_kodu
  const is = await get('SELECT id FROM plus_isler WHERE qr_kodu=?', [qr_kodu])
  if (!is) return res.status(404).send('QR kod bulunamadı')
  const png = await QRCode.toBuffer(qr_kodu, { width: 300, margin: 2, errorCorrectionLevel: 'H' })
  res.set('Content-Type', 'image/png')
  res.set('Cache-Control', 'public, max-age=86400')
  res.send(png)
}))

// ── Partner Profile Endpoints ─────────────────────────────────────────────────
app.get('/api/plus/partner/profil', partnerAuth, wrap(async (req, res) => {
  const p = await get('SELECT * FROM plus_partnerler WHERE id=?', [req.partner.id])
  if (!p) return res.status(404).json({ message: 'Bulunamadı' })
  const { sifre_hash, ...profil } = p
  res.json(profil)
}))

app.put('/api/plus/partner/profil', partnerAuth, wrap(async (req, res) => {
  const { merkez_il, merkez_ilce, merkez_adres } = req.body
  await run(`UPDATE plus_partnerler SET merkez_il=?,merkez_ilce=?,merkez_adres=? WHERE id=?`,
    [merkez_il||null, merkez_ilce||null, merkez_adres||null, req.partner.id])
  res.json({ success: true })
}))

// ── Partner Alt Kullanıcı Endpoints ───────────────────────────────────────────
app.get('/api/plus/partner/alt-kullanicilar', partnerAuth, wrap(async (req, res) => {
  const list = await all(`
    SELECT a.*, COUNT(i.id) as is_sayisi
    FROM plus_alt_kullanicilar a
    LEFT JOIN plus_isler i ON i.alt_kullanici_id = a.id
    WHERE a.partner_id=?
    GROUP BY a.id
    ORDER BY a.olusturma DESC`, [req.partner.id])
  res.json(list)
}))

app.post('/api/plus/partner/alt-kullanicilar', partnerAuth, wrap(async (req, res) => {
  const { ad, unvan, email, sifre, telefon, il, ilce, mahalle, adres } = req.body
  if (!ad || !email || !sifre) return res.status(400).json({ message: 'Ad, email ve şifre zorunlu' })
  const hash = await bcrypt.hash(sifre, 10)
  const { lastID } = await run(`
    INSERT INTO plus_alt_kullanicilar (partner_id,ad,unvan,email,sifre_hash,telefon,il,ilce,mahalle,adres)
    VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [req.partner.id, ad, unvan||'Kullanıcı', email, hash,
     telefon||null, il||null, ilce||null, mahalle||null, adres||null])
  res.json({ id: lastID })
}))

app.put('/api/plus/partner/alt-kullanicilar/:id', partnerAuth, wrap(async (req, res) => {
  const existing = await get('SELECT * FROM plus_alt_kullanicilar WHERE id=? AND partner_id=?',
    [req.params.id, req.partner.id])
  if (!existing) return res.status(404).json({ message: 'Alt kullanıcı bulunamadı' })
  const { ad, unvan, email, sifre, telefon, il, ilce, mahalle, adres, aktif } = req.body
  if (sifre) {
    const hash = await bcrypt.hash(sifre, 10)
    await run(`UPDATE plus_alt_kullanicilar
               SET ad=?,unvan=?,email=?,sifre_hash=?,telefon=?,il=?,ilce=?,mahalle=?,adres=?,aktif=?
               WHERE id=? AND partner_id=?`,
      [ad, unvan||'Kullanıcı', email, hash, telefon||null,
       il||null, ilce||null, mahalle||null, adres||null, aktif??1,
       req.params.id, req.partner.id])
  } else {
    await run(`UPDATE plus_alt_kullanicilar
               SET ad=?,unvan=?,email=?,telefon=?,il=?,ilce=?,mahalle=?,adres=?,aktif=?
               WHERE id=? AND partner_id=?`,
      [ad, unvan||'Kullanıcı', email, telefon||null,
       il||null, ilce||null, mahalle||null, adres||null, aktif??1,
       req.params.id, req.partner.id])
  }
  res.json({ success: true })
}))

// ── Alt Kullanıcı Auth & Endpoints ────────────────────────────────────────────
app.post('/api/plus/alt/login', wrap(async (req, res) => {
  const { email, sifre } = req.body || {}
  if (!email || !sifre) return res.status(400).json({ message: 'Email ve şifre gerekli' })
  const a = await get(`
    SELECT ak.*, p.firma_adi, p.merkez_il, p.merkez_ilce, p.merkez_adres
    FROM plus_alt_kullanicilar ak
    JOIN plus_partnerler p ON p.id = ak.partner_id
    WHERE ak.email=? AND ak.aktif=1`, [email])
  if (!a || !bcrypt.compareSync(sifre, a.sifre_hash))
    return res.status(401).json({ message: 'Geçersiz email veya şifre' })
  const token = jwt.sign(
    { id: a.id, email: a.email, ad: a.ad, partner_id: a.partner_id, firma_adi: a.firma_adi, type: 'plus_alt' },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
  res.json({ token })
}))

app.get('/api/plus/alt/me', altAuth, wrap(async (req, res) => {
  const a = await get(`
    SELECT ak.id, ak.ad, ak.unvan, ak.email, ak.telefon, ak.il, ak.ilce, ak.mahalle, ak.adres,
           ak.aktif, ak.olusturma,
           p.firma_adi, p.merkez_il, p.merkez_ilce, p.merkez_adres
    FROM plus_alt_kullanicilar ak
    JOIN plus_partnerler p ON p.id = ak.partner_id
    WHERE ak.id=?`, [req.alt.id])
  if (!a) return res.status(404).json({ message: 'Bulunamadı' })
  res.json(a)
}))

app.post('/api/plus/alt/is', altAuth, wrap(async (req, res) => {
  // Load alt kullanıcı with partner info
  const a = await get(`
    SELECT ak.*, p.firma_adi, p.merkez_il, p.merkez_ilce, p.merkez_adres
    FROM plus_alt_kullanicilar ak
    JOIN plus_partnerler p ON p.id = ak.partner_id
    WHERE ak.id=?`, [req.alt.id])
  if (!a) return res.status(404).json({ message: 'Kullanıcı bulunamadı' })

  if (!a.adres || !a.il || !a.ilce)
    return res.status(400).json({ message: 'Profil adres bilgileriniz eksik. Lütfen profilinizi güncelleyin.' })
  if (!a.merkez_adres || !a.merkez_il || !a.merkez_ilce)
    return res.status(400).json({ message: 'Partner merkez adresi tanımlı değil. Lütfen yöneticinizle iletişime geçin.' })

  const { paket_boyutu, aciklama, alinma_saati } = req.body
  if (!paket_boyutu) return res.status(400).json({ message: 'Paket boyutu gerekli' })

  const alis_il      = a.il
  const alis_ilce    = a.ilce
  const alis_mahalle = a.mahalle || null
  const alis_adres   = a.adres
  const birakilis_il    = a.merkez_il
  const birakilis_ilce  = a.merkez_ilce
  const birakilis_adres = a.merkez_adres

  const priceInfo = await calculatePrice(alis_il, alis_ilce, alis_mahalle, 'adres_toplama', paket_boyutu)

  const effectiveAlinmaSaati = alinma_saati || new Date().toISOString().slice(0, 16).replace('T', ' ')
  const qr = `PLU-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`
  const { lastID } = await run(`
    INSERT INTO plus_isler
    (partner_id,alt_kullanici_id,qr_kodu,is_turu,
     alis_il,alis_ilce,alis_mahalle,alis_adres,
     birakilis_il,birakilis_ilce,birakilis_adres,
     gonderici_ad,gonderici_telefon,alici_ad,alici_telefon,
     paket_boyutu,aciklama,alinma_saati,fiyat,fiyat_detay,kdv_orani,kdv_tutari)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [a.partner_id, a.id, qr, 'adres_toplama',
     alis_il, alis_ilce, alis_mahalle, alis_adres,
     birakilis_il, birakilis_ilce, birakilis_adres,
     a.ad, a.telefon || '',
     a.firma_adi, '',
     paket_boyutu, aciklama||null, effectiveAlinmaSaati,
     priceInfo.toplam, JSON.stringify(priceInfo), priceInfo.kdv_orani, priceInfo.kdv_tutari])
  await run('INSERT INTO plus_hareketler (is_id,durum) VALUES (?,?)', [lastID, 'Havuzda'])
  res.json({ id: lastID, qr_kodu: qr, fiyat: priceInfo.toplam, fiyat_detay: priceInfo })
}))

app.get('/api/plus/alt/islerim', altAuth, wrap(async (req, res) => {
  const data = await all(`
    SELECT i.*, p.firma_adi as partner_firma, t.ad as tasiyici_ad
    FROM plus_isler i
    LEFT JOIN plus_partnerler p ON p.id = i.partner_id
    LEFT JOIN plus_tasiyicilar t ON t.id = i.tasiyici_id
    WHERE i.alt_kullanici_id=?
    ORDER BY i.olusturma DESC`, [req.alt.id])
  res.json(data)
}))

// ── Taşıyıcı Endpoints ────────────────────────────────────────────────────────
app.post('/api/plus/tasiyici/login', wrap(async (req, res) => {
  const { email, sifre } = req.body || {}
  if (!email || !sifre) return res.status(400).json({ message: 'Email ve şifre gerekli' })
  const t = await get('SELECT * FROM plus_tasiyicilar WHERE email=? AND aktif=1', [email])
  if (!t || !bcrypt.compareSync(sifre, t.sifre_hash))
    return res.status(401).json({ message: 'Geçersiz email veya şifre' })
  const token = jwt.sign({ id: t.id, email: t.email, ad: t.ad, type: 'plus_tasiyici' }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
}))

app.get('/api/plus/tasiyici/me', tasiyiciAuth, wrap(async (req, res) => {
  const t = await get('SELECT id,ad,email,telefon,arac_tipi,aktif FROM plus_tasiyicilar WHERE id=?', [req.tasiyici.id])
  if (!t) return res.status(404).json({ message: 'Bulunamadı' })
  res.json(t)
}))

app.get('/api/plus/havuz', tasiyiciAuth, wrap(async (req, res) => {
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

app.put('/api/plus/havuz/:id/al', tasiyiciAuth, wrap(async (req, res) => {
  const is = await get('SELECT * FROM plus_isler WHERE id=? AND durum=?', [req.params.id,'Havuzda'])
  if (!is) return res.status(400).json({ message: 'Bu iş artık mevcut değil' })
  await run(`UPDATE plus_isler SET durum='Alındı', tasiyici_id=?, guncelleme=datetime('now','localtime') WHERE id=?`,
    [req.tasiyici.id, req.params.id])
  await run('INSERT INTO plus_hareketler (is_id,durum) VALUES (?,?)', [req.params.id,'Alındı'])
  res.json({ success: true })
}))

app.put('/api/plus/is/:id/yolda', tasiyiciAuth, wrap(async (req, res) => {
  const is = await get('SELECT * FROM plus_isler WHERE id=? AND tasiyici_id=? AND durum=?',
    [req.params.id, req.tasiyici.id, 'Alındı'])
  if (!is) return res.status(400).json({ message: 'Geçersiz işlem' })
  await run(`UPDATE plus_isler SET durum='Yolda', guncelleme=datetime('now','localtime') WHERE id=?`, [req.params.id])
  await run('INSERT INTO plus_hareketler (is_id,durum) VALUES (?,?)', [req.params.id,'Yolda'])
  res.json({ success: true })
}))

app.put('/api/plus/is/:id/teslim', tasiyiciAuth, wrap(async (req, res) => {
  const is = await get('SELECT * FROM plus_isler WHERE id=? AND tasiyici_id=? AND durum=?',
    [req.params.id, req.tasiyici.id, 'Yolda'])
  if (!is) return res.status(400).json({ message: 'Geçersiz işlem' })
  await run(`UPDATE plus_isler SET durum='Teslim Edildi', guncelleme=datetime('now','localtime') WHERE id=?`, [req.params.id])
  await run('INSERT INTO plus_hareketler (is_id,durum) VALUES (?,?)', [req.params.id,'Teslim Edildi'])
  res.json({ success: true })
}))

app.get('/api/plus/tasiyici/islerim', tasiyiciAuth, wrap(async (req, res) => {
  const data = await all(`SELECT i.*, p.firma_adi as partner_firma
    FROM plus_isler i
    LEFT JOIN plus_partnerler p ON p.id=i.partner_id
    WHERE i.tasiyici_id=? AND i.durum IN ('Alındı','Yolda')
    ORDER BY i.guncelleme DESC`, [req.tasiyici.id])
  res.json(data)
}))

// ── Taşıyıcı QR Scan Endpoints ────────────────────────────────────────────────
app.get('/api/plus/tasiyici/is-by-qr/:qr_kodu', tasiyiciAuth, wrap(async (req, res) => {
  const is = await get(`SELECT i.*, p.firma_adi as partner_firma, t.ad as tasiyici_ad
    FROM plus_isler i LEFT JOIN plus_partnerler p ON p.id=i.partner_id
    LEFT JOIN plus_tasiyicilar t ON t.id=i.tasiyici_id
    WHERE i.qr_kodu=?`, [req.params.qr_kodu])
  if (!is) return res.status(404).json({ message: 'Bu QR koda ait iş bulunamadı' })
  res.json(is)
}))

app.post('/api/plus/tasiyici/qr-tara', tasiyiciAuth, wrap(async (req, res) => {
  const { qr_kodu, aksiyon } = req.body
  if (!qr_kodu || !aksiyon) return res.status(400).json({ message: 'QR kod ve aksiyon gerekli' })
  const is = await get(`SELECT i.*, p.firma_adi as partner_firma
    FROM plus_isler i LEFT JOIN plus_partnerler p ON p.id=i.partner_id
    WHERE i.qr_kodu=?`, [qr_kodu])
  if (!is) return res.status(404).json({ message: 'Bu QR koda ait iş bulunamadı' })

  if (aksiyon === 'al') {
    if (is.durum !== 'Havuzda') return res.status(400).json({ message: `İş "${is.durum}" durumunda, alınamaz` })
    await run(`UPDATE plus_isler SET durum='Alındı', tasiyici_id=?, guncelleme=datetime('now','localtime') WHERE id=?`, [req.tasiyici.id, is.id])
    await run('INSERT INTO plus_hareketler (is_id,durum,notlar) VALUES (?,?,?)', [is.id,'Alındı','QR kod ile alındı'])
    return res.json({ success: true, yeni_durum: 'Alındı', is })
  }
  if (aksiyon === 'yolda') {
    if (is.durum !== 'Alındı' || is.tasiyici_id !== req.tasiyici.id)
      return res.status(400).json({ message: 'Bu işlem için yetkiniz yok' })
    await run(`UPDATE plus_isler SET durum='Yolda', guncelleme=datetime('now','localtime') WHERE id=?`, [is.id])
    await run('INSERT INTO plus_hareketler (is_id,durum,notlar) VALUES (?,?,?)', [is.id,'Yolda','QR kod ile yola çıkıldı'])
    return res.json({ success: true, yeni_durum: 'Yolda', is })
  }
  if (aksiyon === 'teslim') {
    if (is.durum !== 'Yolda' || is.tasiyici_id !== req.tasiyici.id)
      return res.status(400).json({ message: 'Bu işlem için yetkiniz yok' })
    await run(`UPDATE plus_isler SET durum='Teslim Edildi', guncelleme=datetime('now','localtime') WHERE id=?`, [is.id])
    await run('INSERT INTO plus_hareketler (is_id,durum,notlar) VALUES (?,?,?)', [is.id,'Teslim Edildi','QR kod ile teslim edildi'])
    return res.json({ success: true, yeni_durum: 'Teslim Edildi', is })
  }
  return res.status(400).json({ message: 'Geçersiz aksiyon: al, yolda veya teslim olmalı' })
}))

// ── Admin Endpoints ───────────────────────────────────────────────────────────
app.post('/api/plus/admin/login', wrap(async (req, res) => {
  const { email, sifre } = req.body || {}
  const a = await get('SELECT * FROM plus_adminler WHERE email=? AND aktif=1', [email])
  if (!a || !bcrypt.compareSync(sifre, a.sifre_hash))
    return res.status(401).json({ message: 'Geçersiz email veya şifre' })
  const token = jwt.sign({ id: a.id, email: a.email, ad: a.ad, tip: a.tip || 'admin', type: 'plus_admin' }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
}))

app.get('/api/plus/admin/me', adminAuth, wrap(async (req, res) => {
  res.json(await get('SELECT id,ad,email,tip FROM plus_adminler WHERE id=?', [req.admin.id]))
}))

app.get('/api/plus/admin/stats', adminAuth, wrap(async (req, res) => {
  const [partners, tasiyicilar, isler, havuzda, gelir, altKullanicilar] = await Promise.all([
    get('SELECT COUNT(*) as c FROM plus_partnerler WHERE aktif=1'),
    get('SELECT COUNT(*) as c FROM plus_tasiyicilar WHERE aktif=1'),
    get('SELECT COUNT(*) as c FROM plus_isler'),
    get("SELECT COUNT(*) as c FROM plus_isler WHERE durum='Havuzda'"),
    get("SELECT COALESCE(SUM(fiyat),0) as toplam FROM plus_isler WHERE durum='Teslim Edildi'"),
    get('SELECT COUNT(*) as c FROM plus_alt_kullanicilar WHERE aktif=1'),
  ])
  res.json({
    partners: partners.c,
    tasiyicilar: tasiyicilar.c,
    isler: isler.c,
    havuzda: havuzda.c,
    gelir: gelir.toplam,
    alt_kullanicilar: altKullanicilar.c,
  })
}))

app.get('/api/plus/admin/partnerler', adminAuth, wrap(async (req, res) => {
  const list = await all(`SELECT p.*,
    COALESCE(SUM(CASE WHEN i.durum!='İptal' THEN i.fiyat ELSE 0 END),0) as toplam_borc,
    COALESCE((SELECT SUM(o.miktar) FROM plus_odemeler o WHERE o.partner_id=p.id),0) as toplam_odendi
    FROM plus_partnerler p LEFT JOIN plus_isler i ON i.partner_id=p.id
    GROUP BY p.id ORDER BY p.olusturma DESC`)
  res.json(list.map(p => ({ ...p, kalan_borc: +(p.toplam_borc - p.toplam_odendi).toFixed(2) })))
}))

app.post('/api/plus/admin/partnerler', adminAuth, wrap(async (req, res) => {
  const { firma_adi, yetkili_ad, email, sifre, telefon, merkez_il, merkez_ilce, merkez_adres } = req.body
  if (!firma_adi || !yetkili_ad || !email || !sifre) return res.status(400).json({ message: 'Zorunlu alanlar eksik' })
  const hash = await bcrypt.hash(sifre, 10)
  const { lastID } = await run(
    `INSERT INTO plus_partnerler (firma_adi,yetkili_ad,email,sifre_hash,telefon,merkez_il,merkez_ilce,merkez_adres) VALUES (?,?,?,?,?,?,?,?)`,
    [firma_adi, yetkili_ad, email, hash, telefon||null, merkez_il||null, merkez_ilce||null, merkez_adres||null])
  res.json({ id: lastID })
}))

app.put('/api/plus/admin/partnerler/:id', adminAuth, wrap(async (req, res) => {
  const { firma_adi, yetkili_ad, email, sifre, telefon, aktif, merkez_il, merkez_ilce, merkez_adres } = req.body
  if (sifre) {
    const hash = await bcrypt.hash(sifre, 10)
    await run(
      `UPDATE plus_partnerler SET firma_adi=?,yetkili_ad=?,email=?,sifre_hash=?,telefon=?,aktif=?,merkez_il=?,merkez_ilce=?,merkez_adres=? WHERE id=?`,
      [firma_adi, yetkili_ad, email, hash, telefon||null, aktif??1, merkez_il||null, merkez_ilce||null, merkez_adres||null, req.params.id])
  } else {
    await run(
      `UPDATE plus_partnerler SET firma_adi=?,yetkili_ad=?,email=?,telefon=?,aktif=?,merkez_il=?,merkez_ilce=?,merkez_adres=? WHERE id=?`,
      [firma_adi, yetkili_ad, email, telefon||null, aktif??1, merkez_il||null, merkez_ilce||null, merkez_adres||null, req.params.id])
  }
  res.json({ success: true })
}))

app.delete('/api/plus/admin/partnerler/:id', adminAuth, wrap(async (req, res) => {
  await run('UPDATE plus_partnerler SET aktif=0 WHERE id=?', [req.params.id])
  res.json({ success: true })
}))

app.get('/api/plus/admin/tasiyicilar', adminAuth, wrap(async (req, res) => {
  res.json(await all('SELECT * FROM plus_tasiyicilar ORDER BY olusturma DESC'))
}))

app.post('/api/plus/admin/tasiyicilar', adminAuth, wrap(async (req, res) => {
  const { ad, email, sifre, telefon, arac_tipi } = req.body
  if (!ad || !email || !sifre) return res.status(400).json({ message: 'Zorunlu alanlar eksik' })
  const hash = await bcrypt.hash(sifre, 10)
  const { lastID } = await run(`INSERT INTO plus_tasiyicilar (ad,email,sifre_hash,telefon,arac_tipi) VALUES (?,?,?,?,?)`,
    [ad, email, hash, telefon||null, arac_tipi||'Motosiklet'])
  res.json({ id: lastID })
}))

app.put('/api/plus/admin/tasiyicilar/:id', adminAuth, wrap(async (req, res) => {
  const { ad, email, sifre, telefon, arac_tipi, aktif } = req.body
  if (sifre) {
    const hash = await bcrypt.hash(sifre, 10)
    await run(`UPDATE plus_tasiyicilar SET ad=?,email=?,sifre_hash=?,telefon=?,arac_tipi=?,aktif=? WHERE id=?`,
      [ad, email, hash, telefon||null, arac_tipi||'Motosiklet', aktif??1, req.params.id])
  } else {
    await run(`UPDATE plus_tasiyicilar SET ad=?,email=?,telefon=?,arac_tipi=?,aktif=? WHERE id=?`,
      [ad, email, telefon||null, arac_tipi||'Motosiklet', aktif??1, req.params.id])
  }
  res.json({ success: true })
}))

app.delete('/api/plus/admin/tasiyicilar/:id', adminAuth, wrap(async (req, res) => {
  await run('UPDATE plus_tasiyicilar SET aktif=0 WHERE id=?', [req.params.id])
  res.json({ success: true })
}))

app.get('/api/plus/admin/isler', adminAuth, wrap(async (req, res) => {
  const { durum, partner_id } = req.query
  let q = `SELECT i.*, p.firma_adi as partner_firma, t.ad as tasiyici_ad
    FROM plus_isler i LEFT JOIN plus_partnerler p ON p.id=i.partner_id
    LEFT JOIN plus_tasiyicilar t ON t.id=i.tasiyici_id WHERE 1=1`
  const params = []
  if (durum) { q += ' AND i.durum=?'; params.push(durum) }
  if (partner_id) { q += ' AND i.partner_id=?'; params.push(partner_id) }
  q += ' ORDER BY i.olusturma DESC LIMIT 300'
  res.json(await all(q, params))
}))

app.put('/api/plus/admin/is/:id/ata', adminAuth, wrap(async (req, res) => {
  const { tasiyici_id } = req.body
  if (!tasiyici_id) return res.status(400).json({ message: 'Taşıyıcı seçin' })
  const is = await get("SELECT * FROM plus_isler WHERE id=? AND durum='Havuzda'", [req.params.id])
  if (!is) return res.status(400).json({ message: 'Bu iş atanabilir durumda değil' })
  await run(`UPDATE plus_isler SET tasiyici_id=?,durum='Alındı',guncelleme=datetime('now','localtime') WHERE id=?`,
    [tasiyici_id, req.params.id])
  await run('INSERT INTO plus_hareketler (is_id,durum,notlar) VALUES (?,?,?)',
    [req.params.id,'Alındı','Admin tarafından atandı'])
  res.json({ success: true })
}))

app.put('/api/plus/admin/is/:id/fiyat', adminAuth, wrap(async (req, res) => {
  await run('UPDATE plus_isler SET fiyat=? WHERE id=?', [req.body.fiyat, req.params.id])
  res.json({ success: true })
}))

app.get('/api/plus/admin/fiyatlar', adminAuth, wrap(async (req, res) => {
  res.json(await all('SELECT * FROM plus_fiyatlar ORDER BY tur,il,ilce,mahalle'))
}))

app.post('/api/plus/admin/fiyatlar', adminAuth, wrap(async (req, res) => {
  const { il, ilce, mahalle, fiyat, tur } = req.body
  if (!il || !fiyat) return res.status(400).json({ message: 'İl ve fiyat zorunlu' })
  const { lastID } = await run(`INSERT INTO plus_fiyatlar (il,ilce,mahalle,fiyat,tur) VALUES (?,?,?,?,?)`,
    [il, ilce||null, mahalle||null, fiyat, tur||'adres_dagitim'])
  res.json({ id: lastID })
}))

app.put('/api/plus/admin/fiyatlar/:id', adminAuth, wrap(async (req, res) => {
  const { il, ilce, mahalle, fiyat, aktif, tur } = req.body
  await run('UPDATE plus_fiyatlar SET il=?,ilce=?,mahalle=?,fiyat=?,aktif=?,tur=? WHERE id=?',
    [il, ilce||null, mahalle||null, fiyat, aktif??1, tur||'adres_dagitim', req.params.id])
  res.json({ success: true })
}))

app.delete('/api/plus/admin/fiyatlar/:id', adminAuth, wrap(async (req, res) => {
  await run('DELETE FROM plus_fiyatlar WHERE id=?', [req.params.id])
  res.json({ success: true })
}))

app.get('/api/plus/admin/borclar', adminAuth, wrap(async (req, res) => {
  const list = await all(`SELECT p.id,p.firma_adi,p.yetkili_ad,p.telefon,p.email,
    COALESCE(SUM(CASE WHEN i.durum!='İptal' THEN i.fiyat ELSE 0 END),0) as toplam_borc,
    COALESCE((SELECT SUM(o.miktar) FROM plus_odemeler o WHERE o.partner_id=p.id),0) as toplam_odendi,
    COUNT(CASE WHEN i.durum='Havuzda' THEN 1 END) as havuzda,
    COUNT(CASE WHEN i.durum IN ('Alındı','Yolda') THEN 1 END) as aktif,
    COUNT(CASE WHEN i.durum='Teslim Edildi' THEN 1 END) as tamamlandi
    FROM plus_partnerler p LEFT JOIN plus_isler i ON i.partner_id=p.id
    WHERE p.aktif=1 GROUP BY p.id ORDER BY toplam_borc DESC`)
  res.json(list.map(p => ({ ...p, kalan_borc: +(p.toplam_borc - p.toplam_odendi).toFixed(2) })))
}))

app.post('/api/plus/admin/borclar/:partner_id/ode', adminAuth, wrap(async (req, res) => {
  const { miktar, aciklama } = req.body
  if (!miktar || miktar <= 0) return res.status(400).json({ message: 'Geçerli miktar girin' })
  await run('INSERT INTO plus_odemeler (partner_id,miktar,aciklama) VALUES (?,?,?)',
    [req.params.partner_id, miktar, aciklama||null])
  res.json({ success: true })
}))

app.get('/api/plus/admin/borclar/:partner_id/detay', adminAuth, wrap(async (req, res) => {
  const isler = await all(`SELECT i.*,t.ad as tasiyici_ad FROM plus_isler i
    LEFT JOIN plus_tasiyicilar t ON t.id=i.tasiyici_id
    WHERE i.partner_id=? AND i.durum!='İptal' ORDER BY i.olusturma DESC`, [req.params.partner_id])
  const odemeler = await all('SELECT * FROM plus_odemeler WHERE partner_id=? ORDER BY tarih DESC', [req.params.partner_id])
  res.json({ isler, odemeler })
}))

// ── Admin Ayarlar Endpoints ───────────────────────────────────────────────────
app.get('/api/plus/admin/ayarlar', adminAuth, wrap(async (req, res) => {
  res.json(await all('SELECT * FROM plus_ayarlar ORDER BY anahtar'))
}))

app.put('/api/plus/admin/ayarlar/:anahtar', adminAuth, wrap(async (req, res) => {
  const { deger } = req.body
  if (deger === undefined) return res.status(400).json({ message: 'Değer gerekli' })
  await run('INSERT OR REPLACE INTO plus_ayarlar (anahtar,deger,aciklama) VALUES (?,?,COALESCE((SELECT aciklama FROM plus_ayarlar WHERE anahtar=?),?))',
    [req.params.anahtar, deger, req.params.anahtar, null])
  res.json({ success: true })
}))

// ── Admin Kullanıcı Yönetimi (Süper Admin) ────────────────────────────────────
app.get('/api/plus/admin/adminler', superAdminAuth, wrap(async (req, res) => {
  res.json(await all('SELECT id,ad,email,tip,aktif,olusturma FROM plus_adminler ORDER BY olusturma'))
}))

app.post('/api/plus/admin/adminler', superAdminAuth, wrap(async (req, res) => {
  const { ad, email, sifre, tip } = req.body
  if (!ad || !email || !sifre) return res.status(400).json({ message: 'Ad, email ve şifre zorunlu' })
  const hash = await bcrypt.hash(sifre, 10)
  const { lastID } = await run(`INSERT INTO plus_adminler (ad,email,sifre_hash,tip) VALUES (?,?,?,?)`,
    [ad, email, hash, tip||'admin'])
  res.json({ id: lastID })
}))

app.put('/api/plus/admin/adminler/:id', superAdminAuth, wrap(async (req, res) => {
  const { ad, email, sifre, tip, aktif } = req.body
  if (sifre) {
    const hash = await bcrypt.hash(sifre, 10)
    await run('UPDATE plus_adminler SET ad=?,email=?,sifre_hash=?,tip=?,aktif=? WHERE id=?',
      [ad, email, hash, tip||'admin', aktif??1, req.params.id])
  } else {
    await run('UPDATE plus_adminler SET ad=?,email=?,tip=?,aktif=? WHERE id=?',
      [ad, email, tip||'admin', aktif??1, req.params.id])
  }
  res.json({ success: true })
}))

app.delete('/api/plus/admin/adminler/:id', superAdminAuth, wrap(async (req, res) => {
  if (req.params.id == req.admin.id) return res.status(400).json({ message: 'Kendinizi silemezsiniz' })
  await run('UPDATE plus_adminler SET aktif=0 WHERE id=?', [req.params.id])
  res.json({ success: true })
}))

// ── Admin Alt Kullanıcı Endpoints ─────────────────────────────────────────────
app.get('/api/plus/admin/alt-kullanicilar', adminAuth, wrap(async (req, res) => {
  const list = await all(`
    SELECT ak.*, p.firma_adi
    FROM plus_alt_kullanicilar ak
    JOIN plus_partnerler p ON p.id = ak.partner_id
    ORDER BY ak.olusturma DESC`)
  res.json(list)
}))

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.message)
  res.status(500).json({ message: 'Sunucu hatası' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
initDb().then(() =>
  app.listen(PORT, () => console.log(`Paketçiniz Plus Backend → http://localhost:${PORT}`))
)
