import { useEffect, useState } from 'react'
import { Users, Truck, Package, Clock, TrendingUp } from 'lucide-react'
import { api } from '../../lib/api'

interface Stats { partners: number; tasiyicilar: number; isler: number; havuzda: number; gelir: number }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => { api.admin.stats().then(setStats) }, [])

  const cards = [
    { label: 'Aktif Partner',   value: stats?.partners,    icon: Users,   color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: 'Aktif Taşıyıcı',  value: stats?.tasiyicilar, icon: Truck,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Toplam İş',       value: stats?.isler,       icon: Package, color: 'text-violet-600',  bg: 'bg-violet-50' },
    { label: 'Havuzda Bekliyor',value: stats?.havuzda,     icon: Clock,   color: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: 'Toplam Gelir',    value: stats ? `₺${stats.gelir.toLocaleString('tr-TR', {minimumFractionDigits:2})}` : null,
      icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Genel Bakış</h1>
        <p className="text-sm text-gray-500 mt-0.5">Paketçiniz Plus yönetim paneli</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="card p-6 bg-gradient-to-r from-gray-800 to-gray-900">
        <p className="text-white font-semibold mb-1">Admin bilgileri</p>
        <p className="text-gray-400 text-sm">admin@plus.com · şifre: admin123</p>
      </div>
    </div>
  )
}
