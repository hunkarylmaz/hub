# Destek Paketi — Faz 1: Genel Teknik Mimari

> Durum: **Mimari onay aşaması.** Bu doküman kod içermez; aşağıdaki 13 başlık
> onaylandıktan sonra "devam" komutuyla sırasıyla detaylandırılıp kodlanacaktır
> (bkz. README.md → Geliştirme Yol Haritası).

---

## 1. Genel Sistem Mimarisi

### 1.1 Konumlandırma

Destek Paketi, mevcut "Paketçiniz" monorepo'su içinde **bağımsız bir alt sistem**
olarak `destek-paketi/` altında geliştirilir. Mevcut Express/SQLite tabanlı B2B,
Bayi ve Plus uygulamalarına dokunulmaz; entegrasyon yalnızca gerekirse ileride
"restoran kullanıcısı kimliği" ve "kurye/sipariş referansı" için salt-okunur bir
köprü servisi (API anahtarlı, ayrı bounded context) üzerinden yapılır. Bu izolasyon,
destek sisteminin kendi teknoloji yığınıyla (NestJS/Next.js/PostgreSQL) bağımsız
geliştirilip dağıtılabilmesini sağlar.

### 1.2 Katmanlı + Hexagonal (Ports & Adapters) Yaklaşım

```
┌──────────────────────────────────────────────────────────────────────┐
│  PRESENTATION                                                          │
│  Next.js (Restoran Destek Paneli)   Next.js (Operasyon/Admin Paneli)   │
│  - SSR/CSR sayfalar, React Query, Zod form validasyonu                │
│  - Socket.IO client (realtime chat, typing, SLA uyarısı)              │
└───────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTPS (REST) + WSS (Socket.IO)
┌───────────────────────────────▼──────────────────────────────────────┐
│  API / EDGE LAYER  (NestJS)                                            │
│  - Controllers (DTO + class-validator/Zod)                            │
│  - Guards: JwtAuthGuard → TenantScopeGuard → PermissionsGuard          │
│  - Socket.IO Gateway (aynı auth/permission zinciri)                    │
│  - Global ExceptionFilter, Interceptor (logging, response zarfı)       │
└───────────────────────────────┬──────────────────────────────────────┘
                                  │ çağırır
┌───────────────────────────────▼──────────────────────────────────────┐
│  APPLICATION / DOMAIN LAYER  (framework'ten bağımsız TS sınıfları)      │
│  TicketService, TicketSlaService, MailNotificationService, ...        │
│  - İş kuralları burada yaşar, Nest dekoratörlerine bağımlı DEĞİLDİR    │
│  - Yan etkiler (mail, audit, bildirim) doğrudan çağrı değil, DOMAIN     │
│    EVENT (EventEmitter2 / internal bus) ile tetiklenir                 │
└───────┬───────────────────────┬───────────────────┬───────────────────┘
        │ Port: IRepository     │ Port: IMailProvider │ Port: IStorage
┌───────▼────────┐   ┌──────────▼─────────┐  ┌────────▼─────────┐
│  PERSISTENCE    │   │  MESAJLAŞMA/QUEUE   │  │  DOSYA / STORAGE  │
│  Prisma ORM     │   │  Redis + BullMQ     │  │  S3 uyumlu /       │
│  PostgreSQL     │   │  (mail, sla-scan,   │  │  private local     │
│                 │   │   daily-report)     │  │  + signed URL       │
└─────────────────┘   └─────────┬───────────┘  └───────────────────┘
                                  │
                       ┌──────────▼───────────┐
                       │  MAIL PROVIDER ADAPTERS│
                       │  SMTP / SES / SendGrid │
                       │  / Mailgun / Resend     │
                       └────────────────────────┘
```

**Neden bu ayrım?** İstenen "başka frameworklere taşınabilirlik" şartı, domain
servislerinin Nest'e, ORM'in Prisma'ya ve kuyruğun BullMQ'ya **arayüzler (port)**
üzerinden bağlanmasıyla sağlanır:

- `ITicketRepository`, `IMailProvider`, `IStorageProvider`, `IQueue`, `ITemplateRenderer`
  gibi soyut arayüzler domain katmanında tanımlanır.
- NestJS, Prisma, BullMQ, S3 SDK'ları bu arayüzlerin **adapter implementasyonlarıdır**.
- Adapter değişirse (örn. Prisma → Drizzle, BullMQ → SQS, NestJS → Express) domain
  servisleri ve testleri değişmeden kalır.

