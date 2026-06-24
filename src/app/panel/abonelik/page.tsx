import { requireBusinessContext } from "@/lib/session";
import { listPlans, findSubscriptionByBusiness } from "@/lib/db/repo/plans";
import { PageHeader } from "@/components/ui/PageHeader";
import { AbonelikClient } from "./AbonelikClient";

export default async function AbonelikPage() {
  const { business } = await requireBusinessContext();
  const plans = listPlans();
  const subscription = findSubscriptionByBusiness(business.id);

  return (
    <div>
      <PageHeader title="Abonelik" description="Plan ve abonelik durumunu yönet" />
      <AbonelikClient plans={plans} subscription={subscription} />
    </div>
  );
}
