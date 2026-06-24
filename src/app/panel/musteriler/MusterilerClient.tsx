"use client";

import { useMemo, useState } from "react";
import { Plus, Search, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, formatCurrencyTRY } from "@/lib/utils";
import { formatDateShortTR } from "@/lib/date";
import type { CustomerWithStats } from "@/lib/db/repo/customers";
import { CustomerDetailModal } from "./CustomerDetailModal";
import { NewCustomerModal } from "./NewCustomerModal";

export function MusterilerClient({ customers }: { customers: CustomerWithStats[] }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, telefon veya e-posta ara..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> Yeni Müşteri
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={customers.length === 0 ? "Henüz müşteri yok" : "Sonuç bulunamadı"}
          description={customers.length === 0 ? "Yeni randevu oluşturduğunda müşteriler burada listelenecek." : "Arama kriterlerinizi değiştirin."}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <th className="px-4 py-3">Müşteri</th>
                <th className="px-4 py-3">İletişim</th>
                <th className="px-4 py-3">Etiketler</th>
                <th className="px-4 py-3">Son Ziyaret</th>
                <th className="px-4 py-3 text-right">Toplam Randevu</th>
                <th className="px-4 py-3 text-right">Toplam Harcama</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setSelectedId(customer.id)}
                  className="cursor-pointer border-b border-navy-50 last:border-0 hover:bg-navy-50/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={customer.fullName} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-navy-900">{customer.fullName}</span>
                          {(customer.warningNote || customer.noShowCount > 0) && (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-navy-700">
                    <p>{customer.phone ?? "—"}</p>
                    {customer.email && <p className="text-xs text-navy-400">{customer.email}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {customer.tags.length === 0 ? (
                      <span className="text-navy-400">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.map((tag) => (
                          <Badge
                            key={tag}
                            className={cn(tag === "vip" && "bg-violet-50 text-violet-700 ring-violet-100")}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy-700">
                    {customer.lastVisitAt ? formatDateShortTR(customer.lastVisitAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-navy-700">{customer.totalAppointments}</td>
                  <td className="px-4 py-3 text-right font-medium text-navy-900">{formatCurrencyTRY(customer.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomerDetailModal customerId={selectedId} onClose={() => setSelectedId(null)} />
      <NewCustomerModal open={showNew} onClose={() => setShowNew(false)} />
    </div>
  );
}
