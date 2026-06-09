import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCart,
  MessageSquare,
  Package,
  TrendingUp,
  ArrowRight,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import api from '../lib/api'

interface Order {
  id: number
  customer_name: string
  customer_email: string
  product_name: string
  status: string
  total_amount: number
  created_at: string
}

interface Contact {
  id: number
  name: string
  email: string
  subject: string
  status: string
  created_at: string
}

interface Stats {
  totalOrders: number
  newContacts: number
  activeProducts: number
  monthlyRevenue: number
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  unread: 'bg-blue-100 text-blue-700',
  read: 'bg-gray-100 text-gray-600',
  replied: 'bg-green-100 text-green-700',
}

const statusLabels: Record<string, string> = {
  new: 'Yeni',
  processing: 'İşlemde',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  unread: 'Okunmadı',
  read: 'Okundu',
  replied: 'Cevaplandı',
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  loading,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  color: string
  loading: boolean
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, newContacts: 0, activeProducts: 0, monthlyRevenue: 0 })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [recentContacts, setRecentContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [ordersRes, contactsRes, productsRes] = await Promise.all([
        api.get('/orders?limit=5&sort=created_at&order=desc'),
        api.get('/contacts?limit=5&sort=created_at&order=desc'),
        api.get('/products?active=true'),
      ])

      setRecentOrders(ordersRes.data.orders || ordersRes.data || [])
      setRecentContacts(contactsRes.data.contacts || contactsRes.data || [])

      const allOrders: Order[] = ordersRes.data.allOrders || ordersRes.data.orders || []
      const monthlyRev = allOrders.reduce((sum: number, o: Order) => sum + (o.total_amount || 0), 0)

      setStats({
        totalOrders: ordersRes.data.total || allOrders.length,
        newContacts: contactsRes.data.unreadCount || contactsRes.data.total || 0,
        activeProducts: productsRes.data.length || productsRes.data.products?.length || 0,
        monthlyRevenue: monthlyRev,
      })
    } catch {
      setError('Veriler yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Genel bakış ve özet bilgiler</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={ShoppingCart}
          label="Toplam Sipariş"
          value={stats.totalOrders}
          color="bg-blue-50 text-blue-600"
          loading={loading}
        />
        <StatCard
          icon={MessageSquare}
          label="Yeni Mesajlar"
          value={stats.newContacts}
          color="bg-purple-50 text-purple-600"
          loading={loading}
        />
        <StatCard
          icon={Package}
          label="Aktif Ürünler"
          value={stats.activeProducts}
          color="bg-green-50 text-green-600"
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Aylık Gelir"
          value={formatCurrency(stats.monthlyRevenue)}
          color="bg-orange-50 text-orange-600"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Son Siparişler</h2>
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 text-sm text-[#1952d9] hover:underline"
            >
              Tümü <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))
            ) : recentOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Henüz sipariş yok.</div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{order.customer_name}</p>
                    <p className="text-xs text-gray-500 truncate">{order.product_name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusColors[order.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Contacts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Son Mesajlar</h2>
            <Link
              to="/admin/contacts"
              className="flex items-center gap-1 text-sm text-[#1952d9] hover:underline"
            >
              Tümü <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))
            ) : recentContacts.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Henüz mesaj yok.</div>
            ) : (
              recentContacts.map((contact) => (
                <div key={contact.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{contact.name}</p>
                    <p className="text-xs text-gray-500 truncate">{contact.subject || contact.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusColors[contact.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {statusLabels[contact.status] || contact.status}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(contact.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Hızlı İşlemler</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { to: '/admin/products', label: 'Ürün Ekle', icon: Package, color: 'bg-green-50 text-green-700 hover:bg-green-100' },
            { to: '/admin/pricing', label: 'Fiyat Güncelle', icon: TrendingUp, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
            { to: '/admin/orders', label: 'Siparişleri Gör', icon: ShoppingCart, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
            { to: '/admin/contacts', label: 'Mesajları Gör', icon: MessageSquare, color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
          ].map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.to}
                to={action.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${action.color}`}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
