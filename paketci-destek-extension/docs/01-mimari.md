# Paketçi Destek Extension — Faz 1: Genel Mimari

> Durum: **Mimari onay aşaması.** Bu doküman kod içermez. Onaylandıktan sonra
> "devam" komutuyla README.md'deki 20 adım sırayla kodlanacaktır.

---

## 1. Genel Sistem Mimarisi

### 1.1 Bileşenler ve veri akışı

```
┌─────────────────────────────┐
│  Paketçi Web Paneli (DOM)    │   ← Eklenti hiçbir API çağrısı yapmaz,
│  (kullanıcının zaten açık     │     sadece render edilmiş DOM'u okur.
│   olduğu sayfa)               │
└──────────────┬────────────────┘
                │ DOM okuma + buton enjeksiyonu (content script)
┌──────────────▼────────────────┐
│  Chrome Extension (MV3)        │
│  content.js → paketciAdapter   │
│  → supportPanel (Shadow DOM)   │
│  → apiClient (fetch)           │
└──────────────┬────────────────┘
                │ HTTPS POST (multipart/form-data)
                │ Origin: chrome-extension://<id>
┌──────────────▼────────────────┐
│  Backend API (NestJS)          │
│  ValidationPipe → RateLimit    │
│  → ExtensionController/Service │
│  → sanitize → TicketService    │
│  → Prisma (PostgreSQL)         │
│  → MailQueueService (BullMQ)   │
└──────┬───────────────────┬─────┘
       │                   │
┌──────▼──────┐   ┌────────▼────────┐
│ PostgreSQL   │   │ Redis + BullMQ   │
│ paketci_     │   │ Worker (mail.    │
│ support DB   │   │ processor.ts)    │
└──────────────┘   └────────┬────────┘
                              │ Nodemailer
                    ┌─────────▼─────────┐
                    │ Google SMTP        │
                    │ smtp.gmail.com     │
                    └─────────────────────┘
```

### 1.2 Temel mimari kararlar

- **Paketçi API kullanılmaz.** Tüm paket/sipariş bilgisi, kullanıcının zaten
  görüntülediği sayfanın DOM'undan, salt-okunur şekilde okunur. Eklenti
  Paketçi'nin kendi işlevselliğine **dokunmaz**, sadece üzerine bir aksiyon
  katmanı (buton + panel) bindirir.
- **Eklenti hiçbir sır taşımaz.** Google SMTP şifresi/App Password sadece
  backend `.env`'inde yaşar; eklenti sadece backend'in herkese açık
  `POST /api/extension/support-requests` endpoint'ine, kimlik bilgisi
  taşımayan bir istek gönderir (v1). v2'de extension login/JWT eklenince bile
  SMTP sırrı backend dışına çıkmaz.
- **Bağımsız, hafif backend.** Bu sistem, repo kökündeki mevcut Express/SQLite
  B2B backend'inden ve `destek-paketi/` altında tasarlanan kapsamlı kurumsal
  ticket sisteminden **tamamen ayrı** çalışır: kendi PostgreSQL veritabanı
  (`paketci_support`), kendi process'i, kendi portu. Bu, MVP'yi hızlı teslim
  etmeyi ve mevcut sistemleri riske atmamayı sağlar.
