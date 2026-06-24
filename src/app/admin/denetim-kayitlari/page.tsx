import { listAuditLogs } from "@/lib/db/repo/auditLogs";
import { PageHeader } from "@/components/ui/PageHeader";
import { DenetimKayitlariClient } from "./DenetimKayitlariClient";

export default async function AdminAuditLogPage() {
  const logs = listAuditLogs(300);

  return (
    <div>
      <PageHeader title="Denetim Kayıtları" description="Platform genelindeki son işlemler" />
      <DenetimKayitlariClient logs={logs} />
    </div>
  );
}