### 1.3 Süreç (process) topolojisi

Tek kod tabanından 3 farklı çalışma modu derlenir (NestJS `main.ts` giriş noktaları
farklı):

1. **api** — REST + Socket.IO Gateway (kullanıcı trafiği, yatayda ölçeklenir,
   Socket.IO Redis adapter ile birden çok instance arasında oda/pub-sub senkronu).
2. **worker** — BullMQ consumer'ları (mail gönderimi, SLA tarayıcı, günlük rapor,
   retry mantığı). API instance'larından bağımsız ölçeklenir, trafik artışında
   kullanıcı isteklerini bloklamaz.
3. **scheduler** — cron/repeatable job tetikleyici (tek instance, leader-election
   gerektirmeyecek şekilde BullMQ'nun repeatable job mekanizmasına devredilir).

### 1.4 Çok kiracılılık (multi-tenancy) ilkesi

Her veri erişimi `restaurant_id` (+ gerekirse `branch_id`) ile daraltılır. Bu kural
tek bir yerde değil **savunma katmanlarının her birinde** tekrarlanır: Guard
seviyesinde, Repository seviyesinde (Prisma query'lerine otomatik `where` enjeksiyonu)
ve Socket.IO oda katılım kontrolünde. Detay → Bölüm 10.

---

## 2. Modül Listesi

### 2.1 Backend (NestJS) modülleri

| Modül | Sorumluluk |
|---|---|
| `CoreModule` | Config, logger, global exception filter, response interceptor |
| `AuthModule` | Login, refresh token, JWT strategy, şifre sıfırlama |
| `PermissionsModule` | RBAC + PBAC policy engine (CASL tabanlı), guard'lar |
| `UsersModule` | Kullanıcı CRUD (restoran kullanıcısı, agent, manager, admin) |
| `RestaurantsModule` | Restoran + şube yönetimi |
| `TeamsModule` | Departman/ekip ve ekip üyeliği |
| `TicketsModule` | Ticket CRUD, lifecycle, kategori/öncelik ilişkisi |
| `TicketMessagingModule` | Mesaj, iç not, sistem mesajı, okundu bilgisi |
| `TicketAttachmentsModule` | Dosya yükleme/indirme orkestrasyonu (Storage portu üzerinden) |
| `TicketAssignmentModule` | Manuel/otomatik/round-robin atama |
| `TicketSlaModule` | SLA politika çözümleme, due-date hesaplama, ihlal taraması |
| `CannedResponsesModule` | Hazır cevap CRUD + kategori/takım filtresi |
| `TicketRatingModule` | Memnuniyet puanı |
| `RealtimeModule` | Socket.IO gateway, oda yönetimi, presence/typing |
| `NotificationsModule` | Kanal-agnostik bildirim orkestrasyonu (web/mail/[sms/push]) |
| `MailModule` | Aşağıdaki alt modüllerin konteyneri |
| &nbsp;&nbsp;`MailSettingsModule` | Provider ayarları, şifreli alanlar |
| &nbsp;&nbsp;`MailTemplateModule` | Şablon CRUD, render, önizleme |
| &nbsp;&nbsp;`MailProviderModule` | SMTP/SES/SendGrid/Mailgun/Resend adapter'ları |
| &nbsp;&nbsp;`MailQueueModule` | BullMQ producer/consumer, retry/backoff |
| &nbsp;&nbsp;`MailLogModule` | Gönderim logları |
| &nbsp;&nbsp;`MailRecipientModule` | Bildirim alıcı grupları |
| `ReportingModule` | Dashboard metrikleri, raporlar, günlük rapor job'u |
| `AuditLogModule` | Sistem geneli değişmez (append-only) audit kaydı |
| `StorageModule` | S3/local adapter, signed URL üretimi, MIME doğrulama |
| `SchedulerModule` | SLA tarayıcı, günlük rapor, mail retry repeatable job'ları |

### 2.2 Frontend (Next.js) uygulama alanları

Tek Next.js app içinde App Router route group'ları ile ayrıştırılır (paylaşılan
auth/UI altyapısı, ayrı deploy gerekirse ileride iki app'e bölünebilir):

- `app/(restoran)/destek/...` → Restoran Destek Paneli ekranları
- `app/(admin)/admin/destek/...` → Operasyon/Admin Ticket Paneli
- `app/(admin)/admin/mail/...` → Mail ayarları/şablon/log yönetimi

Paylaşılan paketler: `packages/ui` (Tailwind bileşenleri), `packages/api-client`
(tipli REST client + React Query hook'ları), `packages/realtime` (Socket.IO
wrapper hook'ları), `packages/types` (backend DTO'larıyla senkron Zod şemaları).

---

## 3. Kullanıcı Rolleri ve Yetki Matrisi

### 3.1 Roller

| Rol | Açıklama |
|---|---|
| `restaurant_user` | Restoran/şube kullanıcısı |
| `agent` | Operasyon destek personeli |
| `manager` | Operasyon yöneticisi |
| `admin` | Sistem admini |
| `super_admin` | Tüm yetkiler + hassas ayarlar (mail/SMTP) |

Yetkilendirme iki katmanlıdır:

- **RBAC (kabaca rol bazlı erişim)** — hangi ekranlara/route'lara erişilebilir.
- **PBAC (ince taneli izin)** — her aksiyon için `kaynak:aksiyon:kapsam` biçiminde
  permission string (örn. `ticket:read:own`, `ticket:read:assigned`,
  `ticket:read:team`, `ticket:read:all`). Roller, izin setlerine eşlenir; CASL
  benzeri bir policy engine ile çalışma zamanında "bu kullanıcı bu ticket'ı
  görebilir mi" sorusu tek bir merkezi `PermissionService.can(user, action, ticket)`
  üzerinden cevaplanır (controller'larda saçılmış if/else yok).

### 3.2 Yetki Matrisi

| Yetenek | restaurant_user | agent | manager | admin | super_admin |
|---|---|---|---|---|---|
| Ticket oluşturma (kendi restoranı) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kendi restoranının ticketlarını görme | ✅ own | ❌ | ❌ | ❌ | ❌ |
| Atandığı ticketları görme | ❌ | ✅ assigned | ✅ team/all | ✅ all | ✅ all |
| Boştaki ticketı üstlenme | ❌ | ✅ | ✅ | ✅ | ✅ |
| Mesaj yazma (görünür) | ✅ own ticket | ✅ assigned | ✅ | ✅ | ✅ |
| İç not ekleme | ❌ | ✅ | ✅ | ✅ | ✅ |
| Durum/öncelik/kategori değiştirme | ❌ | ✅ assigned | ✅ | ✅ | ✅ |
| Ticket atama/transfer | ❌ | ✅ (kendi üzerinden devir) | ✅ | ✅ | ✅ |
| Dosya yükleme | ✅ own ticket | ✅ assigned | ✅ | ✅ | ✅ |
| Memnuniyet puanı verme | ✅ (resolved sonrası) | ❌ | ❌ | ❌ | ❌ |
| Kategori/SLA/hazır cevap yönetimi | ❌ | ❌ | ✅ | ✅ | ✅ |
| Personel performans/atama raporu | ❌ | ❌ | ✅ | ✅ | ✅ |
| Kullanıcı/restoran/ekip yönetimi | ❌ | ❌ | ❌ | ✅ | ✅ |
| Audit log görüntüleme | ❌ | ❌ | ❌ | ✅ | ✅ |
| Mail şablonu yönetimi | ❌ | ❌ | ❌ | ✅ | ✅ |
| Mail/SMTP ayarları (hassas) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Mail alıcı grupları yönetimi | ❌ | ❌ | ✅ (öneri) | ✅ | ✅ |

> Not: "own" = sadece kendi `restaurant_id`/`branch_id` kapsamı; "assigned" =
> sadece `assigned_agent_id = currentUser.id` olan ticketlar; "team" = kullanıcının
> üyesi olduğu `support_team_members` kapsamındaki ticketlar.

---

## 4. Database ERD Açıklaması

### 4.1 Varlıklar arası ilişkiler (özet)

```
restaurants 1───N restaurant_branches
restaurants 1───N users (restaurant_user, branch_id nullable)
support_teams 1───N support_team_members N───1 users (agent/manager)
support_ticket_categories 1───N support_ticket_categories (self-ref: parent_id → alt kategori)
support_sla_policies N───1 support_ticket_categories (nullable=tüm kategoriler için varsayılan)

support_tickets N───1 restaurants
support_tickets N───1 restaurant_branches
support_tickets N───1 users               (created_by — restoran kullanıcısı)
support_tickets N───1 users               (assigned_agent_id, nullable)
support_tickets N───1 support_teams       (assigned_team_id, nullable)
support_tickets N───1 support_ticket_categories
support_tickets N───1 support_sla_policies (çözümlenmiş politika referansı, snapshot)

support_ticket_messages N───1 support_tickets
support_ticket_messages N───1 users (sender_id, nullable → system mesajı)
support_ticket_attachments N───1 support_tickets
support_ticket_attachments N───0..1 support_ticket_messages
support_ticket_status_logs N───1 support_tickets
support_ticket_assignments N───1 support_tickets
support_ticket_ratings 1───1 support_tickets
support_audit_logs N───1 (polymorphic: actor_id + actor_type, entity_type + entity_id)

mail_logs N───0..1 support_tickets (related_ticket_id)
mail_logs N───0..1 users (related_user_id)
mail_queue_jobs N───0..1 mail_logs
mail_templates (bağımsız, key ile referans alınır — FK yok, template_key string eşleşmesi)
mail_recipients (bağımsız, type bazlı gruplama)
```

### 4.2 Tasarım kararları

- **Tek `users` tablosu, rol enum'lu.** Restoran kullanıcısı, agent, manager,
  admin aynı tabloda `role` alanıyla ayrılır; `restaurant_id`/`branch_id` sadece
  `restaurant_user` rolünde dolu olur. Bu, auth/permission katmanını sadeleştirir
  ve mevcut "Paketçiniz" sistemindeki kullanıcı modeliyle kavramsal tutarlılık
  sağlar.
- **Kurye/sipariş referansları gevşek bağ (loose coupling).** `support_tickets.courier_ref`
  ve `support_tickets.order_number` alanları, ana B2B/Bayi sistemindeki kurye ve
  sipariş kayıtlarına **FK ile değil, dış referans (string/id) ile** bağlanır.
  Çünkü kurye/sipariş verisi başka bir bounded context'te (mevcut Express/SQLite
  sistemde) yaşıyor; sıkı FK bu iki sistemi gereksiz yere kenetler.
- **`support_ticket_assignments` geçmiş tablosu + ticket üzerinde "current" alanlar.**
  Ticket'ta `assigned_agent_id`/`assigned_team_id` (hızlı sorgu için denormalize),
  her değişiklik `support_ticket_assignments`'a satır olarak eklenir (geçmiş ve
  performans raporları için).
- **Soft delete** sadece kullanıcı tarafından "silinebilir" görünen varlıklarda
  (mesajlar — `deleted_at`) uygulanır. Ticket, audit log, mail log gibi kayıtlar
  **hiçbir zaman silinmez** (uyumluluk/denetim gereksinimi).
- **Audit log polymorphic actor** (`actor_id` + `actor_type`: `user` | `system`)
  ile hem insan hem otomasyon kaynaklı olayları aynı tabloda tutar.

---

## 5. Ana Tablo Listesi

**Temel:** `users`, `restaurants`, `restaurant_branches`

**Ticket:** `support_tickets`, `support_ticket_messages`, `support_ticket_attachments`,
`support_ticket_categories`, `support_ticket_priorities` *(opsiyonel lookup —
detayda enum + ayrı görsel/etiket tablosu olarak değerlendirilecek)*,
`support_ticket_status_logs`, `support_ticket_assignments`, `support_teams`,
`support_team_members`, `canned_responses`, `support_notifications`,
`support_sla_policies`, `support_ticket_ratings`, `support_audit_logs`

**Mail:** `mail_settings`, `mail_templates`, `mail_logs`, `mail_queue_jobs`,
`mail_recipients`, `mail_template_variables`

> Alan listeleri, tip, index, FK, unique constraint, soft-delete kararları ve
> Prisma model kodu **Bölüm 4 — Prisma schema** adımında (kullanıcı "devam"
> dediğinde) tek tek detaylandırılacaktır.

---

## 6. Backend Servis Mimarisi

### 6.1 Çağrı yönü ve event-driven ayrıştırma

```
Controller → Service (domain) → Repository (Prisma)
                  │
                  └─ emit("ticket.created" | "ticket.message.created" | ...)
                                  │
                  ┌───────────────┼────────────────────┐
                  ▼               ▼                     ▼
        AuditLogListener   SlaListener            MailNotificationService
        (her olayı loglar)  (due-date set,         (event → şablon/alıcı kararı
                             warning/breach          → MailQueueService.enqueue)
                             planlar)
```

Bu ayrım, kuraldaki **"mail gönderimi request içinde yapılmamalı"** şartını
mimari düzeyde garanti eder: `TicketService.create()` mail göndermeyi *bilmez*;
sadece `ticket.created` event'i yayınlar. Mail göndermek/göndermemek tamamen
`MailNotificationService`'in event dinleyicisinde karara bağlanır.

### 6.2 Servis envanteri

**Ticket tarafı:** `TicketService`, `TicketMessageService`, `TicketAssignmentService`,
`TicketSlaService`, `TicketNotificationService`, `TicketAttachmentService`,
`TicketReportService`, `TicketAuditLogService`, `CannedResponseService`,
`PermissionService`

**Mail tarafı:** `MailService` (fasad), `MailProviderService` (strategy seçici),
`MailTemplateService`, `MailQueueService`, `MailLogService`, `MailSettingsService`,
`MailNotificationService` (event listener), `DailyReportMailService`

Her servis tek sorumluluk taşır; controller'lar sadece DTO doğrulama + servis
çağrısı + response zarfı oluşturma yapar (ince controller ilkesi).

---

## 7. Realtime Mimarisi

- **Namespace:** `/support`. **Oda adlandırma:** `ticket:{ticketId}`.
- **Auth:** Socket handshake'inde aynı JWT access token REST ile paylaşılır;
  bağlantı kurulurken `WsJwtGuard` doğrulama yapar.
- **Yetkilendirme — savunma derinliği:** `ticket:join` event'inde, sadece oda adına
  güvenilmez; sunucu tarafında **REST ile aynı PermissionService** tekrar çalıştırılır
  (restoran kullanıcısı sadece kendi `restaurant_id`'sine ait ticket odasına,
  agent sadece yetkili olduğu ticket odasına katılabilir).
- **Tek doğruluk kaynağı (single source of truth):** Mesaj önce DB'ye yazılır
  (`TicketMessageService.create`), başarılı olursa aynı işlem `ticket:message:new`
  olarak odaya yayınlanır. Sadece soket üzerinden "broadcast-only" mesaj YOKTUR —
  bağlantı kopsa da mesaj kalıcıdır.
- **Idempotency:** İstemci tarafında üretilen `clientMessageId` (UUID) ile
  çift gönderim/duplicate önlenir.
- **Ölçeklenebilirlik:** Birden fazla `api` process'i arasında oda/pub-sub senkronu
  için Socket.IO Redis adapter kullanılır; presence/typing gibi geçici state
  Redis'te kısa TTL'li key'ler olarak tutulur (DB'ye yazılmaz).
