import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Monitor, Apple, Phone, MessageCircle, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AnnouncementBar from '../components/AnnouncementBar'

const sections = [
  { id: 'baslangic', label: 'Başlamadan Önce' },
  { id: 'surucu', label: 'Sürücü İndirme' },
  { id: 'windows-kurulum', label: 'Windows Kurulum' },
  { id: 'macos-kurulum', label: 'macOS Kurulum' },
  { id: 'test', label: 'e-Devlet\'te Test' },
  { id: 'sorunlar', label: 'Sık Karşılaşılan Sorunlar' },
  { id: 'yardim', label: 'Yardım' },
]

const windowsSteps = [
  {
    title: 'İndirilen sürücü dosyasını çalıştırın',
    detail: 'İndirdiğiniz setup.exe dosyasına çift tıklayın. Windows Kullanıcı Hesabı Denetimi ekranı açılırsa "Evet" veya "Allow" butonuna tıklayarak izin verin. Kurulum sihirbazı başlayacaktır.',
  },
  {
    title: 'Lisans sözleşmesini kabul edin',
    detail: 'Lisans sözleşmesini okuyun, "I accept the terms in the License Agreement" seçeneğini işaretleyin ve ardından "İleri" (Next) butonuna tıklayın.',
  },
  {
    title: 'Kurulum türü olarak "Standart" seçin',
    detail: '"Setup Type" ekranında "Standard" seçeneğini seçin. Bu seçenek çoğu kullanıcı için önerilmektedir. Ardından "İleri" butonuna tıklayın.',
  },
  {
    title: '"Kur" butonuna tıklayın',
    detail: '"Kur" (Install) butonuna tıklayın ve kurulumun tamamlanmasını bekleyin. Bu işlem birkaç dakika sürebilir. Ekranı kapatmayın.',
  },
  {
    title: 'Bilgisayarı YENİDEN BAŞLATIN',
    detail: 'Kurulum tamamlandıktan sonra bilgisayarınızı mutlaka yeniden başlatın. Yeniden başlatma olmadan sürücü doğru çalışmayabilir.',
  },
  {
    title: 'USB tokeni bilgisayara takın',
    detail: 'Yeniden başlatma sonrasında USB e-imza tokeninizi bilgisayarınızdaki herhangi bir USB portuna takın. Bilgisayar cihazı tanıyacaktır.',
  },
  {
    title: 'PIN kodu girin',
    detail: 'SafeNet Authentication Client uygulaması açılacak ve PIN kodu giriş ekranı gelecektir. Tarafınıza iletilen PIN kodunu dikkatli bir şekilde girin.',
  },
  {
    title: 'e-İmzanız kullanıma hazır!',
    detail: 'PIN kodunuz onaylandıktan sonra e-imzanız tüm uygulamalarda kullanıma hazırdır. e-Devlet, EKAP ve diğer platformlarda kullanabilirsiniz.',
  },
]

const macosSteps = [
  {
    title: 'İndirilen .pkg dosyasını çalıştırın',
    detail: 'İndirdiğiniz SafeNet .pkg dosyasına çift tıklayın. macOS güvenlik uyarısı verirse Sistem Tercihleri > Güvenlik & Gizlilik bölümünden "Yine de Aç" seçeneğini kullanın.',
  },
  {
    title: 'Kurulum sihirbazını takip edin',
    detail: '"Devam" butonuna tıklayarak kurulum sihirbazını başlatın. Lisans sözleşmesini kabul edip kurulum konumunu seçin.',
  },
  {
    title: 'Yönetici şifrenizi girin',
    detail: 'Kurulum için yönetici (admin) şifrenizi girmeniz istenecektir. macOS kullanıcı şifrenizi girin ve "Yazılımı Yükle" butonuna tıklayın.',
  },
  {
    title: 'Kurulum tamamlandığında bilgisayarı yeniden başlatın',
    detail: 'Kurulum tamamlandıktan sonra bilgisayarınızı yeniden başlatın. Bu adım sürücünün etkinleşmesi için zorunludur.',
  },
  {
    title: 'USB tokeni takın',
    detail: 'Yeniden başlatma sonrasında USB e-imza tokeninizi takın. Gerekirse USB-C adaptörü kullanın.',
  },
  {
    title: 'Güvenlik izinlerini verin',
    detail: 'macOS "Sistem Tercihleri > Güvenlik ve Gizlilik" bölümüne gidin. "Genel" sekmesinde SafeNet uygulamasına izin verin.',
  },
  {
    title: 'PIN kodunu girin',
    detail: 'SafeNet Authentication Client uygulaması açılacak ve PIN kodu ekranı gelecektir. Tarafınıza verilen PIN kodunu girin.',
  },
  {
    title: 'e-İmzanız hazır!',
    detail: 'Doğrulama sonrasında e-imzanız Safari ve Chrome gibi tarayıcılarda kullanıma hazırdır.',
  },
]

