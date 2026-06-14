import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, MapPin, Users } from 'lucide-react'
import { api, Bolge } from '../../lib/api'

const RENKLER = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#dc2626', '#4b5563']

const empty: Partial<Bolge> = { ad: '', il: '', aciklama: '', renk: RENKLER[0], aktif: 1 }

export default function Bolgeler() {
  const [list, setList] = useState<Bolge[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Bolge> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.bolgeler.list().then(setList).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!modal || !modal.ad) return
    setSaving(true)
    try {
      if (modal.id) await api.bolgeler.update(modal.id, modal)
      else await api.bolgeler.create(modal)
      setModal(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function remove(b: Bolge) {
    if (!confirm(`"${b.ad}" bölgesi silinsin mi?`)) return
    setError('')
    try {
      await api.bolgeler.remove(b.id)
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bölgeler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vardiya planlamasında kullanılan bölgeleri yönetin.</p>
        </div>
        <button onClick={() => setModal({ ...empty })} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Yeni Bölge
        </button>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={28} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(b => (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${b.renk}1a` }}>
                    <MapPin size={17} style={{ color: b.renk }} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{b.ad}</p>
                    <p className="text-xs text-gray-400">{b.il || '—'}</p>
                  </div>
                </div>
                {!b.aktif && <span className="badge bg-gray-100 text-gray-500">Pasif</span>}
              </div>
              {b.aciklama && <p className="text-sm text-gray-500 mt-3">{b.aciklama}</p>}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users size={14} /> {b.personel_sayisi} personel
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setModal({ ...b })} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"><Pencil size={15} /></button>
                  <button onClick={() => remove(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-gray-400 col-span-full text-center py-10">Henüz bölge tanımlanmadı.</p>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{modal.id ? 'Bölgeyi Düzenle' : 'Yeni Bölge'}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bölge Adı *</label>
                <input value={modal.ad || ''} onChange={e => setModal(m => ({ ...m, ad: e.target.value }))} className="input-field" placeholder="Örn: İzmir Merkez" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">İl</label>
                <input value={modal.il || ''} onChange={e => setModal(m => ({ ...m, il: e.target.value }))} className="input-field" placeholder="Örn: İzmir" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Açıklama</label>
                <textarea value={modal.aciklama || ''} onChange={e => setModal(m => ({ ...m, aciklama: e.target.value }))} className="input-field min-h-[70px]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Renk</label>
                <div className="flex gap-2 flex-wrap">
                  {RENKLER.map(renk => (
                    <button key={renk} onClick={() => setModal(m => ({ ...m, renk }))}
                      className={`w-8 h-8 rounded-full ring-2 transition-all ${modal.renk === renk ? 'ring-gray-900 scale-110' : 'ring-transparent'}`}
                      style={{ backgroundColor: renk }} />
                  ))}
                </div>
              </div>
              {modal.id && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!!modal.aktif} onChange={e => setModal(m => ({ ...m, aktif: e.target.checked ? 1 : 0 }))} className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm text-gray-600">Aktif bölge</span>
                </label>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Vazgeç</button>
              <button onClick={save} disabled={saving || !modal.ad} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null} Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
