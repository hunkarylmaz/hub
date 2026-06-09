import React, { useEffect, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import api from '../lib/api'

interface FAQ {
  id: number
  question: string
  answer: string
  category: string
  order_num: number
  active: boolean
}

const emptyFAQ: Omit<FAQ, 'id'> = {
  question: '',
  answer: '',
  category: 'genel',
  order_num: 0,
  active: true,
}

const categoryOptions = [
  { value: 'genel', label: 'Genel' },
  { value: 'teknik', label: 'Teknik' },
  { value: 'fiyat', label: 'Fiyat & Ödeme' },
  { value: 'teslimat', label: 'Teslimat' },
  { value: 'iptal', label: 'İptal & İade' },
]

export default function FAQAdmin() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<FAQ | null>(null)
  const [form, setForm] = useState<Omit<FAQ, 'id'>>(emptyFAQ)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [filterCategory, setFilterCategory] = useState('')

  const fetchFaqs = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/faq')
      setFaqs(res.data.faqs || res.data || [])
    } catch {
      setError('SSS yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFaqs() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyFAQ, order_num: faqs.length })
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (faq: FAQ) => {
    setEditing(faq)
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order_num: faq.order_num,
      active: faq.active,
    })
    setFormError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.question.trim()) { setFormError('Soru alanı zorunludur.'); return }
    if (!form.answer.trim()) { setFormError('Cevap alanı zorunludur.'); return }
    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await api.put(`/faq/${editing.id}`, form)
      } else {
        await api.post('/faq', form)
      }
      setShowModal(false)
      fetchFaqs()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setFormError(e.response?.data?.message || 'Kaydedilirken hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/faq/${id}`)
      setDeleteConfirm(null)
      fetchFaqs()
    } catch {
      setError('Silme işlemi başarısız.')
    }
  }

  const getCategoryLabel = (val: string) =>
    categoryOptions.find(c => c.value === val)?.label || val

  const filtered = filterCategory
    ? faqs.filter(f => f.category === filterCategory)
    : faqs

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sık Sorulan Sorular</h1>
          <p className="text-gray-500 text-sm mt-0.5">SSS içeriklerini yönetin</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#1952d9] hover:bg-[#1544c0] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Yeni Soru
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Category filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3.5 mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterCategory('')}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
            filterCategory === '' ? 'bg-[#1952d9] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tüm Kategoriler
        </button>
        {categoryOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilterCategory(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
              filterCategory === opt.value ? 'bg-[#1952d9] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-[#1952d9] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Yükleniyor...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Henüz soru eklenmemiş.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Soru</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Kategori</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Sıra</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Durum</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(faq => (
                  <React.Fragment key={faq.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                          className="flex items-center gap-2 text-left group w-full"
                        >
                          <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expandedId === faq.id ? 'rotate-180' : ''}`} />
                          <span className={`text-sm font-medium ${faq.active ? 'text-gray-800' : 'text-gray-400'}`}>
                            {faq.question}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                          {getCategoryLabel(faq.category)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{faq.order_num}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          faq.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {faq.active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(faq)} className="p-1.5 text-gray-400 hover:text-[#1952d9] hover:bg-blue-50 rounded-lg transition" title="Düzenle">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(faq.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Sil">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === faq.id && (
                      <tr className="bg-blue-50/30">
                        <td colSpan={5} className="px-5 py-3 pl-11">
                          <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Soruyu Sil</h3>
            <p className="text-gray-500 text-sm mb-5">Bu soruyu silmek istediğinize emin misiniz?</p>
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
                {editing ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Soru *</label>
                <input
                  type="text"
                  value={form.question}
                  onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                  placeholder="e-İmza nedir?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cevap *</label>
                <textarea
                  value={form.answer}
                  onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                  placeholder="Detaylı cevap metni..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
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
