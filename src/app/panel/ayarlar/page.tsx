import { requireBusinessContext } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { AyarlarClient } from "./AyarlarClient";

export default async function AyarlarPage() {
  const { user } = await requireBusinessContext();

  return (
    <div>
      <PageHeader title="Ayarlar" description="Hesap bilgilerini ve şifreni yönet" />
      <AyarlarClient user={user} />
    </div>
  );
}
