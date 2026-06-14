import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, X, Loader2, Phone, Mail } from 'lucide-react'
import { api, Personel, Bolge, PersonelDurum } from '../../lib/api'

const DURUMLAR: PersonelDurum[] = ['Aktif', 'Pasif', 'İzinli']
const DURUM_RENK: Record<string, string> = {
  'Aktif': 'bg-emerald-50 text-emerald-700',
  'Pasif': 'bg-gray-100 text-gray-500',
  'İzinli': 'bg-amber-50 text-amber-700',
}

const empty: Partial<Personel> = {
  ad_soyad: '', telefon: '', email: '', tc_no: '', pozisyon: 'Kurye',
  bolge_id: null, ise_giris_tarihi: '', durum: 'Aktif', maas: undefined, adres: '', notlar: '',
}

export default function PersonelSayfasi() {
  const [list, setList] = useState<Personel[]>([])
  const [bolgeler, setBolgeler] = useState<Bolge[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [bolgeFilter, setBolgeFilter] = useState<string>('')
  const [durumFilter, setDurumFilter] = useState<string>('')
  const [modal, setModal] = useState<Partial<Personel> | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (q) params.q = q
    if (durumFilter) params.durum = durumFilter
    if (bolgeFilter) params.bolge_id = bolgeFilter
    api.personel.list(params as never).then(setList).finally(() => setLoading(false))
  }, [q, durumFilter, bolgeFilter])

  useEffect(() => { api.bolgeler.list().then(setBolgeler) }, [])
  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  async function save() {
    if (!modal || !modal.ad_soyad) return
    setSaving(true)
    try {
      const payload = { ...modal, maas: modal.maas ? Number(modal.maas) : null, bolge_id: modal.bolge_id ? Number(modal.bolge_id) : null }
      if (modal.id) await api.personel.update(modal.id, payload)
      else await api.personel.create(payload)
      setModal(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function remove(p: Personel) {
    if (!confirm(`${p.ad_soyad} kalıcı olarak silinsin mi? Bu işlem vardiya kayıtlarını da kaldırır.`)) return
    await api.personel.remove(p.id)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personel Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tüm personeli görüntüleyin, ekleyin, düzenleyin veya çıkarın.</p>
        </div>
        <button onClick={() => setModal({ ...empty })} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Yeni Personel
        </button>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ad, telefon veya e-posta ile ara..." className="input-field pl-10" />
        </div>
        <select value={bolgeFilter} onChange={e => setBolgeFilter(e.target.value)} className="input-field !w-auto">
          <option value="">Tüm Bölgeler</option>
          <option value="null">Bölgesiz</option>
          {bolgeler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
        </select>
        <select value={durumFilter} onChange={e => setDurumFilter(e.target.value)} className="input-field !w-auto">
          <option value="">Tüm Durumlar</option>
          {DURUMLAR.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={28} /></div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">Kayıt bulunamadı.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-4 py-3">Ad Soyad</th>
                <th className="px-4 py-3">Pozisyon</th>
                <th className="px-4 py-3">Bölge</th>
                <th className="px-4 py-3">İletişim</th>
                <th className="px-4 py-3">İşe Giriş</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-semibold text-gray-800">{p.ad_soyad}</td>
                  <td className="px-4 py-3 text-gray-500">{p.pozisyon}</td>
                  <td className="px-4 py-3">
                    {p.bolge_ad ? (
                      <span className="badge" style={{ backgroundColor: `${p.bolge_renk}1a`, color: p.bolge_renk || '#374151' }}>{p.bolge_ad}</span>
                    ) : <span className="text-xs text-gray-400">Bölgesiz</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.telefon && <div className="flex items-center gap-1.5 text-xs"><Phone size={12} />{p.telefon}</div>}
                    {p.email && <div className="flex items-center gap-1.5 text-xs text-gray-400"><Mail size={12} />{p.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.ise_giris_tarihi || '—'}</td>
                  <td className="px-4 py-3"><span className={`badge ${DURUM_RENK[p.durum]}`}>{p.durum}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setModal({ ...p })} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"><Pencil size={15} /></button>
                    <button onClick={() => remove(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{modal.id ? 'Personeli Düzenle' : 'Yeni Personel'}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Soyad *</label>
                <input value={modal.ad_soyad || ''} onChange={e => setModal(m => ({ ...m, ad_soyad: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Telefon</label>
                <input value={modal.telefon || ''} onChange={e => setModal(m => ({ ...m, telefon: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-posta</label>
                <input value={modal.email || ''} onChange={e => setModal(m => ({ ...m, email: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">TC Kimlik No</label>
                <input value={modal.tc_no || ''} onChange={e => setModal(m => ({ ...m, tc_no: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pozisyon</label>
                <input value={modal.pozisyon || ''} onChange={e => setModal(m => ({ ...m, pozisyon: e.target.value }))} className="input-field" placeholder="Kurye" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bölge</label>
                <select value={modal.bolge_id ?? ''} onChange={e => setModal(m => ({ ...m, bolge_id: e.target.value ? Number(e.target.value) : null }))} className="input-field">
                  <option value="">Bölgesiz</option>
                  {bolgeler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Durum</label>
                <select value={modal.durum || 'Aktif'} onChange={e => setModal(m => ({ ...m, durum: e.target.value as PersonelDurum }))} className="input-field">
                  {DURUMLAR.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">İşe Giriş Tarihi</label>
                <input type="date" value={modal.ise_giris_tarihi || ''} onChange={e => setModal(m => ({ ...m, ise_giris_tarihi: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Maaş (₺)</label>
                <input type="number" value={modal.maas ?? ''} onChange={e => setModal(m => ({ ...m, maas: e.target.value ? Number(e.target.value) : undefined }))} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Adres</label>
                <input value={modal.adres || ''} onChange={e => setModal(m => ({ ...m, adres: e.target.value }))} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notlar</label>
                <textarea value={modal.notlar || ''} onChange={e => setModal(m => ({ ...m, notlar: e.target.value }))} className="input-field min-h-[70px]" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Vazgeç</button>
              <button onClick={save} disabled={saving || !modal.ad_soyad} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null} Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
