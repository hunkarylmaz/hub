import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, Lock, Clock, CheckCircle } from 'lucide-react'

const avatarColors = [
  { bg: '#dbeafe', text: '#1952d9', initial: 'A' },
  { bg: '#fce7f3', text: '#be185d', initial: 'M' },
  { bg: '#dcfce7', text: '#15803d', initial: 'K' },
  { bg: '#fef9c3', text: '#854d0e', initial: 'B' },
  { bg: '#ede9fe', text: '#6d28d9', initial: 'S' },
]

export default function Hero() {
  return (
    <section className="relative bg-[#fafbff] overflow-hidden pt-[105px]">
      {/* Angled accent shape top-right */}
      <div
        className="absolute top-0 right-0 w-[55%] h-[80%] bg-[#eef4ff] pointer-events-none"
        style={{ clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)' }}
      />
      {/* Subtle dot grid on the right panel area */}
      <div
        className="absolute top-0 right-0 w-[55%] h-[80%] pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, #1952d9 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_auto] gap-8 xl:gap-16 items-start py-14 lg:py-20">

          {/* ── Left column ── */}
          <div className="max-w-2xl space-y-8">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#1952d9]/20 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#1952d9] flex-shrink-0" />
              <span className="text-xs font-semibold text-[#1952d9] tracking-wide uppercase">
                TÜBİTAK &amp; BİLGEM Onaylı
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-1">
              <h1 className="text-5xl sm:text-6xl lg:text-[64px] font-extrabold leading-[1.08] tracking-tight text-[#0f1629]">
                Elektronik<br />İmzanızı
              </h1>
              <div className="relative inline-block">
                <span className="text-5xl sm:text-6xl lg:text-[64px] font-extrabold leading-[1.08] tracking-tight text-[#0f1629]">
                  5 Dakikada
                </span>
                {/* Wavy orange underline */}
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="10"
                  viewBox="0 0 320 10"
                  fill="none"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 6 C40 2, 80 10, 120 6 C160 2, 200 10, 240 6 C280 2, 310 8, 320 6"
                    stroke="#f97316"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-[64px] font-extrabold leading-[1.08] tracking-tight text-[#0f1629]">
                Alın ve Kullanın
              </h1>
            </div>

            {/* Description */}
            <p className="text-lg text-[#475569] leading-relaxed max-w-lg">
              BİLGEM/TÜBİTAK onaylı nitelikli elektronik imza sertifikalarınızı hızlı ve
              güvenli biçimde edinin. Devlet işlerinden kurumsal belgelere kadar her alanda
              geçerli, yasal e-imza çözümü.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/urunler"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#0a2569] text-white font-semibold rounded-lg hover:bg-[#0d2f7e] transition-colors duration-200 text-[15px] shadow-lg shadow-[#0a2569]/25"
              >
                Hemen Sipariş Ver
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/908508882345?text=Merhaba%2C%20e-%C4%B0mza%20sipari%C5%9Fi%20vermek%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white border-2 border-green-500 text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors duration-200 text-[15px]"
              >
                <MessageCircle className="w-4 h-4 text-green-600" />
                WhatsApp ile Sipariş
              </a>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center gap-5 pt-2">
              <div className="flex items-center">
                {avatarColors.map((av, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor: av.bg,
                      color: av.text,
                      marginLeft: i === 0 ? '0' : '-8px',
                      zIndex: avatarColors.length - i,
                      position: 'relative',
                    }}
                  >
                    {av.initial}
                  </div>
                ))}
                <span className="ml-3 text-sm font-semibold text-[#0f1629]">5.000+ mutlu müşteri</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-[#475569] font-medium">4.9/5 memnuniyet</span>
              </div>
            </div>
          </div>

          {/* ── Right column — styled form mockup ── */}
          <div className="relative w-full max-w-sm lg:max-w-[340px] xl:max-w-[360px] mx-auto lg:mx-0 mt-6 lg:mt-0">
            {/* Floating badge: BİLGEM */}
            <div className="absolute -top-3 -left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-green-200 rounded-full shadow-md text-xs font-semibold text-green-700">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              BİLGEM Onaylı
            </div>
            {/* Floating badge: Güvenli */}
            <div className="absolute -top-3 -right-2 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-md text-xs font-semibold text-[#475569]">
              <Lock className="w-3.5 h-3.5 text-[#1952d9]" />
              Güvenli
            </div>
            {/* Floating badge: Teslimat */}
            <div className="absolute -bottom-4 -right-4 z-20 flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl shadow-lg text-xs font-medium text-[#475569]">
              <Clock className="w-3.5 h-3.5 text-[#f97316]" />
              Ortalama <strong className="text-[#0f1629] ml-0.5">24sa</strong>&nbsp;teslimat
            </div>

            {/* Form card */}
            <div className="bg-white rounded-3xl shadow-[0_8px_48px_rgba(25,82,217,0.12)] border border-slate-100 overflow-hidden">
              {/* Card header */}
              <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1952d9] rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 2h8l4 4v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" fill="white" fillOpacity="0.9"/>
                    <path d="M11 2l4 4h-3a1 1 0 01-1-1V2z" fill="white" fillOpacity="0.5"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#0f1629]">e-İmza Siparişi</p>
                  <p className="text-[11px] text-[#475569]">Hızlı online başvuru</p>
                </div>
              </div>

              {/* Fake form fields */}
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                    Ad Soyad
                  </label>
                  <div className="h-10 bg-[#f4f7ff] rounded-lg border border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                    E-posta Adresi
                  </label>
                  <div className="h-10 bg-[#f4f7ff] rounded-lg border border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                    Telefon Numarası
                  </label>
                  <div className="h-10 bg-[#f4f7ff] rounded-lg border border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                    Paket Seçimi
                  </label>
                  <div className="h-10 bg-[#f4f7ff] rounded-lg border border-slate-200 flex items-center justify-end pr-3">
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                <Link
                  to="/urunler"
                  className="block w-full py-3 bg-[#1952d9] text-white text-sm font-bold text-center rounded-xl hover:bg-[#1445c0] transition-colors mt-2"
                >
                  Hemen Sipariş Ver
                </Link>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#475569]">
                  <Lock className="w-3 h-3 text-[#1952d9]" />
                  256-bit SSL güvenli ödeme
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Partners bar */}
        <div className="border-t border-slate-200 py-6">
          <div className="flex flex-wrap items-center gap-4 sm:gap-0">
            <span className="text-xs font-semibold text-[#475569] uppercase tracking-widest sm:mr-8 whitespace-nowrap">
              Güvenilir Partnerler
            </span>
            <div className="flex flex-wrap items-center gap-6 sm:gap-10">
              {['TÜBİTAK', 'BİLGEM', 'e-Devlet', 'EKAP', 'GİB'].map((partner) => (
                <span
                  key={partner}
                  className="text-sm font-bold text-slate-400 tracking-wide hover:text-slate-600 transition-colors cursor-default"
                >
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
