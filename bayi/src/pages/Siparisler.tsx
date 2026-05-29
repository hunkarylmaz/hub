import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Loader2, AlertCircle, Bike, CheckCircle2, X, Navigation, PauseCircle, RefreshCw, Ban } from 'lucide-react'
import { api, Siparis, Kurye, Restoran } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

function durumBadge(durum: Siparis['durum']) {
  const map: Record<string, string> = {
    'Beklemede': 'bg-amber-100 text-amber-700',
    'Atandı': 'bg-blue-100 text-blue-700',
    'Yolda': 'bg-indigo-100 text-indigo-700',
    'Teslim Edildi': 'bg-emerald-100 text-emerald-700',
    'İptal': 'bg-red-100 text-red-600',
  }
  return map[durum] || 'bg-gray-100 text-gray-600'
}

function formatTarih(dt: string) {
  const d = new Date(dt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface YeniSiparisModalProps {
  restoranlar: Restoran[]
  onClose: () => void
  onSave: () => void
}

function YeniSiparisModal({ restoranlar, onClose, onSave }: YeniSiparisModalProps) {
  const [form, setForm] = useState({ restoran_id: '', musteri_ad: '', musteri_telefon: '', teslimat_adresi: '', tutar: '', odeme_yontemi: 'Nakit' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    if (!form.restoran_id) { setErr('Restoran seçin'); return }
    setSaving(true)
    try {
      await api.siparisler.create({
        restoran_id: Number(form.restoran_id),
        musteri_ad: form.musteri_ad || undefined,
        musteri_telefon: form.musteri_telefon || undefined,
        teslimat_adresi: form.teslimat_adresi || undefined,
        tutar: form.tutar ? Number(form.tutar) : undefined,
        odeme_yontemi: form.odeme_yontemi,
      })
      onSave()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Hata')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Yeni Sipariş</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Restoran *</label>
            <select
              value={form.restoran_id}
              onChange={e => setForm(f => ({ ...f, restoran_id: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            >
              <option value="">Restoran seçin</option>
              {restoranlar.filter(r => r.aktif).map(r => <option key={r.id} value={r.id}>{r.ad}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Müşteri Adı</label>
              <input value={form.musteri_ad} onChange={e => setForm(f => ({ ...f, musteri_ad: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
              <input value={form.musteri_telefon} onChange={e => setForm(f => ({ ...f, musteri_telefon: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Teslimat Adresi</label>
            <input value={form.teslimat_adresi} onChange={e => setForm(f => ({ ...f, teslimat_adresi: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tutar (₺)</label>
              <input type="number" value={form.tutar} onChange={e => setForm(f => ({ ...f, tutar: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ödeme Yöntemi</label>
              <select value={form.odeme_yontemi} onChange={e => setForm(f => ({ ...f, odeme_yontemi: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20">
                <option>Nakit</option>
                <option>Kart</option>
                <option>Online</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60">
            {saving ? 'Kaydediliyor...' : 'Sipariş Oluştur'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface KuryeAtaModalProps {
  siparis: Siparis
  kuryeler: Kurye[]
  onClose: () => void
  onSave: () => void
}

function KuryeAtaModal({ siparis, kuryeler, onClose, onSave }: KuryeAtaModalProps) {
  const [kurye_id, setKuryeId] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    if (!kurye_id) { setErr('Kurye seçin'); return }
    setSaving(true)
    try {
      await api.siparisler.kurye_ata(siparis.id, Number(kurye_id))
      onSave()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Hata')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Kurye Ata — {siparis.siparis_no}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-3">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          <div className="space-y-2">
            {kuryeler.filter(k => k.aktif && k.durum !== 'Çevrimdışı').map(k => (
              <label key={k.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${kurye_id === String(k.id) ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="kurye" value={k.id} checked={kurye_id === String(k.id)} onChange={() => setKuryeId(String(k.id))} className="sr-only" />
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold">
                  {k.ad.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{k.ad}</p>
                  <p className="text-xs text-gray-400">{k.durum} · {k.gunluk_teslimat} teslimat</p>
                </div>
                {k.durum === 'Müsait' && <span className="text-xs text-emerald-600 font-medium">Müsait</span>}
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60">
            {saving ? '...' : 'Ata'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Siparisler() {
  const { refreshBayilik } = useAuth()
  const [siparisler, setSiparisler] = useState<Siparis[]>([])
  const [kuryeler, setKuryeler] = useState<Kurye[]>([])
  const [restoranlar, setRestoranlar] = useState<Restoran[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [durumFilter, setDurumFilter] = useState('Tümü')
  const [showYeni, setShowYeni] = useState(false)
  const [ataModal, setAtaModal] = useState<Siparis | null>(null)
  const [delivering, setDelivering] = useState<number | null>(null)
  const [updatingDurum, setUpdatingDurum] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [s, k, r] = await Promise.all([api.siparisler.list(), api.kuryeler.list(), api.restoranlar.list()])
      setSiparisler(s)
      setKuryeler(k)
      setRestoranlar(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleTeslim(s: Siparis) {
    if (!confirm('Teslim edildi olarak işaretlensin mi? 1 kontör düşülecektir.')) return
    setDelivering(s.id)
    try {
      await api.siparisler.teslim(s.id)
      await fetchData()
      await refreshBayilik()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Hata')
    } finally {
      setDelivering(null)
    }
  }

  async function handleDurumGuncelle(s: Siparis, durum: string) {
    setUpdatingDurum(s.id)
    try {
      await api.siparisler.setDurum(s.id, durum)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Hata')
    } finally {
      setUpdatingDurum(null)
    }
  }

  const filtered = siparisler.filter(s => {
    const matchSearch = search === '' ||
      s.siparis_no.toLowerCase().includes(search.toLowerCase()) ||
      (s.musteri_ad || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.restoran_ad || '').toLowerCase().includes(search.toLowerCase())
    const matchDurum = durumFilter === 'Tümü' || s.durum === durumFilter
    return matchSearch && matchDurum
  })

  const durumlar = ['Tümü', 'Beklemede', 'Atandı', 'Yolda', 'Teslim Edildi', 'İptal']

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-primary-600" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle size={32} className="text-red-500" />
      <p className="text-gray-600">{error}</p>
      <button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg">Tekrar Dene</button>
    </div>
  )

  return (
    <div>
      {showYeni && <YeniSiparisModal restoranlar={restoranlar} onClose={() => setShowYeni(false)} onSave={fetchData} />}
      {ataModal && <KuryeAtaModal siparis={ataModal} kuryeler={kuryeler} onClose={() => setAtaModal(null)} onSave={fetchData} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Siparişler</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} sipariş</p>
        </div>
        <button onClick={() => setShowYeni(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
          <Plus size={16} /> Yeni Sipariş
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Sipariş ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 w-56"
          />
        </div>
        <div className="flex gap-1">
          {durumlar.map(d => (
            <button key={d} onClick={() => setDurumFilter(d)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${durumFilter === d ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-600'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sipariş No</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Restoran</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Müşteri</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kurye</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tutar</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Durum</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tarih</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Sipariş bulunamadı</td></tr>
            ) : (
              filtered.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-mono text-gray-700">{s.siparis_no}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{s.restoran_ad || '—'}</td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-gray-800">{s.musteri_ad || '—'}</p>
                    <p className="text-xs text-gray-400">{s.teslimat_adresi || ''}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">{s.kurye_ad || '—'}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-800">{s.tutar.toFixed(2)} ₺</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${durumBadge(s.durum)}`}>{s.durum}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{formatTarih(s.olusturma_tarihi)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {/* Ata veya Kurye Değiştir */}
                      {s.durum !== 'Teslim Edildi' && s.durum !== 'İptal' && (
                        <button onClick={() => setAtaModal(s)} className="text-xs px-2 py-1 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-md flex items-center gap-1">
                          {s.kurye_id ? <><RefreshCw size={11} /> Kurye Değiştir</> : <><Bike size={11} /> Ata</>}
                        </button>
                      )}
                      {/* Yola Çıkar: sadece Atandı */}
                      {s.durum === 'Atandı' && (
                        <button onClick={() => handleDurumGuncelle(s, 'Yolda')} disabled={updatingDurum === s.id}
                          className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md flex items-center gap-1 disabled:opacity-50">
                          <Navigation size={11} /> Yola Çıkar
                        </button>
                      )}
                      {/* Beklet: Atandı veya Yolda */}
                      {(s.durum === 'Atandı' || s.durum === 'Yolda') && (
                        <button onClick={() => handleDurumGuncelle(s, 'Beklemede')} disabled={updatingDurum === s.id}
                          className="text-xs px-2 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-md flex items-center gap-1 disabled:opacity-50">
                          <PauseCircle size={11} /> Beklet
                        </button>
                      )}
                      {/* Teslim Et: Yolda */}
                      {s.durum === 'Yolda' && (
                        <button onClick={() => handleTeslim(s)} disabled={delivering === s.id}
                          className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md flex items-center gap-1 disabled:opacity-50">
                          <CheckCircle2 size={11} /> {delivering === s.id ? '...' : 'Teslim'}
                        </button>
                      )}
                      {/* İptal: herhangi aktif durum */}
                      {s.durum !== 'Teslim Edildi' && s.durum !== 'İptal' && (
                        <button onClick={() => { if (confirm('Sipariş iptal edilsin mi?')) handleDurumGuncelle(s, 'İptal') }} disabled={updatingDurum === s.id}
                          className="text-xs px-2 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-md flex items-center gap-1 disabled:opacity-50">
                          <Ban size={11} /> İptal
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
