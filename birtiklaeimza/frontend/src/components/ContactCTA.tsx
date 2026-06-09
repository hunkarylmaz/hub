import { Phone, Clock, ArrowRight, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const infoItems = [
  {
    icon: Clock,
    label: 'Çalışma Saatleri',
    value: 'Pzt–Cmt, 09:00–18:00',
    sub: 'Resmi tatillerde WhatsApp destek',
  },
  {
    icon: Zap,
    label: 'Yanıt Süresi',
    value: 'Ortalama 15 dakika',
    sub: 'WhatsApp ve telefonda hızlı yanıt',
  },
  {
    icon: Phone,
    label: 'Telefon',
    value: '0850 888 23 45',
    sub: 'Ücretsiz numaradan arayabilirsiniz',
  },
]

export default function ContactCTA() {
  return (
    <section className="bg-[#0a2569] py-20 relative overflow-hidden">

      {/* Subtle background shapes */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-[40%] h-full pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px] gap-12 xl:gap-20 items-center">

          {/* ── Left: heading + buttons ── */}
          <div className="flex flex-col gap-7">

            {/* Live indicator */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse flex-shrink-0" />
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">
                Şu An Hizmetinizdeyiz
              </span>
            </div>

            {/* Heading */}
            <div>
              <h2 className="text-[38px] sm:text-[46px] font-black tracking-tight text-white leading-[1.07]">
                Hemen e-İmzanızı<br />
                <span className="text-[#0ea5e9]">Alın</span>
              </h2>
              <p className="text-[16px] text-blue-200/75 mt-4 max-w-lg leading-relaxed">
                Sorularınız için bize ulaşın veya hemen sipariş verin.
                Uzman ekibimiz her konuda size yardımcı olmaya hazır.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/908508882345?text=Merhaba%2C%20e-%C4%B0mza%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-[#22c55e] hover:bg-[#16a34a] active:bg-[#15803d] text-white font-bold rounded-xl transition-colors duration-150 text-[15px]"
              >
                {/* WhatsApp icon */}
                <svg className="w-4.5 h-4.5 flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp ile Ulaşın
              </a>
              <a
                href="tel:+908508882345"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-white/10 border border-white/20 hover:bg-white/15 text-white font-bold rounded-xl transition-colors duration-150 text-[15px]"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                0850 888 23 45
              </a>
            </div>

            {/* Or link to contact page */}
            <Link
              to="/iletisim"
              className="inline-flex items-center gap-1.5 text-[13px] text-blue-300/70 hover:text-blue-200 transition-colors duration-150 self-start"
            >
              Ya da iletişim formunu doldurun
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

          </div>

          {/* ── Right: info card ── */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.25)]">

            {/* Card header bar */}
            <div className="bg-[#1952d9] px-6 py-4 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
              <span className="ml-2 text-[11px] font-bold text-white/60 uppercase tracking-widest">
                İletişim Bilgileri
              </span>
            </div>

            {/* Info items */}
            <div className="divide-y divide-slate-100">
              {infoItems.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex items-start gap-4 px-6 py-5">
                    <div className="w-9 h-9 rounded-lg bg-[#f4f7ff] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4.5 h-4.5 text-[#1952d9]" />
                    </div>
                    <div>
                      <p className="text-[10.5px] font-bold text-[#94a3b8] uppercase tracking-widest mb-0.5">
                        {item.label}
                      </p>
                      <p className="text-[15px] font-bold text-[#0f1629] leading-tight">
                        {item.value}
                      </p>
                      <p className="text-[12px] text-[#475569] mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Card footer */}
            <div className="px-6 py-4 bg-[#f4f7ff] border-t border-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981] flex-shrink-0" />
              <span className="text-[12px] font-semibold text-[#475569]">
                Ortalama yanıt süresi: <strong className="text-[#0f1629]">15 dakika</strong>
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
