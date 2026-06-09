import { Zap, MousePointerClick, Award, Headphones, ShieldCheck, Wallet } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Hızlı Teslimat',
    description: 'Başvurunuz onaylandıktan sonra e-İmzanız 24 saat içinde size ulaşır. Acil durumlarda aynı gün teslimat imkânı.',
    color: 'from-orange-400 to-amber-500',
    bg: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
  {
    icon: MousePointerClick,
    title: 'Kolay Kullanım',
    description: 'Adım adım kurulum kılavuzumuz ve teknik destek ekibimiz ile e-İmzanızı kolayca kurabilirsiniz.',
    color: 'from-[#1952d9] to-[#0ea5e9]',
    bg: 'bg-blue-50',
    iconColor: 'text-[#1952d9]',
  },
  {
    icon: Award,
    title: 'Resmi Sertifika',
    description: 'BİLGEM/TÜBİTAK onaylı, yasal geçerliliği olan Nitelikli Elektronik İmza sertifikaları sunuyoruz.',
    color: 'from-yellow-400 to-orange-500',
    bg: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
  },
  {
    icon: Headphones,
    title: '7/24 Teknik Destek',
    description: 'Uzman teknik destek ekibimiz hafta sonu ve resmi tatiller dahil 7 gün 24 saat hizmetinizdedir.',
    color: 'from-purple-500 to-indigo-500',
    bg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    icon: ShieldCheck,
    title: 'Tam Güvenlik',
    description: 'SSL/TLS 256-bit şifreleme ile verileriniz en üst düzey güvenlikle korunur. KVKK uyumlu altyapı.',
    color: 'from-green-500 to-emerald-500',
    bg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    icon: Wallet,
    title: 'Ekonomik Fiyatlar',
    description: 'Piyasanın en rekabetçi fiyatları ile kaliteli hizmeti uygun bütçeyle elde edebilirsiniz.',
    color: 'from-teal-400 to-cyan-500',
    bg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
]

export default function Features() {
  return (
    <section className="py-24 bg-[#f8faff]" id="ozellikler">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-sm font-semibold text-[#1952d9] mb-4">
            <span className="w-2 h-2 bg-[#1952d9] rounded-full" />
            Neden Bizi Tercih Etmelisiniz?
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Neden <span className="text-gradient">Bir Tıkla</span> e-İmza?
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Türkiye'nin en hızlı ve güvenilir elektronik imza hizmeti için doğru adrestesiniz.
            İşte bizi özel kılan özellikler.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
