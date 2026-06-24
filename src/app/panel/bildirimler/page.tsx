import { requireBusinessContext } from "@/lib/session";
import { listNotificationsForBusiness } from "@/lib/db/repo/notifications";
import { PageHeader } from "@/components/ui/PageHeader";
import { BildirimlerClient } from "./BildirimlerClient";

export default async function BildirimlerPage() {
  const { business } = await requireBusinessContext();
  const notifications = listNotificationsForBusiness(business.id);

  return (
    <div>
      <PageHeader title="Bildirimler" description="İşletmenle ilgili son hareketler ve hatırlatmalar" />
      <BildirimlerClient notifications={notifications} />
    </div>
  );
}
