import { listBusinesses } from "@/lib/db/repo/businesses";
import { listAllSubscriptionsWithBusiness, listPlans } from "@/lib/db/repo/plans";
import { PageHeader } from "@/components/ui/PageHeader";
import { IsletmelerClient } from "./IsletmelerClient";

export default async function AdminBusinessesPage() {
  const businesses = listBusinesses();
  const subscriptions = listAllSubscriptionsWithBusiness();
  const plans = listPlans();

  const planById = new Map(plans.map((p) => [p.id, p]));
  const subByBusiness = new Map(subscriptions.map((s) => [s.businessId, s]));

  const rows = businesses.map((biz) => {
    const sub = subByBusiness.get(biz.id) ?? null;
    const plan = sub ? planById.get(sub.planId) ?? null : null;
    return { business: biz, subscription: sub, plan };
  });

  return (
    <div>
      <PageHeader title="İşletmeler" description="Platformdaki tüm işletmeleri görüntüle ve yönet" />
      <IsletmelerClient rows={rows} plans={plans} />
    </div>
  );
}
