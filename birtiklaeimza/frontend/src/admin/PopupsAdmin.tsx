import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Loader2 } from 'lucide-react'
import api from '../lib/api'

interface Popup {
  id: number
  title: string
  content: string
  button_text: string
  button_link: string
  button2_text: string
  button2_link: string
  show_delay: number
  show_once: number
  bg_color: string
  active: number
}

const empty: Omit<Popup, 'id'> = {
  title: '',
  content: '',
  button_text: 'Hemen Sipariş Ver',
  button_link: '/urunler',
  button2_text: 'Daha Sonra',
  button2_link: '',
  show_delay: 3,
  show_once: 1,
  bg_color: 'white',
  active: 0,
}

export default function PopupsAdmin() {
  const [popups, setPopups] = useState<Popup[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Popup | null>(null)
  const [form, setForm] = useState<Omit<Popup, 'id'>>(empty)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const r = await api.get('/popups')
      setPopups(r.data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(empty)
    setModalOpen(true)
  }

  const openEdit = (p: Popup) => {
    setEditing(p)
    setForm(p)
    setModalOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) await api.put(`/popups/${editing.id}`, form)
      else await api.post('/popups', form)
      await load()
      setModalOpen(false)
    } catch {}
    finally { setSaving(false) }
  }

  const del = async (id: number) => {
    if (!confirm('Bu popup silinsin mi?')) return
    await api.delete(`/popups/${id}`)
    load()
  }

  const toggle = async (id: number) => {
    await api.put(`/popups/${id}/toggle`)
    load()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Popup Yönetimi</h1>
          <p className="text-slate-500 text-sm mt-1">Ziyaretçilere gösterilecek popup pencerelerini yönetin</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1952d9] text-white rounded-xl font-medium hover:bg-[#1442c0] transition-colors"
        >
          <Plus className="w-4 h-4" /> Yeni Popup
        </button>
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        ℹ️ Aynı anda yalnızca <strong>1 popup aktif</strong> olabilir. Yeni bir popup aktifleştirildiğinde diğerleri otomatik deaktif olur.
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#1952d9] animate-spin" />
        </div>
      ) : popups.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Henüz popup yok</div>
      ) : (
        <div className="grid gap-4">
          {popups.map(p => (
            <div
              key={p.id}
              className={`bg-white rounded-xl border p-5 flex items-start justify-between gap-4 ${
                p.active ? 'border-green-300 bg-green-50/30' : 'border-slate-200'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-slate-900">{p.title}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {p.active ? '● Aktif' : '○ Pasif'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-2 line-clamp-2">{p.content}</p>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>Gecikme: {p.show_delay}s</span>
                  <span>Bir kez göster: {p.show_once ? 'Evet' : 'Hayır'}</span>
                  <span>Buton: {p.button_text}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggle(p.id)}
                  title={p.active ? 'Deaktif Et' : 'Aktif Et'}
                  className={`p-2 rounded-lg transition-colors ${
                    p.active ? 'text-green-600 hover:bg-green-100' : 'text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {p.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => del(p.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold">{editing ? 'Popup Düzenle' : 'Yeni Popup'}</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık *</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1952d9]"
                  placeholder="Özel Kampanya!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İçerik *</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1952d9] resize-none"
                  placeholder="Popup'ta gösterilecek metin..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Birincil Buton Metni</label>
                  <input
                    value={form.button_text}
                    onChange={e => setForm({ ...form, button_text: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1952d9]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Birincil Buton Linki</label>
                  <input
                    value={form.button_link}
                    onChange={e => setForm({ ...form, button_link: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1952d9]"
                    placeholder="/urunler"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">İkincil Buton Metni</label>
                  <input
                    value={form.button2_text}
                    onChange={e => setForm({ ...form, button2_text: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1952d9]"
                    placeholder="Daha Sonra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gösterme Gecikmesi (sn)</label>
                  <input
                    type="number"
                    value={form.show_delay}
                    onChange={e => setForm({ ...form, show_delay: Number(e.target.value) })}
                    min={0}
                    max={30}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1952d9]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.show_once}
                    onChange={e => setForm({ ...form, show_once: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-slate-700">Ziyaretçiye bir kez göster</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.active}
                    onChange={e => setForm({ ...form, active: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-green-700">Aktif</span>
                </label>
              </div>
              <button
                onClick={save}
                disabled={saving || !form.title || !form.content}
                className="w-full py-3 bg-[#1952d9] text-white font-semibold rounded-xl hover:bg-[#1442c0] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
