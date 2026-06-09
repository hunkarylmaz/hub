import { useState, useEffect } from 'react'
import {
  ShoppingCart,
  CheckCircle2,
  Tag,
  Loader2,
  Zap,
  RefreshCw,
  Stamp,
  Building2,
  PenLine,
  Wrench,
} from 'lucide-react'
import api from '../lib/api'
import OrderModal from './OrderModal'

interface Product {
  id: number
  name: string
  slug?: string
  short_desc?: string
  description: string
  price: number
  old_price?: number
  originalPrice?: number
  category: string
  features: string[]
  badge?: string
  badge_color?: string
  icon?: string
  popular?: boolean
  order_num?: number
}

// ── Category config ────────────────────────────────────────────────────────────
interface CategoryConfig {
  label: string
  accent: string          // Tailwind bg for top bar
  accentText: string      // Tailwind text
  accentLight: string     // Tailwind bg for badge pill
  badgeText: string
  iconBg: string
  iconColor: string
  ring: string            // border/ring class
  shadow: string
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  bireysel: {
    label: 'Bireysel',
    accent: 'bg-blue-600',
    accentText: 'text-blue-600',
    accentLight: 'bg-blue-100',
    badgeText: 'text-blue-700',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    ring: 'border-blue-200',
    shadow: 'hover:shadow-blue-500/10',
  },
  kurumsal: {
    label: 'Kurumsal',
    accent: 'bg-indigo-600',
    accentText: 'text-indigo-600',
    accentLight: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    ring: 'border-indigo-200',
    shadow: 'hover:shadow-indigo-500/10',
  },
  'mali-muhur': {
    label: 'Mali Mühür',
    accent: 'bg-gradient-to-r from-red-500 to-orange-500',
    accentText: 'text-red-600',
    accentLight: 'bg-red-100',
    badgeText: 'text-red-700',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    ring: 'border-red-200',
    shadow: 'hover:shadow-red-500/10',
  },
  yenileme: {
    label: 'Yenileme',
    accent: 'bg-green-600',
    accentText: 'text-green-600',
    accentLight: 'bg-green-100',
    badgeText: 'text-green-700',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    ring: 'border-green-200',
    shadow: 'hover:shadow-green-500/10',
  },
  'hazir-kurulum': {
    label: 'Hazır Kurulum',
    accent: 'bg-gradient-to-r from-amber-500 to-orange-500',
    accentText: 'text-amber-600',
    accentLight: 'bg-amber-100',
    badgeText: 'text-amber-700',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    ring: 'border-amber-300',
    shadow: 'hover:shadow-amber-500/15',
  },
  hizmet: {
    label: 'Hizmet',
    accent: 'bg-teal-600',
    accentText: 'text-teal-600',
    accentLight: 'bg-teal-100',
    badgeText: 'text-teal-700',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    ring: 'border-teal-200',
    shadow: 'hover:shadow-teal-500/10',
  },
}

const DEFAULT_CATEGORY: CategoryConfig = {
  label: 'Diğer',
  accent: 'bg-slate-500',
  accentText: 'text-slate-600',
  accentLight: 'bg-slate-100',
  badgeText: 'text-slate-700',
  iconBg: 'bg-slate-100',
  iconColor: 'text-slate-600',
  ring: 'border-slate-200',
  shadow: 'hover:shadow-slate-500/10',
}

function getCategoryConfig(category: string): CategoryConfig {
  return CATEGORY_MAP[category?.toLowerCase()] ?? DEFAULT_CATEGORY
}

// ── Icon resolver ──────────────────────────────────────────────────────────────
function ProductIcon({ icon, category, className }: { icon?: string; category: string; className?: string }) {
  const cfg = getCategoryConfig(category)
  const cls = className ?? `w-6 h-6 ${cfg.iconColor}`

  switch (icon) {
    case 'zap':        return <Zap className={cls} />
    case 'refresh':    return <RefreshCw className={cls} />
    case 'stamp':      return <Stamp className={cls} />
    case 'building':   return <Building2 className={cls} />
    case 'settings':   return <Wrench className={cls} />
    case 'signature':
    default:           return <PenLine className={cls} />
  }
}

// ── Badge color resolver ───────────────────────────────────────────────────────
function badgeClasses(badgeColor?: string): string {
  switch (badgeColor) {
    case 'green':  return 'bg-green-100 text-green-700'
    case 'red':    return 'bg-red-100 text-red-700'
    case 'orange': return 'bg-orange-100 text-orange-700'
    case 'purple': return 'bg-purple-100 text-purple-700'
    case 'blue':
    default:       return 'bg-blue-100 text-blue-700'
  }
}

