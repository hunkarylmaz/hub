import { Users, Activity, Clock, Headphones } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: '50.000+',
    label: 'Mutlu Müşteri',
    color: 'text-[#1952d9]',
    bg: 'bg-blue-50',
  },
  {
    icon: Activity,
    value: '%99.9',
    label: 'Uptime Garantisi',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: Clock,
    value: '24 Saat',
    label: 'Hızlı Teslimat',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    icon: Headphones,
    value: '7/24',
    label: 'Teknik Destek',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
]

export default function StatsBar() {
  return (
    <section className="py-10 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group"
              >
                <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900 leading-none">{stat.value}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
