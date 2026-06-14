import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Pencil, X, Loader2, Megaphone } from 'lucide-react'
import { api, Duyuru, Bolge } from '../../lib/api'

const ONEMLER = ['Normal', 'Önemli', 'Acil']
const ONEM_RENK: Record<string, string> = {
  'Normal': 'bg-gray-100 text-gray-600',
  'Önemli': 'bg-amber-50 text-amber-700',
  'Acil': 'bg-red-50 text-red-700',
}

const empty: Partial<Duyuru> = { baslik: '', icerik: '', bolge_id: null, onem: 'Normal' }

export default function Duyurular() {
  const [list, setList] = useState<Duyuru[]>([])
  const [bolgeler, setBolgeler] = useState<Bolge[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Duyuru> | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.duyurular.list().then(setList).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { api.bolgeler.list().then(setBolgeler) }, [])

  async function save() {
    if (!modal || !modal.baslik || !modal.icerik) return
    setSaving(true)
    try {
      const payload = { ...modal, bolge_id: modal.bolge_id ? Number(modal.bolge_id) : null }
      if (modal.id) await api.duyurular.update(modal.id, payload)
      else await api.duyurular.create(payload)
      setModal(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function remove(d: Duyuru) {
    if (!confirm(`"${d.baslik}" duyurusu silinsin mi?`)) return
    await api.duyurular.remove(d.id)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Duyurular</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tüm personele veya belirli bir bölgeye yönelik duyurular yayınlayın.</p>
        </div>
        <button onClick={() => setModal({ ...empty })} className="btn-primary flex items-center gap-1.5"><Plus size={15} /> Yeni Duyuru</button>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={28} /></div>
      ) : list.length === 0 ? (
        <div className="card p-10 text-center text-gray-400 text-sm">Henüz duyuru yayınlanmadı.</div>
      ) : (
        <div className="space-y-3">
          {list.map(d => (
            <div key={d.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Megaphone size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900">{d.baslik}</p>
                      <span className={`badge ${ONEM_RENK[d.onem]}`}>{d.onem}</span>
                      <span className="badge bg-gray-50 text-gray-500">{d.bolge_ad || 'Tüm Bölgeler'}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1.5">{d.icerik}</p>
                    <p className="text-[11px] text-gray-400 mt-2">{d.olusturma}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setModal({ ...d })} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"><Pencil size={15} /></button>
                  <button onClick={() => remove(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{modal.id ? 'Duyuruyu Düzenle' : 'Yeni Duyuru'}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Başlık *</label>
                <input value={modal.baslik || ''} onChange={e => setModal(m => ({ ...m, baslik: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">İçerik *</label>
                <textarea value={modal.icerik || ''} onChange={e => setModal(m => ({ ...m, icerik: e.target.value }))} className="input-field min-h-[100px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Hedef Bölge</label>
                  <select value={modal.bolge_id ?? ''} onChange={e => setModal(m => ({ ...m, bolge_id: e.target.value ? Number(e.target.value) : null }))} className="input-field">
                    <option value="">Tüm Bölgeler</option>
                    {bolgeler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Önem</label>
                  <select value={modal.onem || 'Normal'} onChange={e => setModal(m => ({ ...m, onem: e.target.value }))} className="input-field">
                    {ONEMLER.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Vazgeç</button>
              <button onClick={save} disabled={saving || !modal.baslik || !modal.icerik} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null} Yayınla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