const troubleshootingItems = [
  {
    q: 'Sürücü kurulum sonrası token tanınmıyor',
    a: 'Bilgisayarı yeniden başlatın. Yeniden başlatma sürücünün etkinleşmesi için zorunludur. Sorun devam ederse tokeni farklı bir USB portuna takıp tekrar deneyin.',
  },
  {
    q: 'PIN kodu yanlış hatası alıyorum',
    a: 'PIN kodunuzu dikkatli bir şekilde giriniz. Büyük-küçük harf duyarlılığı yoktur ancak rakamları kontrol edin. Uyarı: Üst üste 5 yanlış PIN girişi yapılırsa token kalıcı olarak kilitlenir. PIN kodunuzu hatırlamıyorsanız bizimle iletişime geçin.',
  },
  {
    q: 'Tarayıcıda e-imza çalışmıyor',
    a: 'Tarayıcı eklentisinin etkin olduğundan emin olun. Chrome için chrome://extensions, Firefox için about:addons adresinden SafeNet eklentisini kontrol edin. Eklenti yoksa SafeNet Authentication Client uygulamasından yükleyin.',
  },
  {
    q: 'macOS\'ta e-imza çalışmıyor',
    a: 'Sistem Tercihleri > Güvenlik ve Gizlilik > Gizlilik sekmesine gidin. "Tam Disk Erişimi" listesine SafeNet uygulamasını ekleyin. macOS 12 Monterey ve üzeri için sürücü güncellemesi gerekebilir.',
  },
  {
    q: 'Token takılı ama görünmüyor',
    a: 'Farklı bir USB portunu deneyin. USB hub kullanıyorsanız doğrudan bilgisayar portuna takın. SafeNet Authentication Client uygulamasını yeniden açın. Sorun çözülmezse sürücüyü kaldırıp yeniden yükleyin.',
  },
  {
    q: 'e-Devlet\'te "Sertifika bulunamadı" hatası',
    a: 'SafeNet Authentication Client uygulamasının çalıştığından emin olun (görev çubuğunda simgesi görünmeli). Uygulamayı yeniden başlatın ve tokeni yeniden takın. Ardından tarayıcınızı kapatıp açarak tekrar deneyin.',
  },
]

interface AccordionItemProps {
  q: string
  a: string
  isOpen: boolean
  onToggle: () => void
}

