import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone, FileSignature, ChevronRight } from 'lucide-react'

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
  const isHome = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // On home page: transparent until scrolled; on other pages: always white
  const isTransparent = isHome && !isScrolled && !mobileOpen
  const navBg = isTransparent
    ? 'bg-transparent'
    : 'bg-white shadow-md'
  const logoTextColor = isTransparent ? 'text-white' : 'text-[#0a2569]'
  const logoAccentColor = isTransparent ? 'text-blue-300' : 'text-[#1952d9]'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${navBg}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              isTransparent ? 'bg-white/20' : 'bg-[#1952d9]'
            }`}>
              <FileSignature className={`w-5 h-5 ${isTransparent ? 'text-white' : 'text-white'}`} />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className={`text-xl font-bold tracking-tight transition-colors ${logoTextColor}`}>
                Bir Tıkla
              </span>
              <span className={`text-xl font-bold tracking-tight transition-colors ${logoAccentColor}`}>
                &nbsp;e-İmza
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 animated-underline
                    ${isActive
                      ? isTransparent
                        ? 'text-white bg-white/15'
                        : 'text-[#1952d9] bg-blue-50'
                      : isTransparent
                        ? 'text-white/85 hover:text-white hover:bg-white/10'
                        : 'text-slate-600 hover:text-[#1952d9] hover:bg-slate-50'
                    }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right side - phone + CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="tel:+908508882345"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isTransparent ? 'text-white/85 hover:text-white' : 'text-slate-600 hover:text-[#1952d9]'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>0850 888 23 45</span>
            </a>
            <a
              href="/urunler"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              Hemen Al
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isTransparent ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
            }`}
            aria-label="Menü"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-xl animate-slide-down">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-[#1952d9]'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#1952d9]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="pt-3 pb-1 border-t border-slate-100 space-y-3">
              <a
                href="tel:+908508882345"
                className="flex items-center gap-2 px-4 py-2.5 text-slate-600 text-sm font-medium"
              >
                <Phone className="w-4 h-4 text-[#1952d9]" />
                0850 888 23 45
              </a>
              <a
                href="/urunler"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white text-sm font-semibold rounded-xl"
              >
                Hemen Satın Al
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
