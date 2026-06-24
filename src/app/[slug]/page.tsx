import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, Phone, Instagram, Globe, Star, Images } from "lucide-react";
import { findBusinessBySlug } from "@/lib/db/repo/businesses";
import { getOrCreatePublicPageSettings } from "@/lib/db/repo/publicPageSettings";
import { listServices, listCategories } from "@/lib/db/repo/services";
import { listStaff, calculateStaffEarnings } from "@/lib/db/repo/staff";
import { listBusinessImages } from "@/lib/db/repo/businessImages";
import { listReviews, getReviewStats } from "@/lib/db/repo/reviews";
import { getEligibleStaffIds } from "@/lib/availability";
import { SECTORS } from "@/lib/types";
import { initials, cn } from "@/lib/utils";
import { formatDateShortTR } from "@/lib/date";
import { BookingWidget } from "./BookingWidget";
import { ReviewForm } from "./ReviewForm";

const SECTOR_LABELS: Record<string, string> = Object.fromEntries(SECTORS.map((s) => [s.value, s.label]));

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const business = findBusinessBySlug(params.slug);
  if (!business) return {};
  return {
    title: business.name,
    description: business.description ?? `${business.name} için online randevu al.`,
  };
}

export default function PublicBookingPage({ params }: { params: { slug: string } }) {
  const business = findBusinessBySlug(params.slug);
  if (!business || business.status !== "active") notFound();

  const settings = getOrCreatePublicPageSettings(business.id);
  const services = listServices(business.id, { onlyActive: true }).filter((s) => s.isOnlineBookable);
  const categories = listCategories(business.id);
  const eligibleStaffIds = new Set<string>();
  const serviceStaffMap: Record<string, string[]> = {};
  for (const service of services) {
    const ids = getEligibleStaffIds(business.id, service.id);
    serviceStaffMap[service.id] = ids;
    ids.forEach((id) => eligibleStaffIds.add(id));
  }
  const staff = listStaff(business.id, { onlyActive: true }).filter((s) => eligibleStaffIds.has(s.id));
  const staffWithStats = staff
    .map((s) => ({ ...s, completedCount: calculateStaffEarnings(s.id).completedCount }))
    .sort((a, b) => b.completedCount - a.completedCount);
  const topStaffId = staffWithStats.length > 0 && staffWithStats[0].completedCount > 0 ? staffWithStats[0].id : null;

  const images = listBusinessImages(business.id);
  const reviewStats = getReviewStats(business.id);
  const reviews = listReviews(business.id, { onlyPublished: true });

  const description = settings.descriptionOverride || business.description;
  const contactItems: { icon: typeof MapPin; label: string; href?: string }[] = [];
  if (settings.showAddress && (business.address || business.city)) {
    contactItems.push({
      icon: MapPin,
      label: [business.address, business.district, business.city].filter(Boolean).join(", "),
    });
  }
  if (settings.showPhone && business.phone) {
    contactItems.push({ icon: Phone, label: business.phone, href: `tel:${business.phone}` });
  }
  if (business.instagram) {
    contactItems.push({ icon: Instagram, label: business.instagram, href: `https://instagram.com/${business.instagram.replace(/^@/, "")}` });
  }
  if (business.website) {
    contactItems.push({ icon: Globe, label: business.website, href: business.website });
  }

  return (
    <div className="min-h-screen bg-surface-subtle pb-16">
      <div
        className="h-36 bg-brand-gradient sm:h-48"
        style={
          business.coverUrl
            ? { backgroundImage: `url(${business.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <div className="h-full w-full bg-hero-grid opacity-30" />
      </div>

      <div className="mx-auto -mt-10 max-w-3xl px-4 sm:-mt-12 sm:px-6">
        <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-xl font-semibold text-white shadow-card sm:h-20 sm:w-20"
              style={{ backgroundColor: business.themeColor }}
            >
              {business.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={business.logoUrl} alt={business.name} className="h-full w-full object-cover" />
              ) : (
                initials(business.name) || "?"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-navy-900 sm:text-2xl">{business.name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-navy-500">
                <span>{SECTOR_LABELS[business.sector] ?? business.sector}</span>
                <span className="flex items-center gap-1 text-navy-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {reviewStats.count > 0 ? reviewStats.average.toFixed(1) : "Yeni"}
                  {reviewStats.count > 0 && ` (${reviewStats.count})`}
                </span>
              </div>
              {description && <p className="mt-2 text-sm text-navy-600">{description}</p>}
            </div>
          </div>

          {contactItems.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-navy-50 pt-4">
              {contactItems.map((item, i) => {
                const Icon = item.icon;
                const content = (
                  <span className="flex items-center gap-1.5 text-sm text-navy-600">
                    <Icon className="h-4 w-4 shrink-0 text-navy-400" />
                    {item.label}
                  </span>
                );
                return item.href ? (
                  <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-violet-600">
                    {content}
                  </a>
                ) : (
                  <span key={i}>{content}</span>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6">
          {services.length === 0 ? (
            <div className={cn("rounded-2xl border border-dashed border-navy-200 bg-white p-8 text-center text-sm text-navy-500")}>
              Bu işletme şu anda online randevu kabul etmiyor.
            </div>
          ) : (
            <BookingWidget
              slug={business.slug}
              services={services}
              categories={categories}
              staff={staff}
              serviceStaffMap={serviceStaffMap}
              settings={settings}
            />
          )}
        </div>

        {images.length > 0 && (
          <div className="mt-8 rounded-2xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-navy-900">
              <Images className="h-4 w-4 text-violet-600" /> Görseller
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img) => (
                <div key={img.id} className="h-32 w-48 shrink-0 overflow-hidden rounded-xl border border-navy-100 bg-navy-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={business.name} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {staffWithStats.length > 0 && (
          <div className="mt-8 rounded-2xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-navy-900">Ekibimiz</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {staffWithStats.map((s) => (
                <div key={s.id} className="relative rounded-xl border border-navy-100 bg-surface-subtle p-3 text-center">
                  {s.id === topStaffId && (
                    <span className="absolute -top-2 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-white shadow-card">
                      <Star className="h-2.5 w-2.5 fill-white" /> En İyi
                    </span>
                  )}
                  <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-navy-100 text-sm font-semibold text-navy-700">
                    {s.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photoUrl} alt={s.fullName} className="h-full w-full object-cover" />
                    ) : (
                      initials(s.fullName)
                    )}
                  </div>
                  <p className="mt-2 truncate text-xs font-medium text-navy-900">{s.fullName}</p>
                  {s.title && <p className="truncate text-[11px] text-navy-400">{s.title}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-navy-900">Değerlendirmeler</h2>
            {reviewStats.count > 0 && (
              <span className="flex items-center gap-1 text-sm text-navy-600">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {reviewStats.average.toFixed(1)} <span className="text-navy-400">({reviewStats.count})</span>
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-navy-500">Henüz değerlendirme yapılmamış. İlk yorumu sen yaz!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-navy-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-navy-900">{r.customerName}</p>
                    <span className="text-xs text-navy-400">{formatDateShortTR(r.createdAt)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star key={v} className={cn("h-3.5 w-3.5", v <= r.rating ? "fill-amber-400 text-amber-400" : "text-navy-200")} />
                    ))}
                  </div>
                  {r.comment && <p className="mt-1.5 text-sm text-navy-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 border-t border-navy-100 pt-6">
            <h3 className="mb-3 text-sm font-semibold text-navy-900">Sen de değerlendir</h3>
            <ReviewForm slug={business.slug} />
          </div>
        </div>
      </div>
    </div>
  );
}
