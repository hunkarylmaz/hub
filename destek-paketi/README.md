# Destek Paketi — Paketçiniz Canlı Destek / Ticket Sistemi

WhatsApp gruplarının yerini alacak; restoran, kurye ve operasyon ekibi arasındaki
destek akışını tek bir kurumsal panel üzerinden yöneten ticket + canlı destek sistemi.

Bu klasör, mevcut "Paketçiniz" monorepo'su içinde **bağımsız bir alt sistem** olarak
geliştirilecektir (mevcut `src/`, `bayi/`, `plus/`, `backend/` uygulamalarına dokunmadan).

## Teknoloji yığını

| Katman      | Teknoloji                                              |
|-------------|----------------------------------------------------------|
| Backend     | Node.js + NestJS                                          |
| Frontend    | Next.js + React + TypeScript                              |
| Database    | PostgreSQL                                                |
| ORM         | Prisma                                                     |
| Realtime    | Socket.IO                                                  |
| Queue/Cache | Redis + BullMQ                                             |
| Dosya       | S3 uyumlu storage / private local storage (adapter)        |
| Auth        | JWT + RBAC/PBAC                                            |
| UI          | Tailwind CSS                                               |
| Validation  | Zod / class-validator                                      |
| Test        | Jest                                                       |
| Mail        | SMTP, SES, SendGrid, Mailgun, Resend (provider abstraction) |

Mimari, framework/ORM/queue/mail-provider bağımlılıklarını **port & adapter**
sınırlarının arkasına alacak şekilde tasarlanır; böylece NestJS→başka bir framework,
Prisma→başka bir ORM, BullMQ→başka bir kuyruk geçişleri domain kodunu kırmadan yapılabilir.

## Klasör planı (ilerleyen adımlarda doldurulacak)

```
destek-paketi/
  docs/                 mimari, ERD, API ve karar dokümanları
  backend/              NestJS API + Socket.IO gateway + BullMQ worker'lar (sonraki adım)
  web/                  Next.js restoran destek paneli + admin paneli (sonraki adım)
  packages/             paylaşılan tipler / api-client / ui-kit (gerekirse)
```

## Geliştirme yol haritası

- [x] 1. Genel sistem mimarisi
- [ ] 2. Kullanıcı rolleri ve yetki matrisi (detaylı)
- [ ] 3. Database ERD açıklaması (detaylı)
- [ ] 4. Prisma schema ve migration yapısı
- [ ] 5. Auth ve permission sistemi
- [ ] 6. Ticket backend modülü
- [ ] 7. Ticket mesajlaşma modülü
- [ ] 8. Dosya yükleme modülü
- [ ] 9. SLA ve bildirim modülü
- [ ] 10. Mail sistemi mimarisi (detaylı)
- [ ] 11. Mail database tabloları
- [ ] 12. Mail provider abstraction
- [ ] 13. SMTP provider örneği
- [ ] 14. Mail queue worker
- [ ] 15. Mail template sistemi
- [ ] 16. Admin mail ayarları API'leri
- [ ] 17. Ticket eventlerinden mail tetikleme
- [ ] 18. WebSocket canlı chat
- [ ] 19. Restoran frontend ekranları
- [ ] 20. Admin ticket paneli
- [ ] 21. Admin mail ayarları paneli
- [ ] 22. Raporlama sistemi
- [ ] 23. Günlük rapor mail job sistemi
- [ ] 24. Testler
- [ ] 25. Production deployment önerileri

İlk faz çıktısı `docs/01-mimari.md` dosyasındadır. Sıradaki adım kullanıcı "devam"
dediğinde işlenecektir.
