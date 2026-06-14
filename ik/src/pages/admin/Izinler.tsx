import { useState, useEffect, useCallback } from 'react'
import { Plus, Check, X as XIcon, Trash2, Loader2, Filter } from 'lucide-react'
import { api, Izin, IzinDurum, Personel } from '../../lib/api'

const DURUMLAR: IzinDurum[] = ['Beklemede', 'Onaylandı', 'Reddedildi']
const DURUM_RENK: Record<string, string> = {
  'Beklemede': 'bg-amber-50 text-amber-700',
  'Onaylandı': 'bg-emerald-50 text-emerald-700',
  'Reddedildi': 'bg-red-50 text-red-700',
}
const TURLER = ['Yıllık İzin', 'Mazeret İzni', 'Sağlık Raporu', 'Ücretsiz İzin', 'Diğer']

function gunSayisi(b: string, e: string) {
  const d1 = new Date(b + 'T00:00:00')
  const d2 = new Date(e + 'T00:00:00')
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1)
}

export default function Izinler() {
  const [list, setList] = useState<Izin[]>([])
  const [personeller, setPersoneller] = useState<Personel[]>([])
  const [loading, setLoading] = useState(true)
  const [durumFilter, setDurumFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ personel_id: '', baslangic_tarih: '', bitis_tarih: '', tur: TURLER[0], aciklama: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.izinler.list(durumFilter ? { durum: durumFilter } : {}).then(setList).finally(() => setLoading(false))
  }, [durumFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { api.personel.list({ durum: 'Aktif' }).then(setPersoneller) }, [])

  async function setDurum(i: Izin, durum: IzinDurum) {
    await api.izinler.update(i.id, { durum })
    setList(l => l.map(x => x.id === i.id ? { ...x, durum } : x))
  }

  async function remove(i: Izin) {
    if (!confirm(`${i.ad_soyad} için izin kaydı silinsin mi?`)) return
    await api.izinler.remove(i.id)
    load()
  }

  async function submit() {
    if (!form.personel_id || !form.baslangic_tarih || !form.bitis_tarih) return
    setSaving(true)
    try {
      await api.izinler.create({ ...form, personel_id: Number(form.personel_id), durum: 'Beklemede' })
      setModal(false)
      setForm({ personel_id: '', baslangic_tarih: '', bitis_tarih: '', tur: TURLER[0], aciklama: '' })
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İzin Talepleri</h1>
          <p className="text-sm text-gray-500 mt-0.5">Personel izin / rapor taleplerini kayıt altına alın ve onaylayın.</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-1.5"><Plus size={15} /> Yeni İzin Kaydı</button>
      </div>

      <div className="card p-4 flex items-center gap-2 flex-wrap">
        <Filter size={15} className="text-gray-400" />
        <button onClick={() => setDurumFilter('')} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${durumFilter === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>Tümü</button>
        {DURUMLAR.map(d => (
          <button key={d} onClick={() => setDurumFilter(d)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${durumFilter === d ? 'bg-gray-900 text-white' : DURUM_RENK[d]}`}>{d}</button>
        ))}
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
                <th className="px-4 py-3">Personel</th>
                <th className="px-4 py-3">Bölge</th>
                <th className="px-4 py-3">Tür</th>
                <th className="px-4 py-3">Tarih Aralığı</th>
                <th className="px-4 py-3">Gün</th>
                <th className="px-4 py-3">Açıklama</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {list.map(i => (
                <tr key={i.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-semibold text-gray-800">{i.ad_soyad}</td>
                  <td className="px-4 py-3 text-gray-500">{i.bolge_ad || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{i.tur}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{i.baslangic_tarih} → {i.bitis_tarih}</td>
                  <td className="px-4 py-3 text-gray-500">{gunSayisi(i.baslangic_tarih, i.bitis_tarih)} gün</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px] truncate">{i.aciklama || '—'}</td>
                  <td className="px-4 py-3"><span className={`badge ${DURUM_RENK[i.durum]}`}>{i.durum}</span></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {i.durum !== 'Onaylandı' && (
                      <button onClick={() => setDurum(i, 'Onaylandı')} title="Onayla" className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"><Check size={15} /></button>
                    )}
                    {i.durum !== 'Reddedildi' && (
                      <button onClick={() => setDurum(i, 'Reddedildi')} title="Reddet" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><XIcon size={15} /></button>
                    )}
                    <button onClick={() => remove(i)} title="Sil" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Yeni İzin Kaydı</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><XIcon size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Personel *</label>
                <select value={form.personel_id} onChange={e => setForm(f => ({ ...f, personel_id: e.target.value }))} className="input-field">
                  <option value="">Seçiniz</option>
                  {personeller.map(p => <option key={p.id} value={p.id}>{p.ad_soyad} {p.bolge_ad ? `(${p.bolge_ad})` : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Başlangıç *</label>
                  <input type="date" value={form.baslangic_tarih} onChange={e => setForm(f => ({ ...f, baslangic_tarih: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bitiş *</label>
                  <input type="date" value={form.bitis_tarih} onChange={e => setForm(f => ({ ...f, bitis_tarih: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">İzin Türü</label>
                <select value={form.tur} onChange={e => setForm(f => ({ ...f, tur: e.target.value }))} className="input-field">
                  {TURLER.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Açıklama</label>
                <textarea value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} className="input-field min-h-[70px]" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Vazgeç</button>
              <button onClick={submit} disabled={saving || !form.personel_id || !form.baslangic_tarih || !form.bitis_tarih} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null} Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
