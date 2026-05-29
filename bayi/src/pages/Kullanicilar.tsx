import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Search, Loader2, X, Pencil, Trash2, ShieldCheck, User } from 'lucide-react'
import { api, BayiKullanici } from '../lib/api'

const SAYFA_IZINLERI = [
  { key: 'guncel_durum',          label: 'Güncel Durum',            grup: null },
  { key: 'kuryeler',              label: 'Kuryeler',                grup: null },
  { key: 'restoranlar',           label: 'Restoranlar',             grup: null },
  { key: 'kullanicilar',          label: 'Kullanıcılar',            grup: null },
  { key: 'periyodik_isletme',     label: 'İşletme Raporu',          grup: 'Periyodik Rapor' },
  { key: 'periyodik_kurye',       label: 'Kurye Raporu',            grup: 'Periyodik Rapor' },
  { key: 'periyodik_nakit',       label: 'Nakit Raporu',            grup: 'Periyodik Rapor' },
  { key: 'raporlar_gecmis',       label: 'Geçmiş Siparişler',       grup: 'Raporlar' },
  { key: 'raporlar_kurye_hakedis', label: 'Kurye Hakediş',          grup: 'Raporlar' },
  { key: 'raporlar_kurye_odeme',  label: 'Kurye Ödeme Dağılımı',    grup: 'Raporlar' },
  { key: 'raporlar_restoran',     label: 'Restoran Hakediş',        grup: 'Raporlar' },
  { key: 'raporlar_odeme',        label: 'Ödeme Dağılım',           grup: 'Raporlar' },
  { key: 'raporlar_firma',        label: 'Firma Hakediş',           grup: 'Raporlar' },
  { key: 'performanslar',         label: 'Performanslar',           grup: null },
  { key: 'ayarlar_genel',         label: 'Genel Ayar',              grup: 'Ayarlar' },
  { key: 'ayarlar_atama',         label: 'Atama Ayarları',          grup: 'Ayarlar' },
  { key: 'ayarlar_bonus',         label: 'Bonus Ayarları',          grup: 'Ayarlar' },
  { key: 'ayarlar_mola',          label: 'Mola Yönetim',            grup: 'Ayarlar' },
  { key: 'ayarlar_bildirimler',   label: 'Bildirimler',             grup: 'Ayarlar' },
  { key: 'ayarlar_vardiyalar',    label: 'Vardiyalar',              grup: 'Ayarlar' },
  { key: 'ayarlar_kontor',        label: 'Kontör Yönetim',          grup: 'Ayarlar' },
]

const GRUPLAR = ['Periyodik Rapor', 'Raporlar', 'Ayarlar']

function parseIzinler(json: string): string[] {
  try { return JSON.parse(json) } catch { return [] }
}

interface ModalProps {
  kullanici?: BayiKullanici | null
  onClose: () => void
  onSave: () => void
}

