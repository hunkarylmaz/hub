import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Edit2, Loader2, X, Check, Tag } from 'lucide-react'
import { api, Fiyat, HizmetTuru, HIZMET_TURU_LABELS } from '../../lib/api'
import { ILLER } from '../../lib/locations'

const TURLER: HizmetTuru[] = ['adres_dagitim', 'adres_toplama', 'otogar_alis', 'kargo_geri']

const TUR_COLOR: Record<HizmetTuru, string> = {
  adres_dagitim: 'bg-blue-600 text-white',
  adres_toplama: 'bg-emerald-600 text-white',
  otogar_alis:   'bg-amber-500 text-white',
  kargo_geri:    'bg-purple-600 text-white',
}
const TUR_INACTIVE = 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'

interface Form { il: string; ilce: string; mahalle: string; fiyat: string; tur: HizmetTuru }
const EMPTY = (tur: HizmetTuru): Form => ({ il: '', ilce: '', mahalle: '', fiyat: '', tur })

export default function Fiyatlar() {
  const [list, setList] = useState<Fiyat[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTur, setActiveTur] = useState<HizmetTuru>('adres_dagitim')
  const [modal, setModal] = useState<{ open: boolean; edit?: Fiyat }>({ open: false })
  const [form, setForm] = useState<Form>(EMPTY('adres_dagitim'))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setList(await api.admin.fiyatlar.list()); setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setForm(EMPTY(activeTur)); setErr(''); setModal({ open: true }) }
  function openEdit(f: Fiyat) {
    setForm({ il: f.il, ilce: f.ilce || '', mahalle: f.mahalle || '', fiyat: String(f.fiyat), tur: f.tur || 'adres_dagitim' })
    setErr(''); setModal({ open: true, edit: f })
  }

  async function save() {
    if (!form.il || !form.fiyat) { setErr('İl ve fiyat zorunlu'); return }
    setSaving(true); setErr('')
    try {
      const data = { il: form.il, ilce: form.ilce || null, mahalle: form.mahalle || null, fiyat: Number(form.fiyat), tur: form.tur }
      if (modal.edit) await api.admin.fiyatlar.update(modal.edit.id, data)
      else await api.admin.fiyatlar.create(data)
      setModal({ open: false }); load()
    } catch (e) { setErr((e as Error).message) }
    finally { setSaving(false) }
  }

  async function remove(id: number) {
    if (!confirm('Bu fiyatı silmek istediğinizden emin misiniz?')) return
    await api.admin.fiyatlar.remove(id); load()
  }

  const secilenIl = ILLER.find(i => i.il === form.il)
  const filtered = list.filter(f => (f.tur || 'adres_dagitim') === activeTur)

  const scopeLabel = (f: Fiyat) => {
    if (f.mahalle) return `${f.il} / ${f.ilce} / ${f.mahalle}`
    if (f.ilce) return `${f.il} / ${f.ilce}`
    return f.il
  }
  const scopeType = (f: Fiyat) => {
    if (f.mahalle) return { label: 'Mahalle', color: 'bg-purple-50 text-purple-700' }
    if (f.ilce)    return { label: 'İlçe',    color: 'bg-blue-50 text-blue-700' }
    return { label: 'İl', color: 'bg-gray-100 text-gray-700' }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fiyat Tablosu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hizmet türü ve bölge bazlı fiyatlar (KDV hariç)</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Fiyat Ekle
        </button>
      </div>

      {/* Service type tabs */}
      <div className="flex flex-wrap gap-2">
        {TURLER.map(tur => (
          <button key={tur} onClick={() => setActiveTur(tur)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTur === tur ? TUR_COLOR[tur] : TUR_INACTIVE
            }`}>
            {HIZMET_TURU_LABELS[tur]}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${
              activeTur === tur ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
            }`}>
              {list.filter(f => (f.tur || 'adres_dagitim') === tur).length}
            </span>
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
        <span className="font-bold shrink-0">Öncelik:</span>
        <span>Mahalle {'>'} İlçe {'>'} İl — iş oluşturulurken alış noktası + hizmet türüne göre en spesifik fiyat uygulanır.</span>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Tag size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">"{HIZMET_TURU_LABELS[activeTur]}" için fiyat tanımlı değil</p>
            <button onClick={openCreate} className="mt-3 text-sm text-blue-600 font-semibold hover:underline">
              İlk fiyatı ekle →
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Bölge</th>
                <th className="text-left px-4 py-3">Kapsam</th>
                <th className="text-right px-4 py-3">Baz Fiyat (KDV hariç)</th>
                <th className="text-center px-4 py-3">Durum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(f => {
                const scope = scopeType(f)
                return (
                  <tr key={f.id} className={`hover:bg-gray-50 ${!f.aktif ? 'opacity-40' : ''}`}>
                    <td className="px-5 py-3 font-medium text-gray-800">{scopeLabel(f)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${scope.color}`}>{scope.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">₺{f.fiyat.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${f.aktif ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {f.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => remove(f.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">{modal.edit ? 'Fiyat Düzenle' : 'Yeni Fiyat'}</h2>
              <button onClick={() => setModal({ open: false })} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            {err && <div className="mb-3 px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg">{err}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hizmet Türü *</label>
                <select value={form.tur} onChange={e => setForm(f => ({ ...f, tur: e.target.value as HizmetTuru }))}
                  className="input-field">
                  {TURLER.map(t => <option key={t} value={t}>{HIZMET_TURU_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">İl *</label>
                <select value={form.il} onChange={e => setForm(f => ({ ...f, il: e.target.value, ilce: '' }))}
                  className="input-field">
                  <option value="">İl seçin...</option>
                  {ILLER.map(i => <option key={i.il} value={i.il}>{i.il}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">İlçe <span className="font-normal text-gray-400">(boş = tüm ilçeler)</span></label>
                <select value={form.ilce} onChange={e => setForm(f => ({ ...f, ilce: e.target.value }))}
                  disabled={!form.il} className="input-field disabled:opacity-50">
                  <option value="">Tüm ilçeler</option>
                  {secilenIl?.ilceler.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mahalle <span className="font-normal text-gray-400">(boş = tüm mahalleler)</span></label>
                <input type="text" value={form.mahalle} placeholder="Mahalle adı"
                  onChange={e => setForm(f => ({ ...f, mahalle: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Baz Fiyat (₺, KDV hariç) *</label>
                <input type="number" step="0.01" min="0" value={form.fiyat}
                  onChange={e => setForm(f => ({ ...f, fiyat: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal({ open: false })} className="btn-secondary flex-1">İptal</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
