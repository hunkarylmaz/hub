import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Search, Star } from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { listDirectoryBusinesses, listDirectoryCities } from "@/lib/db/repo/businesses";
import { listServices } from "@/lib/db/repo/services";
import { getReviewStats } from "@/lib/db/repo/reviews";
import { SECTORS } from "@/lib/types";
import { initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "İşletmeler | Rezervasyo",
  description: "Bölgenizdeki işletmeleri keşfedin, hizmetleri inceleyin ve online randevu alın.",
};

export const dynamic = "force-dynamic";

const SECTOR_LABELS: Record<string, string> = Object.fromEntries(SECTORS.map((s) => [s.value, s.label]));

export default function IsletmelerPage({
  searchParams,
}: {
  searchParams: { q?: string; sehir?: string; sektor?: string };
}) {
  const filters = {
    query: searchParams.q || undefined,
    city: searchParams.sehir || undefined,
    sector: searchParams.sektor || undefined,
  };
  const businesses = listDirectoryBusinesses(filters);
  const cities = listDirectoryCities();

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <main>
        <section className="border-b border-navy-100 bg-surface-subtle py-12 sm:py-16">
          <div className="container">
            <h1 className="text-3xl font-semibold text-navy-900 sm:text-4xl">İşletmeleri Keşfedin</h1>
            <p className="mt-3 max-w-xl text-navy-500">
              Bölgenizdeki işletmeleri inceleyin, değerlendirmelerini okuyun ve online randevunuzu hemen alın.
            </p>
            <form className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]" action="/isletmeler" method="get">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy-700">Hizmet veya işletme ara</label>
                <Input name="q" defaultValue={filters.query} placeholder="Örn. saç kesimi, manikür..." />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy-700">Şehir</label>
                <Select name="sehir" defaultValue={filters.city ?? ""} className="sm:w-44">
                  <option value="">Tüm şehirler</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy-700">Sektör</label>
                <Select name="sektor" defaultValue={filters.sector ?? ""} className="sm:w-52">
                  <option value="">Tüm sektörler</option>
                  {SECTORS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full sm:w-auto">
                  <Search className="h-4 w-4" /> Ara
                </Button>
              </div>
            </form>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="container">
            <p className="mb-6 text-sm text-navy-500">{businesses.length} işletme bulundu</p>
            {businesses.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Sonuç bulunamadı"
                description="Farklı bir arama terimi, şehir veya sektör deneyin."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {businesses.map((b) => {
                  const stats = getReviewStats(b.id);
                  const services = listServices(b.id, { onlyActive: true }).filter((s) => s.isOnlineBookable);
                  return (
                    <Link
                      key={b.id}
                      href={`/${b.slug}`}
                      className="group block overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
                    >
                      <div
                        className="h-28 bg-brand-gradient"
                        style={
                          b.coverUrl
                            ? { backgroundImage: `url(${b.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                            : undefined
                        }
                      />
                      <div className="p-5">
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-semibold text-white"
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

                        {services.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {services.slice(0, 3).map((s) => (
                              <span key={s.id} className="rounded-full bg-navy-50 px-2.5 py-1 text-xs text-navy-600">
                                {s.name}
                              </span>
                            ))}
                            {services.length > 3 && (
                              <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs text-navy-400">+{services.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
