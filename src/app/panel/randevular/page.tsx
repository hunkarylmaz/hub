import { requireBusinessContext } from "@/lib/session";
import { listAppointmentsForBusiness } from "@/lib/db/repo/appointments";
import { listServices, listStaffIdsForService } from "@/lib/db/repo/services";
import { listStaff } from "@/lib/db/repo/staff";
import { listCustomers } from "@/lib/db/repo/customers";
import { PageHeader } from "@/components/ui/PageHeader";
import { RandevularClient } from "./RandevularClient";
import type { AppointmentStatus } from "@/lib/types";

export default async function RandevularPage({
  searchParams,
}: {
  searchParams: { status?: string; staffId?: string; serviceId?: string };
}) {
  const { business } = await requireBusinessContext();

  const staff = listStaff(business.id, { onlyActive: true });
  const services = listServices(business.id, { onlyActive: true });
  const customers = listCustomers(business.id);

  const serviceStaffMap: Record<string, string[]> = {};
  for (const service of services) serviceStaffMap[service.id] = listStaffIdsForService(service.id);

  const appointments = listAppointmentsForBusiness(business.id, {
    status: (searchParams.status as AppointmentStatus) || undefined,
    staffId: searchParams.staffId || undefined,
    serviceId: searchParams.serviceId || undefined,
  });

  return (
    <div>
      <PageHeader title="Randevular" description="Tüm randevuları görüntüle, filtrele ve yönet" />
      <RandevularClient
        appointments={appointments}
        staff={staff}
        services={services}
        customers={customers}
        serviceStaffMap={serviceStaffMap}
      />
    </div>
  );
}
