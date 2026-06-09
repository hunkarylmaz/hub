'use strict';

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'birtiklaeimza.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  // ── Users ────────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT NOT NULL UNIQUE,
      email       TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ── Products ─────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      slug        TEXT NOT NULL UNIQUE,
      short_desc  TEXT,
      description TEXT,
      price       REAL NOT NULL DEFAULT 0,
      old_price   REAL,
      category    TEXT,
      features    TEXT DEFAULT '[]',
      badge       TEXT,
      badge_color TEXT DEFAULT 'blue',
      icon        TEXT,
      image       TEXT,
      order_num   INTEGER DEFAULT 0,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ── Pricing Plans ─────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS pricing_plans (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      price       REAL NOT NULL DEFAULT 0,
      old_price   REAL,
      period      TEXT DEFAULT 'yıl',
      features    TEXT DEFAULT '[]',
      popular     INTEGER NOT NULL DEFAULT 0,
      color       TEXT DEFAULT 'blue',
      order_num   INTEGER DEFAULT 0,
      active      INTEGER NOT NULL DEFAULT 1
    )
  `);

  // ── Site Content ──────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_content (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT NOT NULL,
      content_key TEXT NOT NULL,
      value       TEXT,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(section_key, content_key)
    )
  `);

  // ── Contacts ──────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      phone      TEXT,
      subject    TEXT,
      message    TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','read','replied')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ── Orders ────────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      email        TEXT NOT NULL,
      phone        TEXT NOT NULL,
      company      TEXT,
      product_id   INTEGER,
      product_name TEXT,
      notes        TEXT,
      status       TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','processing','completed','cancelled')),
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ── Testimonials ──────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL,
      company   TEXT,
      position  TEXT,
      text      TEXT NOT NULL,
      rating    INTEGER NOT NULL DEFAULT 5 CHECK(rating BETWEEN 1 AND 5),
      avatar    TEXT,
      active    INTEGER NOT NULL DEFAULT 1,
      order_num INTEGER DEFAULT 0
    )
  `);

  // ── FAQ ───────────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS faq (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      question  TEXT NOT NULL,
      answer    TEXT NOT NULL,
      category  TEXT DEFAULT 'genel',
      order_num INTEGER DEFAULT 0,
      active    INTEGER NOT NULL DEFAULT 1
    )
  `);

  // ── Settings ──────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      key        TEXT NOT NULL UNIQUE,
      value      TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ── Announcements ─────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      text      TEXT NOT NULL,
      color     TEXT DEFAULT 'blue',
      active    INTEGER NOT NULL DEFAULT 1,
      order_num INTEGER DEFAULT 0
    )
  `);

  seedDatabase(db);
  return db;
}

function seedDatabase(db) {
  // ── Admin User ────────────────────────────────────────────────────────────
  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('Admin123!', 10);
    db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('admin', 'admin@birtiklaeimza.com', hash, 'admin');
    console.log('[DB] Admin kullanıcısı oluşturuldu.');
  }

  // ── Products ──────────────────────────────────────────────────────────────
  const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  if (productCount === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products
        (name, slug, short_desc, description, price, old_price, category, features, badge, badge_color, icon, order_num, active)
      VALUES
        (@name, @slug, @short_desc, @description, @price, @old_price, @category, @features, @badge, @badge_color, @icon, @order_num, @active)
    `);

    const products = [
      {
        name: 'Bireysel e-İmza (1 Yıl)',
        slug: 'bireysel-e-imza-1-yil',
        short_desc: 'Bireyler için 1 yıl geçerli nitelikli elektronik imza',
        description: 'Bireysel kullanım için tasarlanmış, 1 yıl geçerlilik süresine sahip nitelikli elektronik imza sertifikası. Tüm resmi belgelerinizi, sözleşmelerinizi ve devlet işlemlerinizi güvenle imzalayın. USB token ile teslim edilir.',
        price: 490,
        old_price: 650,
        category: 'bireysel',
        features: JSON.stringify([
          '1 Yıl Geçerlilik Süresi',
          'Nitelikli Elektronik İmza',
          'USB Token Dahil',
          'Ücretsiz Kurulum Desteği',
          'e-Devlet Uyumlu',
          'Tüm İşletim Sistemleri Desteklenir'
        ]),
        badge: 'Popüler',
        badge_color: 'blue',
        icon: 'signature',
        order_num: 1,
        active: 1
      },
      {
        name: 'Bireysel e-İmza (3 Yıl)',
        slug: 'bireysel-e-imza-3-yil',
        short_desc: 'Bireyler için 3 yıl geçerli nitelikli elektronik imza',
        description: 'Bireysel kullanım için tasarlanmış, 3 yıl geçerlilik süresine sahip nitelikli elektronik imza sertifikası. Uzun vadeli kullanım için en ekonomik seçenek. USB token ile teslim edilir.',
        price: 990,
        old_price: 1350,
        category: 'bireysel',
        features: JSON.stringify([
          '3 Yıl Geçerlilik Süresi',
          'Nitelikli Elektronik İmza',
          'USB Token Dahil',
          'Ücretsiz Kurulum Desteği',
          'e-Devlet Uyumlu',
          'Tüm İşletim Sistemleri Desteklenir',
          'Uzun Vadede Tasarruf'
        ]),
        badge: 'En Avantajlı',
        badge_color: 'green',
        icon: 'signature',
        order_num: 2,
        active: 1
      },
      {
        name: 'Kurumsal e-İmza (1 Yıl)',
        slug: 'kurumsal-e-imza-1-yil',
        short_desc: 'Kurumlar için 1 yıl geçerli nitelikli elektronik imza',
        description: 'Şirket çalışanları ve kurumlar için özel olarak tasarlanmış, 1 yıl geçerlilik süresine sahip nitelikli elektronik imza sertifikası. Kurumsal unvan bilgisi sertifikaya eklenir.',
        price: 590,
        old_price: 750,
        category: 'kurumsal',
        features: JSON.stringify([
          '1 Yıl Geçerlilik Süresi',
          'Kurumsal Ünvan Bilgisi',
          'Nitelikli Elektronik İmza',
          'USB Token Dahil',
          'Ücretsiz Kurulum Desteği',
          'e-Devlet & EKAP Uyumlu',
          'İhale İmzalama Desteği'
        ]),
        badge: null,
        badge_color: 'blue',
        icon: 'building',
        order_num: 3,
        active: 1
      },
      {
        name: 'Kurumsal e-İmza (3 Yıl)',
        slug: 'kurumsal-e-imza-3-yil',
        short_desc: 'Kurumlar için 3 yıl geçerli nitelikli elektronik imza',
        description: 'Şirket çalışanları ve kurumlar için özel olarak tasarlanmış, 3 yıl geçerlilik süresine sahip nitelikli elektronik imza sertifikası. Uzun vadeli kurumsal kullanım için ideal.',
        price: 1190,
        old_price: 1600,
        category: 'kurumsal',
        features: JSON.stringify([
          '3 Yıl Geçerlilik Süresi',
          'Kurumsal Ünvan Bilgisi',
          'Nitelikli Elektronik İmza',
          'USB Token Dahil',
          'Ücretsiz Kurulum Desteği',
          'e-Devlet & EKAP Uyumlu',
          'İhale İmzalama Desteği',
          'Uzun Vadede Tasarruf'
        ]),
        badge: 'En Avantajlı',
        badge_color: 'green',
        icon: 'building',
        order_num: 4,
        active: 1
      },
      {
        name: 'Mali Mühür',
        slug: 'mali-muhur',
        short_desc: 'Tüzel kişiler için zorunlu mali mühür sertifikası',
        description: 'Tüzel kişiler (şirketler, vakıflar, dernekler vb.) için Gelir İdaresi Başkanlığı gerekliliklerini karşılayan mali mühür sertifikası. e-Fatura, e-Arşiv ve e-Defter uygulamalarında zorunludur.',
        price: 890,
        old_price: 1100,
        category: 'mali-muhur',
        features: JSON.stringify([
          '3 Yıl Geçerlilik Süresi',
          'GİB Onaylı',
          'e-Fatura Uyumlu',
          'e-Arşiv Uyumlu',
          'e-Defter Uyumlu',
          'Hızlı Teslimat',
          'Kurulum Desteği'
        ]),
        badge: 'Zorunlu',
        badge_color: 'red',
        icon: 'stamp',
        order_num: 5,
        active: 1
      },
      {
        name: 'e-İmza Yenileme',
        slug: 'e-imza-yenileme',
        short_desc: 'Mevcut e-imzanızı uygun fiyatla yenileyin',
        description: 'Süresi dolmuş veya dolmak üzere olan elektronik imza sertifikanızı uygun fiyatla yenileyin. Mevcut USB tokeninizi kullanmaya devam edebilirsiniz. Kesintisiz hizmet için zamanında yenileyin.',
        price: 390,
        old_price: 490,
        category: 'yenileme',
        features: JSON.stringify([
          'Mevcut Token ile Uyumlu',
          'Hızlı Aktivasyon',
          '1 veya 3 Yıl Seçeneği',
          'Online Yenileme İmkânı',
          'Ücretsiz Teknik Destek',
          'Kesintisiz Hizmet'
        ]),
        badge: 'Fırsatlı Fiyat',
        badge_color: 'orange',
        icon: 'refresh',
        order_num: 6,
        active: 1
      }
    ];

    for (const p of products) {
      insertProduct.run(p);
    }
    console.log('[DB] Ürünler oluşturuldu.');
  }

  // ── Pricing Plans ─────────────────────────────────────────────────────────
  const pricingCount = db.prepare('SELECT COUNT(*) as c FROM pricing_plans').get().c;
  if (pricingCount === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO pricing_plans
        (name, description, price, old_price, period, features, popular, color, order_num, active)
      VALUES
        (@name, @description, @price, @old_price, @period, @features, @popular, @color, @order_num, @active)
    `);

    const plans = [
      {
        name: 'Basic',
        description: 'Bireysel kullanım için ideal başlangıç paketi',
        price: 490,
        old_price: 650,
        period: 'yıl',
        features: JSON.stringify([
          'Bireysel e-İmza (1 Yıl)',
          'USB Token Dahil',
          'e-Devlet Uyumlu',
          'Ücretsiz Kurulum Desteği',
          'E-posta Destek'
        ]),
        popular: 0,
        color: 'blue',
        order_num: 1,
        active: 1
      },
      {
        name: 'Pro',
        description: 'Uzun vadeli kullanım için en çok tercih edilen paket',
        price: 990,
        old_price: 1350,
        period: '3 yıl',
        features: JSON.stringify([
          'Bireysel e-İmza (3 Yıl)',
          'USB Token Dahil',
          'e-Devlet Uyumlu',
          'Ücretsiz Kurulum Desteği',
          'Telefon & E-posta Destek',
          'Yenileme Hatırlatma Servisi',
          'Öncelikli Teslimat'
        ]),
        popular: 1,
        color: 'indigo',
        order_num: 2,
        active: 1
      },
      {
        name: 'Kurumsal',
        description: 'Şirketler ve kurumlar için kapsamlı çözüm',
        price: 1190,
        old_price: 1600,
        period: '3 yıl',
        features: JSON.stringify([
          'Kurumsal e-İmza (3 Yıl)',
          'Kurumsal Ünvan Bilgisi',
          'USB Token Dahil',
          'e-Devlet & EKAP Uyumlu',
          'İhale İmzalama Desteği',
          '7/24 Teknik Destek',
          'Toplu Satın Alma İndirimi',
          'Özel Kurumsal Fatura'
        ]),
        popular: 0,
        color: 'purple',
        order_num: 3,
        active: 1
      }
    ];

    for (const plan of plans) {
      insertPlan.run(plan);
    }
    console.log('[DB] Fiyatlandırma planları oluşturuldu.');
  }

  // ── Site Content ──────────────────────────────────────────────────────────
  const contentCount = db.prepare('SELECT COUNT(*) as c FROM site_content').get().c;
  if (contentCount === 0) {
    const insertContent = db.prepare(`
      INSERT INTO site_content (section_key, content_key, value)
      VALUES (@section_key, @content_key, @value)
    `);

    const contents = [
      // Hero section
      { section_key: 'hero', content_key: 'title', value: 'Bir Tıkla e-İmza' },
      { section_key: 'hero', content_key: 'subtitle', value: 'Güvenli, Hızlı ve Uygun Fiyatlı Elektronik İmza Çözümleri' },
      { section_key: 'hero', content_key: 'description', value: 'Türkiye\'nin güvenilir e-imza sağlayıcısı olarak bireysel ve kurumsal müşterilerimize hızlı, güvenli ve uygun fiyatlı elektronik imza hizmetleri sunuyoruz.' },
      { section_key: 'hero', content_key: 'cta_primary', value: 'Hemen Başvur' },
      { section_key: 'hero', content_key: 'cta_secondary', value: 'Ürünleri İncele' },
      { section_key: 'hero', content_key: 'badge', value: 'BTK Yetkili Bayi' },
      // About section
      { section_key: 'about', content_key: 'title', value: 'Hakkımızda' },
      { section_key: 'about', content_key: 'subtitle', value: 'Güvenilir e-İmza Partneri' },
      { section_key: 'about', content_key: 'description', value: 'Bir Tıkla e-İmza olarak 2015\'ten bu yana binlerce bireysel ve kurumsal müşterimize nitelikli elektronik imza hizmetleri sunmaktayız. BTK onaylı yetkili bayi sıfatımızla güvenilir ve hızlı hizmet garantisi veriyoruz.' },
      { section_key: 'about', content_key: 'mission', value: 'Dijital dönüşümde bireylerin ve kurumların yanında olmak, güvenli ve erişilebilir e-imza çözümleri sunmak.' },
      { section_key: 'about', content_key: 'years_experience', value: '10+' },
      { section_key: 'about', content_key: 'total_customers', value: '15.000+' },
      { section_key: 'about', content_key: 'total_signatures', value: '250.000+' },
      { section_key: 'about', content_key: 'support_hours', value: '7/24' },
      // Contact info
      { section_key: 'contact', content_key: 'title', value: 'İletişim' },
      { section_key: 'contact', content_key: 'subtitle', value: 'Bize Ulaşın' },
      { section_key: 'contact', content_key: 'description', value: 'Sorularınız için bize ulaşın. Uzman ekibimiz size en kısa sürede yardımcı olacaktır.' },
      { section_key: 'contact', content_key: 'address', value: 'Levent Mahallesi, Büyükdere Caddesi No:123 Kat:5, 34394 Şişli/İstanbul' },
      { section_key: 'contact', content_key: 'phone', value: '+90 212 555 0123' },
      { section_key: 'contact', content_key: 'email', value: 'info@birtiklaeimza.com' },
      { section_key: 'contact', content_key: 'whatsapp', value: '+90 532 555 0123' },
      { section_key: 'contact', content_key: 'working_hours', value: 'Pazartesi - Cumartesi: 09:00 - 18:00' },
      // Features section
      { section_key: 'features', content_key: 'title', value: 'Neden Biz?' },
      { section_key: 'features', content_key: 'subtitle', value: 'e-İmzada Fark Yaratan Özellikler' },
      { section_key: 'features', content_key: 'feature1_title', value: 'Hızlı Teslimat' },
      { section_key: 'features', content_key: 'feature1_desc', value: 'Başvurunuzu tamamladıktan sonra e-imzanız aynı gün kargo ile gönderilir.' },
      { section_key: 'features', content_key: 'feature2_title', value: 'Güvenli Altyapı' },
      { section_key: 'features', content_key: 'feature2_desc', value: 'BTK onaylı altyapımız ile verileriniz tam güvenlik altında.' },
      { section_key: 'features', content_key: 'feature3_title', value: 'Teknik Destek' },
      { section_key: 'features', content_key: 'feature3_desc', value: 'Kurulum ve kullanım konusunda 7/24 teknik destek hizmeti.' },
      { section_key: 'features', content_key: 'feature4_title', value: 'Uygun Fiyat' },
      { section_key: 'features', content_key: 'feature4_desc', value: 'Piyasanın en rekabetçi fiyatlarıyla nitelikli e-imza hizmeti.' },
    ];

    for (const c of contents) {
      insertContent.run(c);
    }
    console.log('[DB] Site içerikleri oluşturuldu.');
  }

  // ── FAQ ───────────────────────────────────────────────────────────────────
  const faqCount = db.prepare('SELECT COUNT(*) as c FROM faq').get().c;
  if (faqCount === 0) {
    const insertFaq = db.prepare(`
      INSERT INTO faq (question, answer, category, order_num, active)
      VALUES (@question, @answer, @category, @order_num, @active)
    `);

    const faqs = [
      {
        question: 'Elektronik imza (e-imza) nedir?',
        answer: 'Elektronik imza, elektronik ortamda kimlik doğrulama ve veri bütünlüğünü sağlamak amacıyla kullanılan güvenli bir imza yöntemidir. Türkiye\'de 5070 sayılı Elektronik İmza Kanunu kapsamında nitelikli elektronik imza, ıslak imza ile aynı hukuki geçerliliğe sahiptir.',
        category: 'genel',
        order_num: 1,
        active: 1
      },
      {
        question: 'e-İmza başvurusu nasıl yapılır?',
        answer: 'Başvuru süreci oldukça basittir: 1) Web sitemizden ürün seçin, 2) Başvuru formunu doldurun, 3) Kimlik doğrulama işlemini tamamlayın, 4) Ödemenizi yapın. Başvurunuz onaylandıktan sonra e-imzanız USB token ile adresinize kargo ile gönderilir. Tüm süreç genellikle 1-2 iş günü sürer.',
        category: 'basvuru',
        order_num: 2,
        active: 1
      },
      {
        question: 'e-İmzamı hangi işlemlerde kullanabilirim?',
        answer: 'e-İmzanızı; e-Devlet işlemleri, EKAP ihale sistemi, vergi dairesi işlemleri, noter işlemleri, iş sözleşmeleri, banka işlemleri, e-fatura ve e-arşiv uygulamaları, SGK bildirgeleri, belediye işlemleri ve diğer tüm resmi belge imzalama işlemlerinde kullanabilirsiniz.',
        category: 'kullanim',
        order_num: 3,
        active: 1
      },
      {
        question: 'e-İmzanın geçerlilik süresi dolduğunda ne yapmalıyım?',
        answer: 'e-İmzanızın geçerlilik süresi dolmadan önce size hatırlatma e-postası göndeririz. Süresi dolan e-imzanızı sitemizden uygun fiyatlarla yenileyebilirsiniz. Yenileme işleminde mevcut USB tokeninizi kullanabilirsiniz, yeni bir token satın almanıza gerek yoktur.',
        category: 'yenileme',
        order_num: 4,
        active: 1
      },
      {
        question: 'Kurumsal e-imza ile bireysel e-imza arasındaki fark nedir?',
        answer: 'Bireysel e-imza; kişi adına düzenlenir ve yalnızca kişisel işlemler için kullanılır. Kurumsal e-imza ise şirket/kurum unvanını da içerir ve kurumsal işlemlerde (ihale, resmi yazışma, sözleşme vb.) kullanılır. Mali mühür ise yalnızca tüzel kişilere tanımlanır ve e-fatura, e-arşiv gibi mali uygulamalar için zorunludur.',
        category: 'genel',
        order_num: 5,
        active: 1
      }
    ];

    for (const f of faqs) {
      insertFaq.run(f);
    }
    console.log('[DB] SSS oluşturuldu.');
  }

  // ── Testimonials ──────────────────────────────────────────────────────────
  const testimonialCount = db.prepare('SELECT COUNT(*) as c FROM testimonials').get().c;
  if (testimonialCount === 0) {
    const insertTestimonial = db.prepare(`
      INSERT INTO testimonials (name, company, position, text, rating, active, order_num)
      VALUES (@name, @company, @position, @text, @rating, @active, @order_num)
    `);

    const testimonials = [
      {
        name: 'Ahmet Yılmaz',
        company: 'Yılmaz İnşaat A.Ş.',
        position: 'Genel Müdür',
        text: 'Bir Tıkla e-İmza sayesinde ihale işlemlerimizi çok daha hızlı tamamlıyoruz. Kurumsal e-imzamızı bir gün içinde teslim aldık ve kurulum desteği mükemmeldi. Kesinlikle tavsiye ediyorum.',
        rating: 5,
        active: 1,
        order_num: 1
      },
      {
        name: 'Fatma Kaya',
        company: 'Serbest Muhasebeci',
        position: 'SMMM',
        text: 'e-Defter ve e-Fatura işlemlerim için mali mühür aldım. Süreç son derece hızlı ve sorunsuz ilerledi. Fiyatlar da çok uygun. Müşterilerime de burayı öneriyorum.',
        rating: 5,
        active: 1,
        order_num: 2
      },
      {
        name: 'Mehmet Demir',
        company: 'Teknoloji Girişimcisi',
        position: 'Yazılım Geliştirici',
        text: 'e-Devlet işlemlerini artık ofisimden halledebiliyorum. Bireysel e-imzamı aldıktan sonra hayatım çok kolaylaştı. Kurulum videolarını takip ederek her şeyi kendim hallettim.',
        rating: 4,
        active: 1,
        order_num: 3
      }
    ];

    for (const t of testimonials) {
      insertTestimonial.run(t);
    }
    console.log('[DB] Referanslar oluşturuldu.');
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  const settingsCount = db.prepare('SELECT COUNT(*) as c FROM settings').get().c;
  if (settingsCount === 0) {
    const insertSetting = db.prepare(`
      INSERT INTO settings (key, value) VALUES (@key, @value)
    `);

    const settingsList = [
      { key: 'site_title', value: 'Bir Tıkla e-İmza' },
      { key: 'site_description', value: 'Güvenli, Hızlı ve Uygun Fiyatlı Elektronik İmza Çözümleri' },
      { key: 'site_url', value: 'https://birtiklaeimza.com' },
      { key: 'phone', value: '+90 212 555 0123' },
      { key: 'phone_2', value: '+90 216 555 0456' },
      { key: 'email', value: 'info@birtiklaeimza.com' },
      { key: 'email_support', value: 'destek@birtiklaeimza.com' },
      { key: 'address', value: 'Levent Mahallesi, Büyükdere Caddesi No:123 Kat:5, 34394 Şişli/İstanbul' },
      { key: 'whatsapp', value: '+90 532 555 0123' },
      { key: 'working_hours', value: 'Pazartesi - Cumartesi: 09:00 - 18:00' },
      { key: 'facebook', value: 'https://facebook.com/birtiklaeimza' },
      { key: 'twitter', value: 'https://twitter.com/birtiklaeimza' },
      { key: 'instagram', value: 'https://instagram.com/birtiklaeimza' },
      { key: 'linkedin', value: 'https://linkedin.com/company/birtiklaeimza' },
      { key: 'footer_text', value: '© 2024 Bir Tıkla e-İmza. Tüm hakları saklıdır.' },
      { key: 'meta_keywords', value: 'e-imza, elektronik imza, nitelikli elektronik imza, mali mühür, e-fatura, EKAP' },
      { key: 'google_analytics', value: '' },
      { key: 'maintenance_mode', value: '0' }
    ];

    for (const s of settingsList) {
      insertSetting.run(s);
    }
    console.log('[DB] Ayarlar oluşturuldu.');
  }

  // ── Announcements ─────────────────────────────────────────────────────────
  const announcementCount = db.prepare('SELECT COUNT(*) as c FROM announcements').get().c;
  if (announcementCount === 0) {
    db.prepare(`
      INSERT INTO announcements (text, color, active, order_num)
      VALUES (?, ?, ?, ?)
    `).run('🎉 Yaz kampanyası! Tüm ürünlerde %25 indirim. Kampanya 30 Haziran\'a kadar geçerlidir.', 'blue', 1, 1);
    console.log('[DB] Duyurular oluşturuldu.');
  }
}

module.exports = { getDb, initDatabase };
