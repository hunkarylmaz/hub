import { requireBusinessContext } from "@/lib/session";
import { listCategories, listServices, listStaffIdsForService } from "@/lib/db/repo/services";
import { listStaff } from "@/lib/db/repo/staff";
import { PageHeader } from "@/components/ui/PageHeader";
import { HizmetlerClient } from "./HizmetlerClient";

export default async function HizmetlerPage() {
  const { business } = await requireBusinessContext();

  const categories = listCategories(business.id);
  const services = listServices(business.id);
  const staff = listStaff(business.id, { onlyActive: true });

  const serviceStaffMap: Record<string, string[]> = {};
  for (const service of services) serviceStaffMap[service.id] = listStaffIdsForService(service.id);

  return (
    <div>
      <PageHeader title="Hizmetler" description="Sunulan hizmetleri, kategorileri ve fiyatları yönet" />
      <HizmetlerClient categories={categories} services={services} staff={staff} serviceStaffMap={serviceStaffMap} />
    </div>
  );
}
