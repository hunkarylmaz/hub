import React, { useEffect, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Star,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import api from '../lib/api'

interface Testimonial {
  id: number
  name: string
  company: string
  position: string
  text: string
  rating: number
  active: boolean
  order_num: number
}

const emptyTestimonial: Omit<Testimonial, 'id'> = {
  name: '',
  company: '',
  position: '',
  text: '',
  rating: 5,
  active: true,
  order_num: 0,
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`transition ${onChange ? 'hover:scale-110' : ''}`}
          disabled={!onChange}
        >
          <Star
            className={`w-5 h-5 ${n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  )
}

export default function TestimonialsAdmin() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [form, setForm] = useState<Omit<Testimonial, 'id'>>(emptyTestimonial)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [formError, setFormError] = useState('')

  const fetchTestimonials = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/testimonials')
      const data = res.data.testimonials || res.data || []
      setTestimonials(data.sort((a: Testimonial, b: Testimonial) => a.order_num - b.order_num))
    } catch {
      setError('Yorumlar yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTestimonials() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyTestimonial, order_num: testimonials.length })
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (t: Testimonial) => {
    setEditing(t)
    setForm({
      name: t.name,
      company: t.company,
      position: t.position,
      text: t.text,
      rating: t.rating,
      active: t.active,
      order_num: t.order_num,
    })
    setFormError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Ad alanı zorunludur.'); return }
    if (!form.text.trim()) { setFormError('Yorum metni zorunludur.'); return }
    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await api.put(`/testimonials/${editing.id}`, form)
      } else {
        await api.post('/testimonials', form)
      }
      setShowModal(false)
      fetchTestimonials()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setFormError(e.response?.data?.message || 'Kaydedilirken hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/testimonials/${id}`)
      setDeleteConfirm(null)
      fetchTestimonials()
    } catch {
      setError('Silme işlemi başarısız.')
    }
  }

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    const idx = testimonials.findIndex(t => t.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === testimonials.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const updated = [...testimonials]
    const tempOrder = updated[idx].order_num
    updated[idx] = { ...updated[idx], order_num: updated[swapIdx].order_num }
    updated[swapIdx] = { ...updated[swapIdx], order_num: tempOrder }

    setTestimonials([...updated].sort((a, b) => a.order_num - b.order_num))

    try {
      await Promise.all([
        api.put(`/testimonials/${updated[idx].id}`, { order_num: updated[idx].order_num }),
        api.put(`/testimonials/${updated[swapIdx].id}`, { order_num: updated[swapIdx].order_num }),
      ])
    } catch {
      fetchTestimonials()
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Müşteri Yorumları</h1>
          <p className="text-gray-500 text-sm mt-0.5">Testimonial yönetimi</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#1952d9] hover:bg-[#1544c0] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Yeni Yorum
        </button>
      </div>

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
        ) : testimonials.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Henüz yorum eklenmemiş.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-16">Sıra</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Müşteri</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Yorum (Önizleme)</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Puan</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Durum</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {testimonials.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleReorder(t.id, 'up')}
                          disabled={idx === 0}
                          className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReorder(t.id, 'down')}
                          disabled={idx === testimonials.length - 1}
                          className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.position}{t.company ? ` — ${t.company}` : ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 max-w-xs">
                      <p className="truncate">{t.text}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StarRating value={t.rating} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {t.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-[#1952d9] hover:bg-blue-50 rounded-lg transition" title="Düzenle">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Sil">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Yorumu Sil</h3>
            <p className="text-gray-500 text-sm mb-5">Bu yorumu silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">İptal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition">Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {editing ? 'Yorumu Düzenle' : 'Yeni Yorum Ekle'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    placeholder="Ahmet Yılmaz" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şirket</label>
                  <input type="text" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    placeholder="ABC A.Ş." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pozisyon</label>
                  <input type="text" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    placeholder="Finans Direktörü" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sıra No</label>
                  <input type="number" value={form.order_num} onChange={e => setForm(p => ({ ...p, order_num: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    min="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yorum Metni *</label>
                <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                  placeholder="Harika bir hizmet aldım, kesinlikle tavsiye ederim..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Puan</label>
                <StarRating value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
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
