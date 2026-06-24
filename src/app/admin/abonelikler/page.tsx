import { listAllSubscriptionsWithBusiness, listPlans } from "@/lib/db/repo/plans";
import { PageHeader } from "@/components/ui/PageHeader";
import { AbonelikleClient } from "./AbonelikleClient";

export default async function AdminSubscriptionsPage() {
  const subscriptions = listAllSubscriptionsWithBusiness();
  const plans = listPlans();

  return (
    <div>
      <PageHeader title="Abonelikler" description="Tüm işletmelerin abonelik durumunu yönet" />
      <AbonelikleClient subscriptions={subscriptions} plans={plans} />
    </div>
  );
}
