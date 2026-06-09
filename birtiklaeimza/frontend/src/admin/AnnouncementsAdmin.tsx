import { useEffect, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Bell,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import api from '../lib/api'

interface Announcement {
  id: number
  text: string
  color: string
  active: boolean
  order_num: number
}

const emptyAnnouncement: Omit<Announcement, 'id'> = {
  text: '',
  color: 'blue',
  active: false,
  order_num: 0,
}

const colorOptions = [
  { value: 'blue', label: 'Mavi', bg: 'bg-blue-500', preview: 'bg-blue-50 text-blue-800 border-blue-200' },
  { value: 'green', label: 'Yeşil', bg: 'bg-green-500', preview: 'bg-green-50 text-green-800 border-green-200' },
  { value: 'red', label: 'Kırmızı', bg: 'bg-red-500', preview: 'bg-red-50 text-red-800 border-red-200' },
  { value: 'orange', label: 'Turuncu', bg: 'bg-orange-500', preview: 'bg-orange-50 text-orange-800 border-orange-200' },
  { value: 'purple', label: 'Mor', bg: 'bg-purple-500', preview: 'bg-purple-50 text-purple-800 border-purple-200' },
]

const getColorPreview = (color: string) =>
  colorOptions.find(c => c.value === color)?.preview || 'bg-blue-50 text-blue-800 border-blue-200'

const getColorBg = (color: string) =>
  colorOptions.find(c => c.value === color)?.bg || 'bg-blue-500'

export default function AnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState<Omit<Announcement, 'id'>>(emptyAnnouncement)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [formError, setFormError] = useState('')

  const fetchAnnouncements = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/announcements')
      setAnnouncements(res.data.announcements || res.data || [])
    } catch {
      setError('Duyurular yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyAnnouncement, order_num: announcements.length })
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setForm({ text: a.text, color: a.color, active: a.active, order_num: a.order_num })
    setFormError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.text.trim()) { setFormError('Duyuru metni zorunludur.'); return }
    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await api.put(`/announcements/${editing.id}`, form)
      } else {
        await api.post('/announcements', form)
      }
      setShowModal(false)
      fetchAnnouncements()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setFormError(e.response?.data?.message || 'Kaydedilirken hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/announcements/${id}`)
      setDeleteConfirm(null)
      fetchAnnouncements()
    } catch {
      setError('Silme işlemi başarısız.')
    }
  }

  const handleToggleActive = async (a: Announcement) => {
    try {
      await api.put(`/announcements/${a.id}`, { ...a, active: !a.active })
      fetchAnnouncements()
    } catch {
      setError('Durum güncellenemedi.')
    }
  }

  const activeCount = announcements.filter(a => a.active).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Duyurular</h1>
          <p className="text-gray-500 text-sm mt-0.5">Site üstü duyuru çubuğunu yönetin</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#1952d9] hover:bg-[#1544c0] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Yeni Duyuru
        </button>
      </div>

      {activeCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 flex-shrink-0" />
          <span>{activeCount} aktif duyuru var. Genellikle yalnızca bir duyuru aktif olmalıdır.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-[#1952d9] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Yükleniyor...
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Henüz duyuru eklenmemiş.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {announcements.map(a => (
              <div key={a.id} className="px-5 py-4 flex items-center gap-4">
                {/* Color indicator */}
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getColorBg(a.color)}`} />

                {/* Preview */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm px-3 py-1.5 rounded-lg border inline-block max-w-full truncate ${getColorPreview(a.color)}`}>
                    {a.text}
                  </div>
                </div>

                {/* Sıra */}
                <span className="text-xs text-gray-400 flex-shrink-0">Sıra: {a.order_num}</span>

                {/* Toggle */}
                <button
                  onClick={() => handleToggleActive(a)}
                  className="flex items-center gap-1.5 text-sm transition flex-shrink-0"
                  title={a.active ? 'Pasif yap' : 'Aktif yap'}
                >
                  {a.active ? (
                    <>
                      <ToggleRight className="w-6 h-6 text-green-500" />
                      <span className="text-green-600 text-xs font-medium">Aktif</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                      <span className="text-gray-400 text-xs">Pasif</span>
                    </>
                  )}
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-[#1952d9] hover:bg-blue-50 rounded-lg transition" title="Düzenle">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(a.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Sil">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Duyuruyu Sil</h3>
            <p className="text-gray-500 text-sm mb-5">Bu duyuruyu silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">İptal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition">Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {editing ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Ekle'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duyuru Metni *</label>
                <textarea
                  value={form.text}
                  onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                  placeholder="Kargo ücreti 2 iş günü içinde teslim, ücretsiz kargo..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Renk</label>
                <div className="flex gap-3">
                  {colorOptions.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, color: c.value }))}
                      className={`flex flex-col items-center gap-1 transition group`}
                    >
                      <div className={`w-8 h-8 rounded-full ${c.bg} border-2 transition ${
                        form.color === c.value ? 'border-gray-700 scale-110' : 'border-transparent group-hover:border-gray-400'
                      }`} />
                      <span className="text-xs text-gray-500">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              {form.text && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Önizleme</label>
                  <div className={`text-sm px-4 py-2 rounded-lg border ${getColorPreview(form.color)}`}>
                    {form.text}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sıra No</label>
                  <input
                    type="number"
                    value={form.order_num}
                    onChange={e => setForm(p => ({ ...p, order_num: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setForm(p => ({ ...p, active: !p.active }))}>
                  {form.active
                    ? <ToggleRight className="w-8 h-8 text-green-500" />
                    : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {form.active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition">
                İptal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm text-white bg-[#1952d9] hover:bg-[#1544c0] rounded-lg transition disabled:opacity-60">
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editing ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
