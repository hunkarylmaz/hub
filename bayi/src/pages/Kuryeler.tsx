import { useState, useEffect, useCallback } from 'react'
import { Plus, Phone, Loader2, AlertCircle, X, Bike, CheckCircle, Coffee, WifiOff, Edit2, Trash2 } from 'lucide-react'
import { api, Kurye } from '../lib/api'

const durumlar: Kurye['durum'][] = ['Müsait', 'Dağıtımda', 'Mola', 'Çevrimdışı']

function durumIcon(durum: Kurye['durum']) {
  const map = { 'Müsait': <CheckCircle size={14} className="text-emerald-500" />, 'Dağıtımda': <Bike size={14} className="text-blue-500" />, 'Mola': <Coffee size={14} className="text-amber-500" />, 'Çevrimdışı': <WifiOff size={14} className="text-gray-400" /> }
  return map[durum]
}

function durumBg(durum: Kurye['durum']) {
  const map = { 'Müsait': 'bg-emerald-500', 'Dağıtımda': 'bg-blue-500', 'Mola': 'bg-amber-400', 'Çevrimdışı': 'bg-gray-300' }
  return map[durum] || 'bg-gray-300'
}

interface KuryeModalProps { kurye?: Kurye; onClose: () => void; onSave: () => void }

function KuryeModal({ kurye, onClose, onSave }: KuryeModalProps) {
  const [form, setForm] = useState({ ad: kurye?.ad || '', telefon: kurye?.telefon || '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    if (!form.ad.trim()) { setErr('Ad zorunlu'); return }
    setSaving(true)
    try {
      if (kurye) await api.kuryeler.update(kurye.id, form)
      else await api.kuryeler.create(form)
      onSave(); onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Hata')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{kurye ? 'Kurye Düzenle' : 'Yeni Kurye'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
            <input value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
            <input value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Kuryeler() {
  const [kuryeler, setKuryeler] = useState<Kurye[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'yeni' | Kurye | null>(null)
  const [durumUpdating, setDurumUpdating] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setKuryeler(await api.kuryeler.list())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDurum(k: Kurye, durum: Kurye['durum']) {
    setDurumUpdating(k.id)
    try {
      await api.kuryeler.setDurum(k.id, durum)
      await fetchData()
    } catch {} finally { setDurumUpdating(null) }
  }

  async function handleDelete(k: Kurye) {
    if (!confirm(`${k.ad} silinsin mi?`)) return
    try {
      await api.kuryeler.delete(k.id)
      await fetchData()
    } catch (err) { alert(err instanceof Error ? err.message : 'Hata') }
  }

  const stats = { musait: kuryeler.filter(k => k.durum === 'Müsait' && k.aktif).length, dagitimda: kuryeler.filter(k => k.durum === 'Dağıtımda' && k.aktif).length, mola: kuryeler.filter(k => k.durum === 'Mola' && k.aktif).length, cevrimdisi: kuryeler.filter(k => k.durum === 'Çevrimdışı' && k.aktif).length }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>
  if (error) return <div className="flex flex-col items-center justify-center py-20 gap-4"><AlertCircle size={32} className="text-red-500" /><p className="text-gray-600">{error}</p><button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg">Tekrar Dene</button></div>

  return (
    <div>
      {modal && <KuryeModal kurye={modal === 'yeni' ? undefined : modal} onClose={() => setModal(null)} onSave={fetchData} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Kuryeler</h1>
          <p className="text-sm text-gray-500 mt-0.5">{kuryeler.filter(k => k.aktif).length} aktif kurye</p>
        </div>
        <button onClick={() => setModal('yeni')} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
          <Plus size={16} /> Yeni Kurye
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Müsait', value: stats.musait, color: 'emerald' },
          { label: 'Dağıtımda', value: stats.dagitimda, color: 'blue' },
          { label: 'Mola', value: stats.mola, color: 'amber' },
          { label: 'Çevrimdışı', value: stats.cevrimdisi, color: 'gray' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {kuryeler.filter(k => k.aktif).map(k => (
          <div key={k.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                    {k.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${durumBg(k.durum)}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{k.ad}</p>
                  <p className="text-xs text-gray-400">{k.telefon || 'Telefon yok'}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setModal(k)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(k)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <p className="text-xl font-bold text-gray-800">{k.gunluk_teslimat}</p>
                <p className="text-xs text-gray-400">Bugün</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <p className="text-xl font-bold text-gray-800">{k.toplam_teslimat}</p>
                <p className="text-xs text-gray-400">Toplam</p>
              </div>
            </div>

            <div className="flex gap-1 flex-wrap">
              {durumlar.map(d => (
                <button
                  key={d}
                  onClick={() => handleDurum(k, d)}
                  disabled={durumUpdating === k.id}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium transition-colors ${k.durum === d ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {durumIcon(d)} {d}
                </button>
              ))}
            </div>

            {k.telefon && (
              <a href={`tel:${k.telefon}`} className="mt-3 flex items-center gap-2 text-xs text-gray-500 hover:text-primary-600 transition-colors">
                <Phone size={12} /> {k.telefon}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
