# Paketçi Destek Chrome Extension + Backend

Paketçi web panelinde paket/sipariş satırlarına ve detay sayfasına "Destek Talebi
Oluştur" butonu ekleyen Chrome Extension (Manifest V3) ve bu talepleri işleyip
Google SMTP üzerinden profesyonel mail gönderen bağımsız NestJS backend'i.

> Bu proje, `destek-paketi/` altında tasarlanan kapsamlı kurumsal ticket sistemiyle
> aynı vizyonu paylaşır ancak **bağımsız, daha hafif bir MVP** olarak çalışır:
> kendi PostgreSQL veritabanı (`paketci_support`), kendi backend süreci, Paketçi
> API'sine bağımlılık yok (veriler DOM'dan okunur). Mail provider sözleşmesi
> (`IMailProvider`), `destek-paketi` sistemindeki mail mimarisiyle aynı şekle
> sahip olacak şekilde tasarlanır; ileride ortak bir pakete çıkarılabilir.

## Neden ayrı klasör?

- Repo kökünde zaten mevcut bir `backend/` (Express + SQLite, B2B/Bayi/Plus
  sistemleri) bulunuyor — isim çakışmasını önlemek için bu proje kendi
  `paketci-destek-extension/backend` köküne sahiptir.
- `destek-paketi/backend` ise gelecekteki kapsamlı kurumsal ticket sistemine
  ayrılmıştır (henüz kodlanmadı). Bu extension MVP'si kendi DB'si ve kendi
  deploy birimi ile tamamen ayrı çalışır.

## Klasör planı

```
paketci-destek-extension/
  docs/                  mimari ve karar dokümanları
  chrome-extension/       Manifest V3 eklenti kaynak kodu (sonraki adım)
  backend/                NestJS API + Prisma + BullMQ + Google SMTP (sonraki adım)
```

## Geliştirme yol haritası

- [x] 1. Genel mimari, UI/UX, backend, mail, DB, güvenlik, kurulum, test planı
- [ ] 2. manifest.json
- [ ] 3. config.js
- [ ] 4. content.js
- [ ] 5. paketciAdapter.js
- [ ] 6. supportPanel.js
- [ ] 7. styles.css
- [ ] 8. apiClient.js
- [ ] 9. popup.html / popup.js / popup.css
- [ ] 10. NestJS backend kurulumu
- [ ] 11. Prisma schema
- [ ] 12. Extension controller/service/dto
- [ ] 13. Ticket service
- [ ] 14. Google SMTP mail provider
- [ ] 15. Mail queue worker
- [ ] 16. Admin mail template
- [ ] 17. Kullanıcı mail template
- [ ] 18. .env.example
- [ ] 19. Kurulum komutları
- [ ] 20. Test komutları
- [ ] 21. Production deployment notları

Faz 1 çıktısı: `docs/01-mimari.md`. "Devam" dendiğinde 2. adımdan başlanacak.
