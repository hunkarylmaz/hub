const BASE = '/api/plus'

function partnerToken() { return localStorage.getItem('plus_partner_token') }
function tasiyiciToken() { return localStorage.getItem('plus_tasiyici_token') }

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

export const api = {
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
