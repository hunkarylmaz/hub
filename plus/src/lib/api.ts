const BASE = '/api/plus'

function partnerToken() { return localStorage.getItem('plus_partner_token') }
function tasiyiciToken() { return localStorage.getItem('plus_tasiyici_token') }
function adminToken() { return localStorage.getItem('plus_admin_token') }
function altToken() { return localStorage.getItem('plus_alt_token') }

async function req(url: string, opts: RequestInit = {}, token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { ...opts, headers: { ...headers, ...(opts.headers as Record<string,string> || {}) } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'Hata oluştu')
  }
  return res.json()
}

export interface Partner {
  id: number
  firma_adi: string
  yetkili_ad: string
  email: string
  telefon: string
  aktif: number
}

export interface Tasiyici {
  id: number
  ad: string
  email: string
  telefon: string
  arac_tipi: string
  aktif: number
}

export type PaketBoyutu = 'Zarf' | 'Küçük' | 'Orta' | 'Büyük' | 'Koli'
export type IsDurum = 'Havuzda' | 'Alındı' | 'Yolda' | 'Teslim Edildi' | 'İptal'
export type HizmetTuru = 'adres_dagitim' | 'adres_toplama' | 'otogar_alis' | 'kargo_geri'

export const HIZMET_TURU_LABELS: Record<HizmetTuru, string> = {
  adres_dagitim: 'Adres Dağıtım',
  adres_toplama: 'Adres Toplama',
  otogar_alis:   'Otogar Alış',
  kargo_geri:    'Kargo İade',
}

export interface FiyatDetay {
  is_turu: HizmetTuru
  baz_fiyat: number
  kdv_orani: number
  kdv_tutari: number
  toplam: number
}

export interface Is {
  id: number
  partner_id: number
  partner_firma?: string
  tasiyici_id: number | null
  tasiyici_ad?: string | null
  qr_kodu: string
  durum: IsDurum
  is_turu?: HizmetTuru
  fiyat_detay?: string
  kdv_orani?: number
  kdv_tutari?: number
  alis_il: string
  alis_ilce: string
  alis_mahalle: string
  alis_adres: string
  birakilis_il: string
  birakilis_ilce: string
  birakilis_mahalle: string
  birakilis_adres: string
  gonderici_ad: string
  gonderici_telefon: string
  alici_ad: string
  alici_telefon: string
  paket_boyutu: PaketBoyutu
  aciklama: string | null
  alinma_saati: string
  fiyat: number
  olusturma: string
  guncelleme: string
}

export interface IsForm {
  alis_il: string; alis_ilce: string; alis_mahalle: string; alis_adres: string
  birakilis_il: string; birakilis_ilce: string; birakilis_mahalle: string; birakilis_adres: string
  gonderici_ad: string; gonderici_telefon: string
  alici_ad: string; alici_telefon: string
  paket_boyutu: PaketBoyutu; aciklama: string; alinma_saati: string
  is_turu?: HizmetTuru
}

export interface Admin { id: number; ad: string; email: string; tip?: string }
export interface AdminUser { id: number; ad: string; email: string; tip: string; aktif: number; olusturma: string }
export interface Fiyat { id: number; il: string; ilce: string | null; mahalle: string | null; fiyat: number; tur: HizmetTuru; aktif: number }
export interface Ayar { anahtar: string; deger: string; aciklama: string | null }

export interface AltKullanici {
  id: number
  partner_id: number
  firma_adi: string
  ad: string
  unvan: string | null
  email: string
  telefon: string | null
  il: string | null
  ilce: string | null
  mahalle: string | null
  adres: string | null
  aktif: number
}

export interface AltIs {
  id: number
  alt_kullanici_id: number
  partner_id: number
  durum: IsDurum
  paket_boyutu: PaketBoyutu
  aciklama: string | null
  olusturma: string
  guncelleme: string
}

