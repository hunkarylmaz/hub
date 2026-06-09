const stats = [
  {
    value: '50.000+',
    label: 'Mutlu Müşteri',
    sublabel: 'Türkiye genelinde',
  },
  {
    value: '%99.9',
    label: 'Çalışma Süresi',
    sublabel: 'Uptime garantisi',
  },
  {
    value: '24 Saat',
    label: 'Ortalama Teslimat',
    sublabel: 'Sipariş sonrası',
  },
  {
    value: '7/24',
    label: 'Teknik Destek',
    sublabel: 'Tatil dahil her gün',
  },
]

export default function StatsBar() {
  return (
    <section className="bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x-0 lg:divide-x divide-slate-100">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group flex flex-col items-center justify-center py-8 px-4 gap-1
                         hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(25,82,217,0.06)]
                         transition-all duration-200 cursor-default select-none"
            >
              <span className="text-3xl sm:text-4xl font-extrabold text-[#1952d9] tracking-tight leading-none">
                {stat.value}
              </span>
              <span className="text-sm font-semibold text-[#0f1629] mt-1">{stat.label}</span>
              <span className="text-xs text-[#475569]">{stat.sublabel}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