function KullaniciModal({ kullanici, onClose, onSave }: ModalProps) {
  const isEdit = !!kullanici
  const [form, setForm] = useState({
    ad_soyad: kullanici?.ad_soyad || '',
    email: kullanici?.email || '',
    telefon: kullanici?.telefon || '',
    sifre: '',
    rol: kullanici?.rol || 'Operasyon',
  })
  const [izinler, setIzinler] = useState<string[]>(() =>
    kullanici ? parseIzinler(kullanici.sayfa_izinleri) : []
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function toggleIzin(key: string) {
    setIzinler(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  function toggleGrup(grup: string) {
    const grupKeys = SAYFA_IZINLERI.filter(p => p.grup === grup).map(p => p.key)
    const allOn = grupKeys.every(k => izinler.includes(k))
    if (allOn) {
      setIzinler(prev => prev.filter(k => !grupKeys.includes(k)))
    } else {
      setIzinler(prev => [...new Set([...prev, ...grupKeys])])
    }
  }

  function tumunuSec() {
    if (izinler.length === SAYFA_IZINLERI.length) {
      setIzinler([])
    } else {
      setIzinler(SAYFA_IZINLERI.map(p => p.key))
    }
  }

  async function handleSave() {
    if (!form.ad_soyad || !form.email) { setErr('Ad soyad ve e-posta zorunlu'); return }
    if (!isEdit && !form.sifre) { setErr('Şifre zorunlu'); return }
    setSaving(true)
    setErr('')
    try {
      if (isEdit) {
        await api.kullanicilar.update(kullanici!.id, {
          ...form,
          sifre: form.sifre || undefined,
          sayfa_izinleri: izinler,
        })
      } else {
        await api.kullanicilar.create({ ...form, sayfa_izinleri: izinler })
      }
      onSave()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Hata')
    } finally {
      setSaving(false)
    }
  }

  const topluIzinler = SAYFA_IZINLERI.filter(p => !p.grup)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-semibold text-gray-800">{isEdit ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
              <input value={form.ad_soyad} onChange={e => setForm(f => ({ ...f, ad_soyad: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-posta *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
              <input value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{isEdit ? 'Yeni Şifre (boş = değiştirme)' : 'Şifre *'}</label>
              <input type="password" value={form.sifre} onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
              <div className="flex gap-2 mt-1">
                {['Yönetici', 'Operasyon'].map(r => (
                  <button key={r} onClick={() => setForm(f => ({ ...f, rol: r }))}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${form.rol === r ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:border-primary-400'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sayfa Erişim İzinleri */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Sayfa Erişim İzinleri</p>
              <button onClick={tumunuSec} className="text-xs text-primary-600 hover:underline">
                {izinler.length === SAYFA_IZINLERI.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 text-sm">
              {/* Top-level items */}
              {topluIzinler.map(p => (
                <label key={p.key} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={izinler.includes(p.key)} onChange={() => toggleIzin(p.key)}
                    className="accent-primary-600" />
                  <span className="text-gray-700">{p.label}</span>
                </label>
              ))}

              {/* Grouped items */}
              {GRUPLAR.map(grup => {
                const items = SAYFA_IZINLERI.filter(p => p.grup === grup)
                const allOn = items.every(p => izinler.includes(p.key))
                const someOn = items.some(p => izinler.includes(p.key))
                return (
                  <div key={grup}>
                    <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 bg-gray-50/50">
                      <input type="checkbox" checked={allOn} ref={el => { if (el) el.indeterminate = someOn && !allOn }}
                        onChange={() => toggleGrup(grup)} className="accent-primary-600" />
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{grup}</span>
                    </label>
                    {items.map(p => (
                      <label key={p.key} className="flex items-center gap-3 px-3 py-2 pl-8 cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={izinler.includes(p.key)} onChange={() => toggleIzin(p.key)}
                          className="accent-primary-600" />
                        <span className="text-gray-600">{p.label}</span>
                      </label>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60">
            {saving ? 'Kaydediliyor...' : isEdit ? 'Kaydet' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Kullanicilar() {
  const [kullanicilar, setKullanicilar] = useState<BayiKullanici[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'aktif' | 'silinmis'>('aktif')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ open: boolean; kullanici?: BayiKullanici | null }>({ open: false })
  const [deleting, setDeleting] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.kullanicilar.list(tab === 'silinmis')
      setKullanicilar(data)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete(u: BayiKullanici) {
    if (!confirm(`${u.ad_soyad} adlı kullanıcıyı silmek istediğinize emin misiniz?`)) return
    setDeleting(u.id)
    try {
      await api.kullanicilar.delete(u.id)
      await fetchData()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Hata')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = kullanicilar.filter(u =>
    search === '' ||
    u.ad_soyad.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.telefon || '').includes(search)
  )

  return (
    <div>
      {modal.open && (
        <KullaniciModal
          kullanici={modal.kullanici}
          onClose={() => setModal({ open: false })}
          onSave={fetchData}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Kullanıcılar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bayi panel erişim kullanıcıları</p>
        </div>
        <button onClick={() => setModal({ open: true, kullanici: null })}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
          <Plus size={16} /> Yeni Kullanıcı
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex gap-1">
          <button onClick={() => setTab('aktif')}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'aktif' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-600'}`}>
            Aktif {tab === 'aktif' && `(${kullanicilar.length})`}
          </button>
          <button onClick={() => setTab('silinmis')}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'silinmis' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-600'}`}>
            Silinenler {tab === 'silinmis' && `(${kullanicilar.length})`}
          </button>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Kullanıcı ara..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 w-56" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <Users size={32} className="opacity-40" />
            <p className="text-sm">{tab === 'silinmis' ? 'Silinmiş kullanıcı yok' : 'Henüz kullanıcı eklenmemiş'}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ad Soyad</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">E-posta</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefon</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Erişim</th>
                {tab === 'aktif' && <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">İşlem</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const izinler = parseIzinler(u.sayfa_izinleri)
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold shrink-0">
                          {u.ad_soyad.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{u.ad_soyad}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{u.telefon || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${u.rol === 'Yönetici' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.rol === 'Yönetici' ? <ShieldCheck size={11} /> : <User size={11} />}
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {izinler.length === 0 ? (
                          <span className="text-xs text-gray-400">Erişim yok</span>
                        ) : izinler.length === SAYFA_IZINLERI.length ? (
                          <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Tüm Sayfalar</span>
                        ) : (
                          <>
                            {izinler.slice(0, 3).map(k => {
                              const p = SAYFA_IZINLERI.find(x => x.key === k)
                              return p ? (
                                <span key={k} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{p.label}</span>
                              ) : null
                            })}
                            {izinler.length > 3 && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">+{izinler.length - 3}</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    {tab === 'aktif' && (
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setModal({ open: true, kullanici: u })}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(u)} disabled={deleting === u.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
