import { listAllUsers } from "@/lib/db/repo/users";
import { listBusinesses } from "@/lib/db/repo/businesses";
import { PageHeader } from "@/components/ui/PageHeader";
import { KullanicilarClient } from "./KullanicilarClient";

export default async function AdminUsersPage() {
  const users = listAllUsers();
  const businesses = listBusinesses();
  const businessByOwnerId = new Map(businesses.map((b) => [b.ownerUserId, b]));

  const rows = users.map(({ passwordHash, ...u }) => ({ ...u, businessName: businessByOwnerId.get(u.id)?.name ?? null }));

  return (
    <div>
      <PageHeader title="Kullanıcılar" description="Platformdaki tüm kullanıcı hesapları" />
      <KullanicilarClient users={rows} />
    </div>
  );
}
