import { ShoppingBag, FileText, CreditCard, CheckCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const steps = [
  {
    step: '01',
    icon: ShoppingBag,
    title: 'Ürün Seçin',
    description: 'İhtiyacınıza uygun e-imza paketini seçin. Bireysel, kurumsal veya mobil seçeneklerimiz arasından en uygununu bulun.',
    iconBg: 'bg-[#dbeafe]',
    iconColor: 'text-[#1952d9]',
    stepColor: 'text-[#1952d9]/10',
  },
  {
    step: '02',
    icon: FileText,
    title: 'Formu Doldurun',
    description: 'Kişisel bilgilerinizi ve gerekli belgeleri içeren başvuru formunu eksiksiz doldurun.',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    stepColor: 'text-purple-500/10',
  },
  {
    step: '03',
    icon: CreditCard,
    title: 'Güvenli Ödeme',
    description: 'Güvenli ödeme altyapımız üzerinden kredi kartı, havale veya EFT ile ödemenizi gerçekleştirin.',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    stepColor: 'text-emerald-500/10',
  },
  {
    step: '04',
    icon: CheckCircle,
    title: 'e-İmzanızı Alın',
    description: '24 saat içinde e-imzanız hazırlanır ve kargo ile adresinize gönderilir. Teknik destek ile kurulumunuzu tamamlayın.',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
    stepColor: 'text-orange-400/10',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-12 md:py-20 lg:py-24 bg-[#f4f7ff]" id="nasil-calisir">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#1952d9]/15 rounded-full mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1952d9] flex-shrink-0" />
            <span className="text-[11px] font-bold text-[#1952d9] uppercase tracking-widest">
              Süreç
            </span>
          </div>
          <h2 className="text-[36px] sm:text-[42px] font-black tracking-tight text-[#0f1629] leading-[1.1]">
            Nasıl Çalışır?
          </h2>
          <p className="text-[16px] text-[#475569] mt-3 max-w-xl mx-auto leading-relaxed">
            Sadece 4 basit adımda e-imzanızı alın. Tüm süreç online olarak tamamlanır.
          </p>
        </div>

        {/* ── 4 steps ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === steps.length - 1

            return (
              <div
                key={index}
                className="relative bg-white rounded-2xl p-6 border border-slate-100
                           shadow-[0_1px_8px_rgba(0,0,0,0.04)]
                           hover:shadow-[0_4px_24px_rgba(25,82,217,0.09)]
                           hover:-translate-y-1 transition-all duration-200 group overflow-hidden"
              >
                {/* Large ghost step number behind card content */}
                <span
                  className={`absolute -top-2 -right-1 text-[80px] font-black leading-none select-none pointer-events-none ${step.stepColor}`}
                  aria-hidden="true"
                >
                  {step.step}
                </span>

                {/* Icon circle */}
                <div
                  className={`relative w-11 h-11 rounded-xl ${step.iconBg} flex items-center justify-center mb-5
                               group-hover:scale-105 transition-transform duration-200`}
                >
                  <Icon className={`w-5 h-5 ${step.iconColor}`} />
                </div>

                {/* Step label */}
                <p className="text-[10.5px] font-bold text-[#94a3b8] uppercase tracking-widest mb-1.5">
                  Adım {step.step}
                </p>

                {/* Title */}
                <h3 className="text-[16px] font-bold text-[#0f1629] mb-2.5 leading-tight">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-[13px] text-[#475569] leading-relaxed">
                  {step.description}
                </p>

                {/* Connector arrow — shown between steps on large screens */}
                {!isLast && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center shadow-sm">
                    <ArrowRight className="w-3 h-3 text-[#1952d9]" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── CTA ── */}
        <div className="text-center mt-12">
          <Link
            to="/urunler"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#1952d9] text-white font-bold rounded-xl
                       hover:bg-[#1445c0] active:bg-[#0f39a8] transition-colors duration-150 text-[15px]
                       shadow-lg shadow-[#1952d9]/20"
          >
            Hemen Başlayın
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  )
}
