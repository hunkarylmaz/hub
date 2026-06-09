# Bir Tıkla e-İmza - birtiklaeimza.com

Profesyonel e-imza hizmetleri web sitesi ve admin paneli.

## Geliştirme

### Backend (port 3001)
```bash
cd backend
npm install
node server.js
```

### Frontend (port 5174)
```bash
cd frontend
npm install
npm run dev
```

## Admin Panel
- URL: http://localhost:5174/admin
- Kullanıcı: `admin`
- Şifre: `Admin123!`

## Production Build
```bash
cd frontend && npm run build
cd ../backend && node server.js
```
Frontend build `frontend/dist/` klasörüne çıkar, backend production modunda bunu serve eder.

## Özellikler
- Profesyonel anasayfa (Hero, Ürünler, Fiyatlar, SSS, Yorumlar, Footer)
- Admin paneli: ürün, fiyat, içerik, sipariş, mesaj yönetimi
- SQLite veritabanı (kurulum gerektirmez)
- JWT kimlik doğrulama
