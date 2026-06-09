import { ShoppingBag, FileText, CreditCard, Download, ArrowRight } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: ShoppingBag,
    title: 'Ürün Seçin',
    description: 'İhtiyacınıza uygun e-imza paketini seçin. Bireysel, kurumsal veya mobil seçeneklerimiz arasından en uygununu bulun.',
    color: 'from-[#1952d9] to-[#0ea5e9]',
    iconBg: 'bg-blue-50',
    iconColor: 'text-[#1952d9]',
  },
  {
    step: '02',
    icon: FileText,
    title: 'Formu Doldurun',
    description: 'Kişisel bilgilerinizi ve gerekli belgeleri içeren başvuru formunu eksiksiz doldurun.',
    color: 'from-purple-500 to-indigo-500',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    step: '03',
    icon: CreditCard,
    title: 'Ödeme Yapın',
    description: 'Güvenli ödeme altyapımız üzerinden kredi kartı, havale veya EFT ile ödemenizi gerçekleştirin.',
    color: 'from-green-500 to-emerald-500',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    step: '04',
    icon: Download,
    title: 'e-İmzanızı Alın',
    description: '24 saat içinde e-imzanız hazırlanır ve kargo ile adresinize gönderilir. Teknik destek ile kurulumunuzu tamamlayın.',
    color: 'from-orange-400 to-amber-500',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 bg-[#f8faff]" id="nasil-calisir">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-sm font-semibold text-[#1952d9] mb-4">
            <span className="w-2 h-2 bg-[#1952d9] rounded-full" />
            Süreç
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Nasıl <span className="text-gradient">Çalışır?</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Sadece 4 basit adımda e-imzanızı alın. Tüm süreç online olarak tamamlanır.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line on desktop */}
          <div className="hidden lg:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-[#1952d9]/20 via-[#1952d9]/40 to-[#1952d9]/20" style={{ left: 'calc(12.5% + 2rem)', right: 'calc(12.5% + 2rem)' }} />

          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="relative flex flex-col items-center text-center group">
                {/* Step number + icon */}
                <div className="relative mb-6">
                  {/* Outer ring */}
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-9 h-9 text-white" />
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-600">{step.step}</span>
                  </div>
                </div>

                {/* Arrow between steps (mobile/tablet) */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex items-center justify-center mb-4 w-full">
                    <ArrowRight className="w-5 h-5 text-slate-300" />
                  </div>
                )}

                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <a
            href="/urunler"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200 text-base"
          >
            Hemen Başlayın
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  )
}
