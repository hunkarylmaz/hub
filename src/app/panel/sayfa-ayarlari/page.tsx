import { requireBusinessContext } from "@/lib/session";
import { listWorkingHours } from "@/lib/db/repo/staff";
import { PageHeader } from "@/components/ui/PageHeader";
import { SayfaAyarlariClient } from "./SayfaAyarlariClient";

export default async function SayfaAyarlariPage() {
  const { business } = await requireBusinessContext();
  const workingHours = listWorkingHours(business.id);

  return (
    <div>
      <PageHeader title="Public Sayfa Ayarları" description="Müşterilerin gördüğü online randevu sayfanı ve işletme bilgilerini düzenle" />
      <SayfaAyarlariClient business={business} workingHours={workingHours} />
    </div>
  );
}
