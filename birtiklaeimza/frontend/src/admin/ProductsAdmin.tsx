import { useEffect, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Package,
} from 'lucide-react'
import api from '../lib/api'

interface Product {
  id: number
  name: string
  slug: string
  short_desc: string
  description: string
  price: number
  old_price?: number
  category: string
  features: string[] | string
  badge_text?: string
  badge_color?: string
  order_num: number
  active: boolean
}

const emptyProduct: Omit<Product, 'id'> = {
  name: '',
  slug: '',
  short_desc: '',
  description: '',
  price: 0,
  old_price: undefined,
  category: 'bireysel',
  features: [],
  badge_text: '',
  badge_color: '',
  order_num: 0,
  active: true,
}

const categoryOptions = [
  { value: 'bireysel', label: 'Bireysel' },
  { value: 'kurumsal', label: 'Kurumsal' },
  { value: 'mali-muhur', label: 'Mali Mühür' },
  { value: 'yenileme', label: 'Yenileme' },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<Omit<Product, 'id'>>(emptyProduct)
  const [featuresText, setFeaturesText] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [formError, setFormError] = useState('')

  const fetchProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/products')
      setProducts(res.data.products || res.data || [])
    } catch {
      setError('Ürünler yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const openAdd = () => {
    setEditingProduct(null)
    setForm(emptyProduct)
    setFeaturesText('')
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditingProduct(p)
    const featArr = Array.isArray(p.features)
      ? p.features
      : typeof p.features === 'string'
        ? JSON.parse(p.features || '[]')
        : []
    setFeaturesText(featArr.join('\n'))
    setForm({
      name: p.name,
      slug: p.slug,
      short_desc: p.short_desc,
      description: p.description,
      price: p.price,
      old_price: p.old_price,
      category: p.category,
      features: featArr,
      badge_text: p.badge_text || '',
      badge_color: p.badge_color || '',
      order_num: p.order_num,
      active: p.active,
    })
    setFormError('')
    setShowModal(true)
  }

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: slugify(name),
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Ürün adı zorunludur.'); return }
    setSaving(true)
    setFormError('')
    try {
      const featuresArr = featuresText.split('\n').map(f => f.trim()).filter(Boolean)
      const payload = { ...form, features: featuresArr }
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload)
      } else {
        await api.post('/products', payload)
      }
      setShowModal(false)
      fetchProducts()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setFormError(e.response?.data?.message || 'Kaydedilirken hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/products/${id}`)
      setDeleteConfirm(null)
      fetchProducts()
    } catch {
      setError('Silme işlemi başarısız.')
    }
  }

  const handleToggleActive = async (p: Product) => {
    try {
      await api.put(`/products/${p.id}`, { ...p, active: !p.active })
      fetchProducts()
    } catch {
      setError('Durum güncellenemedi.')
    }
  }

  const getCategoryLabel = (val: string) =>
    categoryOptions.find(c => c.value === val)?.label || val

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ürünler</h1>
          <p className="text-gray-500 text-sm mt-0.5">E-imza ürünlerini yönetin</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#1952d9] hover:bg-[#1544c0] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Yeni Ürün
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
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Henüz ürün eklenmemiş.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Ad</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Kategori</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Fiyat</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Sıra</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Durum</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.slug}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {getCategoryLabel(p.category)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-gray-800">{p.price} ₺</p>
                      {p.old_price && (
                        <p className="text-xs text-gray-400 line-through">{p.old_price} ₺</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{p.order_num}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className="flex items-center gap-1.5 text-sm transition"
                      >
                        {p.active ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-green-500" />
                            <span className="text-green-600 font-medium">Aktif</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-400">Pasif</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-[#1952d9] hover:bg-blue-50 rounded-lg transition"
                          title="Düzenle"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Sil"
                        >
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

      {/* Delete confirmation modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ürünü Sil</h3>
            <p className="text-gray-500 text-sm mb-5">Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    placeholder="Bireysel e-İmza"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9] bg-gray-50"
                    placeholder="bireysel-e-imza"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kısa Açıklama</label>
                  <input
                    type="text"
                    value={form.short_desc}
                    onChange={e => setForm(prev => ({ ...prev, short_desc: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    placeholder="Kısa ürün açıklaması"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detaylı Açıklama</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    placeholder="Ürün detaylı açıklaması..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    placeholder="299"
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
                    placeholder="399"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
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
                    onChange={e => setForm(prev => ({ ...prev, order_num: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    min="0"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Özellikler <span className="text-gray-400 font-normal">(her satıra bir özellik)</span>
                  </label>
                  <textarea
                    value={featuresText}
                    onChange={e => setFeaturesText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    placeholder="3 yıl geçerli&#10;Teknik destek&#10;Ücretsiz kargo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rozet Metni</label>
                  <input
                    type="text"
                    value={form.badge_text || ''}
                    onChange={e => setForm(prev => ({ ...prev, badge_text: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    placeholder="En Çok Satan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rozet Rengi</label>
                  <input
                    type="text"
                    value={form.badge_color || ''}
                    onChange={e => setForm(prev => ({ ...prev, badge_color: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9]"
                    placeholder="#1952d9"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Aktif</label>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, active: !prev.active }))}
                    className="transition"
                  >
                    {form.active ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                  <span className={`text-sm font-medium ${form.active ? 'text-green-600' : 'text-gray-400'}`}>
                    {form.active ? 'Aktif' : 'Pasif'}
                  </span>
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
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                {editingProduct ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
