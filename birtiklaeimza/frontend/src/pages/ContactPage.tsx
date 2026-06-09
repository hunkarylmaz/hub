import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle2, Loader2 } from 'lucide-react'
import AnnouncementBar from '../components/AnnouncementBar'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../lib/api'

interface ContactForm {
  fullName: string
  email: string
  phone: string
  subject: string
  message: string
}

const contactInfo = [
  {
    icon: Phone,
    title: 'Telefon',
    lines: ['0850 888 23 45', 'Pazartesi - Cuma: 09:00 - 18:00'],
    href: 'tel:+908508882345',
    color: 'bg-blue-50',
    iconColor: 'text-[#1952d9]',
  },
  {
    icon: Mail,
    title: 'E-posta',
    lines: ['info@birtiklaeimza.com', 'destek@birtiklaeimza.com'],
    href: 'mailto:info@birtiklaeimza.com',
    color: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    lines: ['0850 888 23 45', '7 Gün 24 Saat Aktif'],
    href: 'https://wa.me/908508882345',
    color: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    icon: MapPin,
    title: 'Adres',
    lines: ['Maslak Mahallesi, Ahi Evran Cad. No:6', 'Sarıyer / İstanbul'],
    color: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
]

const subjects = [
  'Ürün ve Fiyat Bilgisi',
  'Sipariş Takibi',
  'Teknik Destek',
  'Kurumsal Çözümler',
  'Şikâyet ve Geri Bildirim',
  'Diğer',
]

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Lütfen zorunlu alanları doldurun.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/contacts', form)
      setSuccess(true)
      setForm({ fullName: '', email: '', phone: '', subject: '', message: '' })
    } catch {
      setError('Mesajınız gönderilemedi. Lütfen tekrar deneyin veya bizi arayın.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar />
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0a2569] to-[#1952d9] pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-blue-200 mb-4 border border-white/20">
            <MessageCircle className="w-4 h-4" />
            İletişim
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Bize Ulaşın</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Sorularınız için bize ulaşın. Uzman ekibimiz size yardımcı olmaya hazır.
          </p>
        </div>
      </div>

      <main className="flex-1 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Contact info cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, i) => {
              const Icon = info.icon
              const content = (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-100 p-6 hover:border-blue-200 hover:shadow-lg transition-all group"
                >
                  <div className={`w-12 h-12 ${info.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${info.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{info.title}</h3>
                  {info.lines.map((line, j) => (
                    <p key={j} className={`text-sm ${j === 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                      {line}
                    </p>
                  ))}
                </div>
              )

              if (info.href) {
                return (
                  <a key={i} href={info.href} target={info.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="block">
                    {content}
                  </a>
                )
              }
              return content
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* Contact Form */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Mesaj Gönderin</h2>
              <p className="text-slate-500 text-sm mb-8">En kısa sürede size dönüş yapacağız.</p>

              {success ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Mesajınız İletildi!</h3>
                  <p className="text-slate-500 mb-6">
                    En kısa sürede size dönüş yapacağız. Acil durumlarda 0850 888 23 45 numaralı hattımızı arayabilirsiniz.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="px-6 py-3 bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white font-semibold rounded-xl"
                  >
                    Yeni Mesaj Gönder
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Ad Soyad <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Adınız Soyadınız"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1952d9] focus:ring-2 focus:ring-[#1952d9]/20 outline-none transition-all text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="05XX XXX XX XX"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1952d9] focus:ring-2 focus:ring-[#1952d9]/20 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      E-posta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="ornek@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1952d9] focus:ring-2 focus:ring-[#1952d9]/20 outline-none transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Konu
                    </label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1952d9] focus:ring-2 focus:ring-[#1952d9]/20 outline-none transition-all text-sm bg-white text-slate-700"
                    >
                      <option value="">Konu seçin...</option>
                      {subjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Mesajınız <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Mesajınızı yazın..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1952d9] focus:ring-2 focus:ring-[#1952d9]/20 outline-none transition-all text-sm resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Mesaj Gönder
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Map + Working hours */}
            <div className="space-y-6">
              {/* Map placeholder */}
              <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm bg-[#f8faff] h-72 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">Harita</p>
                  <p className="text-slate-400 text-xs mt-1">Maslak, Sarıyer / İstanbul</p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#1952d9]" />
                  </div>
                  <h3 className="font-bold text-slate-900">Çalışma Saatleri</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { days: 'Pazartesi - Cuma', hours: '09:00 - 18:00', active: true },
                    { days: 'Cumartesi', hours: '10:00 - 16:00', active: true },
                    { days: 'Pazar', hours: 'Kapalı', active: false },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-slate-600">{row.days}</span>
                      <span className={`text-sm font-semibold ${row.active ? 'text-green-600' : 'text-red-500'}`}>
                        {row.hours}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-xl flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                  <p className="text-xs text-green-700 font-medium">
                    WhatsApp desteği 7/24 aktif
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
