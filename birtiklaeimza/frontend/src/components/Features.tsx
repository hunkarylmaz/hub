import { Zap, MousePointerClick, Award, Headphones, ShieldCheck, Wallet, Check } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Hızlı Teslimat',
    description: 'Başvurunuz onaylandıktan sonra e-İmzanız 24 saat içinde size ulaşır.',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
  },
  {
    icon: MousePointerClick,
    title: 'Kolay Kullanım',
    description: 'Adım adım kurulum kılavuzu ve teknik destek ile e-İmzanızı kolayca kurabilirsiniz.',
    iconBg: 'bg-blue-100',
    iconColor: 'text-[#1952d9]',
  },
  {
    icon: Award,
    title: 'Resmi Sertifika',
    description: 'yasal geçerliliği olan Nitelikli Elektronik İmza sertifikaları.',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    icon: Headphones,
    title: '7/24 Teknik Destek',
    description: 'Hafta sonu ve resmi tatiller dahil, uzman ekibimiz her an yanınızda.',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    icon: ShieldCheck,
    title: 'Tam Güvenlik',
    description: '256-bit SSL şifreleme ile verileriniz en üst düzey güvenlikle korunur.',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Wallet,
    title: 'Ekonomik Fiyatlar',
    description: 'Piyasanın en rekabetçi fiyatları ile kaliteli hizmet, uygun bütçeyle.',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
]

const guaranteePoints = [
  'Aynı gün işleme ve onay süreci',
  'Nitelikli CA sertifikalı altyapı',
  'KVKK uyumlu veri işleme',
  'Ücretsiz teknik kurulum desteği',
]

export default function Features() {
  return (
    <section className="py-12 md:py-20 lg:py-24 bg-white" id="ozellikler">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#f4f7ff] border border-[#1952d9]/15 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1952d9] flex-shrink-0" />
            <span className="text-[11px] font-bold text-[#1952d9] uppercase tracking-widest">
              Neden Bir Tıkla?
            </span>
          </div>
          <h2 className="text-[36px] sm:text-[42px] font-black tracking-tight text-[#0f1629] leading-[1.1]">
            İşinizi Kolaylaştıran<br />
            <span className="text-gradient">e-İmza Çözümleri</span>
          </h2>
        </div>

        {/* ── Two-column split layout ── */}
        <div className="grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px] gap-10 xl:gap-16 items-start">

          {/* ── Left: Feature list (not cards) ── */}
          <div className="divide-y divide-slate-100">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group flex items-start gap-4 py-5 first:pt-0 last:pb-0
                             hover:translate-x-1 transition-transform duration-200 cursor-default"
                >
                  {/* Icon square */}
                  <div
                    className={`w-10 h-10 flex-shrink-0 rounded-lg ${feature.iconBg} flex items-center justify-center
                                mt-0.5 group-hover:scale-105 transition-transform duration-200`}
                  >
                    <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  {/* Text */}
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-[#0f1629] leading-tight">
                      {feature.title}
                    </p>
                    <p className="text-[13.5px] text-[#475569] mt-1 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Right: Guarantee panel (dark navy) ── */}
          <div className="bg-[#0a2569] rounded-2xl p-8 text-white flex flex-col gap-6 self-start lg:sticky lg:top-28">

            {/* Heading */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-300/70 mb-2">
                Neden Bizi Tercih Edin?
              </p>
              <h3 className="text-[26px] font-black leading-tight tracking-tight text-white">
                Türkiye'nin En Hızlı<br />e-İmza Servisi
              </h3>
            </div>

            {/* Large stat */}
            <div className="bg-white/8 rounded-xl p-5 border border-white/10">
              <span className="text-[44px] font-black text-white tracking-tight leading-none">
                50.000+
              </span>
              <p className="text-[13.5px] text-blue-200/80 mt-1 leading-snug">
                memnun müşteri, Türkiye'nin dört bir yanından
                bireysel ve kurumsal kullanıcı
              </p>
            </div>

            {/* Checkmark list */}
            <ul className="space-y-3.5">
              {guaranteePoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                  </span>
                  <span className="text-[13.5px] text-blue-100 leading-snug">{point}</span>
                </li>
              ))}
            </ul>

            {/* Badge row */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2">
              {['Nitelikli Onaylı', 'Güvenli Sertifikalı', 'KVKK Uyumlu'].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center px-2.5 py-1 bg-white/10 border border-white/15 rounded-full text-[10.5px] font-bold text-blue-200 tracking-wide"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
