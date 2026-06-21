export interface AdresSonucu {
  lat: number
  lon: number
  display_name: string
  mahalle: string | null
  ilce: string | null
  il: string | null
}

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
  plaka: string | null
  durum: 'Müsait' | 'Dağıtımda' | 'Mola' | 'Çevrimdışı'
  aktif: number
  toplam_teslimat: number
  gunluk_teslimat: number
  paket_limiti: number
  odeme_tipleri: string
  calisma_tipi: string
  paket_basi_ucret: number
  km_baslangic: number
  km_ucret: number
  komisyon_yuzdesi: number
  saatlik_ucret: number
  coklu_paket: string
  paket_iptali: number
  odeme_duzenleme: number
  olusturma_tarihi: string
  lat: number | null
  lon: number | null
  son_konum_tarihi: string | null
}

export interface KuryeKonum {
  id: number
  ad: string
  telefon: string | null
  durum: string
  lat: number
  lon: number
  son_konum_tarihi: string | null
  gunluk_teslimat: number
  toplam_teslimat: number
}

export interface Restoran {
  id: number
  bayilik_id: number
  ad: string
  adres: string | null
  telefon: string | null
  aktif: number
  gunluk_siparis: number
  ilce: string | null
  email: string | null
  iban: string | null
  iban_sahibi: string | null
  calisma_tipi: string
  paket_basi_ucret: number
  km_baslangic: number
  km_ucret: number
  komisyon_yuzdesi: number
  saatlik_ucret: number
  coklu_paket: string
  hazirlanma_suresi: number
  otomatik_yazdir: number
  kurye_konum_takip: number
  kurye_numara_goruntu: number
  restoran_teslimat: number
  siparis_hazir: number
  pos_kullanim: number
  odeme_duzenleme: number
  harita_konum: number
  lat?: number | null
  lon?: number | null
  olusturma_tarihi: string
}

export interface BakiyeHareketi {
  id: number
  bayilik_id: number
  entity_type: string
  entity_id: number
  tur: 'Aldım' | 'Verdim'
  tutar: number
  tarih: string
  aciklama: string | null
  faturaya_dahil: number
  olusturma_tarihi: string
}

export const SIPARIS_KANALLARI = ['Telefon', 'WhatsApp', 'Uygulama', 'Web Sitesi', 'Yemeksepeti', 'Getir'] as const
export type SiparisKanali = typeof SIPARIS_KANALLARI[number]

export interface Siparis {
  id: number
  bayilik_id: number
  siparis_no: string
  restoran_id: number | null
  kurye_id: number | null
  musteri_ad: string | null
  musteri_telefon: string | null
  teslimat_adresi: string | null
  musteri_lat?: number | null
  musteri_lon?: number | null
  tutar: number
  odeme_yontemi: string
  kanal: string
  durum: 'Beklemede' | 'Atandı' | 'Yolda' | 'Teslim Edildi' | 'İptal'
  atama_zamani: string | null
  teslim_zamani: string | null
  olusturma_tarihi: string
  restoran_ad?: string
  kurye_ad?: string
  kurye_telefon?: string | null
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
  // Bonus periyotlar
  bonus_gunluk_aktif?: number
  bonus_gunluk_min?: number
  bonus_gunluk_tutar?: number
  bonus_gunluk_tip?: string
  bonus_haftalik_aktif?: number
  bonus_haftalik_min?: number
  bonus_haftalik_tutar?: number
  bonus_haftalik_tip?: string
  bonus_aylik_aktif?: number
  bonus_aylik_min?: number
  bonus_aylik_tutar?: number
  bonus_aylik_tip?: string
  // Genel ayarlar extended
  calisma_acilis?: string
  calisma_kapanis?: string
  lat?: number | null
  lon?: number | null
  ilce?: string | null
  siparis_tutar_gorunu?: number
  isletmeye_vardim?: number
  siparis_onay_modu?: string
  bildirim_gecikmesi?: number
  bildirim_mesaji?: string
  gecmis_kazanc_duzenleme?: number
  bayilik?: Bayilik
}

