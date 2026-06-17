# Paketçi Destek Backend

Chrome eklentisinden gelen destek taleplerini DB'ye yazan ve Google SMTP
üzerinden mail gönderen bağımsız NestJS servisi. Paketçi'nin kendi API'sine
bağımlılığı yoktur — tüm paket verisi eklenti tarafından DOM'dan okunup
istekle birlikte gönderilir.

## Mimari özet

- **NestJS** (Express adapter) + **Prisma** (PostgreSQL) + **BullMQ** (Redis)
- Mail gönderimi `IMailProvider` arayüzü üzerinden `GoogleSmtpProvider`
  (Nodemailer) ile yapılır — provider değişse de `MailService`/`MailProcessor`
  değişmez (Adapter Pattern).
- Destek talebi oluşturma senkron DB yazımı + asenkron mail kuyruğudur: ticket
  oluşturulur, ardından admin ve kullanıcı mailleri ayrı BullMQ job'ları olarak
  kuyruğa eklenir (3 deneme, exponential backoff). Her job `mail_logs`
  tablosunda izlenir.
- Admin uç noktaları (`/api/admin/*`, `/api/mail/test`) basit paylaşılan-sır
  header kontrolüyle korunur (`X-Admin-Api-Key`) — v1 stopgap, v2'de gerçek
  JWT/RBAC ile değiştirilecektir.

## Güvenlik notları (mutlaka okuyun)

- `GOOGLE_SMTP_PASSWORD` normal Google hesap şifresi **DEĞİLDİR** — 2FA açık
  bir hesapta üretilen 16 haneli **App Password** kullanılmalıdır.
- Bu şifre yalnızca backend `.env` dosyasında yaşar: Chrome eklentisine asla
  yazılmaz, hiçbir API response'unda dönmez, log'a yazılmaz.
- `.env` dosyası `.gitignore` ile hariç tutulur; bu repoda yalnızca gerçek
  şifre içermeyen `.env.example` bulunur.
- Production'da bu değerler ortam değişkeni / secret manager (örn. Docker
  secret, Vault, cloud secret manager) ile enjekte edilmelidir.
- CORS yalnızca `chrome-extension://<EXTENSION_ID>` (ve varsa admin panel)
  origin'lerine izin verir — wildcard yoktur.
- Mail şablonu değişkenleri ve kullanıcı girdileri (`sanitize-html`,
  `escapeHtml`) XSS'e karşı temizlenir/escape edilir.

## Backend kurulumu (adım adım)

