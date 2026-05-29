import { useState, useRef } from 'react'
import { Image, Star, Building2, Upload, Plus } from 'lucide-react'

interface BankaHesabi {
  id: string
  banka: string
  hesapAdi: string
  iban: string
}

export default function Ayarlar() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [bankalar, setBankalar] = useState<BankaHesabi[]>([])
  const [showBankaForm, setShowBankaForm] = useState(false)
  const [yeniBanka, setYeniBanka] = useState({ banka: '', hesapAdi: '', iban: '' })

  const logoRef = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setLogoPreview(url)
    }
  }

  function handleFaviconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setFaviconPreview(url)
    }
  }

  function handleBankaEkle() {
    if (!yeniBanka.banka || !yeniBanka.hesapAdi || !yeniBanka.iban) return
    setBankalar((prev) => [...prev, { ...yeniBanka, id: Date.now().toString() }])
    setYeniBanka({ banka: '', hesapAdi: '', iban: '' })
    setShowBankaForm(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Ayarlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Logo, favicon ve banka hesapları yönetimi</p>
      </div>

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
          <button
            onClick={() => logoRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 text-sm font-medium rounded-lg hover:bg-primary-50 transition-colors"
          >
            <Upload size={15} />
            Logo Seç
          </button>
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
          <button
            onClick={() => faviconRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 text-sm font-medium rounded-lg hover:bg-primary-50 transition-colors"
          >
            <Upload size={15} />
            Favicon Seç
          </button>
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
