import { listPlans } from "@/lib/db/repo/plans";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlanlarClient } from "./PlanlarClient";

export default async function AdminPlansPage() {
  const plans = listPlans();

  return (
    <div>
      <PageHeader title="Planlar" description="Abonelik planlarının fiyat ve limitlerini yönet" />
      <PlanlarClient plans={plans} />
    </div>
  );
}
