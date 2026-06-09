import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Phone, Mail, MapPin, MessageCircle,
  Facebook, Twitter, Instagram, Linkedin, Youtube,
  ChevronRight, Shield, Award
} from 'lucide-react'
import api from '../lib/api'

interface Settings {
  phone?: string
  email?: string
  address?: string
  whatsapp?: string
  facebook?: string
  twitter?: string
  instagram?: string
  linkedin?: string
  youtube?: string
  company_name?: string
  company_description?: string
}

const defaultSettings: Settings = {
  phone: '0850 302 85 40',
  email: 'info@birtiklaeimza.com',
  address: 'Maslak Mahallesi, Ahi Evran Cad. No:6, Sarıyer / İstanbul',
  whatsapp: '905503028540',
  company_name: 'Bir Tıkla e-İmza',
  company_description: 'Türkiye\'nin en hızlı ve güvenilir elektronik imza hizmet sağlayıcısı. nitelikli elektronik imza çözümleri.',
}

const quickLinks = [
  { label: 'Ana Sayfa', to: '/' },
  { label: 'Ürünlerimiz', to: '/urunler' },
  { label: 'Hakkımızda', to: '/hakkimizda' },
  { label: 'İletişim', to: '/iletisim' },
]

const serviceLinks = [
  { label: 'Bireysel e-İmza', to: '/urunler' },
  { label: 'Kurumsal e-İmza', to: '/urunler' },
  { label: 'Mobil e-İmza', to: '/urunler' },
  { label: 'Teknik Destek', to: '/iletisim' },
  { label: 'Sık Sorulan Sorular', to: '/#sss' },
]

export default function Footer() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings/public')
        setSettings({ ...defaultSettings, ...response.data })
      } catch {
        // Use defaults
      }
    }
    fetchSettings()
  }, [])

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#0a2569] text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-5">
              <img src="/logo.png" alt="Bir Tıkla e-İmza" className="h-12 w-auto mb-3" />
            </Link>
            <p className="text-blue-200 text-sm leading-relaxed mb-6">
              {settings.company_description}
            </p>

            {/* Trust badges */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-blue-200">
                <Award className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                Akredite CA / Nitelikli Onaylı
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-200">
                <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
                SSL/TLS 256-bit Güvenlik
              </div>
            </div>

            {/* Social links */}
            <div className="flex gap-3 mt-6">
              {settings.facebook && (
                <SocialLink href={settings.facebook} icon={Facebook} label="Facebook" />
              )}
              {settings.twitter && (
                <SocialLink href={settings.twitter} icon={Twitter} label="Twitter" />
              )}
              {settings.instagram && (
                <SocialLink href={settings.instagram} icon={Instagram} label="Instagram" />
              )}
              {settings.linkedin && (
                <SocialLink href={settings.linkedin} icon={Linkedin} label="LinkedIn" />
              )}
              {settings.youtube && (
                <SocialLink href={settings.youtube} icon={Youtube} label="YouTube" />
              )}
              {/* Default socials if none configured */}
              {!settings.facebook && !settings.twitter && !settings.instagram && (
                <>
                  <SocialLink href="#" icon={Facebook} label="Facebook" />
                  <SocialLink href="#" icon={Instagram} label="Instagram" />
                  <SocialLink href="#" icon={Linkedin} label="LinkedIn" />
                  <SocialLink href="#" icon={Twitter} label="Twitter" />
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">
              Hızlı Bağlantılar
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#0ea5e9] group-hover:translate-x-1 transition-transform" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">
              Hizmetlerimiz
            </h4>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#0ea5e9] group-hover:translate-x-1 transition-transform" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">
              İletişim
            </h4>
            <ul className="space-y-4">
              {settings.phone && (
                <li>
                  <a
                    href={`tel:+90${settings.phone.replace(/\D/g, '').slice(-10)}`}
                    className="flex items-start gap-3 text-sm text-blue-200 hover:text-white transition-colors group"
                  >
                    <Phone className="w-4 h-4 mt-0.5 text-[#0ea5e9] flex-shrink-0" />
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.email && (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="flex items-start gap-3 text-sm text-blue-200 hover:text-white transition-colors"
                  >
                    <Mail className="w-4 h-4 mt-0.5 text-[#0ea5e9] flex-shrink-0" />
                    {settings.email}
                  </a>
                </li>
              )}
              {settings.address && (
                <li>
                  <div className="flex items-start gap-3 text-sm text-blue-200">
                    <MapPin className="w-4 h-4 mt-0.5 text-[#0ea5e9] flex-shrink-0" />
                    <span>{settings.address}</span>
                  </div>
                </li>
              )}
              {settings.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${settings.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-green-400 hover:text-green-300 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                    WhatsApp Destek
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-blue-300">
            <p>
              © {currentYear} Bir Tıkla e-İmza. Tüm hakları saklıdır.
            </p>
            <div className="flex gap-6">
              <Link to="/gizlilik" className="hover:text-white transition-colors">
                Gizlilik Politikası
              </Link>
              <Link to="/kullanim-kosullari" className="hover:text-white transition-colors">
                Kullanım Koşulları
              </Link>
              <Link to="/kvkk" className="hover:text-white transition-colors">
                KVKK
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#1952d9] flex items-center justify-center transition-colors"
    >
      <Icon className="w-4 h-4 text-white" />
    </a>
  )
}
