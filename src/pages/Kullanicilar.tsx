import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, ChevronDown, X, Users, AlertCircle, Loader2 } from 'lucide-react'
import { api, User } from '../lib/api'

const ROL_OPTIONS = ['B2B Partner', 'Bayi', 'Yönetici']

const PAGE_SIZE = 10

interface UserModalProps {
  initial?: User | null
  onClose: () => void
  onSave: (data: { ad: string; email: string; sifre: string; rol: string }) => Promise<void>
}

function UserModal({ initial, onClose, onSave }: UserModalProps) {
  const [form, setForm] = useState({
    ad: initial?.ad || '',
    email: initial?.email || '',
    sifre: '',
    rol: initial?.rol || 'B2B Partner',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((v) => ({ ...v, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.ad || !form.email) {
      setError('Ad ve e-posta zorunludur')
      return
    }
    if (!initial && !form.sifre) {
      setError('Yeni kullanıcı için şifre zorunludur')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">
            {initial ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
            <input
              type="text"
              value={form.ad}
              onChange={set('ad')}
              placeholder="Ad Soyad"
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">E-posta *</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="ornek@sirket.com"
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Şifre {initial ? '(boş bırakılırsa değişmez)' : '*'}
            </label>
            <input
              type="password"
              value={form.sifre}
              onChange={set('sifre')}
              placeholder={initial ? 'Değiştirmek için girin' : 'Şifre'}
              required={!initial}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
            <div className="relative">
              <select
                value={form.rol}
                onChange={set('rol')}
                className="w-full appearance-none px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-white text-gray-700"
              >
                {ROL_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2.5">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {initial ? 'Güncelle' : 'Kullanıcı Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface RowMenuProps {
  user: User
  onClose: () => void
  onEdit: () => void
  onDeactivate: () => void
}

function RowMenu({ user, onClose, onEdit, onDeactivate }: RowMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[160px]"
    >
      <button
        onClick={() => { onEdit(); onClose() }}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Düzenle
      </button>
      <div className="border-t border-gray-100 mt-1 pt-1">
        <button
          onClick={() => { onDeactivate(); onClose() }}
          className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          {user.aktif ? 'Pasifleştir' : 'Aktifleştir'}
        </button>
      </div>
    </div>
  )
}

export default function Kullanicilar() {
  const [kullanicilar, setKullanicilar] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [page, setPage] = useState(1)

  const fetchKullanicilar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.kullanicilar.list()
      setKullanicilar(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKullanicilar()
  }, [fetchKullanicilar])

  const filtered = kullanicilar.filter(
    (u) =>
      u.ad.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.rol.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleSave(data: { ad: string; email: string; sifre: string; rol: string }) {
    if (editUser) {
      const updateData: Partial<{ ad: string; email: string; sifre: string; rol: string }> = {
        ad: data.ad,
        email: data.email,
        rol: data.rol,
      }
      if (data.sifre) updateData.sifre = data.sifre
      const updated = await api.kullanicilar.update(editUser.id, updateData)
      setKullanicilar((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } else {
      const created = await api.kullanicilar.create(data)
      setKullanicilar((prev) => [created, ...prev])
    }
    setEditUser(null)
  }

  async function handleDeactivate(user: User) {
    try {
      await api.kullanicilar.delete(user.id)
      await fetchKullanicilar()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle size={32} className="text-red-500" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchKullanicilar}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={22} className="text-primary-600" />
            Kullanıcılar
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Toplam {filtered.length} kayıt</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ara..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 w-56"
            />
          </div>
          <button
            onClick={() => { setEditUser(null); setModalOpen(true) }}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} />
            Yeni Kullanıcı
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Ad Soyad
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                E-posta
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Rol
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Durum
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Araçlar
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                  Kullanıcı bulunamadı
                </td>
              </tr>
            ) : (
              paginated.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                        {u.ad.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{u.ad}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.aktif
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {u.aktif ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === u.id ? null : u.id)}
                      className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Düzenle <ChevronDown size={14} />
                    </button>
                    {openDropdown === u.id && (
                      <RowMenu
                        user={u}
                        onClose={() => setOpenDropdown(null)}
                        onEdit={() => { setEditUser(u); setModalOpen(true) }}
                        onDeactivate={() => handleDeactivate(u)}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            {filtered.length === 0
              ? '0 kayıt'
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} / ${filtered.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
            >
              İlk
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-full text-sm font-medium ${
                    p === page ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
            >
              Son
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <UserModal
          initial={editUser}
          onClose={() => { setModalOpen(false); setEditUser(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
