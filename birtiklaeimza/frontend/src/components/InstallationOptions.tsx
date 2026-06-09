import { Monitor, Headphones, Check, Zap, ArrowRight } from 'lucide-react'

export default function InstallationOptions() {
  return (
    <section className="py-24 bg-white" id="kurulum">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Kurulum Tercihinizi{' '}
            <span className="text-gradient">Seçin</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            e-İmzanızı kendi başınıza kurabilir ya da uzman ekibimize bırakabilirsiniz
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Card 1 – Kendiniz Kurun */}
          <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-8 transition-all duration-300 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1">
            {/* Badge */}
            <span className="inline-flex items-center self-start px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 mb-6">
              Ücretsiz
            </span>

            {/* Icon + Title */}
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Monitor className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Kendiniz Kurun</h3>
                <p className="text-sm text-slate-500 mt-0.5">Adım adım rehberimizle kolayca kurulum</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 my-6" />

            {/* Features */}
            <ul className="space-y-3 flex-1 mb-8">
              {[
                'Ayrıntılı kurulum kılavuzu',
                'Video anlatım desteği',
                'Canlı sohbet desteği',
                'Tüm işletim sistemleri için rehber',
                '7/24 online destek portalı',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-green-600">Ücretsiz</span>
            </div>

            {/* CTA */}
            <button className="w-full py-3.5 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold text-sm transition-all duration-200 hover:border-[#1952d9] hover:text-[#1952d9] hover:bg-blue-50">
              Bu Seçeneği Seç
            </button>
          </div>

          {/* Card 2 – Biz Kuralım (Highlighted) */}
          <div className="relative flex flex-col rounded-2xl border-2 border-blue-400 bg-blue-50 p-8 shadow-xl shadow-blue-500/15 transition-all duration-300 hover:-translate-y-1">
            {/* Recommended ribbon */}
            <div className="absolute -top-px left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1952d9] to-[#0ea5e9]" />

            {/* Badge */}
            <span className="inline-flex items-center self-start px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white mb-6">
              Önerilen
            </span>

            {/* Icon + Title */}
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/30">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Biz Kuralım</h3>
                <p className="text-sm text-slate-600 mt-0.5">Uzman ekibimiz uzaktan bağlanıp kurulumu yapar</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-blue-200 my-6" />

            {/* Features */}
            <ul className="space-y-3 flex-1 mb-8">
              {[
                'Uzaktan bağlantı ile kurulum',
                '30 dakikada tamamlanır',
                'Sürücü ve ayar yapılandırması',
                'e-Devlet test imzası',
                'Kurulum sonrası destek garantisi',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-slate-900">+199₺</span>
              <span className="text-sm text-slate-500 ml-2">ek ücret</span>
            </div>

            {/* CTA */}
            <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1952d9] to-[#0ea5e9] text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5">
              Bu Seçeneği Seç
            </button>
          </div>
        </div>

        {/* 5 Dakikada Hazır Banner */}
        <div className="rounded-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" fill="white" />
              </div>
              <p className="text-lg font-bold text-white">
                5 Dakikada Kullanıma Hazır e-İmza
              </p>
            </div>
            <a
              href="#urunler"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold whitespace-nowrap transition-all duration-200 hover:bg-slate-800 hover:-translate-y-0.5"
            >
              Hazır Kurulu Paketi Gör
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-slate-400">
          * Kurulum hizmeti sipariş sırasında eklenebilir. Aynı iş günü içinde yapılır.
        </p>
      </div>
    </section>
  )
}
