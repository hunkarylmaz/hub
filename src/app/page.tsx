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
  Gem,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LogoMark } from "@/components/brand/Logo";
import { PricingSection } from "@/components/marketing/PricingSection";
import { HeroPreview } from "@/components/marketing/HeroPreview";
import { Reveal } from "@/components/marketing/Reveal";
import { listPlans } from "@/lib/db/repo/plans";
import { listDirectoryBusinesses } from "@/lib/db/repo/businesses";
import { getReviewStats } from "@/lib/db/repo/reviews";
import { SECTORS } from "@/lib/types";
import { initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Randevu, Müşteri ve Ön Muhasebe Yönetimi",
};

export const dynamic = "force-dynamic";

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
  tirnak_estetik: Gem,
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

const SECTOR_LABELS: Record<string, string> = Object.fromEntries(SECTORS.map((s) => [s.value, s.label]));

export default async function LandingPage() {
  const plans = listPlans().filter((p) => p.isActive);
  const featuredBusinesses = listDirectoryBusinesses().slice(0, 6);

  return (
    <div className="bg-white">
      <header className="sticky top-0 z-50 border-b border-navy-100 bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold text-navy-900">
            <LogoMark className="h-8 w-8" />
            Rezervasyo
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-navy-600 md:flex">
            <Link href="/isletmeler" className="hover:text-navy-900">İşletmeler</Link>
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
            <HeroPreview />
          </div>
        </section>

        {/* Sectors strip */}
        <section className="border-b border-navy-100 bg-surface-subtle py-10">
          <div className="container">
            <Reveal>
              <p className="text-center text-sm font-medium text-navy-400">
                Yüzlerce işletme türü için uyarlanabilir
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {SECTORS.map((sector, i) => {
                  const Icon = SECTOR_ICONS[sector.value] ?? Briefcase;
                  return (
                    <span
                      key={sector.value}
                      className="inline-flex items-center gap-1.5 rounded-full border border-navy-100 bg-white px-3.5 py-1.5 text-sm text-navy-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-card"
                      style={{ transitionDelay: `${i * 25}ms` }}
                    >
                      <Icon className="h-3.5 w-3.5 text-violet-500" /> {sector.label}
                    </span>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Features */}
        <section id="ozellikler" className="py-20 sm:py-28">
          <div className="container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold text-navy-900 sm:text-4xl">Tüm işletme operasyonunuz tek yerde</h2>
              <p className="mt-4 text-navy-500">
                Randevudan ön muhasebeye, müşteri ilişkilerinden raporlamaya kadar her şey Rezervasyo'da.
              </p>
            </Reveal>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 60}>
                  <div className="group h-full rounded-2xl border border-navy-100 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white">
                      <feature.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-navy-900">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-navy-500">{feature.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="nasil-calisir" className="bg-surface-subtle py-20 sm:py-28">
          <div className="container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold text-navy-900 sm:text-4xl">3 adımda yayında olun</h2>
              <p className="mt-4 text-navy-500">Karmaşık kurulum yok. Dakikalar içinde randevu almaya başlayın.</p>
            </Reveal>
            <div className="mt-14 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <Reveal key={step.title} delay={i * 100} className="relative text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy-900 text-lg font-semibold text-white shadow-glow">
                    {i + 1}
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-navy-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">{step.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 sm:py-28">
          <div className="container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold text-navy-900 sm:text-4xl">İşletmeler Rezervasyo'yu seviyor</h2>
            </Reveal>
            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delay={i * 80}>
                  <div className="h-full rounded-2xl border border-navy-100 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <Quote className="mt-4 h-5 w-5 text-violet-300" />
                    <p className="mt-2 text-sm leading-relaxed text-navy-700">{t.quote}</p>
                    <p className="mt-5 text-sm font-semibold text-navy-900">{t.name}</p>
                    <p className="text-xs text-navy-400">{t.business}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Featured businesses */}
        {featuredBusinesses.length > 0 && (
          <section className="bg-surface-subtle py-20 sm:py-28">
            <div className="container">
              <Reveal className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-semibold text-navy-900 sm:text-4xl">Platformumuzdaki işletmeleri keşfedin</h2>
                <p className="mt-4 text-navy-500">
                  Yemeksepeti'nin restoranları ve menülerini listelemesi gibi, biz de işletmeleri ve hizmetlerini
                  listeliyoruz — böylece bulunma oranınız artıyor.
                </p>
              </Reveal>
              <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredBusinesses.map((b, i) => {
                  const stats = getReviewStats(b.id);
                  return (
                    <Reveal key={b.id} delay={i * 60}>
                      <Link
                        href={`/${b.slug}`}
                        className="group block h-full overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
                      >
                        <div
                          className="h-24 bg-brand-gradient"
                          style={
                            b.coverUrl
                              ? { backgroundImage: `url(${b.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                              : undefined
                          }
                        />
                        <div className="p-5">
                          <div className="flex items-start gap-3">
                            <div
                              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-semibold text-white"
                              style={{ backgroundColor: b.themeColor }}
                            >
                              {b.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={b.logoUrl} alt={b.name} className="h-full w-full object-cover" />
                              ) : (
                                initials(b.name) || "?"
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-base font-semibold text-navy-900 group-hover:text-violet-600">{b.name}</h3>
                              <p className="text-xs text-navy-400">{SECTOR_LABELS[b.sector] ?? b.sector}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-navy-500">
                            {(b.city || b.district) && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {[b.district, b.city].filter(Boolean).join(", ")}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              {stats.count > 0 ? stats.average.toFixed(1) : "Yeni"}
                              {stats.count > 0 && ` (${stats.count})`}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
              <div className="mt-12 text-center">
                <Link href="/isletmeler">
                  <Button variant="outline" size="lg">
                    Tüm işletmeleri görüntüle <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Pricing */}
        <PricingSection plans={plans} />

        {/* FAQ */}
        <section id="sss" className="py-20 sm:py-28">
          <div className="container max-w-2xl">
            <Reveal>
              <h2 className="text-center text-3xl font-semibold text-navy-900 sm:text-4xl">Sıkça Sorulan Sorular</h2>
            </Reveal>
            <Reveal delay={100} className="mt-12 divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white shadow-card">
              <>
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
              </>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden bg-brand-gradient py-20 text-center text-white sm:py-24">
          <div className="absolute inset-0 bg-hero-grid opacity-30" />
          <div
            className="absolute -left-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-violet-500/20 blur-3xl animate-float-slow"
            aria-hidden
          />
          <div
            className="absolute -right-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-navy-300/10 blur-3xl animate-float"
            aria-hidden
          />
          <Reveal className="container relative z-10">
            <h2 className="text-3xl font-semibold sm:text-4xl">İşletmenizi büyütmeye bugün başlayın</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Kurulum birkaç dakika sürer, kredi kartı gerekmez. Hemen ücretsiz hesabınızı oluşturun.
            </p>
            <Link href="/kayit" className="mt-8 inline-block">
              <Button size="lg" variant="secondary">
                Ücretsiz Hesap Oluştur <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-navy-100 bg-surface-subtle">
        <div className="container py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2 text-base font-semibold text-navy-900">
                <LogoMark className="h-8 w-8" />
                Rezervasyo
              </Link>
              <p className="mt-3 text-sm text-navy-500">
                İşletmeniz için randevu, müşteri ve ön muhasebe yönetim platformu.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">Ürün</p>
              <ul className="mt-3 space-y-2 text-sm text-navy-500">
                <li><Link href="/isletmeler" className="hover:text-navy-900">İşletmeler</Link></li>
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
