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

  const yogunlukColor = stats?.yogunluk === 'Yüksek' ? 'text-red-600 bg-red-50' : stats?.yogunluk === 'Orta' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center justify-between gap-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-2">
        <Stat iconBg="bg-blue-50 text-primary-600" icon={<Package size={13} />} label="Sipariş" value={String(stats?.siparis_toplam ?? 0)} />
        <Stat iconBg="bg-amber-50 text-amber-600" icon={<Percent size={13} />} label="Müdahale" value={`${stats?.mudahale_yuzdesi ?? 0}%`} />
        <Stat iconBg="bg-emerald-50 text-emerald-600" icon={<Star size={13} />} label="Kalite" value={`${stats?.kalite_yuzdesi ?? 100}%`} />
        <Stat iconBg={yogunlukColor} icon={<Zap size={13} />} label="Yoğunluk" value={stats?.yogunluk ?? 'Düşük'} />
        <Stat iconBg="bg-indigo-50 text-indigo-600" icon={<Coins size={13} />} label="Kontör" value={String(bayilik?.token ?? stats?.kontor_bakiye ?? 0)} />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={fetchStats} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-all duration-150 active:rotate-180">
          <RefreshCw size={15} />
        </button>
        <div className="w-px h-7 bg-gray-100" />
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-primary-50 shrink-0">
            {bayilik?.ad.slice(0, 2).toUpperCase() || 'B'}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-800 leading-tight">{bayilik?.ad}</p>
            <p className="text-xs text-gray-400 leading-tight font-mono">{bayilik?.bayilik_id}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

function Stat({ icon, iconBg, label, value }: { icon: React.ReactNode; iconBg: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors duration-150">
      <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</span>
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-bold text-gray-800">{value}</span>
    </div>
  )
}