function AccordionItem({ q, a, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <span className="font-medium text-slate-800 pr-4">{q}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#1952d9] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 bg-white border-t border-slate-100">
          <p className="text-slate-600 text-sm leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function KurulumPage() {
  const [osTab, setOsTab] = useState<'windows' | 'macos'>('windows')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const offset = 120
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AnnouncementBar />
      <Navbar />

      {/* Page Header */}
      <div className="bg-[#0a2569] text-white pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Adım Adım Rehber
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">e-İmza Kurulum Rehberi</h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              E-imzanızı bilgisayarınıza kurmak için aşağıdaki adımları takip edin. Ortalama kurulum süresi 10 dakikadır.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex gap-8 items-start">

          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-28">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">İçindekiler</p>
              <nav className="space-y-0.5">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:text-[#1952d9] hover:bg-blue-50 rounded-lg transition-colors font-medium"
                  >
                    {s.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-12">

            {/* SECTION 1: Başlamadan Önce */}
            <section id="baslangic">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#1952d9] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <h2 className="text-xl font-bold text-slate-900">Başlamadan Önce</h2>
              </div>

              {/* Warning box */}
              <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Önemli Uyarı</p>
                  <p className="text-amber-700 text-sm mt-0.5">
                    USB tokeni <strong>HENÜZ TAKMAYIN</strong>. Önce sürücüyü kurmanız gerekmektedir. Aksi halde token tanınmayabilir.
                  </p>
                </div>
              </div>

              {/* System requirements */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-semibold text-slate-800">Sistem Gereksinimleri</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {[
                    { label: 'İşletim Sistemi (Windows)', value: 'Windows 7 SP1 / 8.1 / 10 / 11 (32-bit & 64-bit)' },
                    { label: 'İşletim Sistemi (macOS)', value: 'macOS 10.15 (Catalina) ve üzeri' },
                    { label: 'Tarayıcı', value: 'Chrome 90+, Firefox 88+, Edge 90+' },
                    { label: 'USB Port', value: 'USB 2.0 veya USB 3.0' },
                    { label: 'RAM', value: 'Minimum 2 GB' },
                    { label: 'Disk Alanı', value: '500 MB boş alan' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center px-5 py-3.5">
                      <span className="w-48 text-sm font-medium text-slate-500 flex-shrink-0">{row.label}</span>
                      <span className="text-sm text-slate-800">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SECTION 2: Sürücü İndirme */}
            <section id="surucu">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#1952d9] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <h2 className="text-xl font-bold text-slate-900">Sürücü İndirme</h2>
              </div>

              {/* OS Tabs */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setOsTab('windows')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    osTab === 'windows'
                      ? 'bg-[#1952d9] text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-[#1952d9] hover:text-[#1952d9]'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  Windows
                </button>
                <button
                  onClick={() => setOsTab('macos')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    osTab === 'macos'
                      ? 'bg-[#1952d9] text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-[#1952d9] hover:text-[#1952d9]'
                  }`}
                >
                  <Apple className="w-4 h-4" />
                  macOS
                </button>
              </div>

              {osTab === 'windows' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">SafeNet Authentication Client 10.8</p>
                      <p className="text-slate-500 text-xs mt-0.5">Windows 64-bit &bull; Önerilen</p>
                    </div>
                    <a
                      href="#"
                      className="flex items-center gap-2 px-4 py-2 bg-[#1952d9] text-white text-sm font-semibold rounded-xl hover:bg-[#1442c0] transition-colors flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      İndir
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">SafeNet Authentication Client 10.8</p>
                      <p className="text-slate-500 text-xs mt-0.5">Windows 32-bit</p>
                    </div>
                    <a
                      href="#"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      İndir
                    </a>
                  </div>
                  <div className="flex gap-2 bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <span className="text-blue-500 text-sm">ℹ️</span>
                    <p className="text-sm text-blue-700">Windows 10 ve Windows 11 kullanıcıları için <strong>64-bit</strong> versiyonu önerilmektedir.</p>
                  </div>
                </div>
              )}

              {osTab === 'macos' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">SafeNet Authentication Client 10.8</p>
                      <p className="text-slate-500 text-xs mt-0.5">macOS &bull; Universal (Apple Silicon + Intel)</p>
                    </div>
                    <a
                      href="#"
                      className="flex items-center gap-2 px-4 py-2 bg-[#1952d9] text-white text-sm font-semibold rounded-xl hover:bg-[#1442c0] transition-colors flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      İndir
                    </a>
                  </div>
                  <div className="flex gap-2 bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <span className="text-amber-500 text-sm">⚠️</span>
                    <p className="text-sm text-amber-700">macOS 12 Monterey ve üzeri için sürücü güncellemesi gerekebilir. Sorun yaşarsanız bizimle iletişime geçin.</p>
                  </div>
                </div>
              )}
            </section>

            {/* SECTION 3: Windows Kurulum */}
            <section id="windows-kurulum">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#1952d9] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <h2 className="text-xl font-bold text-slate-900">Windows Kurulum Adımları</h2>
              </div>
              <div className="space-y-3">
                {windowsSteps.map((step, i) => (
                  <div key={i} className="flex gap-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1952d9]/10 text-[#1952d9] flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 mb-1">{step.title}</p>
                      <p className="text-sm text-slate-500 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 4: macOS Kurulum */}
            <section id="macos-kurulum">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#1952d9] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                <h2 className="text-xl font-bold text-slate-900">macOS Kurulum Adımları</h2>
              </div>
              <div className="space-y-3">
                {macosSteps.map((step, i) => (
                  <div key={i} className="flex gap-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1952d9]/10 text-[#1952d9] flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 mb-1">{step.title}</p>
                      <p className="text-sm text-slate-500 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 5: e-Devlet'te Test */}
            <section id="test">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#1952d9] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">5</div>
                <h2 className="text-xl font-bold text-slate-900">e-Devlet'te Test Edin</h2>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-slate-600 text-sm mb-5 leading-relaxed">
                  Kurulumun başarılı olduğunu doğrulamak için e-Devlet kapısında giriş testi yapabilirsiniz.
                </p>
                <div className="space-y-3">
                  {[
                    { step: 1, text: 'turkiye.gov.tr adresine gidin' },
                    { step: 2, text: '"Giriş Yap" butonuna tıklayın' },
                    { step: 3, text: '"e-İmza ile Giriş" seçeneğini seçin' },
                    { step: 4, text: 'USB tokeninizin bilgisayara takılı olduğundan emin olun' },
                    { step: 5, text: 'Sertifikanızı seçin ve PIN kodunuzu girin' },
                    { step: 6, text: 'Başarılı giriş → e-İmzanız doğru çalışıyor!' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        item.step === 6 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.step === 6 ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                      </div>
                      <p className={`text-sm ${item.step === 6 ? 'font-semibold text-green-700' : 'text-slate-700'}`}>
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SECTION 6: Sık Karşılaşılan Sorunlar */}
            <section id="sorunlar">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#1952d9] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">6</div>
                <h2 className="text-xl font-bold text-slate-900">Sık Karşılaşılan Sorunlar</h2>
              </div>
              <div className="space-y-3">
                {troubleshootingItems.map((item, i) => (
                  <AccordionItem
                    key={i}
                    q={item.q}
                    a={item.a}
                    isOpen={openFaq === i}
                    onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                  />
                ))}
              </div>
            </section>

            {/* SECTION 7: Yardım */}
            <section id="yardim">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#1952d9] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">7</div>
                <h2 className="text-xl font-bold text-slate-900">Yardım Lazım mı?</h2>
              </div>
              <div className="bg-gradient-to-br from-[#0a2569] to-[#1952d9] rounded-2xl p-7 text-white">
                <h3 className="text-xl font-bold mb-2">Hâlâ sorun mu yaşıyorsunuz?</h3>
                <p className="text-blue-200 mb-6 leading-relaxed">
                  Uzman teknik ekibimiz size yardımcı olmaktan memnuniyet duyar. WhatsApp veya telefon ile bize ulaşın, birlikte sorunu çözelim.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <a
                    href="https://wa.me/905503028540?text=Merhaba%2C%20e-%C4%B0mza%20kurulumu%20hakk%C4%B1nda%20yard%C4%B1m%20almak%20istiyorum."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-[#22c55e] text-white font-semibold rounded-xl hover:bg-[#16a34a] transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp ile Destek
                  </a>
                  <a
                    href="tel:+908503028540"
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-white/15 text-white font-semibold rounded-xl hover:bg-white/25 transition-colors border border-white/20"
                  >
                    <Phone className="w-5 h-5" />
                    0850 302 85 40
                  </a>
                </div>
                <div className="border-t border-white/20 pt-5">
                  <p className="text-blue-200 text-sm mb-3">
                    Kurulum yapmakta zorlanıyor musunuz? Uzaktan bağlantı ile sizin için kuralım!
                  </p>
                  <Link
                    to="/urunler"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-blue-200 transition-colors"
                  >
                    "Biz Kuralım" hizmetini inceleyin
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