- **Olay kataloğu** (kullanıcı tarafından verilen spesifikasyonla aynı):
  - Client → Server: `ticket:join`, `ticket:leave`, `ticket:message:send`,
    `ticket:typing:start`, `ticket:typing:stop`, `ticket:read`
  - Server → Client: `ticket:message:new`, `ticket:status:changed`,
    `ticket:assigned`, `ticket:priority:changed`, `ticket:typing`, `ticket:read`,
    `ticket:sla:warning`, `ticket:closed`

---

## 8. Mail Sistemi Mimarisi

```
Domain Event (ticket.created, ticket.message.created, ticket.sla.warning, ...)
        │
        ▼
MailNotificationService  — "gönderilmeli mi? hangi şablon? hangi alıcı(lar)?"
        │  (iç notlar burada elenir — asla bu noktayı geçemez)
        ▼
MailQueueService.enqueue({ templateKey, variables, recipient, dedupeKey })
        │  (BullMQ — Redis backed, retry/backoff, anti-spam debounce penceresi)
        ▼
[Worker process]  MailQueueProcessor
        │
        ├─ MailTemplateService.render(templateKey, variables)   → escape/sanitize
        ├─ MailProviderService.getActiveProvider()              → Strategy seçimi
        ├─ provider.send(renderedMessage)                       → SMTP/SES/SendGrid/...
        └─ MailLogService.record(result)                        → sent/failed + retry_count
```

