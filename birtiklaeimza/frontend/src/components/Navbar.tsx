import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone, Clock, MessageCircle } from 'lucide-react'

const navLinks = [
  { label: 'Ana Sayfa', to: '/' },
  { label: 'Ürünler', to: '/urunler' },
  { label: 'Hakkımızda', to: '/hakkimizda' },
  { label: 'İletişim', to: '/iletisim' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* ── Top info bar ── */}
      <div className="bg-[#0a2569]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-9">
            {/* Left: phone + hours */}
            <div className="flex items-center gap-1 text-[11px] font-medium text-blue-200/90">
              <a
                href="tel:+908508882345"
                className="flex items-center gap-1.5 hover:text-white transition-colors duration-150 pr-3"
              >
                <Phone className="w-3 h-3 opacity-70" />
                <span>0850 888 23 45</span>
              </a>
              <span className="text-blue-600 select-none px-1 font-light">|</span>
              <span className="flex items-center gap-1.5 pl-1">
                <Clock className="w-3 h-3 opacity-70" />
                <span>Pazartesi–Cumartesi 09:00–18:00</span>
              </span>
            </div>
            {/* Right: WhatsApp */}
            <a
              href="https://wa.me/908508882345?text=Merhaba%2C%20e-%C4%B0mza%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-[#22c55e] hover:text-[#4ade80] transition-colors duration-150"
            >
              {/* WhatsApp icon SVG */}
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp ile Ulaşın
            </a>
          </div>
        </div>
      </div>

      {/* ── Main nav bar ── */}
      <div
        className={`bg-white border-b border-slate-100 transition-shadow duration-300 ${
          isScrolled ? 'shadow-[0_2px_16px_rgba(0,0,0,0.07)]' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <svg
                width="34"
                height="34"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <rect width="36" height="36" rx="8" fill="#1952d9" />
                <path
                  d="M9.5 8.5h10.5l5.5 5.5v13a1 1 0 01-1 1H9.5a1 1 0 01-1-1v-17.5a.5.5 0 01.5-.5z"
                  fill="white"
                  fillOpacity="0.92"
                />
                <path d="M20 8.5l5.5 5.5h-4a1.5 1.5 0 01-1.5-1.5V8.5z" fill="white" fillOpacity="0.45" />
                <path d="M12.5 16h11M12.5 19.5h7.5" stroke="#1952d9" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="24.5" cy="25.5" r="5" fill="#0ea5e9" />
                <path
                  d="M22.8 25.7l1.3 1.3 2.2-2.6"
                  stroke="white"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex items-baseline leading-none">
                <span className="text-[16px] font-bold tracking-tight text-[#0f1629]">Bir Tıkla</span>
                <span className="text-[16px] font-bold tracking-tight text-[#1952d9]">&nbsp;e-İmza</span>
              </div>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-4 py-2 text-[13.5px] font-medium transition-colors duration-150 group
                      ${isActive ? 'text-[#1952d9]' : 'text-[#475569] hover:text-[#0f1629]'}`}
                  >
                    {link.label}
                    {/* Animated underline */}
                    <span
                      className={`absolute bottom-0 left-4 right-4 h-[1.5px] bg-[#1952d9] rounded-full transition-transform duration-200 origin-left
                        ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                    />
                  </Link>
                )
              })}
            </nav>

            {/* Desktop CTA area */}
            <div className="hidden md:flex items-center gap-2.5">
              <a
                href="https://wa.me/908508882345?text=Merhaba%2C%20e-%C4%B0mza%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors duration-150"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              <Link
                to="/urunler"
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#1952d9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1445c0] active:bg-[#0f39a8] transition-colors duration-150"
              >
                Hemen Al
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-[#475569] hover:bg-slate-50 transition-colors"
              aria-label="Menü"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white animate-slide-down">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-0.5">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors
                      ${isActive ? 'text-[#1952d9] bg-blue-50' : 'text-[#475569] hover:text-[#0f1629] hover:bg-slate-50'}`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <div className="pt-3 pb-1 border-t border-slate-100 space-y-2">
                <a
                  href="https://wa.me/908508882345?text=Merhaba%2C%20e-%C4%B0mza%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp ile Ulaşın
                </a>
                <Link
                  to="/urunler"
                  className="flex items-center justify-center w-full py-2.5 bg-[#1952d9] text-white text-sm font-semibold rounded-lg hover:bg-[#1445c0] transition-colors"
                >
                  Hemen Satın Al
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
