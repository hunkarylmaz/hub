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
      {/* Top info bar */}
      <div className="bg-[#0a2569] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-9">
            <div className="flex items-center gap-4 text-xs text-blue-200">
              <a
                href="tel:+908508882345"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>0850 888 23 45</span>
              </a>
              <span className="text-blue-700 select-none">|</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span>Pazartesi–Cumartesi 09:00–18:00</span>
              </span>
            </div>
            <a
              href="https://wa.me/908508882345?text=Merhaba%2C%20e-%C4%B0mza%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors font-medium"
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp ile Ulaşın
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div
        className={`bg-white transition-shadow duration-300 ${
          isScrolled ? 'shadow-[0_1px_12px_rgba(0,0,0,0.08)]' : 'border-b border-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              {/* Inline SVG logo — document with pen */}
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <rect width="36" height="36" rx="9" fill="#1952d9" />
                <path
                  d="M10 9h11l5 5v13a1 1 0 01-1 1H10a1 1 0 01-1-1V10a1 1 0 011-1z"
                  fill="white"
                  fillOpacity="0.9"
                />
                <path d="M21 9l5 5h-4a1 1 0 01-1-1V9z" fill="white" fillOpacity="0.5" />
                <path d="M13 16h10M13 19h7" stroke="#1952d9" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="24" cy="25" r="5" fill="#0ea5e9" />
                <path
                  d="M22.5 25.5l1.2 1.2 2-2.4"
                  stroke="white"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex items-baseline leading-none">
                <span className="text-[17px] font-bold tracking-tight text-[#0f1629]">Bir Tıkla</span>
                <span className="text-[17px] font-bold tracking-tight text-[#1952d9]">&nbsp;e-İmza</span>
              </div>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md group
                      ${isActive ? 'text-[#1952d9]' : 'text-[#475569] hover:text-[#0f1629]'}`}
                  >
                    {link.label}
                    <span
                      className={`absolute bottom-0 left-4 right-4 h-0.5 bg-[#1952d9] rounded-full transition-transform duration-200 origin-left
                        ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                    />
                  </Link>
                )
              })}
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href="https://wa.me/908508882345?text=Merhaba%2C%20e-%C4%B0mza%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
              <Link
                to="/urunler"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1952d9] text-white text-sm font-semibold rounded-lg hover:bg-[#1445c0] transition-colors duration-200"
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
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp ile Ulaşın
                </a>
                <Link
                  to="/urunler"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#1952d9] text-white text-sm font-semibold rounded-lg hover:bg-[#1445c0] transition-colors"
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