export interface AtamaAyarlari {
  id: number
  bayilik_id: number
  oto_atama_aktif: number
  ilave_paket: number
  kurye_arama_km: number
  isletme_yakinlik_m: number
  teslimat_yakinlik_m: number
  atama_bekleme_dk: number
  paket_birlestirme_dk: number
  atamasiz_tekrar_dk: number
  max_paket_per_kurye: number
  kurye_secim_algo: string
  havuz_aktif: number
  havuz_teslimatci_gizle: number
  havuz_mesafe_km: number
  havuz_bekleme_dk: number
  havuz_siparis_adet: number
  havuz_paket_limiti: number
}

export interface BankaHesabi {
  id: number
  banka_adi: string
  ad_soyad: string | null
  iban: string
  aktif: number
}

export interface KontorTalep {
  id: number
  talep_no: string
  bayilik_id: number
  miktar: number
  banka: string | null
  gonderen: string | null
  durum: string
  olusturma_tarihi: string
}

export interface BayiBildirim {
  id: number
  bayilik_id: number
  kurye_id: number | null
  kurye_ad: string | null
  baslik: string
  mesaj: string
  olusturma_tarihi: string
}

export interface Vardiya {
  id: number
  bayilik_id: number
  kurye_id: number
  tarih: string
  baslangic: string | null
  bitis: string | null
  izin: number
  not_text: string | null
}

export interface OdemeGrubu { sayi: number; tutar: number }

export interface GecmisSiparis extends Siparis {
  restoran_ad: string | undefined
  kurye_ad: string | undefined
}

export interface KuryeHakedisRow {
  id: number
  ad: string
  calisma_tipi: string
  toplam_paket: number
  brut_kazanc: number
  aldim_toplam: number
  ciro: number
}

export interface RestoranHakedisRow {
  id: number
  ad: string
  calisma_tipi: string
  paket_sayisi: number
  nakit: number
  kredi_karti: number
  yemek_karti: number
  online: number
  diger: number
  toplam_gelir: number
  tasima: number
  net_kazanc: number
}

export interface MolaAyarlari {
  id: number
  bayilik_id: number
  gunluk_mola_hakki: number
  mola_sureleri: string
  onay_mekanizmasi: string
  yasak_saatler: string
}

export interface MolaTalep {
  id: number
  bayilik_id: number
  kurye_id: number
  kurye_ad: string | null
  kurye_tel: string | null
  sure_dk: number
  durum: string
  talep_tarihi: string
  baslangic: string | null
  bitis: string | null
}

export interface BayiKullanici {
  id: number
  ad_soyad: string
  email: string
  telefon: string | null
  rol: string
  sayfa_izinleri: string
  aktif: number
  olusturma_tarihi: string
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

  geocode: {
    ara: (q: string) =>
      request<AdresSonucu[]>(`/api/bayi/geocode/ara?q=${encodeURIComponent(q)}`, { headers: authHeaders() }),
  },

