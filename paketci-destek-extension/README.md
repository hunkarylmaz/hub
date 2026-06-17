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
  chrome-extension/       Manifest V3 eklenti kaynak kodu
  backend/                NestJS API + Prisma + BullMQ + Google SMTP
```

## Geliştirme yol haritası

- [x] 1. Genel mimari, UI/UX, backend, mail, DB, güvenlik, kurulum, test planı
- [x] 2. manifest.json
- [x] 3. config.js
- [x] 4. content.js
- [x] 5. paketciAdapter.js
- [x] 6. supportPanel.js
- [x] 7. styles.css
- [x] 8. apiClient.js
- [x] 9. popup.html / popup.js / popup.css
- [x] 10. NestJS backend kurulumu
- [x] 11. Prisma schema
- [x] 12. Extension controller/service/dto
- [x] 13. Ticket service
- [x] 14. Google SMTP mail provider
- [x] 15. Mail queue worker
- [x] 16. Admin mail template
- [x] 17. Kullanıcı mail template
- [x] 18. .env.example
- [x] 19. Kurulum komutları
- [x] 20. Test komutları
- [x] 21. Production deployment notları

Faz 1 çıktısı: `docs/01-mimari.md`. Backend ve eklenti kodu tamamlandı;
kurulum adımları, test senaryoları ve production deployment notları için
[`backend/README.md`](./backend/README.md) bakın.
