const BASE = '/api/ik'

function token() { return localStorage.getItem('ik_admin_token') }

async function req(url: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const t = token()
  if (t) headers['Authorization'] = `Bearer ${t}`
  const res = await fetch(url, { ...opts, headers: { ...headers, ...(opts.headers as Record<string, string> || {}) } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'Bir hata oluştu')
  }
  return res.json()
}

export interface Admin { id: number; ad: string; email: string }

export interface Bolge {
  id: number
  ad: string
  il: string | null
  aciklama: string | null
  renk: string
  aktif: number
  olusturma: string
  personel_sayisi: number
}

export type PersonelDurum = 'Aktif' | 'Pasif' | 'İzinli'

export interface Personel {
  id: number
  ad_soyad: string
  telefon: string | null
  email: string | null
  tc_no: string | null
  pozisyon: string
  bolge_id: number | null
  bolge_ad?: string | null
  bolge_renk?: string | null
  ise_giris_tarihi: string | null
  durum: PersonelDurum
  maas: number | null
  adres: string | null
  notlar: string | null
  olusturma: string
}

export interface VardiyaGun {
  gun: number
  gun_adi: string
  tarih: string
  baslangic: string | null
  bitis: string | null
  off: boolean
}

export interface VardiyaPersonel {
  id: number
  ad_soyad: string
  pozisyon: string
  telefon: string | null
  bolge_id: number | null
  bolge_ad: string | null
  gunler: VardiyaGun[]
  haftalik_toplam: number
}

export interface VardiyaPlani {
  hafta_baslangic: string
  gun_adlari: string[]
  personeller: VardiyaPersonel[]
}

export type IzinDurum = 'Beklemede' | 'Onaylandı' | 'Reddedildi'

export interface Izin {
  id: number
  personel_id: number
  ad_soyad: string
  bolge_id: number | null
  bolge_ad: string | null
  baslangic_tarih: string
  bitis_tarih: string
  tur: string
  aciklama: string | null
  durum: IzinDurum
  olusturma: string
}

export type BasvuruDurum = 'Yeni' | 'Değerlendiriliyor' | 'Olumlu' | 'Olumsuz' | 'İşe Alındı'

export interface Basvuru {
  id: number
  ad_soyad: string
  telefon: string
  email: string | null
  pozisyon: string | null
  sehir: string | null
  dogum_tarihi: string | null
  ehliyet: string | null
  arac: string | null
  deneyim: string | null
  mesaj: string | null
  durum: BasvuruDurum
  notlar: string | null
  olusturma: string
}

export interface Duyuru {
  id: number
  baslik: string
  icerik: string
  bolge_id: number | null
  bolge_ad?: string | null
  onem: string
  olusturma: string
}

export interface Stats {
  toplam_personel: number
  aktif_personel: number
  toplam_bolge: number
  yeni_basvuru: number
  bekleyen_izin: number
  bu_hafta_toplam_saat: number
  bolge_dagilim: { id: number; ad: string; renk: string; personel_sayisi: number }[]
  son_basvurular: { id: number; ad_soyad: string; pozisyon: string | null; sehir: string | null; durum: string; olusturma: string }[]
}

