import { useEffect, useState, useCallback, FormEvent } from 'react'
import {
  Plus, Edit2, ToggleLeft, ToggleRight, Loader2, X,
  Check, Users, MapPin, Phone, Mail, BadgeCheck,
} from 'lucide-react'
import { api, AltKullanici } from '../../lib/api'
import { ILLER } from '../../lib/locations'

/* ── Form state ── */
interface Form {
  ad: string
  unvan: string
  email: string
  sifre: string
  telefon: string
  il: string
  ilce: string
  mahalle: string
  adres: string
}

const EMPTY_FORM: Form = {
  ad: '', unvan: '', email: '', sifre: '',
  telefon: '', il: '', ilce: '', mahalle: '', adres: '',
}

/* ── Helpers ── */
function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

/* ── Main component ── */
export default function AltKullanicilar() {
  const [list, setList] = useState<AltKullanici[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; edit?: AltKullanici }>({ open: false })
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.partner.altKullanicilar.list()
      setList(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Modal helpers ── */
  function openCreate() {
    setForm(EMPTY_FORM)
    setErr('')
    setModal({ open: true })
  }

  function openEdit(ak: AltKullanici) {
    setForm({
      ad: ak.ad,
      unvan: ak.unvan ?? '',
      email: ak.email,
      sifre: '',
      telefon: ak.telefon ?? '',
      il: ak.il ?? '',
      ilce: ak.ilce ?? '',
      mahalle: ak.mahalle ?? '',
      adres: ak.adres ?? '',
    })
    setErr('')
    setModal({ open: true, edit: ak })
  }

  function closeModal() {
    setModal({ open: false })
  }

  /* ── Submit ── */
  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErr('')
    try {
      const payload: Record<string, unknown> = { ...form }
      // Don't send empty password on edit
      if (modal.edit && !form.sifre) delete payload.sifre

      if (modal.edit) {
        await api.partner.altKullanicilar.update(modal.edit.id, payload)
      } else {
        await api.partner.altKullanicilar.create(payload)
      }
      closeModal()
      load()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  /* ── Toggle aktif ── */
  async function toggleAktif(ak: AltKullanici) {
    setTogglingId(ak.id)
    try {
      await api.partner.altKullanicilar.update(ak.id, { aktif: ak.aktif ? 0 : 1 })
      setList(prev => prev.map(u => u.id === ak.id ? { ...u, aktif: ak.aktif ? 0 : 1 } : u))
    } catch {
      /* ignore */
    } finally {
      setTogglingId(null)
    }
  }

  /* ── Derived ── */
  const selectedIl = ILLER.find(i => i.il === form.il)
  const aktifCount = list.filter(u => u.aktif).length

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alt Kullanıcılar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {list.length} kullanıcı &bull; {aktifCount} aktif
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Yeni Alt Kullanıcı
        </button>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-14 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-gray-300" /> Yükleniyor...
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">Henüz alt kullanıcı eklenmedi</p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 font-semibold hover:underline"
            >
              <Plus size={14} /> İlk kullanıcıyı ekle
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3 min-w-[160px]">Ad / Unvan</th>
                  <th className="text-left px-4 py-3 min-w-[160px]">E-posta</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Telefon</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">İl / İlçe</th>
                  <th className="text-center px-4 py-3 hidden sm:table-cell">İşler</th>
                  <th className="text-center px-4 py-3">Durum</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map(ak => (
                  <tr key={ak.id} className="hover:bg-gray-50 transition-colors">
                    {/* Name + unvan */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-blue-600">
                            {ak.ad.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">{ak.ad}</p>
                          {ak.unvan && (
                            <p className="text-xs text-gray-400 leading-tight">{ak.unvan}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Mail size={12} className="text-gray-300 shrink-0" />
                        <span className="truncate max-w-[180px]">{ak.email}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {ak.telefon ? (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Phone size={11} className="text-gray-300 shrink-0" />
                          {ak.telefon}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {(ak.il || ak.ilce) ? (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <MapPin size={11} className="text-gray-300 shrink-0" />
                          {[ak.il, ak.ilce].filter(Boolean).join(' / ')}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Job count */}
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        <BadgeCheck size={11} className="text-gray-400" />
                        {(ak as AltKullanici & { is_sayisi?: number }).is_sayisi ?? 0}
                      </span>
                    </td>

                    {/* Toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleAktif(ak)}
                        disabled={togglingId === ak.id}
                        title={ak.aktif ? 'Pasif yap' : 'Aktif yap'}
                        className="transition-opacity disabled:opacity-50"
                      >
                        {togglingId === ak.id ? (
                          <Loader2 size={22} className="text-gray-300 animate-spin" />
                        ) : ak.aktif ? (
                          <ToggleRight size={24} className="text-emerald-500" />
                        ) : (
                          <ToggleLeft size={24} className="text-gray-300" />
                        )}
                      </button>
                    </td>

                    {/* Edit */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(ak)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="font-bold text-gray-900 text-base">
                  {modal.edit ? 'Kullanıcı Düzenle' : 'Yeni Alt Kullanıcı'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {modal.edit ? `#${modal.edit.id} — ${modal.edit.ad}` : 'Firma adına yeni kullanıcı oluştur'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={save}>
              <div className="px-6 py-5 space-y-4">
                {err && (
                  <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    {err}
                  </div>
                )}

                {/* Ad + Unvan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Ad Soyad *">
                    <input
                      type="text"
                      required
                      value={form.ad}
                      onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                      placeholder="Ayşe Kaya"
                      className="input-field"
                    />
                  </Field>
                  <Field label="Unvan">
                    <input
                      type="text"
                      value={form.unvan}
                      onChange={e => setForm(f => ({ ...f, unvan: e.target.value }))}
                      placeholder="Diş Hekimi"
                      className="input-field"
                    />
                  </Field>
                </div>

                {/* Email + Sifre */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="E-posta *">
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="kullanici@firma.com"
                      className="input-field"
                    />
                  </Field>
                  <Field label={modal.edit ? 'Yeni Şifre (boş bırak = değişmez)' : 'Şifre *'}>
                    <input
                      type="password"
                      required={!modal.edit}
                      value={form.sifre}
                      onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
                      placeholder="••••••••"
                      className="input-field"
                    />
                  </Field>
                </div>

                {/* Telefon */}
                <Field label="Telefon">
                  <input
                    type="tel"
                    value={form.telefon}
                    onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                    placeholder="05XX XXX XX XX"
                    className="input-field"
                  />
                </Field>

                {/* Divider */}
                <div className="pt-1 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Adres Bilgileri
                  </p>

                  {/* İl + İlçe */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="İl">
                      <select
                        value={form.il}
                        onChange={e => setForm(f => ({ ...f, il: e.target.value, ilce: '' }))}
                        className="input-field"
                      >
                        <option value="">İl seçin...</option>
                        {ILLER.map(i => (
                          <option key={i.il} value={i.il}>{i.il}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="İlçe">
                      <select
                        value={form.ilce}
                        disabled={!form.il}
                        onChange={e => setForm(f => ({ ...f, ilce: e.target.value }))}
                        className="input-field disabled:opacity-50"
                      >
                        <option value="">İlçe seçin...</option>
                        {selectedIl?.ilceler.map(i => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Mahalle */}
                  <Field label="Mahalle / Semt">
                    <input
                      type="text"
                      value={form.mahalle}
                      onChange={e => setForm(f => ({ ...f, mahalle: e.target.value }))}
                      placeholder="Mahalle veya semt adı"
                      className="input-field"
                    />
                  </Field>
                </div>

                {/* Adres */}
                <Field label="Açık Adres">
                  <textarea
                    value={form.adres}
                    onChange={e => setForm(f => ({ ...f, adres: e.target.value }))}
                    rows={3}
                    placeholder="Sokak, bina no, kat/daire..."
                    className="input-field resize-none"
                  />
                </Field>
              </div>

              {/* Modal footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 size={15} className="animate-spin" /> Kaydediliyor...</>
                  ) : (
                    <><Check size={15} /> {modal.edit ? 'Kaydet' : 'Oluştur'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
