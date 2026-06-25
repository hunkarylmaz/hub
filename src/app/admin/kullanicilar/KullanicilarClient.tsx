"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Pencil, Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { formatDateShortTR } from "@/lib/date";
import type { SafeUser } from "@/lib/types";
import { setUserActiveAction } from "./actions";
import { UserModal } from "./UserModal";

type UserRow = SafeUser & { businessName: string | null };

const ROLE_LABELS: Record<SafeUser["role"], string> = {
  SUPER_ADMIN: "Süper Admin",
  OWNER: "İşletme Sahibi",
  STAFF: "Çalışan",
};

const ROLE_BADGE_CLASSES: Record<SafeUser["role"], string> = {
  SUPER_ADMIN: "bg-violet-50 text-violet-700 ring-violet-200",
  OWNER: "bg-navy-50 text-navy-700 ring-navy-200",
  STAFF: "bg-amber-50 text-amber-700 ring-amber-200",
};

export function KullanicilarClient({
  users,
  businesses,
  currentUserId,
}: {
  users: UserRow[];
  businesses: { id: string; name: string }[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggleActive(user: UserRow) {
    setPendingId(user.id);
    setToggleError(null);
    startTransition(async () => {
      try {
        await setUserActiveAction(user.id, !user.isActive);
        router.refresh();
      } catch (e) {
        setToggleError(e instanceof Error ? e.message : "İşlem gerçekleştirilemedi.");
      } finally {
        setPendingId(null);
      }
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.businessName ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ad, e-posta veya işletme ara..." className="pl-9" />
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Yeni Kullanıcı Ekle
        </Button>
      </div>

      {toggleError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{toggleError}</div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={users.length === 0 ? "Henüz kullanıcı yok" : "Sonuç bulunamadı"}
          description={users.length === 0 ? "Yeni kayıtlar burada görünecek." : "Arama kriterlerinizi değiştirin."}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <th className="px-4 py-3">Kullanıcı</th>
                <th className="px-4 py-3">İletişim</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">İşletme</th>
                <th className="px-4 py-3">Kayıt Tarihi</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.fullName} size="sm" />
                      <span className="font-medium text-navy-900">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-navy-700">
                    <p>{u.email}</p>
                    {u.phone && <p className="text-xs text-navy-400">{u.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn(ROLE_BADGE_CLASSES[u.role])}>{ROLE_LABELS[u.role]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-navy-700">{u.businessName ?? "—"}</td>
                  <td className="px-4 py-3 text-navy-700">{formatDateShortTR(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn(u.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200")}>
                      {u.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingUser(u)}>
                        <Pencil className="h-3.5 w-3.5" /> Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant={u.isActive ? "danger" : "outline"}
                        loading={isPending && pendingId === u.id}
                        disabled={u.id === currentUserId}
                        title={u.id === currentUserId ? "Kendi hesabınızı pasif hale getiremezsiniz." : undefined}
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.isActive ? "Pasifleştir" : "Etkinleştir"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserModal open={creating} onClose={() => setCreating(false)} businesses={businesses} />
      <UserModal open={editingUser !== null} onClose={() => setEditingUser(null)} businesses={businesses} editUser={editingUser} />
    </div>
  );
}
