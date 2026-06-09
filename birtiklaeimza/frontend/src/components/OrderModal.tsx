import { useState } from 'react'
import { X, CheckCircle2, Loader2, Send } from 'lucide-react'
import api from '../lib/api'

interface Product {
  id: number
  name: string
  price: number
}

interface OrderModalProps {
  product: Product
  onClose: () => void
}

interface FormData {
  fullName: string
  email: string
  phone: string
  company: string
  notes: string
}

export default function OrderModal({ product, onClose }: OrderModalProps) {
  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Lütfen zorunlu alanları doldurun.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/orders', {
        productId: product.id,
        productName: product.name,
        price: product.price,
        ...form,
      })
      setSuccess(true)
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin veya bizi arayın.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sipariş Ver</h2>
            <p className="text-sm text-slate-500 mt-0.5">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            /* Success state */
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Siparişiniz Alındı!</h3>
              <p className="text-slate-500 mb-2">
                <strong>{form.fullName}</strong> adına <strong>{product.name}</strong> siparişiniz başarıyla oluşturuldu.
              </p>
              <p className="text-slate-500 mb-8">
                En kısa sürede <strong>{form.email}</strong> adresine onay e-postası gönderilecektir.
                Sorularınız için 0850 888 23 45 numaralı hattımızı arayabilirsiniz.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Tamam
              </button>
            </div>
          ) : (
            /* Order form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product summary */}
              <div className="bg-[#f8faff] rounded-xl p-4 flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">{product.name}</span>
                <span className="text-lg font-extrabold text-[#1952d9]">
                  {product.price.toLocaleString('tr-TR')} ₺
                </span>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Fields */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Adınız Soyadınız"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1952d9] focus:ring-2 focus:ring-[#1952d9]/20 outline-none transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  E-posta <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ornek@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1952d9] focus:ring-2 focus:ring-[#1952d9]/20 outline-none transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="05XX XXX XX XX"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1952d9] focus:ring-2 focus:ring-[#1952d9]/20 outline-none transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Firma / Kurum
                  <span className="text-slate-400 font-normal ml-1">(isteğe bağlı)</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Firma adınız"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1952d9] focus:ring-2 focus:ring-[#1952d9]/20 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Notlar
                  <span className="text-slate-400 font-normal ml-1">(isteğe bağlı)</span>
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Eklemek istediğiniz bilgiler..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1952d9] focus:ring-2 focus:ring-[#1952d9]/20 outline-none transition-all text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Sipariş Ver
                  </>
                )}
              </button>

              <p className="text-xs text-center text-slate-400">
                Siparişiniz onaylandıktan sonra ödeme bilgileri e-posta ile gönderilecektir.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