1. **Node.js kurulumu** — Node.js 20 LTS önerilir (`node -v` ile doğrulayın).
2. **PostgreSQL kurulumu** — yerel geliştirme için `postgresql` servisini
   kurun/başlatın, `paketci_support` adlı bir veritabanı oluşturun:
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE paketci_support;"
   ```
3. **Redis kurulumu** — BullMQ mail kuyruğu için gereklidir:
   ```bash
   sudo apt-get install redis-server   # veya işletim sisteminize uygun paket
   redis-server --daemonize yes
   ```
4. **Backend projesini oluşturma** — bu klasörü (`paketci-destek-extension/backend`)
   klonlayın/kopyalayın.
5. **Paketleri yükleme**:
   ```bash
   cd paketci-destek-extension/backend
   npm install
   ```
6. **.env dosyasını oluşturma**:
   ```bash
   cp .env.example .env
   ```
7. **Google SMTP ayarlarını .env içine girme** — `GOOGLE_SMTP_HOST`,
   `GOOGLE_SMTP_PORT`, `GOOGLE_SMTP_USER`, `GOOGLE_SMTP_PASSWORD` alanlarını
   doldurun.
8. **Google App Password alma notu** — Google Hesabınızda 2 Adımlı
   Doğrulama'yı açın, ardından *Hesap > Güvenlik > Uygulama Şifreleri*
   bölümünden "Mail" için 16 haneli bir App Password üretin ve bunu
   `GOOGLE_SMTP_PASSWORD` olarak kullanın. **Normal hesap şifrenizi asla
   kullanmayın.**
9. **Prisma schema hazırlama** — şema zaten `prisma/schema.prisma` içinde
   tanımlıdır; değişiklik yapmadıysanız bu adımda ek işlem gerekmez.
10. **Prisma migration çalıştırma**:
    ```bash
    npx prisma migrate deploy   # veya geliştirme sırasında: npx prisma migrate dev
    npx prisma generate
    ```
11. **Backend'i development modda başlatma**:
    ```bash
    npm run start:dev
    ```
12. **Health endpoint test etme**:
    ```bash
    curl http://localhost:3001/api/health
    # { "status": "ok", "timestamp": "..." }
    ```
13. **Mail test endpoint test etme**:
    ```bash
    curl -X POST http://localhost:3001/api/mail/test \
      -H "X-Admin-Api-Key: <ADMIN_API_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"to":"siz@example.com"}'
    ```
14. **Support request endpoint test etme**:
    ```bash
    curl -X POST http://localhost:3001/api/extension/support-requests \
      -F 'payload={"issueType":"address_problem","priority":"normal","description":"Test talebi metni en az yirmi karakter olmalı.","requesterName":"Test Kullanıcı","requesterEmail":"test@example.com","paketciPackageId":"PKG-1","paketciOrderNumber":"ORD-1","sourceUrl":"https://example.com"}'
    ```
15. **Mail loglarını kontrol etme**:
    ```bash
    curl -H "X-Admin-Api-Key: <ADMIN_API_KEY>" http://localhost:3001/api/admin/mail/logs
    ```
16. **Production build alma**:
    ```bash
    npm run build
    ```
17. **PM2 veya Docker ile çalıştırma** — bkz. [Production deployment](#production-deployment).

## Chrome Extension kurulumu (adım adım)

1. `chrome-extension/` klasörünü oluşturma — bu repoda zaten mevcuttur
   (`paketci-destek-extension/chrome-extension`).
2. `manifest.json` ekleme — mevcut dosyayı kullanın, domain placeholder'larını
   güncelleyin.
3. `content.js` ekleme — mevcuttur (`src/content.js`).
4. `paketciAdapter.js` ekleme — mevcuttur (`src/paketciAdapter.js`); Paketçi
   DOM selector'ları değiştiyse bu dosyayı güncelleyin.
5. `supportPanel.js` ekleme — mevcuttur (`src/supportPanel.js`).
6. `styles.css` ekleme — mevcuttur (`src/styles.css`).
7. `apiClient.js` ekleme — mevcuttur (`src/apiClient.js`).
8. `config.js` içine backend URL yazma — `src/config.js` içindeki
   `BACKEND_BASE_URL.production` değerini gerçek backend domaininizle
   değiştirin.
9. `manifest.json` içine Paketçi domainini yazma — `content_scripts.matches`,
   `host_permissions` ve `web_accessible_resources.matches` alanlarındaki
   `https://*.paketci-domaininiz.com/*` placeholder'ını gerçek domainle
   değiştirin.
10. Chrome'da `chrome://extensions` açma.
11. Sağ üstten **Geliştirici modu**'nu (Developer Mode) açma.
12. **Paketlenmemiş öğe yükle** (Load unpacked) ile
    `paketci-destek-extension/chrome-extension` klasörünü seçme.
13. Paketçi web panelini açma.
14. Paket/sipariş satırlarında "Destek Talebi Oluştur" butonunun görünmesini
    test etme.
15. Butona tıklayıp sağ panelden destek talebi oluşturma.
16. Admin mailinin (ops/critical alıcılar) gelip gelmediğini kontrol etme.
17. Kullanıcı mailinin (talebi oluşturan kişiye onay maili) gelip gelmediğini
    kontrol etme.
18. Backend loglarını (`npm run start:dev` konsolu) kontrol etme.
19. Database kayıtlarını kontrol etme:
    ```bash
    npx prisma studio
    # veya
    curl -H "X-Admin-Api-Key: <ADMIN_API_KEY>" http://localhost:3001/api/admin/support-requests
    ```

## Test senaryoları

