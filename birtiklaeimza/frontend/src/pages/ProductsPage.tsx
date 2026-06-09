import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, ShoppingCart, CheckCircle2, X, Loader2, Tag, Filter } from 'lucide-react'
import AnnouncementBar from '../components/AnnouncementBar'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import OrderModal from '../components/OrderModal'
import api from '../lib/api'

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
  longDescription?: string
  validityYears?: number
  tokenType?: string
}

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: 'Bireysel e-İmza (1 Yıl)',
    description: 'Bireysel kullanıcılar için 1 yıl geçerli nitelikli elektronik imza sertifikası.',
    longDescription: 'Türkiye\'de yasal geçerliliği olan, BİLGEM/TÜBİTAK tarafından onaylı nitelikli elektronik imza (NES) sertifikası. E-devlet işlemleri, sözleşmeler ve tüm resmi belgeler için kullanabilirsiniz. USB Token dahildir, sürücü kurulumu ve aktivasyon desteği ücretsiz sağlanır.',
    price: 299,
    originalPrice: 399,
    category: 'Bireysel',
    features: ['1 Yıl Geçerlilik', 'USB Token Dahil', 'Ücretsiz Kurulum', '7/24 Destek', 'BİLGEM Onaylı'],
    badge: 'Kampanya',
    validityYears: 1,
    tokenType: 'USB Token',
  },
  {
    id: 2,
    name: 'Bireysel e-İmza (3 Yıl)',
    description: '3 yıl geçerli bireysel nitelikli elektronik imza. En ekonomik uzun vadeli seçenek.',
    longDescription: '3 yıl boyunca kesintisiz kullanabileceğiniz bireysel e-imza çözümü. Uzun vadeli kullanımlarda %33 tasarruf sağlar. Tüm bireysel işlemler için geçerlidir.',
    price: 599,
    originalPrice: 799,
    category: 'Bireysel',
    features: ['3 Yıl Geçerlilik', 'USB Token Dahil', 'Ücretsiz Kurulum', '7/24 Destek', 'BİLGEM Onaylı'],
    popular: true,
    badge: 'En Popüler',
    validityYears: 3,
    tokenType: 'USB Token',
  },
  {
    id: 3,
    name: 'Kurumsal e-İmza (1 Yıl)',
    description: 'Şirket unvanlı 1 yıl geçerli kurumsal nitelikli elektronik imza sertifikası.',
    longDescription: 'Şirket unvanınızın da imzada görüneceği kurumsal e-imza çözümü. Ticaret sicil kayıtlı firmalar için uygundur. İhale, sözleşme ve tüm kurumsal işlemlerde kullanabilirsiniz.',
    price: 449,
    category: 'Kurumsal',
    features: ['1 Yıl Geçerlilik', 'Şirket Unvanlı', 'USB Token Dahil', '7/24 Destek', 'TÜBİTAK Onaylı'],
    validityYears: 1,
    tokenType: 'USB Token',
  },
  {
    id: 4,
    name: 'Kurumsal e-İmza (3 Yıl)',
    description: 'Şirket unvanlı 3 yıl geçerli kurumsal e-imza. İşletmeler için ideal çözüm.',
    longDescription: 'İşletmeniz için en ekonomik kurumsal e-imza çözümü. 3 yıl boyunca tüm kurumsal işlemlerde, ihalelerde ve sözleşmelerde kullanabilirsiniz. Öncelikli teknik destek dahildir.',
    price: 849,
    originalPrice: 1050,
    category: 'Kurumsal',
    features: ['3 Yıl Geçerlilik', 'Şirket Unvanlı', 'USB Token Dahil', 'Öncelikli Destek', 'TÜBİTAK Onaylı'],
    badge: 'Fırsatı Kaçırma',
    validityYears: 3,
    tokenType: 'USB Token',
  },
  {
    id: 5,
    name: 'Mobil e-İmza (1 Yıl)',
    description: 'SIM kart tabanlı 1 yıl geçerli mobil elektronik imza. USB Token gerektirmez.',
    longDescription: 'Telefon SIM kartınıza yüklenen ve USB Token gerektirmeyen modern e-imza çözümü. Akıllı telefon veya tablet üzerinden dilediğiniz yerden imzalayın. Operatör desteği gereklidir.',
    price: 349,
    category: 'Mobil',
    features: ['1 Yıl Geçerlilik', 'SIM Kart Tabanlı', 'Token Gerekmez', 'Mobil Uyumlu', 'TÜBİTAK Onaylı'],
    validityYears: 1,
    tokenType: 'SIM Kart',
  },
  {
    id: 6,
    name: 'Mobil e-İmza (3 Yıl)',
    description: 'SIM kart tabanlı 3 yıl geçerli mobil elektronik imza. Her yerden imzalayın.',
    longDescription: '3 yıl boyunca mobil cihazınızdan imzalama yapabilirsiniz. Yolculukta, toplantıda veya ofis dışında da belgelerinizi kolayca imzalayın.',
    price: 749,
    originalPrice: 899,
    category: 'Mobil',
    features: ['3 Yıl Geçerlilik', 'SIM Kart Tabanlı', 'Token Gerekmez', 'Mobil Uyumlu', 'TÜBİTAK Onaylı'],
    validityYears: 3,
    tokenType: 'SIM Kart',
  },
]

