import { useState, useRef, useEffect, useCallback } from 'react'
import { Image, Star, Building2, Upload, Plus, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { api, Ayarlar as AyarlarType } from '../lib/api'

interface BankaHesabi {
  id: string
  banka: string
  hesapAdi: string
  iban: string
}

export default function Ayarlar() {
  const [ayarlar, setAyarlar] = useState<AyarlarType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [bankalar, setBankalar] = useState<BankaHesabi[]>([])
  const [showBankaForm, setShowBankaForm] = useState(false)
  const [yeniBanka, setYeniBanka] = useState({ banka: '', hesapAdi: '', iban: '' })

  const logoRef = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)

  const fetchAyarlar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.ayarlar.get()
      setAyarlar(data)
      if (data.logo_url) setLogoPreview(data.logo_url)
      if (data.favicon_url) setFaviconPreview(data.favicon_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ayarlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAyarlar()
  }, [fetchAyarlar])

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const base64 = await fileToBase64(file)
      setLogoPreview(base64)
    }
  }

  async function handleFaviconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const base64 = await fileToBase64(file)
      setFaviconPreview(base64)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const updated = await api.ayarlar.update({
        logo_url: logoPreview,
        favicon_url: faviconPreview,
      })
      setAyarlar(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  function handleBankaEkle() {
    if (!yeniBanka.banka || !yeniBanka.hesapAdi || !yeniBanka.iban) return
    setBankalar((prev) => [...prev, { ...yeniBanka, id: Date.now().toString() }])
    setYeniBanka({ banka: '', hesapAdi: '', iban: '' })
    setShowBankaForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    )
  }

  if (error && !ayarlar) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle size={32} className="text-red-500" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchAyarlar}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Ayarlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Logo, favicon ve banka hesapları yönetimi</p>
      </div>

      {ayarlar && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-sm text-blue-700 max-w-3xl">
          <span className="font-medium">Kontör Bakiyesi:</span>
          <span className="font-bold">{ayarlar.kontor_bakiye.toLocaleString('tr-TR')}</span>
          <span className="ml-4 text-blue-500">Toplam Dağıtılan:</span>
          <span className="font-bold text-blue-700">{ayarlar.toplam_dagitilan.toLocaleString('tr-TR')}</span>
        </div>
      )}

      <div className="space-y-4 max-w-3xl">
        {/* Logo */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Image size={18} className="text-primary-600" />
            <h2 className="text-base font-semibold text-gray-800">Logo</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">Maksimum 2MB | PNG, WEBP, JPG, SVG</p>
          <div className="border-2 border-dashed border-gray-200 rounded-lg h-32 flex items-center justify-center mb-4 bg-gray-50">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="max-h-24 max-w-xs object-contain" />
            ) : (
              <span className="text-gray-400 text-sm font-medium tracking-wide">PaketÇi</span>
            )}
          </div>
          <input ref={logoRef} type="file" accept=".png,.webp,.jpg,.jpeg,.svg" className="hidden" onChange={handleLogoChange} />
          <div className="flex items-center gap-3">
            <button
              onClick={() => logoRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 text-sm font-medium rounded-lg hover:bg-primary-50 transition-colors"
            >
              <Upload size={15} />
              Logo Seç
            </button>
            {logoPreview && (
              <button
                onClick={() => setLogoPreview(null)}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Kaldır
              </button>
            )}
          </div>
        </div>

        {/* Favicon */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Star size={18} className="text-primary-600" />
            <h2 className="text-base font-semibold text-gray-800">Favicon</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">Maksimum 2MB | PNG, WEBP, JPG, SVG</p>
          <div className="border-2 border-dashed border-gray-200 rounded-lg h-32 flex items-center justify-center mb-4 bg-gray-50">
            {faviconPreview ? (
              <img src={faviconPreview} alt="Favicon" className="max-h-24 max-w-xs object-contain" />
            ) : (
              <span className="text-gray-400 text-sm">Favicon seçilmedi</span>
            )}
          </div>
          <input ref={faviconRef} type="file" accept=".png,.webp,.jpg,.jpeg,.svg" className="hidden" onChange={handleFaviconChange} />
          <div className="flex items-center gap-3">
            <button
              onClick={() => faviconRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 text-sm font-medium rounded-lg hover:bg-primary-50 transition-colors"
            >
              <Upload size={15} />
              Favicon Seç
            </button>
            {faviconPreview && (
              <button
                onClick={() => setFaviconPreview(null)}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Kaldır
              </button>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              'Değişiklikleri Kaydet'
            )}
          </button>
          {saved && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
              <CheckCircle size={16} />
              Kaydedildi
            </div>
          )}
          {error && ayarlar && (
            <div className="flex items-center gap-1.5 text-red-500 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Banka Hesapları */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-primary-600" />
              <h2 className="text-base font-semibold text-gray-800">Banka Hesapları</h2>
            </div>
            <button
              onClick={() => setShowBankaForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={14} />
              Hesap Ekle
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-4">Ödeme almak istediğiniz banka hesaplarını ekleyin</p>

          {bankalar.length === 0 && !showBankaForm && (
            <div className="text-center py-8 text-gray-400">
              <Building2 size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Henüz banka hesabı eklenmedi</p>
            </div>
          )}

          {bankalar.length > 0 && (
            <div className="space-y-2 mb-4">
              {bankalar.map((b) => (
                <div key={b.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{b.banka}</p>
                    <p className="text-xs text-gray-500">{b.hesapAdi}</p>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">{b.iban}</p>
                </div>
              ))}
            </div>
          )}

          {showBankaForm && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Banka Adı</label>
                  <input
                    type="text"
                    value={yeniBanka.banka}
                    onChange={(e) => setYeniBanka((v) => ({ ...v, banka: e.target.value }))}
                    placeholder="örn. Garanti Bankası"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hesap Sahibi</label>
                  <input
                    type="text"
                    value={yeniBanka.hesapAdi}
                    onChange={(e) => setYeniBanka((v) => ({ ...v, hesapAdi: e.target.value }))}
                    placeholder="Ad Soyad / Şirket Adı"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">IBAN</label>
                <input
                  type="text"
                  value={yeniBanka.iban}
                  onChange={(e) => setYeniBanka((v) => ({ ...v, iban: e.target.value }))}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 font-mono"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleBankaEkle}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => { setShowBankaForm(false); setYeniBanka({ banka: '', hesapAdi: '', iban: '' }) }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
