import { Wallet, CheckCircle, Clock, BarChart2 } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

const lineData = [
  { month: 'Oca', gelir: 0 },
  { month: 'Şub', gelir: 0 },
  { month: 'Mar', gelir: 0 },
  { month: 'Nis', gelir: 0 },
  { month: 'May', gelir: 16700 },
]

const barData = [
  { name: 'Osmaniye Paketçiniz', value: 14000 },
  { name: 'Paketçiniz Bodrum', value: 1980 },
  { name: 'Paketçiniz Afyon', value: 720 },
  { name: 'Test', value: 1 },
]

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

export default function Raporlar() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Finansal Raporlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Onaylanan ödemeler ve detaylı gelir analizi</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Wallet size={20} className="text-purple-600" />}
          label="Toplam Onaylanan"
          value="16.700,60 ₺"
          borderColor="border-purple-200"
          iconBg="bg-purple-50"
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-emerald-600" />}
          label="Onaylanan Talep"
          value="6"
          borderColor="border-emerald-200"
          iconBg="bg-emerald-50"
        />
        <StatCard
          icon={<Clock size={20} className="text-amber-500" />}
          label="Bekleyen Ödeme"
          value="0,00 ₺"
          borderColor="border-amber-200"
          iconBg="bg-amber-50"
        />
        <StatCard
          icon={<BarChart2 size={20} className="text-blue-500" />}
          label="Ortalama Ödeme"
          value="2.783,43 ₺"
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
              <LineChart data={lineData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: 12 }}
                  formatter={(value: number) => [`${value.toLocaleString('tr-TR')} ₺`, 'Gelir']}
                />
                <Line type="monotone" dataKey="gelir" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED', r: 4 }} activeDot={{ r: 6 }} />
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
              <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
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
