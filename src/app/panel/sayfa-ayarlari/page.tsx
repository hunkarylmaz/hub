import { requireOwnerContext } from "@/lib/session";
import { listWorkingHours } from "@/lib/db/repo/staff";
import { getOrCreatePublicPageSettings } from "@/lib/db/repo/publicPageSettings";
import { listBusinessImages } from "@/lib/db/repo/businessImages";
import { PageHeader } from "@/components/ui/PageHeader";
import { SayfaAyarlariClient } from "./SayfaAyarlariClient";

export default async function SayfaAyarlariPage() {
  const { business } = await requireOwnerContext();
  const workingHours = listWorkingHours(business.id);
  const pageSettings = getOrCreatePublicPageSettings(business.id);
  const images = listBusinessImages(business.id);

  return (
    <div>
      <PageHeader title="Public Sayfa Ayarları" description="Müşterilerin gördüğü online randevu sayfanı ve işletme bilgilerini düzenle" />
      <SayfaAyarlariClient business={business} workingHours={workingHours} pageSettings={pageSettings} images={images} />
    </div>
  );
}