const categories = ['Tümü', 'Bireysel', 'Kurumsal', 'Mobil']
const sortOptions = [
  { value: 'default', label: 'Varsayılan' },
  { value: 'price-asc', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'price-desc', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'popular', label: 'Popülerlik' },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Tümü')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
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

  const filtered = products
    .filter(p => activeCategory === 'Tümü' || p.category === activeCategory)
    .filter(p =>
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'popular') return (b.popular ? 1 : 0) - (a.popular ? 1 : 0)
      return 0
    })

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faff]">
      <AnnouncementBar />
      <Navbar />

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-[#0a2569] to-[#1952d9] pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-blue-200 mb-4 border border-white/20">
            <Tag className="w-4 h-4" />
            Ürün Kataloğu
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">e-İmza Ürünleri</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            İhtiyacınıza uygun e-imza çözümünü bulun. Hızlı teslimat ve rekabetçi fiyatlarla.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Search + Filter bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ürün ara..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#1952d9] focus:ring-2 focus:ring-[#1952d9]/20 outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#1952d9] outline-none text-sm text-slate-700 bg-white"
            >
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                showFilters ? 'border-[#1952d9] text-[#1952d9] bg-blue-50' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtrele
            </button>
          </div>
        </div>

        {/* Category filters */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-[#1952d9] text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{filtered.length}</span> ürün bulundu
          </p>
          {(activeCategory !== 'Tümü' || search) && (
            <button
              onClick={() => { setActiveCategory('Tümü'); setSearch('') }}
              className="text-sm text-[#1952d9] hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Filtreleri temizle
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-[#1952d9] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-700 mb-2">Ürün bulunamadı</p>
            <p className="text-slate-400 text-sm">Farklı anahtar kelimeler veya kategoriler deneyin.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onOrder={() => setSelectedProduct(product)}
                onDetail={() => setDetailProduct(product)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {selectedProduct && (
        <OrderModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onOrder={() => { setSelectedProduct(detailProduct); setDetailProduct(null) }}
        />
      )}
    </div>
  )
}

function ProductCard({
  product,
  onOrder,
  onDetail,
}: {
  product: Product
  onOrder: () => void
  onDetail: () => void
}) {
  return (
    <div
      className={`relative flex flex-col bg-white rounded-2xl border transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
        product.popular
          ? 'border-[#1952d9] shadow-xl shadow-blue-500/15'
          : 'border-slate-200 hover:border-blue-200 hover:shadow-lg'
      }`}
    >
      {product.badge && (
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white z-10 ${
          product.popular ? 'bg-gradient-to-r from-[#1952d9] to-[#0ea5e9]' : 'bg-gradient-to-r from-orange-500 to-red-500'
        }`}>
          {product.badge}
        </div>
      )}
      {product.popular && (
        <div className="bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] px-6 py-1.5 text-center">
          <p className="text-white text-xs font-semibold tracking-wide">En Çok Tercih Edilen</p>
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
          product.category === 'Bireysel' ? 'bg-blue-100 text-blue-700' :
          product.category === 'Kurumsal' ? 'bg-purple-100 text-purple-700' :
          'bg-green-100 text-green-700'
        }`}>
          {product.category}
        </span>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{product.name}</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">{product.description}</p>
        <div className="flex items-baseline gap-2 mb-5">
          <span className="text-3xl font-extrabold text-slate-900">
            {product.price.toLocaleString('tr-TR')} ₺
          </span>
          {product.originalPrice && (
            <span className="text-slate-400 line-through text-base">
              {product.originalPrice.toLocaleString('tr-TR')} ₺
            </span>
          )}
        </div>
        <ul className="space-y-2 mb-6">
          {product.features.slice(0, 4).map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button
            onClick={onOrder}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              product.popular
                ? 'bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-blue-500/30'
                : 'bg-slate-900 text-white hover:bg-[#1952d9]'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Sipariş Ver
          </button>
          <button
            onClick={onDetail}
            className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:border-[#1952d9] hover:text-[#1952d9] transition-colors"
          >
            Detay
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductDetailModal({
  product,
  onClose,
  onOrder,
}: {
  product: Product
  onClose: () => void
  onOrder: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-slate-900">
              {product.price.toLocaleString('tr-TR')} ₺
            </span>
            {product.originalPrice && (
              <span className="text-xl text-slate-400 line-through">
                {product.originalPrice.toLocaleString('tr-TR')} ₺
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              product.category === 'Bireysel' ? 'bg-blue-100 text-blue-700' :
              product.category === 'Kurumsal' ? 'bg-purple-100 text-purple-700' :
              'bg-green-100 text-green-700'
            }`}>{product.category}</span>
          </div>

          {/* Description */}
          {product.longDescription && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Ürün Hakkında</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{product.longDescription}</p>
            </div>
          )}

          {/* Specs */}
          <div className="grid grid-cols-2 gap-4">
            {product.validityYears && (
              <div className="bg-[#f8faff] rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Geçerlilik Süresi</p>
                <p className="font-bold text-slate-800">{product.validityYears} Yıl</p>
              </div>
            )}
            {product.tokenType && (
              <div className="bg-[#f8faff] rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Token Tipi</p>
                <p className="font-bold text-slate-800">{product.tokenType}</p>
              </div>
            )}
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Özellikler</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={onOrder}
            className="w-full py-4 bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Sipariş Ver
          </button>
        </div>
      </div>
    </div>
  )
}
