import { listAllUsers } from "@/lib/db/repo/users";
import { listBusinesses, listBusinessUsers } from "@/lib/db/repo/businesses";
import { PageHeader } from "@/components/ui/PageHeader";
import { KullanicilarClient } from "./KullanicilarClient";

export default async function AdminUsersPage() {
  const users = listAllUsers();
  const businesses = listBusinesses();

  const businessNameByUserId = new Map<string, string>();
  for (const business of businesses) {
    businessNameByUserId.set(business.ownerUserId, business.name);
    for (const member of listBusinessUsers(business.id)) {
      if (!businessNameByUserId.has(member.userId)) businessNameByUserId.set(member.userId, business.name);
    }
  }

  const rows = users.map(({ passwordHash, ...u }) => ({ ...u, businessName: businessNameByUserId.get(u.id) ?? null }));

  return (
    <div>
      <PageHeader title="Kullanıcılar" description="Platformdaki tüm kullanıcı hesapları" />
      <KullanicilarClient users={rows} businesses={businesses.map((b) => ({ id: b.id, name: b.name }))} />
    </div>
  );
}
