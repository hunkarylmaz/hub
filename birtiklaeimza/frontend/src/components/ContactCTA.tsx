import { MessageCircle, Mail, ArrowRight, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ContactCTA() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cta-gradient" />
      <div className="absolute inset-0 hero-grid opacity-50" />

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0ea5e9]/20 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-blue-200 mb-6 border border-white/20">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Şu An Hizmetinizdeyiz
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
          Hemen e-İmzanızı
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-300">
            Alın
          </span>
        </h2>

        <p className="text-xl text-blue-100/90 mb-10 max-w-2xl mx-auto leading-relaxed">
          Sorularınız için bize ulaşın veya hemen sipariş verin.
          Uzman ekibimiz her konuda size yardımcı olmaya hazır.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <a
            href="https://wa.me/908508882345?text=Merhaba%2C%20e-%C4%B0mza%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-400 text-white font-bold rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-0.5 text-base w-full sm:w-auto justify-center"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp ile Ulaşın
          </a>
          <Link
            to="/iletisim"
            className="inline-flex items-center gap-3 px-8 py-4 border-2 border-white/40 text-white font-bold rounded-2xl hover:bg-white/10 hover:border-white/60 transition-all duration-200 text-base w-full sm:w-auto justify-center backdrop-blur-sm"
          >
            <Mail className="w-5 h-5" />
            Form Doldurun
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Contact info row */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-blue-200">
          <a
            href="tel:+908508882345"
            className="flex items-center gap-2 hover:text-white transition-colors text-sm md:text-base"
          >
            <Phone className="w-4 h-4" />
            0850 888 23 45
          </a>
          <a
            href="mailto:info@birtiklaeimza.com"
            className="flex items-center gap-2 hover:text-white transition-colors text-sm md:text-base"
          >
            <Mail className="w-4 h-4" />
            info@birtiklaeimza.com
          </a>
          <a
            href="https://wa.me/908508882345"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-white transition-colors text-sm md:text-base"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Destek
          </a>
        </div>
      </div>
    </section>
  )
}
