import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, UserPlus, UserMinus, Copy, Printer, X, Loader2, CalendarDays } from 'lucide-react'
import { api, Bolge, VardiyaPlani, Personel } from '../../lib/api'

const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

function pad(n: number) { return n < 10 ? `0${n}` : `${n}` }
function toISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function mondayOf(d: Date) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const m = new Date(d)
  m.setDate(m.getDate() + diff)
  return m
}
function fmt(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${AYLAR[d.getMonth()]}`
}
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toISO(d)
}

interface EditState {
  personelId: number
  ad_soyad: string
  gun: number
  gun_adi: string
  tarih: string
  baslangic: string
  bitis: string
  off: boolean
}

export default function VardiyaPlanlama() {
  const [bolgeler, setBolgeler] = useState<Bolge[]>([])
  const [bolgeId, setBolgeId] = useState<number | null>(null)
  const [hafta, setHafta] = useState<string>(toISO(mondayOf(new Date())))
  const [plan, setPlan] = useState<VardiyaPlani | null>(null)
  const [loading, setLoading] = useState(false)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [copyMsg, setCopyMsg] = useState('')

  useEffect(() => {
    api.bolgeler.list().then(rows => {
      setBolgeler(rows)
      if (rows.length && bolgeId == null) {
        const enKalabalik = [...rows].sort((a, b) => b.personel_sayisi - a.personel_sayisi)[0]
        setBolgeId(enKalabalik.id)
      }
    })
  }, [bolgeId])

  const loadPlan = useCallback(() => {
    if (bolgeId == null) return
    setLoading(true)
    api.vardiya.get(bolgeId, hafta).then(setPlan).finally(() => setLoading(false))
  }, [bolgeId, hafta])

  useEffect(() => { loadPlan() }, [loadPlan])

  function openEdit(personelId: number, ad_soyad: string, gun: number, gun_adi: string, tarih: string, baslangic: string | null, bitis: string | null, off: boolean) {
    setEdit({ personelId, ad_soyad, gun, gun_adi, tarih, baslangic: baslangic || '', bitis: bitis || '', off })
  }

  async function saveEdit() {
    if (!edit) return
    setSaving(true)
    try {
      await api.vardiya.set({
        personel_id: edit.personelId,
        hafta_baslangic: hafta,
        gun: edit.gun,
        baslangic: edit.off ? null : (edit.baslangic || null),
        bitis: edit.off ? null : (edit.bitis || null),
        off: edit.off,
      })
      setEdit(null)
      loadPlan()
    } finally {
      setSaving(false)
    }
  }

  async function clearCell() {
    if (!edit) return
    setSaving(true)
    try {
      await api.vardiya.clear({ personel_id: edit.personelId, hafta_baslangic: hafta, gun: edit.gun })
      setEdit(null)
      loadPlan()
    } finally {
      setSaving(false)
    }
  }

  async function removeFromRegion(personelId: number, ad_soyad: string) {
    if (!confirm(`${ad_soyad} bu bölgeden çıkarılsın mı? (Personel kaydı silinmez, sadece bölge ataması kaldırılır.)`)) return
    await api.personel.update(personelId, { bolge_id: null })
    loadPlan()
  }

  async function copyToNextWeek() {
    if (bolgeId == null) return
    setCopyMsg('')
    const r = await api.vardiya.kopyala({ bolge_id: bolgeId, hafta_baslangic: hafta })
    setCopyMsg(`Plan ${fmt(r.hedef_hafta)} haftasına kopyalandı.`)
    setTimeout(() => setCopyMsg(''), 4000)
  }

  const currentBolge = bolgeler.find(b => b.id === bolgeId)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vardiya Planlama</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bölge bazlı haftalık vardiya tablosu — hücreye tıklayarak düzenleyin.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="btn-secondary flex items-center gap-1.5" disabled={bolgeId == null}>
            <UserPlus size={15} /> Personel Ekle
          </button>
          <button onClick={copyToNextWeek} className="btn-secondary flex items-center gap-1.5" disabled={bolgeId == null}>
            <Copy size={15} /> Haftayı Kopyala
          </button>
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-1.5">
            <Printer size={15} /> Yazdır
          </button>
        </div>
      </div>

      {copyMsg && <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl print:hidden">{copyMsg}</div>}

      <div className="card p-4 flex flex-wrap items-center gap-3 print:border-0 print:shadow-none">
        <div className="flex items-center gap-2">
          <span className="section-title">Bölge</span>
          <select value={bolgeId ?? ''} onChange={e => setBolgeId(Number(e.target.value))} className="input-field !w-auto print:hidden">
            {bolgeler.map(b => <option key={b.id} value={b.id}>{b.ad} {b.personel_sayisi ? `(${b.personel_sayisi})` : ''}</option>)}
          </select>
          <span className="hidden print:inline font-bold text-gray-900">{currentBolge?.ad}</span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto print:hidden">
          <button onClick={() => setHafta(addDays(hafta, -7))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-sm font-semibold text-gray-700">
            <CalendarDays size={14} className="text-gray-400" />
            {fmt(hafta)} – {fmt(addDays(hafta, 6))}
          </div>
          <button onClick={() => setHafta(addDays(hafta, 7))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setHafta(toISO(mondayOf(new Date())))} className="btn-ghost">Bugün</button>
        </div>
        <span className="hidden print:inline text-sm text-gray-500">{fmt(hafta)} – {fmt(addDays(hafta, 6))}</span>
      </div>

      <div className="card overflow-x-auto print:border-0 print:shadow-none">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={28} /></div>
        ) : !plan || plan.personeller.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            Bu bölgede henüz personel bulunmuyor. "Personel Ekle" ile bu bölgeye personel atayabilirsiniz.
          </div>
        ) : (
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-4 py-3 text-left font-bold sticky left-0 bg-blue-600 z-10 min-w-[160px]">Personel</th>
                {plan.gun_adlari.map((g, i) => (
                  <th key={g} className="px-3 py-3 text-center font-bold min-w-[120px]">
                    <div>{g}</div>
                    <div className="text-[10px] font-medium text-blue-100">{fmt(plan.personeller[0].gunler[i].tarih)}</div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-bold min-w-[110px]">Haftalık Toplam</th>
                <th className="px-2 py-3 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {plan.personeller.map((p, idx) => (
                <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                  <td className="px-4 py-2.5 font-semibold text-gray-800 sticky left-0 z-10" style={{ background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                    {p.ad_soyad}
                    <div className="text-[11px] text-gray-400 font-normal">{p.pozisyon}</div>
                  </td>
                  {p.gunler.map(g => (
                    <td key={g.gun} className="px-2 py-2 text-center">
                      <button
                        onClick={() => openEdit(p.id, p.ad_soyad, g.gun, g.gun_adi, g.tarih, g.baslangic, g.bitis, g.off)}
                        className={`w-full px-2 py-2 rounded-lg text-xs font-semibold transition-colors print:rounded-none ${
                          g.off
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : g.baslangic && g.bitis
                              ? 'bg-blue-50/60 text-gray-700 hover:bg-blue-100'
                              : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
                        }`}>
                        {g.off ? 'OFF' : g.baslangic && g.bitis ? `${g.baslangic}-${g.bitis}` : '—'}
                      </button>
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-center font-bold text-gray-900">{p.haftalik_toplam} saat</td>
                  <td className="px-2 py-2.5 text-center print:hidden">
                    <button onClick={() => removeFromRegion(p.id, p.ad_soyad)} title="Bölgeden çıkar" className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50">
                      <UserMinus size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cell edit modal */}
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEdit(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">{edit.ad_soyad}</h3>
                <p className="text-xs text-gray-400">{edit.gun_adi} · {fmt(edit.tarih)}</p>
              </div>
              <button onClick={() => setEdit(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>

            <label className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-red-50 cursor-pointer">
              <input type="checkbox" checked={edit.off} onChange={e => setEdit({ ...edit, off: e.target.checked })} className="w-4 h-4 accent-red-500" />
              <span className="text-sm font-semibold text-red-600">OFF (İzin / Tatil günü)</span>
            </label>

            {!edit.off && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Başlangıç</label>
                  <input type="time" value={edit.baslangic} onChange={e => setEdit({ ...edit, baslangic: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bitiş</label>
                  <input type="time" value={edit.bitis} onChange={e => setEdit({ ...edit, bitis: e.target.value })} className="input-field" />
                </div>
                <p className="col-span-2 text-[11px] text-gray-400">Bitiş saati başlangıçtan küçükse (örn. 23:00 - 04:00) vardiya gece yarısını geçer kabul edilir.</p>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={clearCell} disabled={saving} className="btn-secondary flex-1">Temizle</button>
              <button onClick={saveEdit} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null} Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add personnel modal */}
      {showAdd && bolgeId != null && (
        <PersonelEkleModal bolgeId={bolgeId} onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); loadPlan() }} />
      )}
    </div>
  )
}

function PersonelEkleModal({ bolgeId, onClose, onDone }: { bolgeId: number; onClose: () => void; onDone: () => void }) {
  const [tab, setTab] = useState<'mevcut' | 'yeni'>('mevcut')
  const [list, setList] = useState<Personel[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [form, setForm] = useState({ ad_soyad: '', telefon: '', pozisyon: 'Kurye' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api.personel.list({ durum: 'Aktif' }).then(rows => {
      setList(rows.filter(p => p.bolge_id !== bolgeId))
      setLoading(false)
    })
  }, [bolgeId])

  async function assign(id: number) {
    setBusyId(id)
    try { await api.personel.update(id, { bolge_id: bolgeId }); onDone() }
    finally { setBusyId(null) }
  }

  async function createAndAssign() {
    if (!form.ad_soyad) return
    setCreating(true)
    try {
      await api.personel.create({ ...form, bolge_id: bolgeId, durum: 'Aktif' })
      onDone()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Bölgeye Personel Ekle</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setTab('mevcut')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'mevcut' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>Mevcut Personel</button>
          <button onClick={() => setTab('yeni')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'yeni' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>Yeni Personel</button>
        </div>

        {tab === 'mevcut' ? (
          loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={22} /></div>
          ) : list.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Atanabilecek başka aktif personel bulunmuyor.</p>
          ) : (
            <div className="space-y-1.5">
              {list.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-gray-200">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.ad_soyad}</p>
                    <p className="text-xs text-gray-400 truncate">{p.pozisyon} · {p.bolge_ad || 'Bölgesiz'}</p>
                  </div>
                  <button onClick={() => assign(p.id)} disabled={busyId === p.id} className="btn-primary !px-3 !py-1.5 text-xs shrink-0">
                    {busyId === p.id ? <Loader2 size={13} className="animate-spin" /> : 'Ekle'}
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Soyad *</label>
              <input value={form.ad_soyad} onChange={e => setForm(f => ({ ...f, ad_soyad: e.target.value }))} className="input-field" placeholder="Ad Soyad" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Telefon</label>
              <input value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} className="input-field" placeholder="05XX XXX XX XX" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pozisyon</label>
              <input value={form.pozisyon} onChange={e => setForm(f => ({ ...f, pozisyon: e.target.value }))} className="input-field" placeholder="Kurye" />
            </div>
            <button onClick={createAndAssign} disabled={creating || !form.ad_soyad} className="btn-primary w-full flex items-center justify-center gap-1.5">
              {creating ? <Loader2 size={14} className="animate-spin" /> : null} Oluştur ve Bölgeye Ekle
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
