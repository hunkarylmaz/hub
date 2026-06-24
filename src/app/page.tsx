import Link from "next/link";
import type { Metadata } from "next";
import {
  CalendarCheck2,
  Globe,
  Users,
  Wallet,
  Bell,
  Building2,
  BarChart3,
  ShieldCheck,
  Check,
  ArrowRight,
  Quote,
  Star,
  Scissors,
  Sparkles as SparklesIcon,
  Stethoscope,
  Brain,
  HeartPulse,
  Dumbbell,
  Briefcase,
  GraduationCap,
  Footprints,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatCurrencyTRY } from "@/lib/utils";
import { listPlans } from "@/lib/db/repo/plans";
import { SECTORS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Randevu, Müşteri ve Ön Muhasebe Yönetimi",
};

const FEATURES = [
  {
    icon: CalendarCheck2,
    title: "Akıllı Takvim & Randevu",
    description: "Çakışmaları otomatik engelleyen, personel ve şube bazlı takvim ile randevularınızı yönetin.",
  },
  {
    icon: Globe,
    title: "Online Randevu Sayfası",
    description: "Kendi randevu linkinizle müşterileriniz 7/24 size uygun saatten online randevu alabilir.",
  },
  {
    icon: Users,
    title: "Müşteri Yönetimi (CRM)",
    description: "Müşteri geçmişi, notlar, no-show takibi ve KVKK uyumlu onay kayıtlarıyla müşterilerinizi tanıyın.",
  },
  {
    icon: Wallet,
    title: "Ön Muhasebe",
    description: "Gelir-gider takibi, kasa raporu ve e-fatura uyumlu altyapı ile finansal düzeninizi koruyun.",
  },
  {
    icon: Bell,
    title: "Bildirimler",
    description: "Randevu hatırlatmaları ve durum güncellemeleriyle müşterilerinizle bağlantıda kalın.",
  },
  {
    icon: Building2,
    title: "Çoklu Şube & Personel",
    description: "Sınırsız şube ve personel desteğiyle büyüyen işletmeniz için ölçeklenebilir bir yapı.",
  },
  {
    icon: BarChart3,
    title: "Detaylı Raporlar",
    description: "Gelir, randevu ve performans raporlarıyla işletmenizi veriye dayalı şekilde yönetin.",
  },
  {
    icon: ShieldCheck,
    title: "KVKK Uyumlu Güvenlik",
    description: "İşletmeler arası tam veri izolasyonu ve rol bazlı yetkilendirme ile verileriniz güvende.",
  },
];

const STEPS = [
  {
    title: "Kaydolun",
    description: "30 saniyede ücretsiz hesabınızı oluşturun, kredi kartı gerekmez.",
  },
  {
    title: "İşletmenizi Özelleştirin",
    description: "Hizmetlerinizi, çalışma saatlerinizi ve ekibinizi tanımlayın.",
  },
  {
    title: "Randevu Linkinizi Paylaşın",
    description: "Kendi randevu sayfanızla müşterilerinizden online randevu almaya başlayın.",
  },
];

const SECTOR_ICONS: Record<string, typeof Scissors> = {
  berber_kuafor: Scissors,
  guzellik_salonu: SparklesIcon,
  psikolog: Brain,
  klinik: Stethoscope,
  diyetisyen: HeartPulse,
  ayak_bakim: Footprints,
  spa_masaj: SparklesIcon,
  dugun_salonu: CalendarCheck2,
  etkinlik_mekani: Building2,
  spor_egitim: Dumbbell,
  danismanlik: Briefcase,
  diger: GraduationCap,
};

const TESTIMONIALS = [
  {
    quote: "Randevularımızı tek ekrandan yönetmek operasyonumuzu çok hızlandırdı. Artık hiçbir randevuyu kaçırmıyoruz.",
    name: "Elif Yılmaz",
    business: "Nova Güzellik Salonu",
  },
  {
    quote: "Online randevu sayfası sayesinde müşterilerimiz artık bizi arama zorunda kalmıyor, randevular kendiliğinden doluyor.",
    name: "Ali Çelik",
    business: "Ali Barber Studio",
  },
  {
    quote: "Hasta takibi ve hatırlatmalar sayesinde randevu kaçırma oranımız belirgin şekilde düştü.",
    name: "Dr. Arya Korkmaz",
    business: "Klinik Arya",
  },
];

const FAQS = [
  {
    question: "Rezervasyo'yu kullanmak için kredi kartı gerekiyor mu?",
    answer: "Hayır. 14 günlük ücretsiz deneme süresi için herhangi bir kredi kartı bilgisi istemiyoruz.",
  },
  {
    question: "Verilerim güvende mi?",
    answer: "Evet. Her işletmenin verileri tamamen izole tutulur, işletmeler arasında hiçbir veri paylaşımı olmaz ve KVKK'ya uygun şekilde saklanır.",
  },
  {
    question: "Hangi sektörler için uygun?",
    answer: "Berber, kuaför, güzellik salonu, klinik, psikolog, danışmanlık, düğün salonu ve randevu bazlı çalışan tüm işletmeler için uygundur.",
  },
  {
    question: "İstediğim zaman planımı değiştirebilir veya iptal edebilir miyim?",
    answer: "Evet. Abonelik panelinizden plan değişikliği ve iptal işlemlerini istediğiniz zaman yapabilirsiniz.",
  },
  {
    question: "Birden fazla şubem ve personelim olsa nasıl çalışır?",
    answer: "Planınıza bağlı olarak birden fazla şube ve personel ekleyebilir, her biri için ayrı çalışma saatleri tanımlayabilirsiniz.",
  },
];