- **Mail gönderimi request thread'inde değil, queue'da.** Ticket oluşturma
  başarılı olur olmaz iki BullMQ job'u kuyruğa girer; mail gönderiminin
  başarısız olması ticket oluşturmayı etkilemez (response'da `mailStatus:
  "queued"` döner).
- **İleriye dönük uyum:** `IMailProvider` arayüzü ve `mail_logs` kavramı,
  `destek-paketi/docs/01-mimari.md` Bölüm 8'deki mail mimarisiyle aynı
  sözleşme şeklini kullanır — iki sistem ileride ortak bir `mail-core`
  paketinde birleştirilebilir, ama bugün birbirine bağımlı değildir.

---

## 2. Chrome Extension Mimarisi

### 2.1 Manifest V3 temel yapı

- `manifest_version: 3`
- `content_scripts`: `matches` alanı **tek bir yerde** (config.js + manifest.json
  içinde placeholder) tutulur — Paketçi domaini kesinleşince tek satır değişir.
- `background`: non-persistent service worker (`background.js`) — yaşam
  döngüsü olayları (`onInstalled`), opsiyonel badge güncellemesi; v1'de ağır
  iş yapmaz.
- `host_permissions`: sadece Paketçi domaini + backend API domaini (fetch
  CORS için gerekli değildir ama açıkça beyan edilir).
- `permissions`: `storage` (config/cache), `scripting` (gerekirse dinamik
  enjeksiyon). Gereksiz geniş izin **istenmez** (`<all_urls>` kullanılmaz).
- Content script, sayfanın JS dünyasından **izole bir bağlamda** çalışır
  (Chrome'un native izolasyonu) — Paketçi'nin kendi script'leriyle değişken/
  fonksiyon çakışması olmaz.

### 2.2 Dosya sorumlulukları

| Dosya | Sorumluluk |
|---|---|
| `config.js` | Backend base URL, extension version, ortam (dev/prod) ayarı, izinli domain — **tek değişiklik noktası** |
| `constants.js` | Sorun tipi listesi, öncelik listesi + renk/etiket eşlemesi, dosya türü/boyut limiti, tüm kullanıcı mesajları (başarı/hata metinleri) |
| `domUtils.js` | Genel DOM yardımcıları: `qs`/`qsa`, metin çıkarma+trim, `MutationObserver` sarmalayıcı, debounce, basit `escapeHtml` |
| `paketciAdapter.js` | **Adapter pattern.** Tüm Paketçi selector'ları tek bir `SELECTORS` haritasında; her alan için `extractX()` fonksiyonu, bulunamazsa `null` döner, hiçbir zaman exception fırlatmaz; `listPackages()` ile sayfada görünen tüm paketleri toplar (paket seçici için) |
| `content.js` | Orkestratör: sayfaya tek bir sağ-alt "Destek Talep Et" butonu enjekte eder (`data-psupport-fab-injected` ile tekrar enjeksiyonu engeller), tıklamada detay sayfasındaysa ilgili paketi, liste sayfasındaysa paket seçiciyi açar; `MutationObserver` ile butonun SPA re-render'larında kalıcılığını sağlar |
| `supportPanel.js` | Shadow DOM içinde drawer oluşturma/yönetme, form state, validasyon entegrasyonu, gönderim orkestrasyonu, başarı/hata ekranları, focus trap + ESC |
| `supportFormValidator.js` | Saf (DOM'a bağımsız) validasyon fonksiyonları — birim test edilebilir |
| `apiClient.js` | `fetch` sarmalayıcı: `FormData` oluşturma (`payload` JSON alanı + opsiyonel `attachment` dosyası), timeout, HTTP/network hata eşlemesi → `constants.js` hata mesajları |
| `authStorage.js` | v2 için JWT/oturum saklama arayüzü (v1'de stub — `chrome.storage.local` sarmalayıcı) |
| `toast.js` | Kısa ömürlü, bloklamayan bildirimler (örn. ağ hatası uyarısı) |
| `background.js` | Service worker yaşam döngüsü, v1'de minimal |
| `popup.html/js/css` | Eklenti durumu (aktif domain mi, backend health ping), versiyon, "Yeni Destek Talebi" hızlı aksiyonu (pakete bağlı olmadan) |

### 2.3 Enjeksiyon stratejisi

- **Tek buton, tek yer:** Satır başına buton YOK — sayfaya sağ-altta sabit
  konumlu tek bir `psupport-fab-btn` enjekte edilir (`content.js`).
  Idempotency için `data-psupport-fab-injected` kontrol edilir.
- **Dinamik içerik:** `document.body`'ye `MutationObserver` bağlanır
  (`childList: true, subtree: true`); bazı SPA'lar body içeriğini tamamen
  yeniden render edip butonu DOM'dan düşürebileceği için debounce'lu
  (200ms) yeniden ekleme tetiklenir.
- **Tıklama anında dallanma:** Butona tıklandığında route/SPA durumu o anda
  okunur — `paketciAdapter.isDetailPage()` true ise o paket için panel direkt
  açılır; değilse `paketciAdapter.listPackages()` ile sayfadaki paketler
  toplanır ve panel içinde **paket seçici** (`<select>`) gösterilir (tek paket
  varsa seçici atlanıp direkt o paket açılır, hiç paket yoksa manuel giriş
  moduna düşülür). Bu sayede ayrıca bir SPA route-izleme mekanizmasına
  gerek kalmaz.

---

## 3. Extension UI/UX Tasarımı

### 3.1 Drawer (sağ panel)

- **İzolasyon:** Panel, `document.body`'ye eklenen tek bir host element
  içinde **Shadow DOM** (`attachShadow({ mode: 'open' })`) ile render edilir.
  Bu sayede Paketçi'nin CSS'i panelin içine sızmaz, panelin CSS'i de
  Paketçi'nin tasarımını bozmaz. Tüm class isimleri yine de `psupport-`
  prefix'i taşır (ekstra güvenlik + sayfa-üstü butonlar Shadow DOM dışında
  olduğu için onlar gerçekten prefix'e bağımlı).
- **Görsel dil:** Beyaz zemin, yumuşak gölge (`box-shadow`), 12px rounded
  corner, sistem font stack'i (performans + native his), 420px sabit genişlik;
  `<480px` viewport'ta tam ekran (`100vw`) drawer'a dönüşür.
- **Yapı:** Header (başlık + kapat) → Paket Özeti kartı (salt-okunur grid,
  eksik alanlarda "Manuel doldur" linki) → Form (Sorun Tipi custom select,
  Öncelik segmented control + renkli badge: low=gri, normal=mavi, high=
  turuncu, urgent=kırmızı, critical=koyu kırmızı+nabız animasyonu) →
  Açıklama (auto-grow textarea) → Gönderen bilgileri → Dosya alanı
  (drag&drop hissi + click-to-browse, dosya adı/boyutu önizleme, kaldır
  butonu) → Gönder butonu (loading spinner state).
- **Durumlar:** dolduruluyor → gönderiliyor (buton disabled+spinner, form
  kilitli) → başarı (tam panel yeşil onay ekranı + ticket numarası) → hata
  (kırmızı banner + "Tekrar Dene", **form verisi asla silinmez**).
- **Kapatma onayı:** Formda veri varken kapatma denenirse, native `confirm()`
  yerine panel içi stilize bir onay satırı gösterilir.
- **Erişilebilirlik:** `role="dialog"` `aria-modal="true"`, ilk alana otomatik
  focus, Tab/Shift+Tab focus trap, ESC ile kapatma (dirty-check'e tabi), her
  input için `<label>`/`aria-label`, öncelik bilgisi sadece renkle değil
  ikon+metinle de iletilir.

### 3.2 Sayfa üstü buton ve paket seçici

- Tek buton: sağ-altta sabit, pill/yuvarlak buton, ikon+"Destek Talep Et",
  hover elevation. Tüm sayfalarda (liste/detay) aynı buton kullanılır.
- **Paket seçici:** Liste sayfasında ve birden fazla paket görünüyorsa, panel
  açıldığında en üstte zorunlu bir "Paket Seçin" `<select>` gösterilir;
  kullanıcı paket seçince paket özeti aynı panelde anında güncellenir (form
  alanları sıfırlanmaz). Tek paket görünüyorsa seçici atlanır, paket hiç
  bulunamazsa manuel giriş moduna düşülür.
- **Z-index stratejisi:** Shadow DOM host'u çok yüksek bir z-index'te
  (örn. `2147483000`) sayfanın en üstünde sabit konumlanır; sağ-alt buton da
  yüksek bir z-index'te (`2147482999`) sabit konumlanır, herhangi bir
  Paketçi elemanıyla çakışma riski taşımaz.

---

## 4. Backend Mimarisi

### 4.1 İstek yaşam döngüsü

```
multipart/form-data POST
  → Helmet + CORS allow-list (chrome-extension://<id>)
  → Global ValidationPipe (whitelist + transform)
  → RateLimitGuard (IP bazlı, /extension/support-requests için sıkı limit)
  → ExtensionController
      - Multer/FileInterceptor: "attachment" alanı (MIME+boyut filtresi)
      - "payload" alanı (JSON string) → özel pipe ile parse + DTO validasyonu
  → ExtensionService
      - sanitize-html (title, description, sender.name, free-text alanlar)
      - TicketService.checkDuplicate(paketciPackageId, orderNumber)
          → açık ticket varsa 409 + mevcut ticket numarası
      - TicketNumberService.next() → "TCK-2026-000001" (transaction + sequence)
      - Prisma: support_tickets + package_snapshots insert (tek transaction)
      - MailQueueService.enqueue("admin_new_extension_ticket", ...)
      - MailQueueService.enqueue("user_extension_ticket_created", ...)
  → response: { success, ticketNumber, message, mailStatus: "queued" }
```

### 4.2 Modüller

`PrismaModule`, `ExtensionModule` (controller/service/dto), `TicketModule`
(ticket numarası + duplicate kontrolü), `MailModule` (provider/queue/
processor/template/log alt servisleri), `CommonModule` (sanitize, rate-limit
guard, response zarfı, hata sınıfları).

### 4.3 Önemli kararlar

- **Dosya eki taşıma:** Multipart isteğin `attachment` alanı backend'de
  doğrulanır (MIME + boyut), private bir dizine/depoya kaydedilir (ileride S3
  uyumlu adaptöre geçilebilir), yol ticket/snapshot kaydına yazılır. Boyut
  limiti küçük tutulduğundan (örn. 5MB) admin mailine **doğrudan ek** olarak
  da eklenebilir.
- **Duplicate kontrolü:** Aynı `paketciPackageId`/`orderNumber` için açık
  (çözülmemiş/kapanmamış) bir ticket varsa **yeni kayıt oluşturulmaz**, 409
  döner ve hata mesajında mevcut ticket numarası belirtilir ("Bu paket için
  zaten açık bir talep var.").
- **Ticket numarası üretimi:** Eşzamanlı isteklerde çakışmayı önlemek için
  transaction içinde satır kilidi (`SELECT ... FOR UPDATE`) kullanan bir
  sayaç tablosu/sequence ile `TCK-{yıl}-{6 hane}` üretilir.
- **Tutarlı hata/response formatı:** `common/response.ts` zarfı + `common/errors.ts`
  tipli hata sınıfları, kullanıcıya gösterilecek Türkçe mesaj kataloğuyla
  birebir eşlenir (bkz. Bölüm 7 ve kullanıcı tarafından verilen hata listesi).
- **Health endpoint:** `/api/health` → DB + Redis bağlantı kontrolü.

---

## 5. Google SMTP Mail Mimarisi

```
ExtensionService (ticket oluşturuldu)
        │  emit / enqueue (DOĞRUDAN MAIL ÇAĞRISI YOK)
        ▼
MailQueueService.enqueue(jobType, payload)         [BullMQ producer]
        │
        ▼  (ayrı worker process/thread'de tüketilir)
MailProcessor                                       [BullMQ consumer]
        ├─ MailTemplateService.render(jobType, payload)
        │     → admin-new-extension-ticket.template.ts
        │     → user-extension-ticket-created.template.ts
        │     → tüm dinamik değerler escapeHtml() ile kaçışlanır
        ├─ MailProviderService.getProvider() → GoogleSmtpProvider (IMailProvider)
        │     Nodemailer transport: host/port/secure/auth → .env
        ├─ provider.send(message) → smtp.gmail.com
        └─ MailLogService.record(result)            [mail_logs tablosu]
              başarısız → BullMQ retry (attempts:3, exponential backoff)
              3 deneme sonunda hâlâ başarısızsa: mail_queue_jobs.status=failed
```

- **Provider abstraction:** `IMailProvider { send(message): Promise<MailSendResult> }`.
  v1'de tek implementasyon `GoogleSmtpProvider`, ama arayüz `destek-paketi`
  sistemindeki mail provider sözleşmesiyle aynı şekildedir — ileride SES/
  SendGrid/Mailgun/Resend eklenmesi bu dosyaya dokunmadan mümkündür.
- **Alıcı çözümleme:**
  - Admin job → `ADMIN_NOTIFICATION_EMAILS` (virgülle ayrılmış, trim'li liste).
  - `priority` ∈ {urgent, critical} → ayrıca `CRITICAL_TICKET_EMAILS`.
  - Kullanıcı job → sadece `sender.email`.
- **Konu (subject) kuralı:** Admin maili için öncelik urgent/critical ise
  `[Acil Paket Talebi] ...` formatı, aksi halde `[Yeni Paket Talebi] ...`.
- **Mail başarısızlığı ticket'ı geçersiz kılmaz:** Response her durumda
  `mailStatus: "queued"` döner; gerçek gönderim durumu `mail_logs`/admin
  panelinden takip edilir.

---

## 6. Database Tablo Tasarımı

### 6.1 Tablolar ve amaçları

| Tablo | Amaç |
|---|---|
| `support_tickets` | Ana ticket kaydı (kullanıcı verdiği alan listesiyle) |
| `package_snapshots` | Ticket oluşturulduğu anda DOM'dan okunan paket verisinin anlık görüntüsü (1—1, `raw_snapshot` jsonb ile ham veri de saklanır) |
| `mail_logs` | Her gönderim denemesinin sonucu (1 ticket → genelde 2+ satır) |
| `mail_queue_jobs` | Kuyruğa atılan job'ların uygulama seviyesi izi (1 ticket → 2 satır: admin + user) |

### 6.2 İlişkiler

```
support_tickets 1───1 package_snapshots   (ticket_id FK, unique)
support_tickets 1───N mail_logs           (ticket_id FK)
support_tickets 1───N mail_queue_jobs     (ticket_id FK)
support_tickets N───0..1 support_tickets  (duplicate_of_ticket_id, self-ref, nullable)
```

### 6.3 Tasarım notları

- `raw_snapshot` (jsonb) — adapter'ın döndürdüğü **tüm** ham alanlar; normalize
  edilmiş kolonlar boş/yanlış çıksa bile sonradan inceleme/debug imkânı verir.
- `duplicate_of_ticket_id` — v1'de duplicate tespit edilince **yeni kayıt
  oluşturulmaz** (409 ile reddedilir); bu kolon, ileride "duplicate'i bağla ve
  yine de kaydet" davranışına geçilirse kullanılacak şekilde şimdiden ayrılır.
- **Soft delete yok.** Hacim düşük, kayıtlar denetim amaçlı hiç silinmez
  (`destek-paketi` sistemindeki audit-log felsefesiyle tutarlı).
- **Index planı:** `support_tickets(paketci_package_id)`, `(paketci_order_number)`,
  `(sender_email)`, `(status)`, `(created_at)`; `mail_logs(ticket_id, status)`;
  `mail_queue_jobs(ticket_id, status)`.
- Alan listeleri/tipleri ve Prisma model kodu, "devam" sonrası **Prisma
  schema** adımında tek tek yazılacaktır.

---

## 7. Güvenlik Mimarisi

- **Sır izolasyonu:** Google SMTP şifresi/App Password sadece backend `.env`
  içinde yaşar; hiçbir API response'unda, hiçbir log satırında düz metin
  görünmez; eklenti kod tabanında bu bilgiye referans bile yoktur.
- **CORS allow-list:** Sadece `chrome-extension://<EXTENSION_ID>` origin'i
  (ve ileride admin panel origin'i) kabul edilir, wildcard kullanılmaz.
- **Helmet + global ValidationPipe** (whitelist + forbidNonWhitelisted)
  production'da zorunlu.
- **Sanitizasyon — savunma derinliği:** (1) Persist edilmeden önce
  `sanitize-html` ile DB'ye giriş noktasında, (2) mail template render
  edilirken `escapeHtml()` ile çıkış noktasında — iki kez temizlenir.
  DOM'dan okunan tüm metinler aynı şekilde trim+sanitize edilir.
- **Rate limiting:** `@nestjs/throttler` ile IP bazlı global limit
  (`RATE_LIMIT_TTL`/`RATE_LIMIT_MAX`) + servis seviyesinde e-posta bazlı ek
  limit (örn. aynı e-postadan saatte N talep) → "Çok fazla talep gönderdiniz"
  mesajına eşlenir.
- **Dosya yükleme güvenliği:** MIME + uzantı allow-list (jpg/jpeg/png/webp/pdf),
  sunucu tarafında **otoriter** boyut/tür kontrolü (istemci tarafı kontrol
  sadece UX hızlandırması, güvenlik garantisi değildir).
- **Duplicate-ticket koruması** spam/yanlışlıkla çoklu gönderimi engeller.
- **Eklenti kapsamı:** `manifest.json` → `content_scripts.matches` ve
  `host_permissions` sadece gerçek Paketçi domaini ile sınırlıdır; Chrome bu
  kuralı native olarak uygular (kod çalışmaz bile).
- **HTTPS:** Production'da TLS terminasyonu reverse proxy'de yapılır, backend
  `X-Forwarded-Proto`'ya güvenir; HTTP üzerinden çalışma desteklenmez kabul
  edilir.
- **CSP:** MV3 zaten `eval`/inline script'i yasaklar; panel DOM API'leriyle
  güvenli şekilde kurulur, kullanıcı verisi `textContent`/sanitize edilmiş
  `innerHTML` ile yazılır.

---

## 8. Mail Ayarlarının Gireleceği Yerler

### 8.1 v1 — Backend `.env`

Kullanıcının verdiği `.env.example` şablonu birebir uygulanacaktır (Bölüm 18'de
gerçek dosya olarak yazılacak). Burada önemli olan: **Google App Password**,
hesapta 2FA açıkken Google hesap ayarlarından üretilen 16 haneli özel şifredir;
normal hesap şifresi SMTP için kullanılamaz/kullanılmamalıdır.

### 8.2 v2 — Admin Panel (ileride)

Aşağıdaki ekran, `destek-paketi` sistemindeki `mail_settings`/`mail_recipients`
tasarımıyla **aynı veri sözleşmesini** kullanacak şekilde planlanır (iki sistem
arasında gelecekte ortak admin ekranı paylaşılabilir):

- Google SMTP aktif/pasif anahtarı
- SMTP host / port / secure (TLS/SSL)
- Google mail adresi
- Google App Password (password input, mevcut değer **asla** plain text
  gösterilmez — maskeli `••••••••`; boş bırakılırsa eski şifre korunur; yeni
  değer girilirse AES-256-GCM ile şifrelenip kaydedilir; API response'unda
  şifre alanı hiçbir zaman dönmez)
- From name / From email / Reply-to email
- Operasyon mail alıcıları, kritik talep alıcıları, günlük rapor alıcıları
  (liste yönetimi)
- "Test mail gönder" butonu
- Mail logları tablosu (filtrelenebilir)
- Son başarılı gönderim zamanı / son hata mesajı (özet kart)
- **Yetki:** Sadece `super_admin` değiştirebilir; her değişiklik audit log'a
  yazılır.

---

## 9. Kurulum Adımları (runbook taslağı)

### 9.1 Backend

1. Node.js (LTS) kurulumu
2. PostgreSQL kurulumu, `paketci_support` veritabanı oluşturma
3. Redis kurulumu (BullMQ için)
4. `paketci-destek-extension/backend` altında NestJS projesi oluşturma
5. Bağımlılıkları yükleme (`npm install`)
6. `.env` dosyasını `.env.example`'dan oluşturma
7. Google SMTP host/port/user bilgilerini `.env`'e girme
8. Google App Password üretme (Google Hesabı → Güvenlik → 2 Adımlı
   Doğrulama → Uygulama Şifreleri) ve `.env`'e yapıştırma
9. `prisma/schema.prisma` hazırlama
10. `npx prisma migrate dev` ile migration çalıştırma
11. `npm run start:dev` ile geliştirme modunda başlatma
12. `GET /api/health` ile bağlantı testi
13. `POST /api/mail/test` ile SMTP testi
14. `POST /api/extension/support-requests` ile örnek talep testi
15. `mail_logs` tablosunu sorgulayarak gönderim sonucunu doğrulama
16. `npm run build` ile production build alma
17. PM2 (`pm2 start dist/main.js`) veya Docker ile çalıştırma

### 9.2 Chrome Extension

1. `chrome-extension/` klasörünü oluşturma
2. `manifest.json` ekleme
3. `content.js` ekleme
4. `paketciAdapter.js` ekleme
5. `supportPanel.js` ekleme
6. `styles.css` ekleme
7. `apiClient.js` ekleme
8. `config.js` içine backend URL'i yazma
9. `manifest.json` içine gerçek Paketçi domainini yazma
10. `chrome://extensions` açma
11. Geliştirici Modu'nu açma
12. "Paketi Yükle" (Load unpacked) ile klasörü seçme
13. Paketçi panelini açma
14. Sağ-altta sabit "Destek Talep Et" butonunun göründüğünü doğrulama
15. Bir destek talebi oluşturma (uçtan uca test)
16. Admin mailinin geldiğini kontrol etme
17. Kullanıcı mailinin geldiğini kontrol etme
18. Backend loglarını kontrol etme
19. Veritabanı kayıtlarını (`support_tickets`, `package_snapshots`, `mail_logs`) kontrol etme

---

## 10. Test Planı

Kullanıcının verdiği 27 senaryo, aşağıdaki gruplarla eşleştirilip uygulanacaktır:

| Grup | Senaryolar | Araç |
|---|---|---|
| Enjeksiyon davranışı | Buton ekleme, body yeniden render sonrası kalıcılık, çift enjeksiyon engeli, UI görünümü | Manuel QA + (mümkünse) Playwright ile fixture HTML üzerinde otomasyon |
| Panel davranışı | Açılma, ESC, focus trap | Manuel QA + Playwright |
| Veri okuma | Paket verisi doğru okuma, eksik veri → manuel giriş | Jest unit test (adapter saf fonksiyonlar, JSDOM fixture) |
| Form validasyonu | Geçersiz e-posta, boş açıklama, sorun tipi zorunluluğu | Jest unit test (`supportFormValidator.js`, DOM'dan bağımsız) |
| Backend entegrasyonu | Ticket oluşturma, ticket no üretimi, DB yazımı, snapshot yazımı | Jest + Supertest (e2e), test PostgreSQL |
| Mail akışı | Admin/kullanıcı maili gönderimi, urgent/critical ek alıcı, retry, log kaydı | Jest (BullMQ test modu / mock transport) |
| Güvenlik | XSS sanitize, SMTP şifresi eklentide yok, domain kısıtı, rate limit, duplicate kontrolü | Jest + manuel kod incelemesi |
| Build/Deploy | Production build hatasız | CI/manuel `npm run build` |

---

## 11. Dosya Yapıları

```
paketci-destek-extension/
  docs/
    01-mimari.md                              ← bu doküman
  chrome-extension/
    manifest.json
    src/
      config.js
      constants.js
      domUtils.js
      paketciAdapter.js
      content.js
      supportPanel.js
      supportFormValidator.js
      apiClient.js
      authStorage.js
      toast.js
      background.js
      popup.html
      popup.js
      popup.css
      styles.css
    icons/
      icon16.png
      icon48.png
      icon128.png
  backend/
    src/
      main.ts
      app.module.ts
      prisma/
        prisma.service.ts
      extension/
        extension.module.ts
        extension.controller.ts
        extension.service.ts
        dto/
          create-support-request.dto.ts
      tickets/
        ticket.module.ts
        ticket.service.ts
        ticket-number.service.ts
      mail/
        mail.module.ts
        mail.service.ts
        google-smtp.provider.ts
        mail-provider.interface.ts
        mail-queue.service.ts
        mail.processor.ts
        mail-template.service.ts
        mail-log.service.ts
        templates/
          admin-new-extension-ticket.template.ts
          user-extension-ticket-created.template.ts
      common/
        sanitize.ts
        rate-limit.guard.ts
        response.ts
        errors.ts
    prisma/
      schema.prisma
    .env.example
    package.json
    README.md
```

> Bu proje neden `destek-paketi/backend` veya repo köküne değil
> `paketci-destek-extension/backend`'e konuluyor? Çünkü (a) repo kökünde
> zaten mevcut bir Express `backend/` var (isim çakışması), (b)
> `destek-paketi/backend` gelecekteki kapsamlı kurumsal sisteme ayrılmış
> (henüz kodlanmadı, farklı kapsam/DB). Bu MVP kendi bağımsız DB'si ve
> deploy birimiyle çalışır; köprü gerekirse ileride entegrasyon katmanı
> eklenir, şimdi varsayım yapılmaz.

---

## 12. Geliştirme Sırası

1. ✅ Genel mimari, UI/UX, backend, mail, DB, güvenlik, kurulum, test planı *(bu doküman)*
2. `manifest.json`
3. `config.js`
4. `content.js`
5. `paketciAdapter.js`
6. `supportPanel.js`
7. `styles.css`
8. `apiClient.js`
9. `popup.html` / `popup.js` / `popup.css`
10. NestJS backend kurulumu
11. Prisma schema
12. Extension controller/service/dto
13. Ticket service
14. Google SMTP mail provider
15. Mail queue worker
16. Admin mail template
17. Kullanıcı mail template
18. `.env.example`
19. Kurulum komutları
20. Test komutları
21. Production deployment notları

**"Devam"** dendiğinde 2. adımdan (manifest.json) başlanacaktır.
