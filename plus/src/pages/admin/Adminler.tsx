import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Loader2, X, Check, ShieldCheck, ShieldAlert, UserX } from 'lucide-react'
import { api, AdminUser } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

interface Form { ad: string; email: string; sifre: string; tip: string; aktif: number }
const EMPTY: Form = { ad: '', email: '', sifre: '', tip: 'admin', aktif: 1 }

export default function AdminAdminler() {
  const { admin: me } = useAuth()
  const [list, setList] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; edit?: AdminUser }>({ open: false })
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setList(await api.admin.adminler.list()) } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setForm(EMPTY); setErr(''); setModal({ open: true }) }
  function openEdit(a: AdminUser) {
    setForm({ ad: a.ad, email: a.email, sifre: '', tip: a.tip, aktif: a.aktif })
    setErr(''); setModal({ open: true, edit: a })
  }

  async function save() {
    if (!form.ad || !form.email) { setErr('Ad ve email zorunlu'); return }
    if (!modal.edit && !form.sifre) { setErr('Şifre zorunlu'); return }
    setSaving(true); setErr('')
    try {
      const d: Record<string, unknown> = { ad: form.ad, email: form.email, tip: form.tip, aktif: form.aktif }
      if (form.sifre) d.sifre = form.sifre
      if (modal.edit) await api.admin.adminler.update(modal.edit.id, d)
      else await api.admin.adminler.create(d)
      setModal({ open: false }); load()
    } catch (e) { setErr((e as Error).message) }
    finally { setSaving(false) }
  }

  async function remove(a: AdminUser) {
    if (a.id === me?.id) return alert('Kendinizi silemezsiniz')
    if (!confirm(`"${a.ad}" adlı admini pasif yapmak istediğinizden emin misiniz?`)) return
    await api.admin.adminler.remove(a.id); load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Yönetici hesaplarını oluşturun ve düzenleyin</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Yeni Admin
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-center gap-2">
        <ShieldCheck size={14} className="shrink-0" />
        <span>Süper Admin tüm yetkiye sahiptir. Normal Admin gelişmiş ayarlara erişemez.</span>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center"><Loader2 size={24} className="mx-auto animate-spin text-gray-300" /></div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Admin bulunamadı</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Ad</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Yetki</th>
                <th className="text-center px-4 py-3">Durum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {list.map(a => (
                <tr key={a.id} className={`hover:bg-gray-50 ${!a.aktif ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        a.tip === 'super_admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {a.ad.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{a.ad}</p>
                        {a.id === me?.id && <p className="text-xs text-blue-500 font-medium">Siz</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{a.email}</td>
                  <td className="px-4 py-3">
                    {a.tip === 'super_admin' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <ShieldCheck size={10} /> Süper Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                        <ShieldAlert size={10} /> Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium ${a.aktif ? 'text-emerald-600' : 'text-red-400'}`}>
                      {a.aktif ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <Edit2 size={13} />
                      </button>
                      {a.id !== me?.id && (
                        <button onClick={() => remove(a)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                          <UserX size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">{modal.edit ? 'Admin Düzenle' : 'Yeni Admin'}</h2>
              <button onClick={() => setModal({ open: false })} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            {err && <div className="mb-3 px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg">{err}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ad Soyad *</label>
                <input type="text" value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                  className="input-field" placeholder="Ahmet Yılmaz" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field" placeholder="ahmet@rota.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {modal.edit ? 'Şifre (boş bırak = değişmez)' : 'Şifre *'}
                </label>
                <input type="password" value={form.sifre} onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
                  className="input-field" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Yetki Seviyesi</label>
                <select value={form.tip} onChange={e => setForm(f => ({ ...f, tip: e.target.value }))}
                  className="input-field">
                  <option value="admin">Admin — Standart Yönetici</option>
                  <option value="super_admin">Süper Admin — Tam Yetki</option>
                </select>
              </div>
              {modal.edit && (
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="aktif" checked={form.aktif === 1}
                    onChange={e => setForm(f => ({ ...f, aktif: e.target.checked ? 1 : 0 }))}
                    className="w-4 h-4 rounded border-gray-300" />
                  <label htmlFor="aktif" className="text-sm text-gray-700">Aktif</label>
                </div>
              )}
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