| # | Senaryo | Durum |
|---|---------|-------|
| 1 | Paketçi ekranı açılınca buton ekleniyor mu? | Eklenti tarafı |
| 2 | Dinamik yüklenen satırlara buton ekleniyor mu? | Eklenti tarafı |
| 3 | Aynı satıra iki kez buton eklenmiyor mu? | Eklenti tarafı |
| 4 | Buton UI düzgün görünüyor mu? | Eklenti tarafı |
| 5 | Sağ panel açılıyor mu? | Eklenti tarafı |
| 6 | ESC ile panel kapanıyor mu? | Eklenti tarafı |
| 7 | Panel focus trap çalışıyor mu? | Eklenti tarafı |
| 8 | Paket verileri doğru okunuyor mu? | Eklenti tarafı |
| 9 | Eksik veri varsa manuel giriş yapılabiliyor mu? | Eklenti tarafı |
| 10 | Geçersiz e-posta engelleniyor mu? | ✅ DTO `@IsEmail()` + eklenti validator |
| 11 | Boş açıklama engelleniyor mu? | ✅ DTO `@MinLength` |
| 12 | Sorun tipi seçilmeden gönderim engelleniyor mu? | ✅ DTO `@IsEnum(IssueType)` |
| 13 | Talep backend'e gidiyor mu? | ✅ E2E doğrulandı (`POST /api/extension/support-requests` → 201) |
| 14 | Ticket numarası oluşuyor mu? | ✅ E2E doğrulandı (`TCK-2026-000001`, `...000002` ardışık) |
| 15 | Database'e ticket yazılıyor mu? | ✅ `GET /api/admin/support-requests` ile doğrulandı |
| 16 | Package snapshot yazılıyor mu? | ✅ `SupportTicket.packageSnapshot` nested create ile yazılıyor |
| 17 | Admin maili gidiyor mu? | ✅ Kuyruğa ekleniyor, `mail_logs` ile izleniyor |
| 18 | Kullanıcı maili gidiyor mu? | ✅ Kuyruğa ekleniyor, `mail_logs` ile izleniyor |
| 19 | Urgent/critical durumda kritik alıcılara da mail gidiyor mu? | ✅ E2E doğrulandı (`CRITICAL_TICKET_EMAILS` admin mailine eklendi, konu "[Acil Paket Talebi]" oldu) |
| 20 | Mail başarısız olursa retry çalışıyor mu? | ✅ E2E doğrulandı (3 deneme, exponential backoff, `ECONNREFUSED` ile test edildi) |
| 21 | Mail logları kaydediliyor mu? | ✅ E2E doğrulandı (`retryCount`, `errorMessage`, `failedAt` alanları dolu) |
| 22 | XSS içeren açıklama sanitize ediliyor mu? | ✅ `sanitize-html` (DB) + `escapeHtml` (mail HTML) |
| 23 | SMTP şifresi eklenti içinde yok mu? | ✅ `config.js` içinde hiçbir gizli alan yok |
| 24 | Eklenti sadece Paketçi domaininde çalışıyor mu? | ✅ `manifest.json > matches` + `config.js > allowedHostnames` defense-in-depth |
| 25 | Backend rate limit çalışıyor mu? | ✅ E2E doğrulandı (global `ThrottlerModule` + route-level `@Throttle({limit:5,ttl:60_000})`) |
| 26 | Duplicate paket talebi uyarısı çalışıyor mu? | ✅ E2E doğrulandı (aynı `paketciPackageId`/`paketciOrderNumber` için açık talep varsa 409) |
| 27 | Production build hata vermiyor mu? | ✅ `npm run build` (`nest build`) hatasız tamamlanıyor |

Backend tarafı senaryolar (10, 11, 12, 13-27) bu geliştirme sürecinde yerel
PostgreSQL + Redis ile canlı `curl` istekleriyle E2E doğrulanmıştır. Eklenti
tarafı senaryolar (1-9) gerçek Paketçi panelinde manuel test gerektirir.

## Production deployment

### PM2 ile çalıştırma

```bash
npm run build
npm install -g pm2
pm2 start dist/main.js --name paketci-destek-backend \
  --env production
pm2 save
```

`.env` dosyasındaki değişkenleri PM2'nin okuyabilmesi için `dotenv` zaten
`ConfigModule.forRoot({ isGlobal: true })` ile yükleniyor; production'da bu
değerleri PM2 ecosystem dosyası yerine sunucu ortam değişkenleri veya bir
secret manager üzerinden enjekte etmeniz önerilir.

### Docker ile çalıştırma

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

Gizli değerleri (`GOOGLE_SMTP_PASSWORD`, `ADMIN_API_KEY`, `DATABASE_URL`)
imaja **gömmeyin** — `docker run --env-file .env` veya orkestrasyon
aracınızın secret mekanizmasıyla (Docker secrets, Kubernetes Secret, vb.)
enjekte edin.

### Production checklist

- [ ] `NODE_ENV=production`
- [ ] HTTPS ters proxy (nginx/Caddy) arkasında çalışıyor
- [ ] `CORS_ALLOWED_ORIGINS` yalnızca gerçek eklenti ID'sini içeriyor
- [ ] `GOOGLE_SMTP_PASSWORD` bir App Password, secret manager'dan enjekte
      ediliyor
- [ ] `ADMIN_API_KEY` güçlü, rastgele üretilmiş bir değer
- [ ] PostgreSQL ve Redis production örnekleri yedekleniyor
- [ ] `npx prisma migrate deploy` her dağıtımda çalıştırılıyor
- [ ] `npm run build` CI'da hatasız geçiyor