export const api = {
  login: (email: string, sifre: string) =>
    req(`${BASE}/login`, { method: 'POST', body: JSON.stringify({ email, sifre }) }),
  me: (): Promise<Admin> => req(`${BASE}/me`),
  sifreDegistir: (eski_sifre: string, yeni_sifre: string) =>
    req(`${BASE}/me/sifre`, { method: 'PUT', body: JSON.stringify({ eski_sifre, yeni_sifre }) }),
  stats: (): Promise<Stats> => req(`${BASE}/stats`),

  bolgeler: {
    list: (): Promise<Bolge[]> => req(`${BASE}/bolgeler`),
    create: (d: Partial<Bolge>) => req(`${BASE}/bolgeler`, { method: 'POST', body: JSON.stringify(d) }),
    update: (id: number, d: Partial<Bolge>) => req(`${BASE}/bolgeler/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    remove: (id: number) => req(`${BASE}/bolgeler/${id}`, { method: 'DELETE' }),
  },

  personel: {
    list: (params: { bolge_id?: number | 'null'; durum?: string; q?: string } = {}): Promise<Personel[]> => {
      const qs = new URLSearchParams()
      if (params.bolge_id !== undefined) qs.set('bolge_id', String(params.bolge_id))
      if (params.durum) qs.set('durum', params.durum)
      if (params.q) qs.set('q', params.q)
      return req(`${BASE}/personel?${qs.toString()}`)
    },
    get: (id: number): Promise<Personel> => req(`${BASE}/personel/${id}`),
    create: (d: Partial<Personel>) => req(`${BASE}/personel`, { method: 'POST', body: JSON.stringify(d) }),
    update: (id: number, d: Partial<Personel>) => req(`${BASE}/personel/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    remove: (id: number) => req(`${BASE}/personel/${id}`, { method: 'DELETE' }),
  },

  vardiya: {
    get: (bolgeId: number | 'null' | undefined, hafta: string): Promise<VardiyaPlani> => {
      const qs = new URLSearchParams({ hafta })
      if (bolgeId !== undefined) qs.set('bolge_id', String(bolgeId))
      return req(`${BASE}/vardiya?${qs.toString()}`)
    },
    set: (d: { personel_id: number; hafta_baslangic: string; gun: number; baslangic?: string | null; bitis?: string | null; off: boolean }) =>
      req(`${BASE}/vardiya`, { method: 'PUT', body: JSON.stringify(d) }),
    clear: (d: { personel_id: number; hafta_baslangic: string; gun: number }) =>
      req(`${BASE}/vardiya`, { method: 'DELETE', body: JSON.stringify(d) }),
    kopyala: (d: { bolge_id?: number; hafta_baslangic: string }) =>
      req(`${BASE}/vardiya/kopyala`, { method: 'POST', body: JSON.stringify(d) }),
  },

  izinler: {
    list: (params: { durum?: string; personel_id?: number } = {}): Promise<Izin[]> => {
      const qs = new URLSearchParams()
      if (params.durum) qs.set('durum', params.durum)
      if (params.personel_id) qs.set('personel_id', String(params.personel_id))
      return req(`${BASE}/izinler?${qs.toString()}`)
    },
    create: (d: Partial<Izin> & { personel_id: number; baslangic_tarih: string; bitis_tarih: string }) =>
      req(`${BASE}/izinler`, { method: 'POST', body: JSON.stringify(d) }),
    update: (id: number, d: Partial<Izin>) => req(`${BASE}/izinler/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    remove: (id: number) => req(`${BASE}/izinler/${id}`, { method: 'DELETE' }),
  },

  basvurular: {
    list: (durum?: string): Promise<Basvuru[]> => req(`${BASE}/basvurular?durum=${durum || ''}`),
    update: (id: number, d: Partial<Basvuru>) => req(`${BASE}/basvurular/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    remove: (id: number) => req(`${BASE}/basvurular/${id}`, { method: 'DELETE' }),
    iseAl: (id: number, d: { bolge_id?: number; pozisyon?: string; maas?: number; ise_giris_tarihi?: string }) =>
      req(`${BASE}/basvurular/${id}/ise-al`, { method: 'POST', body: JSON.stringify(d) }),
  },

  duyurular: {
    list: (): Promise<Duyuru[]> => req(`${BASE}/duyurular`),
    create: (d: Partial<Duyuru>) => req(`${BASE}/duyurular`, { method: 'POST', body: JSON.stringify(d) }),
    update: (id: number, d: Partial<Duyuru>) => req(`${BASE}/duyurular/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    remove: (id: number) => req(`${BASE}/duyurular/${id}`, { method: 'DELETE' }),
  },

  // public, no-auth endpoint for the careers application form
  basvuruGonder: (d: Record<string, unknown>) =>
    fetch(`${BASE}/basvuru`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      .then(async res => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Başvuru gönderilemedi')
        return res.json()
      }),
}
