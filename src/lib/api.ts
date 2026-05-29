// API Types
export interface User {
  id: number
  email: string
  ad: string
  rol: string
  aktif: number
  olusturma_tarihi: string
}

export interface Bayilik {
  id: number
  ad: string
  bayilik_id: string
  durum: 'Aktif' | 'Pasif'
  sehir: string
  il: string | null
  ilce: string | null
  gunluk_siparis: string | null
  yetkili_ad: string | null
  telefon: string | null
  token: number
  ozel_fiyat: number
  user_id: number
  olusturma_tarihi: string
  odeme_sayisi?: number
}

export interface OdemeTalep {
  id: number
  talep_no: string
  bayilik_ad: string | null
  bayilik_kod: string | null
  miktar: number
  banka: string | null
  gonderen: string | null
  tarih: string
  durum: string
}

export interface KontorIslem {
  id: number
  tarih: string
  islem_turu: string
  bayilik_ad: string | null
  bayilik_kod: string | null
  miktar: number
  kalan_bakiye: number
  not_text: string | null
}

export interface RaporData {
  toplam_onaylanan: number
  onaylanan_talep_sayisi: number
  bekleyen_odeme: number
  ortalama_odeme: number
  aylik_trend: { month: string; gelir: number }[]
  bayilik_dagilim: { name: string; value: number }[]
}

export interface Ayarlar {
  logo_url: string | null
  favicon_url: string | null
  kontor_bakiye: number
  toplam_dagitilan: number
}

export interface KontorBakiye {
  mevcut_bakiye: number
  toplam_dagitilan: number
}

// API Helper
function getToken(): string {
  return localStorage.getItem('paketci_token') || ''
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

// API Object
export const api = {
  auth: {
    login: (email: string, sifre: string) =>
      request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sifre }),
      }),
    me: () =>
      request<User>('/api/auth/me', { headers: authHeaders() }),
  },

  bayilikler: {
    list: () =>
      request<Bayilik[]>('/api/bayilikler', { headers: authHeaders() }),
    create: (data: {
      ad: string
      il: string
      ilce?: string
      gunluk_siparis?: string
      yetkili_ad?: string
      telefon?: string
    }) =>
      request<Bayilik>('/api/bayilikler', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      }),
    update: (
      id: number,
      data: Partial<{
        ad: string
        sehir: string
        il: string
        ilce: string
        gunluk_siparis: string
        yetkili_ad: string
        telefon: string
        ozel_fiyat: number
      }>
    ) =>
      request<Bayilik>(`/api/bayilikler/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/api/bayilikler/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      }),
    toggleDurum: (id: number) =>
      request<Bayilik>(`/api/bayilikler/${id}/toggle-durum`, {
        method: 'PUT',
        headers: authHeaders(),
      }),
    ekleKontor: (id: number, miktar: number) =>
      request<{ success: boolean; yeni_token: number; yeni_bakiye: number }>(
        `/api/bayilikler/${id}/kontor-ekle`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ miktar }),
        }
      ),
    geriAlKontor: (id: number, miktar: number) =>
      request<{ success: boolean; yeni_token: number; yeni_bakiye: number }>(
        `/api/bayilikler/${id}/kontor-geri-al`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ miktar }),
        }
      ),
  },

  odemeTalepleri: {
    list: () =>
      request<OdemeTalep[]>('/api/odeme-talepleri', { headers: authHeaders() }),
    create: (data: {
      bayilik_id?: number
      miktar: number
      banka?: string
      gonderen?: string
    }) =>
      request<OdemeTalep>('/api/odeme-talepleri', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      }),
    updateDurum: (id: number, durum: string) =>
      request<OdemeTalep>(`/api/odeme-talepleri/${id}/durum`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ durum }),
      }),
  },

  kontorGecmisi: {
    list: () =>
      request<KontorIslem[]>('/api/kontor-gecmisi', { headers: authHeaders() }),
  },

  kontorBakiye: {
    get: () =>
      request<KontorBakiye>('/api/kontor-bakiye', { headers: authHeaders() }),
  },

  raporlar: {
    get: () =>
      request<RaporData>('/api/raporlar', { headers: authHeaders() }),
  },

  ayarlar: {
    get: () =>
      request<Ayarlar>('/api/ayarlar', { headers: authHeaders() }),
    update: (data: { logo_url?: string | null; favicon_url?: string | null }) =>
      request<Ayarlar>('/api/ayarlar', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      }),
  },

  kullanicilar: {
    list: () =>
      request<User[]>('/api/kullanicilar', { headers: authHeaders() }),
    create: (data: { email: string; sifre: string; ad: string; rol?: string }) =>
      request<User>('/api/kullanicilar', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      }),
    update: (
      id: number,
      data: Partial<{ email: string; sifre: string; ad: string; rol: string }>
    ) =>
      request<User>(`/api/kullanicilar/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/api/kullanicilar/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      }),
  },
}