export default async function LandingPage() {
  const plans = listPlans().filter((p) => p.isActive);

  return (
    <div className="bg-white">
      <header className="sticky top-0 z-50 border-b border-navy-100 bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold text-navy-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-white">
              <CalendarCheck2 className="h-4.5 w-4.5" />
            </span>
            Rezervasyo
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-navy-600 md:flex">
            <a href="#ozellikler" className="hover:text-navy-900">Özellikler</a>
            <a href="#nasil-calisir" className="hover:text-navy-900">Nasıl Çalışır</a>
            <a href="#fiyatlandirma" className="hover:text-navy-900">Fiyatlandırma</a>
            <a href="#sss" className="hover:text-navy-900">SSS</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/giris">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Giriş Yap</Button>
            </Link>
            <Link href="/kayit">
              <Button variant="secondary" size="sm">Ücretsiz Başla</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-brand-gradient text-white">
          <div className="absolute inset-0 bg-hero-grid opacity-30" />
          <div className="container relative z-10 py-24 text-center sm:py-32">
            <div className="mx-auto max-w-3xl animate-fade-up">
              <Badge className="bg-white/10 text-white ring-white/20">
                <SparklesIcon className="h-3.5 w-3.5" /> Türkiye'nin yeni nesil randevu platformu
              </Badge>
              <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                İşletmeniz için randevu, müşteri ve gelir yönetimi — hepsi bir arada
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
                Berber, kuaför, güzellik salonu, klinik, psikolog ve daha fazlası için tasarlanan Rezervasyo ile online
                randevularınızı alın, müşterilerinizi tanıyın, gelir-giderinizi tek panelden takip edin.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/kayit">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Ücretsiz Başla <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#ozellikler">
                  <Button size="lg" variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto">
                    Özellikleri Gör
                  </Button>
                </a>
              </div>
              <p className="mt-5 text-sm text-white/50">Kredi kartı gerekmez · 14 gün ücretsiz deneme</p>
            </div>
          </div>
        </section>

        {/* Sectors strip */}
        <section className="border-b border-navy-100 bg-surface-subtle py-10">
          <div className="container">
            <p className="text-center text-sm font-medium text-navy-400">
              Yüzlerce işletme türü için uyarlanabilir
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {SECTORS.map((sector) => {
                const Icon = SECTOR_ICONS[sector.value] ?? Briefcase;
                return (
                  <span
                    key={sector.value}
                    className="inline-flex items-center gap-1.5 rounded-full border border-navy-100 bg-white px-3.5 py-1.5 text-sm text-navy-600"
                  >
                    <Icon className="h-3.5 w-3.5 text-violet-500" /> {sector.label}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="ozellikler" className="py-20 sm:py-28">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold text-navy-900 sm:text-4xl">Tüm işletme operasyonunuz tek yerde</h2>
              <p className="mt-4 text-navy-500">
                Randevudan ön muhasebeye, müşteri ilişkilerinden raporlamaya kadar her şey Rezervasyo'da.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-navy-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="nasil-calisir" className="bg-surface-subtle py-20 sm:py-28">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold text-navy-900 sm:text-4xl">3 adımda yayında olun</h2>
              <p className="mt-4 text-navy-500">Karmaşık kurulum yok. Dakikalar içinde randevu almaya başlayın.</p>
            </div>
            <div className="mt-14 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.title} className="relative text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy-900 text-lg font-semibold text-white">
                    {i + 1}
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-navy-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 sm:py-28">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold text-navy-900 sm:text-4xl">İşletmeler Rezervasyo'yu seviyor</h2>
            </div>
            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="mt-4 h-5 w-5 text-violet-300" />
                  <p className="mt-2 text-sm leading-relaxed text-navy-700">{t.quote}</p>
                  <p className="mt-5 text-sm font-semibold text-navy-900">{t.name}</p>
                  <p className="text-xs text-navy-400">{t.business}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="fiyatlandirma" className="bg-surface-subtle py-20 sm:py-28">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold text-navy-900 sm:text-4xl">Size uygun planı seçin</h2>
              <p className="mt-4 text-navy-500">İşletmenizin büyüklüğüne göre ölçeklenen, şeffaf fiyatlandırma.</p>
            </div>
            <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-3">
              {plans.map((plan, i) => {
                const popular = i === 1;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative rounded-2xl border bg-white p-6",
                      popular ? "border-violet-300 shadow-glow" : "border-navy-100 shadow-card"
                    )}
                  >
                    {popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white ring-violet-600">
                        En Popüler
                      </Badge>
                    )}
                    <p className="text-base font-semibold text-navy-900">{plan.name}</p>
                    <p className="mt-3 text-3xl font-bold text-navy-900">
                      {formatCurrencyTRY(plan.monthlyPrice)}
                      <span className="text-sm font-medium text-navy-400">/ay</span>
                    </p>
                    <p className="text-xs text-navy-400">{formatCurrencyTRY(plan.yearlyPrice)}/yıl ödemede</p>
                    <div className="mt-5 space-y-2 border-t border-navy-50 pt-5 text-sm">
                      <div className="flex items-center gap-2 text-navy-700">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        {plan.maxStaff === null ? "Sınırsız personel" : `${plan.maxStaff} personel`}
                      </div>
                      <div className="flex items-center gap-2 text-navy-700">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        {plan.maxBranches === null ? "Sınırsız şube" : `${plan.maxBranches} şube`}
                      </div>
                      <div className="flex items-center gap-2 text-navy-700">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        {plan.maxMonthlyAppointments === null ? "Sınırsız aylık randevu" : `${plan.maxMonthlyAppointments} aylık randevu`}
                      </div>
                      {plan.hasAccounting && (
                        <div className="flex items-center gap-2 text-navy-700">
                          <Check className="h-4 w-4 shrink-0 text-emerald-600" /> Ön muhasebe
                        </div>
                      )}
                      {plan.hasAdvancedReports && (
                        <div className="flex items-center gap-2 text-navy-700">
                          <Check className="h-4 w-4 shrink-0 text-emerald-600" /> Gelişmiş raporlar
                        </div>
                      )}
                      {plan.hasSmsWhatsapp && (
                        <div className="flex items-center gap-2 text-navy-700">
                          <Check className="h-4 w-4 shrink-0 text-emerald-600" /> SMS / WhatsApp bildirimleri
                        </div>
                      )}
                    </div>
                    <Link href="/kayit" className="mt-6 block">
                      <Button variant={popular ? "secondary" : "outline"} className="w-full">
                        Ücretsiz Dene
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="sss" className="py-20 sm:py-28">
          <div className="container max-w-2xl">
            <h2 className="text-center text-3xl font-semibold text-navy-900 sm:text-4xl">Sıkça Sorulan Sorular</h2>
            <div className="mt-12 divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white shadow-card">
              {FAQS.map((faq) => (
                <details key={faq.question} className="group px-6 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-navy-900">
                    {faq.question}
                    <span className="shrink-0 text-navy-400 transition-transform group-open:rotate-45">
                      <Plus className="h-4 w-4" />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-navy-500">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden bg-brand-gradient py-20 text-center text-white sm:py-24">
          <div className="absolute inset-0 bg-hero-grid opacity-30" />
          <div className="container relative z-10">
            <h2 className="text-3xl font-semibold sm:text-4xl">İşletmenizi büyütmeye bugün başlayın</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Kurulum birkaç dakika sürer, kredi kartı gerekmez. Hemen ücretsiz hesabınızı oluşturun.
            </p>
            <Link href="/kayit" className="mt-8 inline-block">
              <Button size="lg" variant="secondary">
                Ücretsiz Hesap Oluştur <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-navy-100 bg-surface-subtle">
        <div className="container py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2 text-base font-semibold text-navy-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-white">
                  <CalendarCheck2 className="h-4.5 w-4.5" />
                </span>
                Rezervasyo
              </Link>
              <p className="mt-3 text-sm text-navy-500">
                İşletmeniz için randevu, müşteri ve ön muhasebe yönetim platformu.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">Ürün</p>
              <ul className="mt-3 space-y-2 text-sm text-navy-500">
                <li><a href="#ozellikler" className="hover:text-navy-900">Özellikler</a></li>
                <li><a href="#fiyatlandirma" className="hover:text-navy-900">Fiyatlandırma</a></li>
                <li><a href="#sss" className="hover:text-navy-900">SSS</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">Hesap</p>
              <ul className="mt-3 space-y-2 text-sm text-navy-500">
                <li><Link href="/giris" className="hover:text-navy-900">Giriş Yap</Link></li>
                <li><Link href="/kayit" className="hover:text-navy-900">Ücretsiz Kaydol</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">Yasal</p>
              <ul className="mt-3 space-y-2 text-sm text-navy-500">
                <li><Link href="/kvkk" className="hover:text-navy-900">KVKK</Link></li>
                <li><Link href="/gizlilik" className="hover:text-navy-900">Gizlilik Politikası</Link></li>
                <li><Link href="/kullanim-sartlari" className="hover:text-navy-900">Kullanım Şartları</Link></li>
              </ul>
            </div>
          </div>
          <p className="mt-10 border-t border-navy-100 pt-6 text-center text-xs text-navy-400">
            © {new Date().getFullYear()} Rezervasyo. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