// ── Fallback product list ──────────────────────────────────────────────────────
const fallbackProducts: Product[] = [
  {
    id: 1,
    name: 'Bireysel e-İmza (1 Yıl)',
    description: 'Bireysel kullanıcılar için 1 yıl geçerli nitelikli elektronik imza sertifikası.',
    price: 490,
    old_price: 650,
    category: 'bireysel',
    features: ['1 Yıl Geçerlilik', 'USB Token Dahil', 'Ücretsiz Kurulum', '7/24 Destek', 'Resmi Sertifikalı'],
    badge: 'Popüler',
    badge_color: 'blue',
    icon: 'signature',
    order_num: 1,
  },
  {
    id: 2,
    name: 'Bireysel e-İmza (3 Yıl)',
    description: '3 yıl geçerli bireysel nitelikli elektronik imza. En ekonomik uzun vadeli seçenek.',
    price: 990,
    old_price: 1350,
    category: 'bireysel',
    features: ['3 Yıl Geçerlilik', 'USB Token Dahil', 'Ücretsiz Kurulum', '7/24 Destek', 'Resmi Sertifikalı'],
    popular: true,
    badge: 'En Avantajlı',
    badge_color: 'green',
    icon: 'signature',
    order_num: 2,
  },
  {
    id: 3,
    name: 'Kurumsal e-İmza (1 Yıl)',
    description: 'Şirket unvanlı 1 yıl geçerli kurumsal nitelikli elektronik imza sertifikası.',
    price: 590,
    old_price: 750,
    category: 'kurumsal',
    features: ['1 Yıl Geçerlilik', 'Şirket Unvanlı', 'USB Token Dahil', '7/24 Destek', 'Nitelikli Onaylı'],
    icon: 'building',
    order_num: 3,
  },
  {
    id: 4,
    name: 'Kurumsal e-İmza (3 Yıl)',
    description: 'Şirket unvanlı 3 yıl geçerli kurumsal e-imza. İşletmeler için ideal çözüm.',
    price: 1190,
    old_price: 1600,
    category: 'kurumsal',
    features: ['3 Yıl Geçerlilik', 'Şirket Unvanlı', 'USB Token Dahil', 'Öncelikli Destek', 'Nitelikli Onaylı'],
    badge: 'En Avantajlı',
    badge_color: 'green',
    icon: 'building',
    order_num: 4,
  },
  {
    id: 5,
    name: 'Mali Mühür',
    description: 'Tüzel kişiler için GİB onaylı mali mühür sertifikası.',
    price: 890,
    old_price: 1100,
    category: 'mali-muhur',
    features: ['3 Yıl Geçerlilik', 'GİB Onaylı', 'e-Fatura Uyumlu', 'e-Arşiv Uyumlu', 'e-Defter Uyumlu'],
    badge: 'Zorunlu',
    badge_color: 'red',
    icon: 'stamp',
    order_num: 5,
  },
  {
    id: 6,
    name: 'e-İmza Yenileme',
    description: 'Mevcut e-imzanızı uygun fiyatla yenileyin.',
    price: 390,
    old_price: 490,
    category: 'yenileme',
    features: ['Mevcut Token ile Uyumlu', 'Hızlı Aktivasyon', '1 veya 3 Yıl Seçeneği', 'Ücretsiz Teknik Destek'],
    badge: 'Fırsatlı Fiyat',
    badge_color: 'orange',
    icon: 'refresh',
    order_num: 6,
  },
  {
    id: 7,
    name: 'Hazır Kurulu e-İmza',
    description: 'Kutudan çıktığı gibi kullanıma hazır! Uzman ekibimiz önceden yapılandırır.',
    price: 689,
    old_price: 850,
    category: 'hazir-kurulum',
    features: ['5 Dakikada Kullanıma Hazır', 'Uzman Kurulum Dahil', 'Sürücüler Önceden Yüklü', 'e-Devlet Test İmzası Yapılmış', '1 Yıl Geçerlilik', 'Öncelikli Teknik Destek', 'USB Token Dahil'],
    badge: 'Çok Satan',
    badge_color: 'orange',
    icon: 'zap',
    order_num: 7,
  },
  {
    id: 8,
    name: 'Kurulum Hizmeti',
    description: 'Uzman teknisyen uzaktan bağlanarak kurulumu tamamlar.',
    price: 199,
    old_price: 299,
    category: 'hizmet',
    features: ['Uzaktan Bağlantı ile Kurulum', 'Sürücü Yükleme ve Yapılandırma', 'e-Devlet Test İmzası', '30 Dakika İçinde Tamamlanır', 'Kurulum Sonrası Destek', 'Tüm İşletim Sistemleri'],
    badge: 'Ek Hizmet',
    badge_color: 'green',
    icon: 'settings',
    order_num: 8,
  },
]