  kuryeler: {
    list: () => request<Kurye[]>('/api/bayi/kuryeler', { headers: authHeaders() }),
    create: (data: { ad: string; telefon?: string }) =>
      request<Kurye>('/api/bayi/kuryeler', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Kurye>(`/api/bayi/kuryeler/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
    setDurum: (id: number, durum: string) =>
      request<Kurye>(`/api/bayi/kuryeler/${id}/durum`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ durum }) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/api/bayi/kuryeler/${id}`, { method: 'DELETE', headers: authHeaders() }),
    konumlar: () => request<{ kuryeler: KuryeKonum[]; merkez: { lat: number | null; lon: number | null; sehir: string | null; ilce: string | null } }>('/api/bayi/kuryeler/konumlar', { headers: authHeaders() }),
    updateKonum: (id: number, lat: number, lon: number) =>
      request<{ id: number; lat: number; lon: number }>(`/api/bayi/kuryeler/${id}/konum`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ lat, lon }) }),
  },

  restoranlar: {
    list: () => request<Restoran[]>('/api/bayi/restoranlar', { headers: authHeaders() }),
    create: (data: { ad: string; adres?: string; telefon?: string; ilce?: string; lat?: number | null; lon?: number | null }) =>
      request<Restoran>('/api/bayi/restoranlar', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
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
    create: (data: { restoran_id: number; musteri_ad?: string; musteri_telefon?: string; teslimat_adresi?: string; musteri_lat?: number; musteri_lon?: number; tutar?: number; odeme_yontemi?: string; kanal: string }) =>
      request<Siparis>('/api/bayi/siparisler', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
    kurye_ata: (id: number, kurye_id: number) =>
      request<Siparis>(`/api/bayi/siparisler/${id}/kurye-ata`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ kurye_id }) }),
    oto_ata: (id: number) =>
      request<{ kurye_ad: string; kurye_id: number }>(`/api/bayi/siparisler/${id}/oto-ata`, { method: 'PUT', headers: authHeaders() }),
    teslim: (id: number) =>
      request<{ success: boolean; yeni_token: number }>(`/api/bayi/siparisler/${id}/teslim`, { method: 'PUT', headers: authHeaders() }),
    setDurum: (id: number, durum: string) =>
      request<Siparis>(`/api/bayi/siparisler/${id}/durum`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ durum }) }),
    duzenle: (id: number, data: { musteri_telefon?: string; teslimat_adresi?: string; odeme_yontemi?: string; kanal?: string }) =>
      request<Siparis>(`/api/bayi/siparisler/${id}/duzenle`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
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
    isletme: (params: { isletme_id: number; baslangic?: string; bitis?: string }) => {
      const q = new URLSearchParams({ isletme_id: String(params.isletme_id) })
      if (params.baslangic) q.set('baslangic', params.baslangic)
      if (params.bitis) q.set('bitis', params.bitis)
      return request<{
        restoran: Restoran
        toplam_paket: number
        toplam_gelir: number
        tasima_toplam: number
        tasima_aciklama: string
        odeme_gruplari: Record<string, { sayi: number; tutar: number }>
        gunluk: { gun: string; sayi: number; gelir: number; tasima: number }[]
      }>(`/api/bayi/raporlar/isletme?${q}`, { headers: authHeaders() })
    },
    kurye: (params: { kurye_id: number; baslangic?: string; bitis?: string }) => {
      const q = new URLSearchParams({ kurye_id: String(params.kurye_id) })
      if (params.baslangic) q.set('baslangic', params.baslangic)
      if (params.bitis) q.set('bitis', params.bitis)
      return request<{
        kurye: Kurye
        toplam_paket: number
        brut_kazanc: number
        kazanc_aciklama: string
        aldim_toplam: number
        ciro: number
        gunluk: { gun: string; sayi: number; kazanc: number }[]
      }>(`/api/bayi/raporlar/kurye?${q}`, { headers: authHeaders() })
    },
    gecmis: (params: { restoran_id?: number; kurye_id?: number; baslangic?: string; bitis?: string; odeme_yontemi?: string; durum?: string; sayfa?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params.restoran_id) q.set('restoran_id', String(params.restoran_id))
      if (params.kurye_id) q.set('kurye_id', String(params.kurye_id))
      if (params.baslangic) q.set('baslangic', params.baslangic)
      if (params.bitis) q.set('bitis', params.bitis)
      if (params.odeme_yontemi) q.set('odeme_yontemi', params.odeme_yontemi)
      if (params.durum) q.set('durum', params.durum)
      if (params.sayfa) q.set('sayfa', String(params.sayfa))
      if (params.limit) q.set('limit', String(params.limit))
      return request<{
        siparisler: GecmisSiparis[]
        toplam: number
        sayfa_sayisi: number
        ozet: { siparis_sayisi: number; toplam_tutar: number; odeme_gruplari: Record<string, OdemeGrubu> }
      }>(`/api/bayi/raporlar/gecmis?${q}`, { headers: authHeaders() })
    },
    kuryelerHakedis: (params?: { baslangic?: string; bitis?: string }) => {
      const q = new URLSearchParams()
      if (params?.baslangic) q.set('baslangic', params.baslangic)
      if (params?.bitis) q.set('bitis', params.bitis)
      return request<{
        kuryeler: KuryeHakedisRow[]
        toplam_kurye: number
        toplam_paket: number
        toplam_kazanc: number
      }>(`/api/bayi/raporlar/kuryeler-hakedis?${q}`, { headers: authHeaders() })
    },
    restoranlarHakedis: (params?: { baslangic?: string; bitis?: string; sayfa?: number }) => {
      const q = new URLSearchParams()
      if (params?.baslangic) q.set('baslangic', params.baslangic)
      if (params?.bitis) q.set('bitis', params.bitis)
      if (params?.sayfa) q.set('sayfa', String(params.sayfa))
      return request<{
        restoranlar: RestoranHakedisRow[]
        toplam_restoran: number
        toplam_paket: number
        toplam_gelir: number
        net_kazanc: number
        sayfa_sayisi: number
      }>(`/api/bayi/raporlar/restoranlar-hakedis?${q}`, { headers: authHeaders() })
    },
    odemeDagilimi: (params?: { baslangic?: string; bitis?: string; restoran_id?: number; kurye_id?: number }) => {
      const q = new URLSearchParams()
      if (params?.baslangic) q.set('baslangic', params.baslangic)
      if (params?.bitis) q.set('bitis', params.bitis)
      if (params?.restoran_id) q.set('restoran_id', String(params.restoran_id))
      if (params?.kurye_id) q.set('kurye_id', String(params.kurye_id))
      return request<{
        gruplari: Record<string, OdemeGrubu>
        toplam_sayi: number
        toplam_tutar: number
        kuryeler: { id: number; ad: string; gruplari: Record<string, OdemeGrubu> }[]
      }>(`/api/bayi/raporlar/odeme-dagilimi?${q}`, { headers: authHeaders() })
    },
    firma: (params?: { baslangic?: string; bitis?: string }) => {
      const q = new URLSearchParams()
      if (params?.baslangic) q.set('baslangic', params.baslangic)
      if (params?.bitis) q.set('bitis', params.bitis)
      return request<{
        paket_sayisi: number
        tasima_ucretleri: number
        kurye_hakedisleri: number
        kazanc: number
        ort_paket_tasima: number
        ort_kurye_hakedis: number
        gunluk: { gun: string; paket: number; tasima: number; hakedis: number; kazanc: number }[]
      }>(`/api/bayi/raporlar/firma?${q}`, { headers: authHeaders() })
    },
  },

  bakiyeHareketleri: {
    list: (entity_type: string, entity_id: number) =>
      request<BakiyeHareketi[]>(`/api/bayi/bakiye-hareketleri?entity_type=${entity_type}&entity_id=${entity_id}`, { headers: authHeaders() }),
    create: (data: { entity_type: string; entity_id: number; tur: string; tutar: number; tarih?: string; aciklama?: string; faturaya_dahil?: number }) =>
      request<BakiyeHareketi>('/api/bayi/bakiye-hareketleri', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/api/bayi/bakiye-hareketleri/${id}`, { method: 'DELETE', headers: authHeaders() }),
  },

  performans: {
    get: () =>
      request<{
        kurye_perf: { id: number; ad: string; durum: string; toplam_teslimat: number; gunluk_teslimat: number; toplam: number; basarili: number; ort_sure: number | null }[]
        isletme_perf: { ad: string; toplam: number; teslim: number; ciro: number }[]
      }>('/api/bayi/performans', { headers: authHeaders() }),
  },

  ayarlar: {
    get: () => request<BayiAyarlar>('/api/bayi/ayarlar', { headers: authHeaders() }),
    update: (data: Partial<BayiAyarlar>) =>
      request<BayiAyarlar>('/api/bayi/ayarlar', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
    updateGenel: (data: Partial<BayiAyarlar>) =>
      request<BayiAyarlar>('/api/bayi/ayarlar/genel', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
    getAtama: () => request<AtamaAyarlari>('/api/bayi/ayarlar/atama', { headers: authHeaders() }),
    updateAtama: (data: Partial<AtamaAyarlari>) =>
      request<AtamaAyarlari>('/api/bayi/ayarlar/atama', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
  },

  vardiyalar: {
    list: (params?: { baslangic?: string; bitis?: string; kurye_id?: number }) => {
      const q = new URLSearchParams()
      if (params?.baslangic) q.set('baslangic', params.baslangic)
      if (params?.bitis) q.set('bitis', params.bitis)
      if (params?.kurye_id) q.set('kurye_id', String(params.kurye_id))
      return request<Vardiya[]>(`/api/bayi/vardiyalar?${q}`, { headers: authHeaders() })
    },
    save: (data: { kurye_id: number; tarih: string; baslangic?: string; bitis?: string; izin?: number; not_text?: string }) =>
      request<Vardiya>('/api/bayi/vardiyalar', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/api/bayi/vardiyalar/${id}`, { method: 'DELETE', headers: authHeaders() }),
  },

  bankaHesaplari: {
    list: () => request<BankaHesabi[]>('/api/bayi/banka-hesaplari', { headers: authHeaders() }),
  },

  kontorTalepler: {
    list: () => request<KontorTalep[]>('/api/bayi/kontor-talepler', { headers: authHeaders() }),
    create: (data: { miktar: number; gonderen?: string; banka?: string; not_text?: string }) =>
      request<KontorTalep>('/api/bayi/kontor-talep', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
  },

  bildirimler: {
    list: () => request<BayiBildirim[]>('/api/bayi/bildirimler', { headers: authHeaders() }),
    send: (data: { baslik: string; mesaj: string; kurye_id?: number | null }) =>
      request<BayiBildirim>('/api/bayi/bildirimler', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
  },

  kullanicilar: {
    list: (silinmis?: boolean) =>
      request<BayiKullanici[]>(`/api/bayi/kullanicilar${silinmis ? '?silinmis=1' : ''}`, { headers: authHeaders() }),
    create: (data: { ad_soyad: string; email: string; telefon?: string; sifre: string; rol?: string; sayfa_izinleri?: string[] }) =>
      request<BayiKullanici>('/api/bayi/kullanicilar', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
    update: (id: number, data: { ad_soyad?: string; email?: string; telefon?: string; sifre?: string; rol?: string; sayfa_izinleri?: string[]; aktif?: number }) =>
      request<BayiKullanici>(`/api/bayi/kullanicilar/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ message: string }>(`/api/bayi/kullanicilar/${id}`, { method: 'DELETE', headers: authHeaders() }),
  },

  molaAyarlari: {
    get: () => request<MolaAyarlari>('/api/bayi/mola-ayarlari', { headers: authHeaders() }),
    update: (data: { gunluk_mola_hakki?: number; mola_sureleri?: number[]; onay_mekanizmasi?: string; yasak_saatler?: { baslangic: string; bitis: string }[] }) =>
      request<MolaAyarlari>('/api/bayi/mola-ayarlari', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
  },

  molaTalepleri: {
    list: (durum?: string) => {
      const q = new URLSearchParams()
      if (durum && durum !== 'Tümü') q.set('durum', durum)
      return request<MolaTalep[]>(`/api/bayi/mola-talepleri?${q}`, { headers: authHeaders() })
    },
    create: (data: { kurye_id: number; sure_dk: number }) =>
      request<MolaTalep>('/api/bayi/mola-talepleri', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
    updateDurum: (id: number, durum: string) =>
      request<MolaTalep>(`/api/bayi/mola-talepleri/${id}/durum`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ durum }) }),
  },

  molaRaporlar: {
    get: (params?: { baslangic?: string; bitis?: string }) => {
      const q = new URLSearchParams()
      if (params?.baslangic) q.set('baslangic', params.baslangic)
      if (params?.bitis) q.set('bitis', params.bitis)
      return request<{
        kurye_siralaması: { kurye_id: number; kurye_ad: string; kurye_tel: string | null; mola_sayisi: number; toplam_sure_dk: number }[]
        saatlik: { saat: string; sayi: number }[]
        gunluk: { gun: string; sayi: number }[]
      }>(`/api/bayi/mola-raporlar?${q}`, { headers: authHeaders() })
    },
  },

  mutabakat: {
    kuryeler: (params?: { baslangic?: string; bitis?: string }) => {
      const q = new URLSearchParams()
      if (params?.baslangic) q.set('baslangic', params.baslangic)
      if (params?.bitis) q.set('bitis', params.bitis)
      return request<{
        kuryeler: {
          id: number; ad: string; telefon: string | null
          paket_sayisi: number; nakit: number; kredi_karti: number; yemek_karti: number; online: number
          toplam_tahsilat: number; odenmesi_gereken: number; alinan: number; verilen: number; net_fark: number; hakedis: number
        }[]
      }>(`/api/bayi/mutabakat/kuryeler?${q}`, { headers: authHeaders() })
    },
    restoranlar: (params?: { baslangic?: string; bitis?: string }) => {
      const q = new URLSearchParams()
      if (params?.baslangic) q.set('baslangic', params.baslangic)
      if (params?.bitis) q.set('bitis', params.bitis)
      return request<{
        restoranlar: {
          id: number; ad: string; calisma_tipi: string
          paket_sayisi: number; nakit: number; kredi_karti: number; yemek_karti: number; online: number
          toplam_satis: number; tasima_ucreti: number; alinan: number; verilen: number; net_fark: number
        }[]
      }>(`/api/bayi/mutabakat/restoranlar?${q}`, { headers: authHeaders() })
    },
  },
}
