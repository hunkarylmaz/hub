const BASE = '/api/plus'

function partnerToken() { return localStorage.getItem('plus_partner_token') }
function tasiyiciToken() { return localStorage.getItem('plus_tasiyici_token') }
function adminToken() { return localStorage.getItem('plus_admin_token') }

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

export interface Is {
  id: number
  partner_id: number
  partner_firma?: string
  tasiyici_id: number | null
  tasiyici_ad?: string | null
  qr_kodu: string
  durum: IsDurum
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
}

export interface Admin { id: number; ad: string; email: string }
export interface Fiyat { id: number; il: string; ilce: string | null; mahalle: string | null; fiyat: number; aktif: number }
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
  },
}
