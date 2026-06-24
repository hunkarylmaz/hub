import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, Phone, Instagram, Globe } from "lucide-react";
import { findBusinessBySlug } from "@/lib/db/repo/businesses";
import { getOrCreatePublicPageSettings } from "@/lib/db/repo/publicPageSettings";
import { listServices, listCategories } from "@/lib/db/repo/services";
import { listStaff } from "@/lib/db/repo/staff";
import { getEligibleStaffIds } from "@/lib/availability";
import { SECTORS } from "@/lib/types";
import { initials, cn } from "@/lib/utils";
import { BookingWidget } from "./BookingWidget";

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
              <p className="text-sm text-navy-500">{SECTOR_LABELS[business.sector] ?? business.sector}</p>
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
      </div>
    </div>
  );
}
