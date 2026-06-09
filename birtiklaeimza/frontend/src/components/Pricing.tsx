import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, ArrowRight, Loader2, Zap } from 'lucide-react'
import api from '../lib/api'
import OrderModal from './OrderModal'

interface PricingPlan {
  id: number
  name: string
  price: number
  period: string
  description: string
  features: { text: string; included: boolean }[]
  popular?: boolean
  badge?: string
  cta?: string
}

const fallbackPlans: PricingPlan[] = [
  {
    id: 1,
    name: 'Başlangıç',
    price: 299,
    period: 'yıl',
    description: 'Bireysel kullanıcılar için temel e-imza çözümü.',
    features: [
      { text: '1 Yıl Geçerlilik', included: true },
      { text: 'USB Token Dahil', included: true },
      { text: 'BİLGEM Onaylı', included: true },
      { text: 'E-posta Desteği', included: true },
      { text: 'Telefon Desteği', included: false },
      { text: 'Öncelikli Kurulum', included: false },
      { text: 'Uzaktan Kurulum Desteği', included: false },
    ],
    cta: 'Hemen Al',
  },
  {
    id: 2,
    name: 'Profesyonel',
    price: 599,
    period: 'yıl',
    description: 'Bireysel ve KOBİ\'ler için 3 yıllık premium çözüm.',
    features: [
      { text: '3 Yıl Geçerlilik', included: true },
      { text: 'USB Token Dahil', included: true },
      { text: 'BİLGEM/TÜBİTAK Onaylı', included: true },
      { text: 'E-posta Desteği', included: true },
      { text: 'Telefon Desteği', included: true },
      { text: 'Öncelikli Kurulum', included: true },
      { text: 'Uzaktan Kurulum Desteği', included: false },
    ],
    popular: true,
    badge: 'En Popüler',
    cta: 'Hemen Al',
  },
  {
    id: 3,
    name: 'Kurumsal',
    price: 849,
    period: 'yıl',
    description: 'Şirketler ve profesyoneller için tam kapsamlı çözüm.',
    features: [
      { text: '3 Yıl Geçerlilik', included: true },
      { text: 'USB Token Dahil', included: true },
      { text: 'TÜBİTAK Onaylı Kurumsal', included: true },
      { text: 'E-posta Desteği', included: true },
      { text: 'Telefon Desteği', included: true },
      { text: 'Öncelikli Kurulum', included: true },
      { text: 'Uzaktan Kurulum Desteği', included: true },
    ],
    cta: 'Teklif Al',
  },
]

export default function Pricing() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null)

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await api.get('/pricing')
        setPlans(response.data)
      } catch {
        setPlans(fallbackPlans)
      } finally {
        setLoading(false)
      }
    }
    fetchPricing()
  }, [])

  return (
    <section className="py-24 bg-white" id="fiyatlar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-sm font-semibold text-[#1952d9] mb-4">
            <Zap className="w-4 h-4" />
            Fiyatlandırma
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Şeffaf <span className="text-gradient">Fiyatlarımız</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            İhtiyacınıza en uygun planı seçin. Gizli ücret yok, ekstra masraf yok.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#1952d9] animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                onSelect={() => setSelectedPlan(plan)}
              />
            ))}
          </div>
        )}

        {/* Note */}
        <p className="text-center text-sm text-slate-400 mt-10">
          Tüm fiyatlara KDV dahildir. Fatura talep edebilirsiniz.
          <a href="/iletisim" className="text-[#1952d9] hover:underline ml-1">
            Özel fiyat için iletişime geçin →
          </a>
        </p>
      </div>

      {selectedPlan && (
        <OrderModal
          product={selectedPlan}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </section>
  )
}

function PricingCard({ plan, onSelect }: { plan: PricingPlan; onSelect: () => void }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
        plan.popular
          ? 'shadow-2xl shadow-blue-500/25 border-2 border-[#1952d9]'
          : 'border border-slate-200 hover:shadow-xl hover:border-blue-200'
      }`}
    >
      {/* Popular header */}
      {plan.popular && (
        <div className="bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] py-2 text-center">
          <p className="text-white text-xs font-bold tracking-widest uppercase">
            ⭐ {plan.badge}
          </p>
        </div>
      )}

      <div className={`p-8 flex flex-col flex-1 ${plan.popular ? 'bg-gradient-to-b from-[#f0f5ff] to-white' : 'bg-white'}`}>
        {/* Plan name */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
          <p className="text-slate-500 text-sm">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-8">
          <span className="text-5xl font-extrabold text-slate-900">
            {plan.price.toLocaleString('tr-TR')}
          </span>
          <span className="text-slate-500 font-medium">₺</span>
          <span className="text-slate-400 text-sm">/ {plan.period}</span>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 flex-1">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              {feature.included ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-slate-300 flex-shrink-0" />
              )}
              <span className={feature.included ? 'text-slate-700' : 'text-slate-400'}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={onSelect}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            plan.popular
              ? 'bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5'
              : 'border-2 border-slate-200 text-slate-700 hover:border-[#1952d9] hover:text-[#1952d9]'
          }`}
        >
          {plan.cta || 'Hemen Al'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
