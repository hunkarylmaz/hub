export interface Bayilik {
  id: number
  ad: string
  bayilik_id: string
  sehir: string
  token: number
  durum: string
}

export interface Kurye {
  id: number
  bayilik_id: number
  ad: string
  telefon: string | null
  durum: 'Müsait' | 'Dağıtımda' | 'Mola' | 'Çevrimdışı'
  aktif: number
  toplam_teslimat: number
  gunluk_teslimat: number
  olusturma_tarihi: string
}

export interface Restoran {
  id: number
  bayilik_id: number
  ad: string
  adres: string | null
  telefon: string | null
  aktif: number
  gunluk_siparis: number
  olusturma_tarihi: string
}

export interface Siparis {
  id: number
  bayilik_id: number
  siparis_no: string
  restoran_id: number | null
  kurye_id: number | null
  musteri_ad: string | null
  musteri_telefon: string | null
  teslimat_adresi: string | null
  tutar: number
  odeme_yontemi: string
  durum: 'Beklemede' | 'Atandı' | 'Yolda' | 'Teslim Edildi' | 'İptal'
  atama_zamani: string | null
  teslim_zamani: string | null
  olusturma_tarihi: string
  restoran_ad?: string
  kurye_ad?: string
}

export interface DashboardData {
  siparis_toplam: number
  siparis_bekleyen: number
  siparis_yolda: number
  siparis_teslim: number
  mudahale_yuzdesi: number
  kalite_yuzdesi: number
  yogunluk: string
  kontor_bakiye: number
  kurye_toplam: number
  kurye_musait: number
  kurye_dagitimda: number
  kurye_mola: number
  aktif_siparisler: Siparis[]
}

export interface BayiAyarlar {
  id: number
  bayilik_id: number
  atama_modu: string
  max_siparis_per_kurye: number
  bonus_aktif: number
  bonus_miktar: number
  bildirim_email: number
  bildirim_sms: number
  bayilik?: Bayilik
}

function getToken(): string {
  return localStorage.getItem('paketci_bayi_token') || ''
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const data: unknown = await res.json()
  if (!res.ok) {
    const err = data as { message?: string }
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return data as T
}

export const api = {
  auth: {
    login: (email: string, sifre: string) =>
      request<{ token: string; bayilik: Bayilik }>('/api/bayi/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sifre }),
      }),
    me: () =>
      request<Bayilik>('/api/bayi/auth/me', { headers: authHeaders() }),
  },

  dashboard: {
    get: () => request<DashboardData>('/api/bayi/dashboard', { headers: authHeaders() }),
  },

  kuryeler: {
    list: () => request<Kurye[]>('/api/bayi/kuryeler', { headers: authHeaders() }),
    create: (data: { ad: string; telefon?: string }) =>
      request<Kurye>('/api/bayi/kuryeler', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
    update: (id: number, data: Partial<{ ad: string; telefon: string }>) =>
      request<Kurye>(`/api/bayi/kuryeler/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
    setDurum: (id: number, durum: string) =>
      request<Kurye>(`/api/bayi/kuryeler/${id}/durum`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ durum }) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/api/bayi/kuryeler/${id}`, { method: 'DELETE', headers: authHeaders() }),
  },

  restoranlar: {
    list: () => request<Restoran[]>('/api/bayi/restoranlar', { headers: authHeaders() }),
    create: (data: { ad: string; adres?: string; telefon?: string }) =>
      request<Restoran>('/api/bayi/restoranlar', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
    update: (id: number, data: Partial<{ ad: string; adres: string; telefon: string; aktif: number }>) =>
      request<Restoran>(`/api/bayi/restoranlar/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/api/bayi/restoranlar/${id}`, { method: 'DELETE', headers: authHeaders() }),
  },

  siparisler: {
    list: (params?: { durum?: string; tarih?: string }) => {
      const q = new URLSearchParams()
      if (params?.durum) q.set('durum', params.durum)
      if (params?.tarih) q.set('tarih', params.tarih)
      return request<Siparis[]>(`/api/bayi/siparisler?${q}`, { headers: authHeaders() })
    },
    create: (data: { restoran_id: number; musteri_ad?: string; musteri_telefon?: string; teslimat_adresi?: string; tutar?: number; odeme_yontemi?: string }) =>
      request<Siparis>('/api/bayi/siparisler', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
    kurye_ata: (id: number, kurye_id: number) =>
      request<Siparis>(`/api/bayi/siparisler/${id}/kurye-ata`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ kurye_id }) }),
    oto_ata: (id: number) =>
      request<{ kurye_ad: string; kurye_id: number }>(`/api/bayi/siparisler/${id}/oto-ata`, { method: 'PUT', headers: authHeaders() }),
    teslim: (id: number) =>
      request<{ success: boolean; yeni_token: number }>(`/api/bayi/siparisler/${id}/teslim`, { method: 'PUT', headers: authHeaders() }),
    setDurum: (id: number, durum: string) =>
      request<Siparis>(`/api/bayi/siparisler/${id}/durum`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ durum }) }),
  },

  raporlar: {
    get: (params?: { baslangic?: string; bitis?: string }) => {
      const q = new URLSearchParams()
      if (params?.baslangic) q.set('baslangic', params.baslangic)
      if (params?.bitis) q.set('bitis', params.bitis)
      return request<{
        siparisler: Siparis[]
        kurye_hakedis: { ad: string; teslim_sayisi: number; toplam_tutar: number }[]
        restoran_hakedis: { ad: string; siparis_sayisi: number; toplam_tutar: number }[]
        gunluk_trend: { gun: string; siparis: number; ciro: number }[]
      }>(`/api/bayi/raporlar?${q}`, { headers: authHeaders() })
    },
  },

  performans: {
    get: () =>
      request<{
        kurye_perf: { id: number; ad: string; durum: string; toplam_teslimat: number; gunluk_teslimat: number; basarili: number; ort_sure: number | null }[]
        isletme_perf: { ad: string; toplam: number; teslim: number; ciro: number }[]
      }>('/api/bayi/performans', { headers: authHeaders() }),
  },

  ayarlar: {
    get: () => request<BayiAyarlar>('/api/bayi/ayarlar', { headers: authHeaders() }),
    update: (data: Partial<BayiAyarlar>) =>
      request<BayiAyarlar>('/api/bayi/ayarlar', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
  },
}
