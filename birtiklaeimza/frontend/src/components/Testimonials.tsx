import { useState, useEffect } from 'react'
import { Star, Quote, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../lib/api'

interface Testimonial {
  id: number
  name: string
  company: string
  role?: string
  text: string
  rating: number
  avatar?: string
}

const fallbackTestimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Ahmet Yılmaz',
    company: 'Yılmaz Hukuk Bürosu',
    role: 'Avukat',
    text: 'Bir Tıkla e-İmza ile işlemlerimi çok daha hızlı hallediyorum. Kurulum kolaylığı ve 7/24 destek hizmeti gerçekten mükemmel. Kesinlikle tavsiye ederim.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Zeynep Kaya',
    company: 'KayaTech Yazılım A.Ş.',
    role: 'Genel Müdür',
    text: 'Şirketimizde kurumsal e-imza ihtiyacımızı hızla karşıladılar. Teslimat gerçekten 24 saat içinde oldu. Fiyat/performans açısından piyasanın en iyi seçeneği.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Mehmet Demir',
    company: 'Demir Muhasebe',
    role: 'Serbest Muhasebeci',
    text: 'Mali müşavir olarak e-imzaya ihtiyacım vardı. Süreç çok basit ve hızlıydı. Teknik destek ekibi kurulumda bana çok yardımcı oldu.',
    rating: 5,
  },
  {
    id: 4,
    name: 'Fatma Şahin',
    company: 'Şahin İnşaat',
    role: 'İK Müdürü',
    text: 'Tüm personelimizin e-imza işlemlerini bu platform üzerinden yaptık. Toplu alımlarda özel indirim sağladılar. Çok profesyonel bir hizmet.',
    rating: 4,
  },
  {
    id: 5,
    name: 'Ali Öztürk',
    company: 'Bireysel Kullanıcı',
    role: 'Mühendis',
    text: 'E-devlet işlemleri için aldım, son derece memnunum. Web sitesi çok kullanışlı ve sipariş süreci gayet kolay. Kesinlikle tekrar alacağım.',
    rating: 5,
  },
  {
    id: 6,
    name: 'Selin Arslan',
    company: 'Arslan Danışmanlık',
    role: 'Danışman',
    text: 'Müşterilerime de Bir Tıkla e-İmza\'yı öneriyorum. Güvenilir, hızlı ve uygun fiyatlı. Piyasadaki en iyi hizmet sağlayıcılarından biri.',
    rating: 5,
  },
]

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const perPage = 3

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await api.get('/testimonials')
        setTestimonials(response.data)
      } catch {
        setTestimonials(fallbackTestimonials)
      } finally {
        setLoading(false)
      }
    }
    fetchTestimonials()
  }, [])

  const totalPages = Math.ceil(testimonials.length / perPage)
  const visible = testimonials.slice(page * perPage, (page + 1) * perPage)

  return (
    <section className="py-24 bg-[#f8faff]" id="yorumlar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-sm font-semibold text-[#1952d9] mb-4">
            <Star className="w-4 h-4 fill-current" />
            Müşteri Yorumları
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Müşterilerimiz Ne <span className="text-gradient">Diyor?</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            50.000'den fazla memnun müşterimizin deneyimlerini okuyun.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#1952d9] animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-10">
              {visible.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#1952d9] hover:text-[#1952d9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        i === page ? 'bg-[#1952d9]' : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#1952d9] hover:text-[#1952d9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const initials = testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Quote icon */}
      <Quote className="w-8 h-8 text-blue-100 mb-4 fill-current" />

      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'}`}
          />
        ))}
      </div>

      {/* Text */}
      <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
        "{testimonial.text}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1952d9] to-[#0ea5e9] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{testimonial.name}</p>
          <p className="text-xs text-slate-400">
            {testimonial.role && `${testimonial.role}, `}{testimonial.company}
          </p>
        </div>
      </div>
    </div>
  )
}
