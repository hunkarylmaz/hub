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
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`
                group relative flex flex-col items-center justify-center py-9 px-6 gap-1
                cursor-default select-none transition-all duration-200
                hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(25,82,217,0.07)]
                ${index !== stats.length - 1
                  ? 'after:absolute after:right-0 after:top-1/4 after:h-1/2 after:w-px after:bg-slate-100 after:content-[""]'
                  : ''}
                ${index >= 2 ? 'lg:border-t-0 border-t border-slate-100' : ''}
              `}
            >
              {/* Big number */}
              <span className="text-[26px] sm:text-[34px] lg:text-[38px] font-black text-[#1952d9] tracking-tight leading-none tabular-nums whitespace-nowrap">
                {stat.value}
              </span>
              {/* Label */}
              <span className="text-[13px] font-semibold text-[#0f1629] mt-2 leading-tight">
                {stat.label}
              </span>
              {/* Sub-label */}
              <span className="text-[11.5px] text-[#94a3b8] mt-0.5">
                {stat.sublabel}
              </span>
              {/* Hover accent line */}
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-[#1952d9] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-250 origin-center" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
