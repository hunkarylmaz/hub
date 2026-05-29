import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Plus, ChevronDown, X, Wallet, AlertCircle, Loader2 } from 'lucide-react'
import { api, Bayilik } from '../lib/api'

const illerTR = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin','Aydın','Balıkesir',
  'Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli',
  'Diyarbakır','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane',
  'Hakkari','Hatay','Isparta','Mersin','İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli',
  'Kırşehir','Kocaeli','Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş',
  'Nevşehir','Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas','Tekirdağ','Tokat',
  'Trabzon','Tunceli','Şanlıurfa','Uşak','Van','Yozgat','Zonguldak','Aksaray','Bayburt','Karaman',
  'Kırıkkale','Batman','Şırnak','Bartın','Ardahan','Iğdır','Yalova','Karabük','Kilis','Osmaniye','Düzce',
]

const siparisSeçenekleri = ['1-50', '51-100', '101-200', '201-500', '500+']

// ── Kontör Modal ─────────────────────────────────────────────────────────────
interface KontorModalProps {
  bayilik: Bayilik
  mode: 'ekle' | 'geri-al'
  onClose: () => void
  onSuccess: () => void
}

function KontorModal({ bayilik, mode, onClose, onSuccess }: KontorModalProps) {
  const [miktar, setMiktar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseInt(miktar, 10)
    if (!amount || amount <= 0) {
      setError('Geçerli bir miktar girin')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (mode === 'ekle') {
        await api.bayilikler.ekleKontor(bayilik.id, amount)
      } else {
        await api.bayilikler.geriAlKontor(bayilik.id, amount)
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-800">
            {mode === 'ekle' ? 'Kontör Ekle' : 'Kontör Geri Al'} — {bayilik.ad}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Miktar {mode === 'geri-al' && <span className="text-gray-400">(Mevcut: {bayilik.token})</span>}
            </label>
            <input
              type="number"
              min={1}
              value={miktar}
              onChange={(e) => setMiktar(e.target.value)}
              placeholder="Kontör miktarı"
              required
              autoFocus
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2.5">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === 'ekle' ? 'Ekle' : 'Geri Al'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Dropdown Menu ─────────────────────────────────────────────────────────────
interface DropdownMenuProps {
  bayilik: Bayilik
  onClose: () => void
  onToggleDurum: (id: number) => void
  onKontorEkle: (b: Bayilik) => void
  onKontorGeriAl: (b: Bayilik) => void
}

function DropdownMenu({ bayilik, onClose, onToggleDurum, onKontorEkle, onKontorGeriAl }: DropdownMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[180px]"
    >
      {[
        { label: 'Kontör Ekle', action: () => { onKontorEkle(bayilik); onClose() } },
        { label: 'Kontör Geri Al', action: () => { onKontorGeriAl(bayilik); onClose() } },
      ].map((item) => (
        <button
          key={item.label}
          onClick={item.action}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {item.label}
        </button>
      ))}
      <div className="border-t border-gray-100 mt-1 pt-1">
        <button
          onClick={() => { onToggleDurum(bayilik.id); onClose() }}
          className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          {bayilik.durum === 'Aktif' ? 'Pasifleştir' : 'Aktifleştir'}
        </button>
      </div>
    </div>
  )
}

// ── Yeni Bayilik Modal ────────────────────────────────────────────────────────
interface YeniBayilikModalProps {
  onClose: () => void
  onSuccess: () => void
}

function YeniBayilikModal({ onClose, onSuccess }: YeniBayilikModalProps) {
  const [form, setForm] = useState({
    firmaIsmi: '',
    il: '',
    ilce: '',
    gunlukSiparis: '',
    yetkiliAd: '',
    telefon: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((v) => ({ ...v, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firmaIsmi || !form.il) return
    setLoading(true)
    setError('')
    try {
      await api.bayilikler.create({
        ad: form.firmaIsmi,
        il: form.il,
        ilce: form.ilce || undefined,
        gunluk_siparis: form.gunlukSiparis || undefined,
        yetkili_ad: form.yetkiliAd || undefined,
        telefon: form.telefon || undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bayilik oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">Yeni Bayilik Ekle</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Bayilik Bilgileri</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Firma İsmi*"
                value={form.firmaIsmi}
                onChange={set('firmaIsmi')}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <select
                    value={form.il}
                    onChange={set('il')}
                    required
                    className="w-full appearance-none px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 text-gray-700 bg-white"
                  >
                    <option value="">İl*</option>
                    {illerTR.map((il) => <option key={il} value={il}>{il}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <input
                  type="text"
                  placeholder="İlçe"
                  value={form.ilce}
                  onChange={set('ilce')}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                />
              </div>
              <div className="relative">
                <select
                  value={form.gunlukSiparis}
                  onChange={set('gunlukSiparis')}
                  className="w-full appearance-none px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 text-gray-700 bg-white"
                >
                  <option value="">Günlük Sipariş Sayısı</option>
                  {siparisSeçenekleri.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Yetkili Bilgileri</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Yetkili Adı Soyadı"
                value={form.yetkiliAd}
                onChange={set('yetkiliAd')}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
              />
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-lg bg-white min-w-[80px]">
                  <span className="text-base">🇹🇷</span>
                  <span className="text-sm text-gray-700">+90</span>
                  <ChevronDown size={12} className="text-gray-400" />
                </div>
                <input
                  type="tel"
                  placeholder="Yetkili Telefon"
                  value={form.telefon}
                  onChange={set('telefon')}
                  className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2.5">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Bayilik Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Bayiliklerim() {
  const [bayilikler, setBayilikler] = useState<Bayilik[]>([])
  const [kontorBakiye, setKontorBakiye] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [kontorModal, setKontorModal] = useState<{ bayilik: Bayilik; mode: 'ekle' | 'geri-al' } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [bayilikData, bakiyeData] = await Promise.all([
        api.bayilikler.list(),
        api.kontorBakiye.get(),
      ])
      setBayilikler(bayilikData)
      setKontorBakiye(bakiyeData.mevcut_bakiye)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = bayilikler.filter(
    (b) =>
      b.ad.toLowerCase().includes(search.toLowerCase()) ||
      b.bayilik_id.toLowerCase().includes(search.toLowerCase()) ||
      b.sehir.toLowerCase().includes(search.toLowerCase()),
  )

  async function toggleDurum(id: number) {
    try {
      const updated = await api.bayilikler.toggleDurum(id)
      setBayilikler((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle size={32} className="text-red-500" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Kontör Bakiyeniz Banner */}
      <div
        className="rounded-xl p-5 mb-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Wallet size={24} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-blue-200 font-medium">Kontör Bakiyeniz</p>
            <p className="text-3xl font-bold text-white mt-0.5">{kontorBakiye.toLocaleString('tr-TR')}</p>
          </div>
        </div>
        <p className="text-sm text-blue-200 text-right max-w-[200px] leading-snug">
          Bayiliklere dağıtabileceğiniz toplam kontör miktarı
        </p>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Bayiliklerim</h1>
          <p className="text-sm text-gray-500 mt-0.5">Toplam {bayilikler.length} kayıt</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 w-56"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} />
            Yeni Bayilik
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bayilik Adı</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bayilik ID</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Durum</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Şehir</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Token</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Özel Fiyat</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Araçlar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                  Bayilik bulunamadı
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-700">{b.ad}</td>
                  <td className="px-6 py-4 text-sm text-primary-600 font-medium cursor-pointer hover:underline">{b.bayilik_id}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${b.durum === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {b.durum}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{b.sehir}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{b.token}</td>
                  <td className="px-6 py-4 text-sm text-emerald-600 font-medium">{b.ozel_fiyat.toFixed(2)} ₺</td>
                  <td className="px-6 py-4 relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === b.id ? null : b.id)}
                      className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Düzenle <ChevronDown size={14} />
                    </button>
                    {openDropdown === b.id && (
                      <DropdownMenu
                        bayilik={b}
                        onClose={() => setOpenDropdown(null)}
                        onToggleDurum={toggleDurum}
                        onKontorEkle={(bay) => setKontorModal({ bayilik: bay, mode: 'ekle' })}
                        onKontorGeriAl={(bay) => setKontorModal({ bayilik: bay, mode: 'geri-al' })}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">1–{filtered.length} / {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700">İlk</button>
            <button className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700">‹</button>
            <button className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-medium">1</button>
            <button className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700">›</button>
            <button className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700">Son</button>
          </div>
        </div>
      </div>

      {showModal && (
        <YeniBayilikModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchData}
        />
      )}

      {kontorModal && (
        <KontorModal
          bayilik={kontorModal.bayilik}
          mode={kontorModal.mode}
          onClose={() => setKontorModal(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  )
}
