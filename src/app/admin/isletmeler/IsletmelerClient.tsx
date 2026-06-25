"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, ExternalLink, Pencil, Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateShortTR } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Business, Plan, Subscription } from "@/lib/types";
import { SECTORS, SUBSCRIPTION_STATUS_LABELS } from "@/lib/types";
import { setBusinessStatusAction } from "./actions";
import { BusinessModal } from "./BusinessModal";

const SECTOR_LABELS: Record<string, string> = Object.fromEntries(SECTORS.map((s) => [s.value, s.label]));

type Row = {
  business: Business;
  subscription: (Subscription & { businessName: string; businessSlug: string }) | null;
  plan: Plan | null;
};

const SUBSCRIPTION_BADGE_CLASSES: Record<Subscription["status"], string> = {
  trial: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  past_due: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  cancelled: "bg-navy-50 text-navy-600 ring-1 ring-inset ring-navy-200",
  suspended: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

export function IsletmelerClient({ rows, plans }: { rows: Row[]; plans: Plan[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.business.name.toLowerCase().includes(q) ||
        r.business.slug.toLowerCase().includes(q) ||
        (r.business.city ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  function handleToggleStatus(businessId: string, current: Business["status"]) {
    setPendingId(businessId);
    startTransition(async () => {
      try {
        await setBusinessStatusAction(businessId, current === "active" ? "inactive" : "active");
        router.refresh();
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İşletme, slug veya şehir ara..." className="pl-9" />
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Yeni İşletme Ekle
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={rows.length === 0 ? "Henüz işletme yok" : "Sonuç bulunamadı"}
          description={rows.length === 0 ? "Yeni kayıtlar burada görünecek." : "Arama kriterlerinizi değiştirin."}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <th className="px-4 py-3">İşletme</th>
                <th className="px-4 py-3">Sektör / Şehir</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Abonelik</th>
                <th className="px-4 py-3">Kayıt Tarihi</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ business, subscription, plan }) => (
                <tr key={business.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-navy-900">{business.name}</p>
                        <a
                          href={`/${business.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-navy-400 hover:text-violet-600"
                        >
                          /{business.slug} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-navy-700">
                    <p>{SECTOR_LABELS[business.sector] ?? business.sector}</p>
                    <p className="text-xs text-navy-400">{business.city ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-navy-700">{plan?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {subscription ? (
                      <span className={cn("status-badge", SUBSCRIPTION_BADGE_CLASSES[subscription.status])}>
                        {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                      </span>
                    ) : (
                      <Badge>Yok</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy-700">{formatDateShortTR(business.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn(business.status === "active" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200")}>
                      {business.status === "active" ? "Aktif" : "Pasif"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingBusiness(business)}>
                        <Pencil className="h-3.5 w-3.5" /> Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant={business.status === "active" ? "danger" : "outline"}
                        loading={isPending && pendingId === business.id}
                        onClick={() => handleToggleStatus(business.id, business.status)}
                      >
                        {business.status === "active" ? "Askıya Al" : "Etkinleştir"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BusinessModal open={creating} onClose={() => setCreating(false)} plans={plans} />
      <BusinessModal open={editingBusiness !== null} onClose={() => setEditingBusiness(null)} plans={plans} editBusiness={editingBusiness} />
    </div>
  );
}
