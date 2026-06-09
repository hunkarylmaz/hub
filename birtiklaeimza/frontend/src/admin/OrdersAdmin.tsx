import { useEffect, useState } from 'react'
import {
  X,
  AlertCircle,
  ShoppingCart,
  Eye,
  RefreshCw,
  Filter,
} from 'lucide-react'
import api from '../lib/api'

interface Order {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  product_name: string
  product_id?: number
  status: 'new' | 'processing' | 'completed' | 'cancelled'
  total_amount: number
  notes?: string
  created_at: string
  updated_at?: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'Yeni', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'İşlemde', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Tamamlandı', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal', color: 'bg-red-100 text-red-700' },
}

const statusOptions = [
  { value: '', label: 'Tüm Durumlar' },
  { value: 'new', label: 'Yeni' },
  { value: 'processing', label: 'İşlemde' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal' },
]

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = {}
      if (filterStatus) params.status = filterStatus
      const res = await api.get('/orders', { params })
      setOrders(res.data.orders || res.data || [])
    } catch {
      setError('Siparişler yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [filterStatus])

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(orderId)
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o))
      if (viewOrder?.id === orderId) {
        setViewOrder(prev => prev ? { ...prev, status: newStatus as Order['status'] } : prev)
      }
    } catch {
      setError('Durum güncellenemedi.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Siparişler</h1>
          <p className="text-gray-500 text-sm mt-0.5">Müşteri siparişlerini yönetin</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3.5 mb-4 flex items-center gap-4">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                filterStatus === opt.value
                  ? 'bg-[#1952d9] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-[#1952d9] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Yükleniyor...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Bu kriterlere uygun sipariş bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tarih</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Müşteri</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Ürün</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tutar</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Durum</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.customer_email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{order.product_name}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      {updatingStatus === order.id ? (
                        <span className="w-4 h-4 border-2 border-[#1952d9] border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                        <select
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${
                            statusConfig[order.status]?.color || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {statusOptions.filter(o => o.value).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setViewOrder(order)}
                          className="p-1.5 text-gray-400 hover:text-[#1952d9] hover:bg-blue-50 rounded-lg transition"
                          title="Detaylar"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Detail Modal */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                Sipariş Detayı — #{viewOrder.id}
              </h2>
              <button onClick={() => setViewOrder(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Müşteri Adı</p>
                  <p className="text-sm font-semibold text-gray-800">{viewOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Telefon</p>
                  <p className="text-sm text-gray-700">{viewOrder.customer_phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">E-posta</p>
                  <p className="text-sm text-gray-700">{viewOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Ürün</p>
                  <p className="text-sm text-gray-700">{viewOrder.product_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Tutar</p>
                  <p className="text-sm font-bold text-gray-800">{formatCurrency(viewOrder.total_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Durum</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[viewOrder.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {statusConfig[viewOrder.status]?.label || viewOrder.status}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Sipariş Tarihi</p>
                  <p className="text-sm text-gray-700">{formatDate(viewOrder.created_at)}</p>
                </div>
                {viewOrder.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Notlar</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{viewOrder.notes}</p>
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Durumu Güncelle</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.filter(o => o.value).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(viewOrder.id, opt.value)}
                      disabled={updatingStatus === viewOrder.id}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                        viewOrder.status === opt.value
                          ? 'ring-2 ring-offset-1 ring-[#1952d9] ' + (statusConfig[opt.value]?.color || '')
                          : statusConfig[opt.value]?.color + ' hover:opacity-80'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button onClick={() => setViewOrder(null)} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