- **Provider abstraction:** Tüm sağlayıcılar `IMailProvider { send(message): Promise<MailSendResult> }`
  arayüzünü uygular (`SmtpMailProvider`, `SesMailProvider`, `SendgridMailProvider`,
  `MailgunMailProvider`, `ResendMailProvider`). Aktif provider, şifreli ayarlar
  üzerinden `MailProviderService` tarafından runtime'da seçilir — kod değişikliği
  gerekmez, sadece admin panelden ayar değişir.
- **Template engine soyutlaması:** `ITemplateRenderer` portu; ilk fazda
  Handlebars/React Email tabanlı bir implementasyon, ihtiyaç halinde MJML'e
  geçilebilir.
- **Anti-spam/gruplama (kullanıcı kuralı #19):** Aynı ticket+alıcı için kısa
  pencerede (örn. 120 sn) gelen ardışık "yeni mesaj" event'leri, Redis'te
  `dedupeKey` ile biriktirilip **gecikmeli tek bir BullMQ job'u** olarak
  flush edilir; böylece operasyon personeli art arda 5 mesaj yazsa kullanıcıya
  5 ayrı mail gitmez.
- **İç notlar asla bu pipeline'a girmez:** `MailNotificationService`, mesaj
  tipi `internal_note` olan event'leri en başta filtreler — mimari garanti,
  sonradan eklenen bir kontrol değil.
- **Kritik/urgent ticketlar anında, normal ticketlar özet/toplu** gönderim
  politikası `MailSettingsModule` üzerinden yapılandırılabilir.

---

## 9. Admin ve Restoran Panel Ekranları

**Restoran paneli:** Destek merkezi ana sayfa, yeni ticket oluşturma, ticket
listem, ticket detay + canlı mesajlaşma, dosya yükleme, durum görüntüleme,
memnuniyet puanı, geçmiş ticketlar.

**Admin/Operasyon paneli:** Dashboard, ticket listesi + filtreleme, ticket
detay + chat paneli, atama paneli, SLA ihlal ekranı, kategori yönetimi, hazır
cevap yönetimi, SLA politika yönetimi, ekip/personel performansı, raporlama,
sistem/audit logları.

**Mail admin paneli:** Mail ayarları, şablon listesi/editörü/önizleme, mail
logları, alıcı grup yönetimi, günlük rapor mail ayarları, test mail gönderimi.

> Sayfa bazlı bileşen ağacı, layout (3 panelli operasyon ekranı: liste/chat/
> bilgi paneli) ve UX detayları **Bölüm 19-21** (frontend) adımlarında kodla
> birlikte detaylandırılacak.

---

## 10. Güvenlik Mimarisi

### 10.1 Guard zinciri (her korumalı istek için)

```
JwtAuthGuard → TenantScopeGuard → PermissionsGuard(action, resource) → Controller
```

- **JwtAuthGuard:** Token doğrulama, kullanıcıyı `request.user`'a bağlama.
- **TenantScopeGuard:** `restaurant_user` için otomatik `restaurant_id`/`branch_id`
  filtresini request bağlamına enjekte eder; Prisma sorgularında bu filtre
  **merkezi bir repository katmanından** geçer (controller'da unutulması mümkün
  olan dağınık `where` kodu yerine).
- **PermissionsGuard:** CASL benzeri policy ile `PermissionService.can(user, action, resource)`
  kontrolü (Bölüm 3.1).

### 10.2 IDOR koruması

Ticket'a erişim **hiçbir zaman** sadece `id` ile sorgulanmaz; her sorgu
`id + (restaurant_id veya assigned/team kapsamı)` composite koşuluyla çalışır.
URL'deki `id` değiştirilerek başka restoranın ticket'ı görüntülenemez — kayıt
bulunamazsa 404 (403 ile bilgi sızdırmamak için "yok" gibi davranılır).

### 10.3 Diğer önlemler

- **Socket güvenliği:** REST ile aynı guard zinciri handshake + her `join`'de.
- **Dosya güvenliği:** Private bucket/disk, kısa ömürlü signed URL, indirme
  endpoint'i izin kontrollü, MIME + magic-byte doğrulama, AV tarama için adapter
  arayüzü (`IVirusScanner`) bırakılır (ilk fazda no-op/opsiyonel entegrasyon).
- **Rate limiting:** Global + endpoint özel (login, ticket create, mesaj
  gönderme için daha sıkı limit) — NestJS Throttler.
- **Input/Output sanitization:** DTO seviyesinde class-validator/Zod; mesaj
  içeriği `sanitize-html` ile; mail template render'ında değişken interpolasyonu
  otomatik escape edilir (XSS'e karşı).
- **SQL injection:** Prisma parametrize sorgular; raw SQL kullanımı gerekirse
  parametre binding zorunlu kod inceleme kuralı.
- **Audit log değiştirilemezliği:** Repository sadece `create` metodu sunar;
  DB kullanıcısına `UPDATE`/`DELETE` izni verilmez (DB seviyesi `REVOKE`).
- **Sır yönetimi:** SMTP şifresi/API key'ler AES-256-GCM ile alan seviyesi
  şifrelenir, anahtar ortam değişkeninden/KMS'den okunur; sadece `super_admin`
  düz metni görebilecek decrypt akışına sahiptir, şifre asla API response'unda
  geri dönmez (write-only alan).
- **KVKK/PII maskeleme:** Telefon/isim maskeleme, mail/log render katmanında
  uygulanan ortak bir `maskPii()` yardımcı fonksiyonu ile (ham veri DB'de durur,
  sadece görünüm/mail çıkışı maskelenir).
- **Ticket linkleri:** Daima auth gerektirir; "public/signed link" senaryosu
  açılırsa kısa ömürlü, tek kullanımlık imzalı token + expiration ile.

---

## 11. SLA ve Bildirim Mimarisi

- **Politika çözümleme:** Ticket oluşturulurken kategori+öncelik eşleşmesine göre
  `support_sla_policies`'ten `first_response_minutes`/`resolution_minutes` okunur,
  ticket üzerine **snapshot** olarak (`first_response_due_at`, `resolution_due_at`)
  yazılır — politika sonradan değişse bile açık ticket'ın taahhüdü sabit kalır.
- **Tarayıcı job:** BullMQ repeatable job (örn. her 60 sn) açık ticketları
  index'li sorgu ile tarar (`status NOT IN (resolved,closed,cancelled) AND
  resolution_due_at < now() + threshold`); idempotency `sla_warning_sent_at`/
  `sla_breached_at` alanlarıyla sağlanır (aynı uyarı iki kez tetiklenmez).
- **Bildirim orkestrasyonu:** Tek giriş noktası `NotificationsModule`; her event
  tipi için kanal fan-out (web/socket realtime + mail + ileride sms/push) —
  her kanal kendi adapter'ı (`IWebNotifier`, `IMailNotifier`, ...).

---

## 12. Raporlama Mimarisi

- **Canlı metrikler** (örn. "şu an açık ticket sayısı") doğrudan OLTP sorgusu;
  index'li ve filtre bazlı.
- **Ağır/sık tekrar eden dashboard sorguları** Redis'te cache-aside (TTL 1-5 dk).
- **Günlük rapor:** Scheduler → `DailyReportMailService.generate()` → agregasyon
  sorguları → sonuç hem mail job payload'ı olur hem admin panelde "detaylı rapor"
  görünümü için saklanabilir (ileri fazda `support_daily_reports` snapshot tablosu
  değerlendirilecek).
- **Personel/restoran/kategori bazlı dağılımlar** group-by sorguları + gerekirse
  materialized view (PostgreSQL) ile performans optimizasyonu.

---

## 13. Geliştirme Sırası

1. ✅ Genel sistem mimarisi *(bu doküman)*
2. Kullanıcı rolleri ve yetki matrisi — detaylandırma
3. Database ERD açıklaması — detaylandırma
4. Prisma schema ve migration yapısı
5. Auth ve permission sistemi
6. Ticket backend modülü
7. Ticket mesajlaşma modülü
8. Dosya yükleme modülü
9. SLA ve bildirim modülü
10. Mail sistemi mimarisi — detaylandırma
11. Mail database tabloları
12. Mail provider abstraction
13. SMTP provider örneği
14. Mail queue worker
15. Mail template sistemi
16. Admin mail ayarları API'leri
17. Ticket eventlerinden mail tetikleme
18. WebSocket canlı chat
19. Restoran frontend ekranları
20. Admin ticket paneli
21. Admin mail ayarları paneli
22. Raporlama sistemi
23. Günlük rapor mail job sistemi
24. Testler
25. Production deployment önerileri

**"Devam"** dendiğinde sırasıyla 2. adımdan başlanacak; her adım ilgili kod ve
(varsa) migration ile birlikte teslim edilecektir.
