import { Target, Eye, Heart, Users, Award, TrendingUp, Shield, Headphones, CheckCircle2 } from 'lucide-react'
import AnnouncementBar from '../components/AnnouncementBar'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ContactCTA from '../components/ContactCTA'

const milestones = [
  { year: '2018', title: 'Kuruluş', desc: 'Bir Tıkla e-İmza İstanbul\'da kuruldu.' },
  { year: '2019', title: 'İlk 1.000 Müşteri', desc: 'Kısa sürede 1.000 memnun müşteriye ulaştık.' },
  { year: '2020', title: 'Kurumsal Büyüme', desc: 'Kurumsal e-imza hizmetlerini genişlettik.' },
  { year: '2021', title: 'Mobil e-İmza', desc: 'SIM kart tabanlı mobil e-imza hizmetine başladık.' },
  { year: '2022', title: '25.000 Müşteri', desc: 'Türkiye genelinde 25.000 müşteriyi geçtik.' },
  { year: '2024', title: '50.000+ Müşteri', desc: 'Sektörün lider firması olarak 50.000+ müşteriye hizmet veriyoruz.' },
]

const team = [
  {
    name: 'Mehmet Arslan',
    role: 'Genel Müdür',
    bio: '15 yıllık sektör deneyimiyle Bir Tıkla e-İmza\'yı kuran ve büyüten vizyon sahibi.',
    initials: 'MA',
  },
  {
    name: 'Ayşe Yıldız',
    role: 'Teknik Direktör',
    bio: 'Kriptografi ve güvenlik alanında uzman. BİLGEM/TÜBİTAK sertifika süreçlerinin mimarı.',
    initials: 'AY',
  },
  {
    name: 'Emre Koçak',
    role: 'Müşteri Deneyimi',
    bio: '7/24 destek ekibimizin lideri. Müşteri memnuniyetini ön planda tutuyor.',
    initials: 'EK',
  },
  {
    name: 'Deniz Çelik',
    role: 'Satış ve Pazarlama',
    bio: 'Kurumsal müşteri ilişkileri ve büyüme stratejisinden sorumlu deneyimli profesyonel.',
    initials: 'DÇ',
  },
]

const values = [
  {
    icon: Shield,
    title: 'Güvenilirlik',
    desc: 'Her zaman dürüst ve şeffaf hizmet anlayışı.',
    color: 'text-[#1952d9]',
    bg: 'bg-blue-50',
  },
  {
    icon: Headphones,
    title: 'Müşteri Odaklılık',
    desc: 'Müşteri memnuniyeti tüm kararlarımızın merkezinde.',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: TrendingUp,
    title: 'İnovasyon',
    desc: 'Sürekli gelişerek en iyi teknolojiyi sunuyoruz.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Heart,
    title: 'Sosyal Sorumluluk',
    desc: 'Dijitalleşme sürecinde topluma katkı sağlıyoruz.',
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar />
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0a2569] to-[#1952d9] pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-blue-200 mb-4 border border-white/20">
            <Users className="w-4 h-4" />
            Hakkımızda
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Bir Tıkla e-İmza</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            2018'den bu yana Türkiye'nin en güvenilir elektronik imza hizmet sağlayıcısı olarak 50.000'den fazla müşteriye hizmet veriyoruz.
          </p>
        </div>
      </div>

      <main className="flex-1">

        {/* Mission & Vision */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="bg-gradient-to-br from-[#f0f5ff] to-white rounded-3xl p-8 border border-blue-100">
              <div className="w-14 h-14 bg-[#1952d9] rounded-2xl flex items-center justify-center mb-5">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-4">Misyonumuz</h2>
              <p className="text-slate-600 leading-relaxed">
                Türkiye'de dijital dönüşümü hızlandırmak ve her bireyin ile kurumun güvenli elektronik imzaya
                kolayca erişebilmesini sağlamak. Yasal geçerliliği olan, güvenli ve ekonomik e-imza çözümleri
                sunarak iş dünyasında kağıtsız ofis kültürünün yaygınlaşmasına öncülük etmek.
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#f0fdf4] to-white rounded-3xl p-8 border border-green-100">
              <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mb-5">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-4">Vizyonumuz</h2>
              <p className="text-slate-600 leading-relaxed">
                2030 yılına kadar Türkiye'nin en büyük ve en güvenilir elektronik imza platformu olmak.
                Tüm vatandaşların ve işletmelerin dijital kimlik ve imza hizmetlerine anında erişebildiği,
                tamamen kağıtsız bir Türkiye'yi desteklemek.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-[#f8faff]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '50.000+', label: 'Memnun Müşteri', icon: Users },
                { value: '6+', label: 'Yıllık Deneyim', icon: TrendingUp },
                { value: '%99.9', label: 'Uptime Garantisi', icon: Shield },
                { value: '7/24', label: 'Teknik Destek', icon: Headphones },
              ].map((stat, i) => {
                const Icon = stat.icon
                return (
                  <div key={i} className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-[#1952d9]" />
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 mb-1">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              Değerlerimiz
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Her kararımızda ve hizmetimizde bu değerleri rehber ediniyoruz.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon
              return (
                <div key={i} className="text-center p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all">
                  <div className={`w-14 h-14 ${v.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-7 h-7 ${v.color}`} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-500">{v.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Milestones */}
        <section className="py-20 bg-[#f8faff]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Kilometre Taşlarımız</h2>
              <p className="text-slate-500">Kuruluştan bugüne büyüme hikâyemiz.</p>
            </div>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#1952d9] to-[#0ea5e9]" />
              <div className="space-y-8">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-start gap-6 pl-2">
                    <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1952d9] to-[#0ea5e9] flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-white text-xs font-bold">{m.year}</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex-1 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-1">{m.title}</h3>
                      <p className="text-sm text-slate-500">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Ekibimiz</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Uzman ekibimiz size en iyi hizmeti sunmak için çalışıyor.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {team.map((member, i) => (
              <div key={i} className="text-center p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all group">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1952d9] to-[#0ea5e9] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">{member.initials}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{member.name}</h3>
                <p className="text-sm text-[#1952d9] font-medium mb-3">{member.role}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Certifications */}
        <section className="py-16 bg-[#f8faff]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Sertifika ve Onaylar</h2>
              <p className="text-slate-500">Yasal geçerlilik ve güvenlik standartlarımız.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'BİLGEM Onaylı', desc: 'TÜBİTAK BİLGEM tarafından onaylı nitelikli elektronik sertifika hizmet sağlayıcısı.', icon: Award },
                { title: 'ISO 27001', desc: 'Bilgi güvenliği yönetim sistemi standardına uygun altyapı ve süreçler.', icon: Shield },
                { title: 'KVKK Uyumlu', desc: '6698 sayılı Kişisel Verilerin Korunması Kanunu\'na tam uyumluluk.', icon: CheckCircle2 },
              ].map((cert, i) => {
                const Icon = cert.icon
                return (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[#1952d9]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">{cert.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{cert.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <ContactCTA />
      </main>

      <Footer />
    </div>
  )
}
