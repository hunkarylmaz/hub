import { useState, useEffect } from 'react'
import { ShoppingCart, CheckCircle2, Tag, Loader2 } from 'lucide-react'
import api from '../lib/api'
import OrderModal from './OrderModal'

interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice?: number
  category: string
  features: string[]
  popular?: boolean
  badge?: string
}

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: 'Bireysel e-İmza (1 Yıl)',
    description: 'Bireysel kullanıcılar için 1 yıl geçerli nitelikli elektronik imza sertifikası.',
    price: 299,
    originalPrice: 399,
    category: 'Bireysel',
    features: ['1 Yıl Geçerlilik', 'USB Token Dahil', 'Ücretsiz Kurulum', '7/24 Destek', 'BİLGEM Onaylı'],
    badge: 'Kampanya',
  },
  {
    id: 2,
    name: 'Bireysel e-İmza (3 Yıl)',
    description: '3 yıl geçerli bireysel nitelikli elektronik imza. En ekonomik uzun vadeli seçenek.',
    price: 599,
    originalPrice: 799,
    category: 'Bireysel',
    features: ['3 Yıl Geçerlilik', 'USB Token Dahil', 'Ücretsiz Kurulum', '7/24 Destek', 'BİLGEM Onaylı'],
    popular: true,
    badge: 'En Popüler',
  },
  {
    id: 3,
    name: 'Kurumsal e-İmza (1 Yıl)',
    description: 'Şirket unvanlı 1 yıl geçerli kurumsal nitelikli elektronik imza sertifikası.',
    price: 449,
    category: 'Kurumsal',
    features: ['1 Yıl Geçerlilik', 'Şirket Unvanlı', 'USB Token Dahil', '7/24 Destek', 'TÜBİTAK Onaylı'],
  },
  {
    id: 4,
    name: 'Kurumsal e-İmza (3 Yıl)',
    description: 'Şirket unvanlı 3 yıl geçerli kurumsal e-imza. İşletmeler için ideal çözüm.',
    price: 849,
    originalPrice: 1050,
    category: 'Kurumsal',
    features: ['3 Yıl Geçerlilik', 'Şirket Unvanlı', 'USB Token Dahil', 'Öncelikli Destek', 'TÜBİTAK Onaylı'],
    badge: 'Fırsatı Kaçırma',
  },
  {
    id: 5,
    name: 'Mobil e-İmza (1 Yıl)',
    description: 'SIM kart tabanlı 1 yıl geçerli mobil elektronik imza. USB Token gerektirmez.',
    price: 349,
    category: 'Mobil',
    features: ['1 Yıl Geçerlilik', 'SIM Kart Tabanlı', 'Token Gerekmez', 'Mobil Uyumlu', 'TÜBİTAK Onaylı'],
  },
  {
    id: 6,
    name: 'Mobil e-İmza (3 Yıl)',
    description: 'SIM kart tabanlı 3 yıl geçerli mobil elektronik imza. Her yerden imzalayın.',
    price: 749,
    originalPrice: 899,
    category: 'Mobil',
    features: ['3 Yıl Geçerlilik', 'SIM Kart Tabanlı', 'Token Gerekmez', 'Mobil Uyumlu', 'TÜBİTAK Onaylı'],
  },
]

const categories = ['Tümü', 'Bireysel', 'Kurumsal', 'Mobil']

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Tümü')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products')
        setProducts(response.data)
      } catch {
        setProducts(fallbackProducts)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filtered = activeCategory === 'Tümü'
    ? products
    : products.filter(p => p.category === activeCategory)

  return (
    <section className="py-24 bg-white" id="urunler">
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

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-[#1952d9] text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading */}
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

function ProductCard({ product, onOrder }: { product: Product; onOrder: () => void }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
        product.popular
          ? 'border-[#1952d9] shadow-xl shadow-blue-500/20'
          : 'border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10'
      }`}
    >
      {/* Popular badge */}
      {product.badge && (
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white ${
          product.popular ? 'bg-gradient-to-r from-[#1952d9] to-[#0ea5e9]' : 'bg-gradient-to-r from-orange-500 to-red-500'
        }`}>
          {product.badge}
        </div>
      )}

      {/* Popular header bar */}
      {product.popular && (
        <div className="bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] px-6 py-2 text-center">
          <p className="text-white text-xs font-semibold tracking-wide uppercase">En Çok Tercih Edilen</p>
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Name + description */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
            product.category === 'Bireysel' ? 'bg-blue-100 text-blue-700' :
            product.category === 'Kurumsal' ? 'bg-purple-100 text-purple-700' :
            'bg-green-100 text-green-700'
          }`}>
            {product.category}
          </span>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{product.name}</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{product.description}</p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-3xl font-extrabold text-slate-900">
            {product.price.toLocaleString('tr-TR')} ₺
          </span>
          {product.originalPrice && (
            <span className="text-lg text-slate-400 line-through">
              {product.originalPrice.toLocaleString('tr-TR')} ₺
            </span>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-8 flex-1">
          {product.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={onOrder}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            product.popular
              ? 'bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5'
              : 'bg-slate-900 text-white hover:bg-[#1952d9]'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Sipariş Ver
        </button>
      </div>
    </div>
  )
}
