import { useState, useEffect, useCallback } from 'react'
import { Plus, Phone, MapPin, Loader2, AlertCircle, X, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import { api, Restoran } from '../lib/api'

interface RestoranModalProps { restoran?: Restoran; onClose: () => void; onSave: () => void }

function RestoranModal({ restoran, onClose, onSave }: RestoranModalProps) {
  const [form, setForm] = useState({ ad: restoran?.ad || '', adres: restoran?.adres || '', telefon: restoran?.telefon || '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    if (!form.ad.trim()) { setErr('Restoran adı zorunlu'); return }
    setSaving(true)
    try {
      if (restoran) await api.restoranlar.update(restoran.id, form)
      else await api.restoranlar.create(form)
      onSave(); onClose()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Hata') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{restoran ? 'Restoran Düzenle' : 'Yeni Restoran'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Restoran Adı *</label>
            <input value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adres</label>
            <input value={form.adres} onChange={e => setForm(f => ({ ...f, adres: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
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

export default function Restoranlar() {
  const [restoranlar, setRestoranlar] = useState<Restoran[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'yeni' | Restoran | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setRestoranlar(await api.restoranlar.list())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleToggle(r: Restoran) {
    try {
      await api.restoranlar.update(r.id, { aktif: r.aktif ? 0 : 1 })
      await fetchData()
    } catch {}
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>
  if (error) return <div className="flex flex-col items-center justify-center py-20 gap-4"><AlertCircle size={32} className="text-red-500" /><p className="text-gray-600">{error}</p><button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg">Tekrar Dene</button></div>

  return (
    <div>
      {modal && <RestoranModal restoran={modal === 'yeni' ? undefined : modal} onClose={() => setModal(null)} onSave={fetchData} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Restoranlar / İşletmeler</h1>
          <p className="text-sm text-gray-500 mt-0.5">{restoranlar.filter(r => r.aktif).length} aktif işletme</p>
        </div>
        <button onClick={() => setModal('yeni')} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
          <Plus size={16} /> Yeni İşletme
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {restoranlar.map(r => (
          <div key={r.id} className={`bg-white rounded-xl border p-5 transition-opacity ${r.aktif ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm">
                {r.ad.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setModal(r)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleToggle(r)} className={`p-1.5 rounded-lg transition-colors ${r.aktif ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                  {r.aktif ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 mb-1">{r.ad}</h3>

            {r.adres && (
              <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-1">
                <MapPin size={11} className="mt-0.5 shrink-0" />
                <span>{r.adres}</span>
              </div>
            )}
            {r.telefon && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                <Phone size={11} />
                <a href={`tel:${r.telefon}`} className="hover:text-primary-600">{r.telefon}</a>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">{r.gunluk_siparis}</p>
                <p className="text-xs text-gray-400">Bugün</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                {r.aktif ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
