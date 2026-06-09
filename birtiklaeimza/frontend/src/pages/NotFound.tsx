import { Link } from 'react-router-dom'
import { Home, ArrowLeft, FileSignature, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f8faff] to-white px-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 mb-12">
        <div className="w-10 h-10 rounded-xl bg-[#1952d9] flex items-center justify-center">
          <FileSignature className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-[#0a2569]">Bir Tıkla</span>
        <span className="text-xl font-bold text-[#1952d9]">e-İmza</span>
      </Link>

      {/* 404 Visual */}
      <div className="text-center max-w-lg">
        <div className="relative mb-8 inline-block">
          <span className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-[#1952d9]/20 to-[#0ea5e9]/20 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-[#1952d9]" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
          Sayfa Bulunamadı
        </h1>
        <p className="text-slate-500 text-lg mb-8 leading-relaxed">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          Ana sayfaya dönerek devam edebilirsiniz.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
          >
            <Home className="w-5 h-5" />
            Ana Sayfaya Dön
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:border-[#1952d9] hover:text-[#1952d9] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Geri Dön
          </button>
        </div>
      </div>

      {/* Bottom links */}
      <div className="mt-16 flex flex-wrap justify-center gap-6 text-sm text-slate-400">
        <Link to="/urunler" className="hover:text-[#1952d9] transition-colors">Ürünler</Link>
        <Link to="/hakkimizda" className="hover:text-[#1952d9] transition-colors">Hakkımızda</Link>
        <Link to="/iletisim" className="hover:text-[#1952d9] transition-colors">İletişim</Link>
      </div>
    </div>
  )
}
