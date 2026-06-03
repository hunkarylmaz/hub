import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, ToggleLeft, ToggleRight, Loader2, X, Check, Bike } from 'lucide-react'
import { api } from '../../lib/api'

interface Tasiyici { id: number; ad: string; email: string; telefon: string; arac_tipi: string; aktif: number }
interface Form { ad: string; email: string; sifre: string; telefon: string; arac_tipi: string }
const EMPTY: Form = { ad: '', email: '', sifre: '', telefon: '', arac_tipi: 'Motosiklet' }
const ARAC_TIPLERI = ['Motosiklet', 'Bisiklet', 'Araç', 'Yaya', 'Elektrikli Scooter']

export default function Tasiyicilar() {
  const [list, setList] = useState<Tasiyici[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; edit?: Tasiyici }>({ open: false })
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setList(await api.admin.tasiyicilar.list()); setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setForm(EMPTY); setErr(''); setModal({ open: true }) }
  function openEdit(t: Tasiyici) {
    setForm({ ad: t.ad, email: t.email, sifre: '', telefon: t.telefon || '', arac_tipi: t.arac_tipi })
    setErr(''); setModal({ open: true, edit: t })
  }
  async function save() {
    setSaving(true); setErr('')
    try {
      if (modal.edit) await api.admin.tasiyicilar.update(modal.edit.id, form as unknown as Record<string, unknown>)
      else await api.admin.tasiyicilar.create(form as unknown as Record<string, unknown>)
      setModal({ open: false }); load()
    } catch (e) { setErr((e as Error).message) }
    finally { setSaving(false) }
  }
  async function toggleAktif(t: Tasiyici) {
    await api.admin.tasiyicilar.update(t.id, { ...t, aktif: t.aktif ? 0 : 1, sifre: '' })
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taşıyıcılar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Taşıyıcı hesapları</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Yeni Taşıyıcı
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Ad</th>
                <th className="text-left px-4 py-3">E-posta</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Araç</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Telefon</th>
                <th className="text-center px-4 py-3">Durum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {list.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Bike size={14} className="text-emerald-600" />
                      </div>
                      <span className="font-semibold text-gray-900">{t.ad}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.email}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{t.arac_tipi}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{t.telefon || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleAktif(t)}>
                      {t.aktif ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} className="text-gray-300" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">{modal.edit ? 'Taşıyıcı Düzenle' : 'Yeni Taşıyıcı'}</h2>
              <button onClick={() => setModal({ open: false })} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            {err && <div className="mb-3 px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg">{err}</div>}
            <div className="space-y-3">
              {[
                { key: 'ad', label: 'Ad Soyad *', type: 'text' },
                { key: 'email', label: 'E-posta *', type: 'email' },
                { key: 'sifre', label: modal.edit ? 'Yeni Şifre (boş = değişmez)' : 'Şifre *', type: 'password' },
                { key: 'telefon', label: 'Telefon', type: 'tel' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input type={type} value={form[key as keyof Form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="input-field" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Araç Tipi</label>
                <select value={form.arac_tipi} onChange={e => setForm(f => ({ ...f, arac_tipi: e.target.value }))}
                  className="input-field">
                  {ARAC_TIPLERI.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal({ open: false })} className="btn-secondary flex-1">İptal</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {modal.edit ? 'Kaydet' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
