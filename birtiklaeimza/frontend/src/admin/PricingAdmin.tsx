import React, { useEffect, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Tag,
  Star,
} from 'lucide-react'
import api from '../lib/api'

interface PricingPlan {
  id: number
  name: string
  description: string
  price: number
  old_price?: number
  period: string
  features: string[] | string
  popular: boolean
  color: string
  order_num: number
  active: boolean
}

const emptyPlan: Omit<PricingPlan, 'id'> = {
  name: '',
  description: '',
  price: 0,
  old_price: undefined,
  period: 'yıl',
  features: [],
  popular: false,
  color: '#1952d9',
  order_num: 0,
  active: true,
}

const colorOptions = [
  { label: 'Mavi', value: '#1952d9' },
  { label: 'Yeşil', value: '#16a34a' },
  { label: 'Mor', value: '#7c3aed' },
  { label: 'Turuncu', value: '#ea580c' },
  { label: 'Kırmızı', value: '#dc2626' },
  { label: 'Pembe', value: '#db2777' },
  { label: 'Koyu', value: '#0a2569' },
]

export default function PricingAdmin() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null)
  const [form, setForm] = useState<Omit<PricingPlan, 'id'>>(emptyPlan)
  const [featuresText, setFeaturesText] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [formError, setFormError] = useState('')

  const fetchPlans = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/pricing')
      setPlans(res.data.plans || res.data || [])
    } catch {
      setError('Fiyat planları yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlans() }, [])

  const openAdd = () => {
    setEditingPlan(null)
    setForm(emptyPlan)
    setFeaturesText('')
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (plan: PricingPlan) => {
    setEditingPlan(plan)
    const featArr = Array.isArray(plan.features)
      ? plan.features
      : typeof plan.features === 'string'
        ? JSON.parse(plan.features || '[]')
        : []
    setFeaturesText(featArr.join('\n'))
    setForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      old_price: plan.old_price,
      period: plan.period,
      features: featArr,
      popular: plan.popular,
      color: plan.color || '#1952d9',
      order_num: plan.order_num,
      active: plan.active,
    })
    setFormError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Plan adı zorunludur.'); return }
    setSaving(true)
    setFormError('')
    try {
      const featuresArr = featuresText.split('\n').map(f => f.trim()).filter(Boolean)
      const payload = { ...form, features: featuresArr }
      if (editingPlan) {
        await api.put(`/pricing/${editingPlan.id}`, payload)
      } else {
        await api.post('/pricing', payload)
      }
      setShowModal(false)
      fetchPlans()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setFormError(e.response?.data?.message || 'Kaydedilirken hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/pricing/${id}`)
      setDeleteConfirm(null)
      fetchPlans()
    } catch {
      setError('Silme işlemi başarısız.')
    }
  }

  const parseFeatures = (features: string[] | string): string[] => {
    if (Array.isArray(features)) return features
    try { return JSON.parse(features) } catch { return [] }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fiyat Planları</h1>
          <p className="text-gray-500 text-sm mt-0.5">Fiyatlandırma planlarını yönetin</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#1952d9] hover:bg-[#1544c0] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Yeni Plan
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-[#1952d9] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Yükleniyor...
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Henüz fiyat planı eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map(plan => {
            const feats = parseFeatures(plan.features)
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden relative ${
                  plan.active ? 'border-gray-100' : 'border-gray-100 opacity-60'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-3 right-3">
                    <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3" />
                      Popüler
                    </span>
                  </div>
                )}
                <div className="h-2 w-full" style={{ backgroundColor: plan.color }} />
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 text-lg">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 mb-3">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold" style={{ color: plan.color }}>{plan.price} ₺</span>
                    <span className="text-gray-400 text-sm">/{plan.period}</span>
                    {plan.old_price && (
                      <span className="text-gray-400 text-sm line-through ml-1">{plan.old_price} ₺</span>
                    )}
                  </div>
                  <ul className="space-y-1 mb-4">
                    {feats.slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: plan.color }} />
                        {f}
                      </li>
                    ))}
                    {feats.length > 4 && (
                      <li className="text-xs text-gray-400">+{feats.length - 4} daha...</li>
                    )}
                  </ul>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      plan.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {plan.active ? 'Aktif' : 'Pasif'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(plan)}
                        className="p-1.5 text-gray-400 hover:text-[#1952d9] hover:bg-blue-50 rounded-lg transition"
                        title="Düzenle"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(plan.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Planı Sil</h3>
            <p className="text-gray-500 text-sm mb-5">Bu fiyat planını silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                İptal
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition">
                Sil
              </button>
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
                {editingPlan ? 'Planı Düzenle' : 'Yeni Plan Ekle'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Adı *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                  placeholder="Standart Plan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                  placeholder="Plan kısa açıklaması"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eski Fiyat (₺)</label>
                  <input
                    type="number"
                    value={form.old_price || ''}
                    onChange={e => setForm(prev => ({ ...prev, old_price: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dönem</label>
                  <input
                    type="text"
                    value={form.period}
                    onChange={e => setForm(prev => ({ ...prev, period: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    placeholder="yıl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Özellikler <span className="text-gray-400 font-normal">(her satıra bir özellik)</span>
                </label>
                <textarea
                  value={featuresText}
                  onChange={e => setFeaturesText(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                  placeholder="SSL sertifikası&#10;Teknik destek&#10;E-fatura entegrasyonu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Renk</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, color: c.value }))}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        form.color === c.value ? 'border-gray-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sıra No</label>
                  <input
                    type="number"
                    value={form.order_num}
                    onChange={e => setForm(prev => ({ ...prev, order_num: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, popular: !prev.popular }))}
                  >
                    {form.popular ? (
                      <ToggleRight className="w-8 h-8 text-yellow-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                  <span className="text-sm font-medium text-gray-700">Popüler</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, active: !prev.active }))}
                  >
                    {form.active ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                  <span className="text-sm font-medium text-gray-700">Aktif</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm text-white bg-[#1952d9] hover:bg-[#1544c0] rounded-lg transition disabled:opacity-60"
              >
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editingPlan ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
