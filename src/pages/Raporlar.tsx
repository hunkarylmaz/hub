import { useState, useEffect, useCallback } from 'react'
import { Wallet, CheckCircle, Clock, BarChart2, AlertCircle, Loader2 } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { api, RaporData } from '../lib/api'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  borderColor: string
  iconBg: string
}

function StatCard({ icon, label, value, borderColor, iconBg }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl border-2 p-5 flex items-center gap-4 ${borderColor}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function formatPara(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}

export default function Raporlar() {
  const [data, setData] = useState<RaporData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRaporlar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api.raporlar.get()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRaporlar()
  }, [fetchRaporlar])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle size={32} className="text-red-500" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchRaporlar}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Finansal Raporlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Onaylanan ödemeler ve detaylı gelir analizi</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Wallet size={20} className="text-blue-600" />}
          label="Toplam Onaylanan"
          value={formatPara(data.toplam_onaylanan)}
          borderColor="border-blue-200"
          iconBg="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-emerald-600" />}
          label="Onaylanan Talep"
          value={String(data.onaylanan_talep_sayisi)}
          borderColor="border-emerald-200"
          iconBg="bg-emerald-50"
        />
        <StatCard
          icon={<Clock size={20} className="text-amber-500" />}
          label="Bekleyen Ödeme"
          value={formatPara(data.bekleyen_odeme)}
          borderColor="border-amber-200"
          iconBg="bg-amber-50"
        />
        <StatCard
          icon={<BarChart2 size={20} className="text-blue-500" />}
          label="Ortalama Ödeme"
          value={formatPara(data.ortalama_odeme)}
          borderColor="border-blue-200"
          iconBg="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded bg-primary-600 flex items-center justify-center">
              <BarChart2 size={12} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700">Aylık Gelir Trendi</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.aylik_trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: 12 }}
                  formatter={(value: number) => [`${value.toLocaleString('tr-TR')} ₺`, 'Gelir']}
                />
                <Line type="monotone" dataKey="gelir" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
              <BarChart2 size={12} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700">Bayiliklere Göre Ödeme Dağılımı</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.bayilik_dagilim} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} angle={-10} textAnchor="end" />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: 12 }}
                  formatter={(value: number) => [`${value.toLocaleString('tr-TR')} ₺`, 'Ödeme']}
                />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
