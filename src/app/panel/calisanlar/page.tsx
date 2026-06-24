import { requireOwnerContext } from "@/lib/session";
import { listStaff } from "@/lib/db/repo/staff";
import { listServices, listServiceIdsForStaff } from "@/lib/db/repo/services";
import { PageHeader } from "@/components/ui/PageHeader";
import { CalisanlarClient } from "./CalisanlarClient";

export default async function CalisanlarPage() {
  const { business } = await requireOwnerContext();

  const staff = listStaff(business.id);
  const services = listServices(business.id);

  const staffServiceMap: Record<string, string[]> = {};
  for (const member of staff) staffServiceMap[member.id] = listServiceIdsForStaff(member.id);

  return (
    <div>
      <PageHeader title="Çalışanlar" description="Ekibini, çalışma saatlerini ve hizmet yetkinliklerini yönet" />
      <CalisanlarClient staff={staff} services={services} staffServiceMap={staffServiceMap} />
    </div>
  );
}
