import { useEffect, useState, useCallback } from 'react'
import { Package, Percent, Star, Zap, Coins, RefreshCw } from 'lucide-react'
import { api, DashboardData } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export default function Topbar() {
  const { bayilik } = useAuth()
  const [stats, setStats] = useState<DashboardData | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.dashboard.get()
      setStats(data)
    } catch {}
  }, [])

  useEffect(() => {
    fetchStats()
    const id = setInterval(fetchStats, 30000)
    return () => clearInterval(id)
  }, [fetchStats])

  const yogunlukColor = stats?.yogunluk === 'Yüksek' ? 'text-red-500' : stats?.yogunluk === 'Orta' ? 'text-amber-500' : 'text-emerald-500'

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <Stat icon={<Package size={14} className="text-primary-600" />} label="Sipariş" value={String(stats?.siparis_toplam ?? 0)} />
        <Stat icon={<Percent size={14} className="text-amber-500" />} label="Müdahale" value={`${stats?.mudahale_yuzdesi ?? 0}%`} />
        <Stat icon={<Star size={14} className="text-emerald-500" />} label="Kalite" value={`${stats?.kalite_yuzdesi ?? 100}%`} />
        <Stat icon={<Zap size={14} className={yogunlukColor} />} label="Yoğunluk" value={stats?.yogunluk ?? 'Düşük'} />
        <Stat icon={<Coins size={14} className="text-blue-500" />} label="Kontör" value={String(bayilik?.token ?? stats?.kontor_bakiye ?? 0)} />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={fetchStats} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw size={14} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
            {bayilik?.ad.slice(0, 2).toUpperCase() || 'B'}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-800 leading-tight">{bayilik?.ad}</p>
            <p className="text-xs text-gray-400 leading-tight">{bayilik?.bayilik_id}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs text-gray-500">{label}:</span>
      <span className="text-xs font-bold text-gray-800">{value}</span>
    </div>
  )
}
