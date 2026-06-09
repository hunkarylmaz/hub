import { Link } from 'react-router-dom'
import { ArrowRight, Lock, Clock, CheckCircle } from 'lucide-react'

const avatarColors = [
  { bg: '#dbeafe', text: '#1952d9', initial: 'A' },
  { bg: '#fce7f3', text: '#be185d', initial: 'M' },
  { bg: '#dcfce7', text: '#15803d', initial: 'K' },
  { bg: '#fef9c3', text: '#854d0e', initial: 'B' },
  { bg: '#ede9fe', text: '#6d28d9', initial: 'S' },
]

export default function Hero() {
  return (
    <section className="relative bg-white overflow-hidden" style={{ paddingTop: '105px' }}>
      {/* Angled blue accent — top-right corner */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-[52%] h-[90%] pointer-events-none"
        style={{
          background: 'linear-gradient(160deg, #eef4ff 0%, #f4f7ff 60%, transparent 100%)',
          clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 0% 100%)',
        }}
      />
      {/* Subtle dot texture on the accent shape */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-[52%] h-[90%] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #1952d9 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 0% 100%)',
          opacity: 0.035,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_420px] gap-10 xl:gap-20 items-start py-16 lg:py-24">

          {/* ── Left column (60%) ── */}
          <div className="flex flex-col gap-7 max-w-2xl">

            {/* Tag */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 bg-white border border-[#1952d9]/20 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1952d9] flex-shrink-0" />
              <span className="text-[11px] font-bold text-[#1952d9] tracking-widest uppercase">
                TÜBİTAK &amp; BİLGEM Onaylı
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-0.5 leading-none">
              <h1 className="text-[52px] sm:text-[60px] lg:text-[68px] font-black tracking-[-0.03em] text-[#0f1629] leading-[1.06]">
                Elektronik<br />İmzanızı
              </h1>
              {/* Highlighted line */}
              <div className="relative inline-block pb-3">
                <span className="text-[52px] sm:text-[60px] lg:text-[68px] font-black tracking-[-0.03em] text-[#0f1629] leading-[1.06]">
                  5 Dakikada
                </span>
                {/* Wavy orange underline SVG */}
                <svg
                  aria-hidden="true"
                  className="absolute left-0 w-full"
                  style={{ bottom: '2px' }}
                  height="12"
                  viewBox="0 0 400 12"
                  fill="none"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 8C36 3, 72 11, 106 7C140 3, 176 11, 210 7C244 3, 280 11, 314 7C348 3, 378 9, 398 7"
                    stroke="#f97316"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
              <h1 className="text-[52px] sm:text-[60px] lg:text-[68px] font-black tracking-[-0.03em] text-[#0f1629] leading-[1.06]">
                Alın ve Kullanın
              </h1>
            </div>

            {/* Description */}
            <p className="text-[17px] text-[#475569] leading-[1.7] max-w-[500px]">
              BİLGEM/TÜBİTAK onaylı nitelikli elektronik imza sertifikalarınızı hızlı ve
              güvenli biçimde edinin. Devlet işlerinden kurumsal belgelere kadar her alanda
              yasal geçerliliğe sahip e-imza çözümü.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 items-center">
              <Link
                to="/urunler"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#0a2569] text-white font-bold rounded-lg hover:bg-[#0d2f7e] active:bg-[#0a2569] transition-colors duration-150 text-[15px] shadow-lg shadow-[#0a2569]/20"
              >
                Hemen Sipariş Ver
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/908508882345?text=Merhaba%2C%20e-%C4%B0mza%20sipari%C5%9Fi%20vermek%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white border-2 border-green-500 text-green-700 font-bold rounded-lg hover:bg-green-50 transition-colors duration-150 text-[15px]"
              >
                {/* WhatsApp inline SVG */}
                <svg className="w-4.5 h-4.5 flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp ile Sipariş
              </a>
            </div>

            {/* Social proof bar */}
            <div className="flex flex-wrap items-center gap-5 pt-1 border-t border-slate-100">
              {/* Avatars */}
              <div className="flex items-center">
                {avatarColors.map((av, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 select-none"
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
                <span className="ml-3 text-[13px] font-semibold text-[#0f1629]">
                  5.000+ mutlu müşteri
                </span>
              </div>
              {/* Stars */}
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[13px] text-[#475569] font-medium">4.9/5 memnuniyet</span>
              </div>
            </div>
          </div>

          {/* ── Right column — styled form mockup ── */}
          <div className="relative w-full mx-auto lg:mx-0 mt-4 lg:mt-8 flex-shrink-0">

            {/* Floating badge: BİLGEM Onaylı */}
            <div
              className="absolute z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-green-200 rounded-full shadow-md text-[11px] font-bold text-green-700"
              style={{ top: '-14px', left: '-10px' }}
            >
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              BİLGEM Onaylı
            </div>

            {/* Floating badge: Güvenli */}
            <div
              className="absolute z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-md text-[11px] font-bold text-[#475569]"
              style={{ top: '-14px', right: '-6px' }}
            >
              <Lock className="w-3.5 h-3.5 text-[#1952d9] flex-shrink-0" />
              Güvenli
            </div>

            {/* Floating badge: Teslimat */}
            <div
              className="absolute z-20 flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl shadow-lg text-[11px] font-medium text-[#475569]"
              style={{ bottom: '-16px', right: '-10px' }}
            >
              <Clock className="w-3.5 h-3.5 text-[#f97316] flex-shrink-0" />
              Ortalama&nbsp;<strong className="text-[#0f1629]">24sa</strong>&nbsp;teslimat
            </div>

            {/* Form card */}
            <div className="bg-white rounded-3xl shadow-[0_8px_56px_rgba(25,82,217,0.13)] border border-slate-100 overflow-hidden">

              {/* Card header */}
              <div className="px-6 pt-6 pb-5 bg-[#f4f7ff] border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1952d9] rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 2h8l4 4v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" fill="white" fillOpacity="0.92" />
                    <path d="M11 2l4 4h-3a1 1 0 01-1-1V2z" fill="white" fillOpacity="0.45" />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#0f1629] leading-tight">e-İmza Siparişi</p>
                  <p className="text-[11px] text-[#475569] leading-tight mt-0.5">Hızlı online başvuru</p>
                </div>
                {/* Step indicator dots */}
                <div className="ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1952d9]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                </div>
              </div>

              {/* Fake form fields */}
              <div className="px-6 py-5 space-y-4">
                {/* Field: Ad Soyad */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider">
                    Ad Soyad
                  </label>
                  <div className="relative h-10 bg-[#f8faff] rounded-lg border border-slate-200 overflow-hidden">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-20 h-2 bg-slate-200 rounded-full" />
                  </div>
                </div>
                {/* Field: E-posta */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider">
                    E-posta Adresi
                  </label>
                  <div className="relative h-10 bg-[#f8faff] rounded-lg border border-slate-200 overflow-hidden">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-28 h-2 bg-slate-200 rounded-full" />
                  </div>
                </div>
                {/* Field: Telefon */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider">
                    Telefon Numarası
                  </label>
                  <div className="relative h-10 bg-[#f8faff] rounded-lg border border-slate-200 overflow-hidden">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-24 h-2 bg-slate-200 rounded-full" />
                  </div>
                </div>
                {/* Field: Paket — select look */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider">
                    Paket Seçimi
                  </label>
                  <div className="relative h-10 bg-[#f8faff] rounded-lg border border-slate-200 flex items-center px-3 overflow-hidden">
                    <div className="w-32 h-2 bg-slate-200 rounded-full" />
                    <svg
                      className="w-3.5 h-3.5 text-slate-400 ml-auto flex-shrink-0"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* CTA button */}
                <Link
                  to="/urunler"
                  className="block w-full py-3 bg-[#1952d9] text-white text-[14px] font-bold text-center rounded-xl hover:bg-[#1445c0] active:bg-[#0f39a8] transition-colors duration-150 mt-2"
                >
                  Hemen Sipariş Ver
                </Link>

                {/* SSL line */}
                <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-[#94a3b8]">
                  <Lock className="w-3 h-3 text-[#1952d9]/60 flex-shrink-0" />
                  256-bit SSL güvenli ödeme
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Partners bar ── */}
        <div className="border-t border-slate-100 py-6">
          <div className="flex flex-wrap items-center gap-4 sm:gap-0">
            <span className="text-[10.5px] font-bold text-[#94a3b8] uppercase tracking-[0.12em] sm:mr-8 whitespace-nowrap">
              Güvenilir Partnerler
            </span>
            <div className="flex flex-wrap items-center gap-6 sm:gap-10">
              {['TÜBİTAK', 'BİLGEM', 'e-Devlet', 'EKAP', 'GİB'].map((partner) => (
                <span
                  key={partner}
                  className="text-[13px] font-bold text-slate-300 tracking-wide hover:text-slate-500 transition-colors duration-150 cursor-default select-none"
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
