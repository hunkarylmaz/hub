import { requireBusinessContext } from "@/lib/session";
import { listCustomersWithStats } from "@/lib/db/repo/customers";
import { PageHeader } from "@/components/ui/PageHeader";
import { MusterilerClient } from "./MusterilerClient";

export default async function MusterilerPage() {
  const { business } = await requireBusinessContext();
  const customers = listCustomersWithStats(business.id);

  return (
    <div>
      <PageHeader title="Müşteriler" description="Müşteri kayıtlarını, notları ve geçmişi yönet" />
      <MusterilerClient customers={customers} />
    </div>
  );
}
