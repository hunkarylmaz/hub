import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Zap, HeadphonesIcon, CheckCircle2, Star, FileText, PenLine, Award } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-hero-gradient">
      {/* Grid overlay */}
      <div className="absolute inset-0 hero-grid" />

      {/* Radial glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0ea5e9]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#1952d9]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-32 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left Content */}
            <div className="text-white space-y-8">
              {/* Subtitle badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm font-medium text-blue-200">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                Türkiye'nin En Güvenilir e-İmza Platformu
              </div>

              {/* Heading */}
              <div className="space-y-2">
                <p className="text-lg md:text-xl font-medium text-blue-200 tracking-wide">
                  Türkiye'nin En Hızlı
                </p>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                  e-İmza
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-300">
                    Çözümleri
                  </span>
                </h1>
              </div>

              {/* Description */}
              <p className="text-lg md:text-xl text-blue-100/90 leading-relaxed max-w-xl">
                BİLGEM/TÜBİTAK onaylı nitelikli elektronik imza sertifikalarınızı
                <strong className="text-white"> 24 saat</strong> içinde alın.
                Güvenli, hızlı ve ekonomik çözümler.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/urunler"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1952d9] font-bold rounded-2xl hover:bg-blue-50 transition-all duration-200 shadow-xl shadow-black/20 hover:-translate-y-1 text-base"
                >
                  Hemen Satın Al
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#nasil-calisir"
                  className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/40 text-white font-semibold rounded-2xl hover:bg-white/10 hover:border-white/60 transition-all duration-200 text-base backdrop-blur-sm"
                >
                  Daha Fazla Bilgi
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium text-white">BİLGEM Onaylı</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium text-white">Hızlı Teslimat</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <HeadphonesIcon className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-white">7/24 Destek</span>
                </div>
              </div>
            </div>

            {/* Right - Illustration */}
            <div className="hidden lg:flex items-center justify-center">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="wave-divider">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-20"
        >
          <path
            d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  )
}

function HeroIllustration() {
  return (
    <div className="relative w-full max-w-lg">
      {/* Main document card */}
      <div className="animate-float relative z-10 mx-auto w-72 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/30 p-6 border border-white/50">
        {/* Doc header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-[#1952d9] to-[#0ea5e9] rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="h-3 bg-slate-200 rounded-full w-28 mb-1.5" />
            <div className="h-2 bg-slate-100 rounded-full w-20" />
          </div>
        </div>

        {/* Doc lines */}
        <div className="space-y-2.5 mb-5">
          <div className="h-2 bg-slate-100 rounded-full w-full" />
          <div className="h-2 bg-slate-100 rounded-full w-5/6" />
          <div className="h-2 bg-slate-100 rounded-full w-4/5" />
          <div className="h-2 bg-slate-100 rounded-full w-full" />
          <div className="h-2 bg-slate-100 rounded-full w-3/4" />
        </div>

        {/* Signature area */}
        <div className="border-t border-dashed border-slate-200 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">Elektronik İmza</p>
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-[#1952d9]" />
                <svg width="80" height="30" viewBox="0 0 80 30" className="overflow-visible">
                  <path
                    d="M5,20 C10,5 15,25 25,15 C35,5 40,20 50,10 C60,0 65,15 75,18"
                    stroke="#1952d9"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-semibold">Onaylandı</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating stat cards */}
      <div className="absolute -top-6 -left-8 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-slate-100">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-[#1952d9]" />
        </div>
        <div>
          <p className="text-xs text-slate-400">Güvenli İmza</p>
          <p className="text-sm font-bold text-slate-800">SSL/TLS 256-bit</p>
        </div>
      </div>

      <div className="absolute -bottom-4 -right-8 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-slate-100">
        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-xs text-slate-400">Teslimat</p>
          <p className="text-sm font-bold text-slate-800">24 Saat İçinde</p>
        </div>
      </div>

      <div className="absolute top-1/2 -right-12 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-slate-100">
        <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
          <Award className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <p className="text-xs text-slate-400">Sertifika</p>
          <p className="text-sm font-bold text-slate-800">TÜBİTAK Onaylı</p>
        </div>
      </div>

      {/* Background decorative circles */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full border border-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-white/5 rounded-full border border-white/10" />
      </div>
    </div>
  )
}