// ── Filter tab definitions ─────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: 'Tümü', label: 'Tümü' },
  { key: 'bireysel', label: 'Bireysel' },
  { key: 'kurumsal', label: 'Kurumsal' },
  { key: 'mali-muhur', label: 'Mali Mühür' },
  { key: 'yenileme', label: 'Yenileme' },
  { key: 'hazir-kurulum', label: 'Hazır Kurulum' },
  { key: 'hizmet', label: 'Hizmet' },
]

// ── Main component ─────────────────────────────────────────────────────────────
export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Tümü')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products')
        // Normalise API response: map old_price / originalPrice, parse features JSON if needed
        const normalised: Product[] = (response.data as Product[]).map((p) => ({
          ...p,
          old_price: p.old_price ?? p.originalPrice,
          features: Array.isArray(p.features)
            ? p.features
            : (() => { try { return JSON.parse(p.features as unknown as string) } catch { return [] } })(),
        }))
        setProducts(normalised)
      } catch {
        setProducts(fallbackProducts)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filtered =
    activeCategory === 'Tümü'
      ? products
      : products.filter((p) => (p.category ?? '').toLowerCase() === activeCategory.toLowerCase())

  return (
    <section className="py-24 bg-slate-50" id="urunler">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-sm font-semibold text-[#1952d9] mb-4">
            <Tag className="w-4 h-4" />
            Ürün ve Fiyatlar
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            e-İmza <span className="text-gradient">Paketleri</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            İhtiyacınıza en uygun e-imza paketini seçin. Hızlı teslimat ve uygun fiyat garantisiyle.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeCategory === tab.key
                  ? 'bg-[#1952d9] text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-[#1952d9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#1952d9] animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOrder={() => setSelectedProduct(product)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-16 text-slate-400 text-sm">
                Bu kategoride ürün bulunamadı.
              </div>
            )}
          </div>
        )}
      </div>

      {selectedProduct && (
        <OrderModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  )
}

// ── Product card ───────────────────────────────────────────────────────────────
function ProductCard({ product, onOrder }: { product: Product; onOrder: () => void }) {
  const cfg = getCategoryConfig(product.category)
  const isHazir = (product.category ?? '').toLowerCase() === 'hazir-kurulum'
  const isPopular = product.popular || isHazir

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl border bg-white overflow-hidden
        transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
        ${isPopular ? `border-2 ${cfg.ring} shadow-lg ${cfg.shadow}` : `border-slate-200 ${cfg.shadow}`}
        ${isHazir ? 'lg:scale-[1.02]' : ''}
      `}
    >
      {/* Top accent bar */}
      <div className={`h-1.5 w-full ${cfg.accent}`} />

      {/* "5 DAKİKADA HAZIR" ribbon for hazir-kurulum */}
      {isHazir && (
        <div className="absolute top-4 left-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-r-full shadow-md flex items-center gap-1">
          <Zap className="w-3 h-3 fill-white" />
          5 Dakikada Hazır
        </div>
      )}

      {/* Badge (top-right) */}
      {product.badge && !isHazir && (
        <div
          className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${badgeClasses(product.badge_color)}`}
        >
          {product.badge}
        </div>
      )}
      {product.badge && isHazir && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
          {product.badge}
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Icon + category chip */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl ${cfg.iconBg} flex items-center justify-center ${isHazir ? 'mt-5' : ''}`}>
            <ProductIcon icon={product.icon} category={product.category} />
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${cfg.accentLight} ${cfg.badgeText}`}>
            {getCategoryConfig(product.category).label}
          </span>
        </div>

        {/* Name + description */}
        <h3 className="text-xl font-bold text-slate-900 mb-1">{product.name}</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-5">
          {product.short_desc ?? product.description}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-5">
          <span className={`text-3xl font-extrabold ${isHazir ? 'text-amber-600' : 'text-slate-900'}`}>
            {product.price.toLocaleString('tr-TR')} ₺
          </span>
          {(product.old_price ?? product.originalPrice) && (
            <span className="text-base text-slate-400 line-through">
              {(product.old_price ?? product.originalPrice)!.toLocaleString('tr-TR')} ₺
            </span>
          )}
          {(product.old_price ?? product.originalPrice) && (
            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              %{Math.round((1 - product.price / (product.old_price ?? product.originalPrice)!) * 100)} indirim
            </span>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-8 flex-1">
          {product.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
              <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${cfg.accentText}`} />
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={onOrder}
          className={`
            w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200
            flex items-center justify-center gap-2
            ${isHazir
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5'
              : isPopular
                ? 'bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5'
                : 'bg-slate-900 text-white hover:bg-[#1952d9]'
            }
          `}
        >
          <ShoppingCart className="w-4 h-4" />
          Sipariş Ver
        </button>
      </div>
    </div>
  )
}