export interface PartnerBorc {
  id: number; firma_adi: string; yetkili_ad: string; telefon: string; email: string
  toplam_borc: number; toplam_odendi: number; kalan_borc: number
  havuzda: number; aktif: number; tamamlandi: number
}

export const api = {
  admin: {
    login: (email: string, sifre: string) =>
      req(`${BASE}/admin/login`, { method: 'POST', body: JSON.stringify({ email, sifre }) }),
    me: () => req(`${BASE}/admin/me`, {}, adminToken()),
    stats: () => req(`${BASE}/admin/stats`, {}, adminToken()),
    partnerler: {
      list: () => req(`${BASE}/admin/partnerler`, {}, adminToken()),
      create: (d: Record<string, unknown>) => req(`${BASE}/admin/partnerler`, { method: 'POST', body: JSON.stringify(d) }, adminToken()),
      update: (id: number, d: Record<string, unknown>) => req(`${BASE}/admin/partnerler/${id}`, { method: 'PUT', body: JSON.stringify(d) }, adminToken()),
      remove: (id: number) => req(`${BASE}/admin/partnerler/${id}`, { method: 'DELETE' }, adminToken()),
    },
    tasiyicilar: {
      list: () => req(`${BASE}/admin/tasiyicilar`, {}, adminToken()),
      create: (d: Record<string, unknown>) => req(`${BASE}/admin/tasiyicilar`, { method: 'POST', body: JSON.stringify(d) }, adminToken()),
      update: (id: number, d: Record<string, unknown>) => req(`${BASE}/admin/tasiyicilar/${id}`, { method: 'PUT', body: JSON.stringify(d) }, adminToken()),
      remove: (id: number) => req(`${BASE}/admin/tasiyicilar/${id}`, { method: 'DELETE' }, adminToken()),
    },
    isler: {
      list: (durum?: string, partner_id?: number) =>
        req(`${BASE}/admin/isler?durum=${durum||''}&partner_id=${partner_id||''}`, {}, adminToken()),
      ata: (id: number, tasiyici_id: number) =>
        req(`${BASE}/admin/is/${id}/ata`, { method: 'PUT', body: JSON.stringify({ tasiyici_id }) }, adminToken()),
      fiyatGuncelle: (id: number, fiyat: number) =>
        req(`${BASE}/admin/is/${id}/fiyat`, { method: 'PUT', body: JSON.stringify({ fiyat }) }, adminToken()),
    },
    fiyatlar: {
      list: () => req(`${BASE}/admin/fiyatlar`, {}, adminToken()),
      create: (d: Partial<Fiyat>) => req(`${BASE}/admin/fiyatlar`, { method: 'POST', body: JSON.stringify(d) }, adminToken()),
      update: (id: number, d: Partial<Fiyat>) => req(`${BASE}/admin/fiyatlar/${id}`, { method: 'PUT', body: JSON.stringify(d) }, adminToken()),
      remove: (id: number) => req(`${BASE}/admin/fiyatlar/${id}`, { method: 'DELETE' }, adminToken()),
    },
    ayarlar: {
      list: () => req(`${BASE}/admin/ayarlar`, {}, adminToken()),
      update: (anahtar: string, deger: string) =>
        req(`${BASE}/admin/ayarlar/${anahtar}`, { method: 'PUT', body: JSON.stringify({ deger }) }, adminToken()),
    },
    adminler: {
      list: () => req(`${BASE}/admin/adminler`, {}, adminToken()),
      create: (d: Record<string, unknown>) =>
        req(`${BASE}/admin/adminler`, { method: 'POST', body: JSON.stringify(d) }, adminToken()),
      update: (id: number, d: Record<string, unknown>) =>
        req(`${BASE}/admin/adminler/${id}`, { method: 'PUT', body: JSON.stringify(d) }, adminToken()),
      remove: (id: number) => req(`${BASE}/admin/adminler/${id}`, { method: 'DELETE' }, adminToken()),
    },
    borclar: {
      list: () => req(`${BASE}/admin/borclar`, {}, adminToken()),
      ode: (partner_id: number, miktar: number, aciklama: string) =>
        req(`${BASE}/admin/borclar/${partner_id}/ode`, { method: 'POST', body: JSON.stringify({ miktar, aciklama }) }, adminToken()),
      detay: (partner_id: number) => req(`${BASE}/admin/borclar/${partner_id}/detay`, {}, adminToken()),
    },
  },
  partner: {
    login: (email: string, sifre: string) =>
      req(`${BASE}/partner/login`, { method: 'POST', body: JSON.stringify({ email, sifre }) }),
    me: () => req(`${BASE}/partner/me`, {}, partnerToken()),
    isOlustur: (data: IsForm) =>
      req(`${BASE}/is`, { method: 'POST', body: JSON.stringify(data) }, partnerToken()),
    islerim: (durum?: string) =>
      req(`${BASE}/is?durum=${durum || ''}`, {}, partnerToken()),
    isDetay: (id: number) =>
      req(`${BASE}/is/${id}`, {}, partnerToken()),
    isIptal: (id: number) =>
      req(`${BASE}/is/${id}/iptal`, { method: 'PUT' }, partnerToken()),
    altKullanicilar: {
      list: () => req(`${BASE}/partner/alt-kullanicilar`, {}, partnerToken()),
      create: (d: Record<string, unknown>) =>
        req(`${BASE}/partner/alt-kullanicilar`, { method: 'POST', body: JSON.stringify(d) }, partnerToken()),
      update: (id: number, d: Record<string, unknown>) =>
        req(`${BASE}/partner/alt-kullanicilar/${id}`, { method: 'PUT', body: JSON.stringify(d) }, partnerToken()),
    },
  },
  alt: {
    login: (email: string, sifre: string) =>
      req(`${BASE}/alt/login`, { method: 'POST', body: JSON.stringify({ email, sifre }) }),
    me: () => req(`${BASE}/alt/me`, {}, altToken()),
    islerim: () => req(`${BASE}/alt/islerim`, {}, altToken()),
    isOlustur: (data: { paket_boyutu: PaketBoyutu; aciklama: string }) =>
      req(`${BASE}/alt/is`, { method: 'POST', body: JSON.stringify(data) }, altToken()),
  },
  tasiyici: {
    login: (email: string, sifre: string) =>
      req(`${BASE}/tasiyici/login`, { method: 'POST', body: JSON.stringify({ email, sifre }) }),
    me: () => req(`${BASE}/tasiyici/me`, {}, tasiyiciToken()),
    havuz: (il?: string, ilce?: string) =>
      req(`${BASE}/havuz?il=${il || ''}&ilce=${ilce || ''}`, {}, tasiyiciToken()),
    isAl: (id: number) =>
      req(`${BASE}/havuz/${id}/al`, { method: 'PUT' }, tasiyiciToken()),
    islerim: () =>
      req(`${BASE}/tasiyici/islerim`, {}, tasiyiciToken()),
    yolda: (id: number) =>
      req(`${BASE}/is/${id}/yolda`, { method: 'PUT' }, tasiyiciToken()),
    teslimEt: (id: number) =>
      req(`${BASE}/is/${id}/teslim`, { method: 'PUT' }, tasiyiciToken()),
    isDetay: (id: number) =>
      req(`${BASE}/is/${id}`, {}, tasiyiciToken()),
    isByQr: (qr_kodu: string) =>
      req(`${BASE}/tasiyici/is-by-qr/${encodeURIComponent(qr_kodu)}`, {}, tasiyiciToken()),
    qrTara: (qr_kodu: string, aksiyon: 'al' | 'yolda' | 'teslim') =>
      req(`${BASE}/tasiyici/qr-tara`, { method: 'POST', body: JSON.stringify({ qr_kodu, aksiyon }) }, tasiyiciToken()),
  },
}
