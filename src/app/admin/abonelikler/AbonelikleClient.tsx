"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, CreditCard } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateShortTR } from "@/lib/date";
import { formatCurrencyTRY, cn } from "@/lib/utils";
import type { Plan, Subscription, SubscriptionStatus } from "@/lib/types";
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/types";
import { updateSubscriptionPlanAction, updateSubscriptionStatusAction } from "./actions";

type SubscriptionRow = Subscription & { businessName: string; businessSlug: string };

const STATUS_OPTIONS: SubscriptionStatus[] = ["trial", "active", "past_due", "cancelled", "suspended"];

function SubscriptionRowItem({ sub, plans }: { sub: SubscriptionRow; plans: Plan[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handlePlanChange(planId: string) {
    startTransition(async () => {
      await updateSubscriptionPlanAction(sub.businessId, planId);
      router.refresh();
    });
  }

  function handleStatusChange(status: SubscriptionStatus) {
    startTransition(async () => {
      await updateSubscriptionStatusAction(sub.businessId, status);
      router.refresh();
    });
  }

  return (
    <tr className={cn("border-b border-navy-50 last:border-0 hover:bg-navy-50/60", isPending && "opacity-50")}>
      <td className="px-4 py-3">
        <p className="font-medium text-navy-900">{sub.businessName}</p>
        <p className="text-xs text-navy-400">/{sub.businessSlug}</p>
      </td>
      <td className="px-4 py-3">
        <Select value={sub.planId} onChange={(e) => handlePlanChange(e.target.value)} disabled={isPending} className="h-9 w-40">
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-4 py-3 text-navy-700">{sub.billingCycle === "monthly" ? "Aylık" : "Yıllık"}</td>
      <td className="px-4 py-3">
        <Select
          value={sub.status}
          onChange={(e) => handleStatusChange(e.target.value as SubscriptionStatus)}
          disabled={isPending}
          className="h-9 w-36"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {SUBSCRIPTION_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-4 py-3 text-navy-700">{sub.trialEndsAt ? formatDateShortTR(sub.trialEndsAt) : "—"}</td>
      <td className="px-4 py-3 text-navy-700">{sub.currentPeriodEnd ? formatDateShortTR(sub.currentPeriodEnd) : "—"}</td>
    </tr>
  );
}

export function AbonelikleClient({ subscriptions, plans }: { subscriptions: SubscriptionRow[]; plans: Plan[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscriptions;
    return subscriptions.filter((s) => s.businessName.toLowerCase().includes(q) || s.businessSlug.toLowerCase().includes(q));
  }, [subscriptions, search]);

  const planById = new Map(plans.map((p) => [p.id, p]));
  const mrr = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      const plan = planById.get(s.planId);
      if (!plan) return sum;
      return sum + (s.billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice / 12);
    }, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İşletme ara..." className="pl-9" />
        </div>
        <p className="text-sm text-navy-500">
          Tahmini MRR: <span className="font-semibold text-navy-900">{formatCurrencyTRY(mrr)}</span>
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={subscriptions.length === 0 ? "Henüz abonelik yok" : "Sonuç bulunamadı"}
          description={subscriptions.length === 0 ? "İşletmeler plan seçtiğinde burada görünecek." : "Arama kriterlerinizi değiştirin."}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <th className="px-4 py-3">İşletme</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Dönem</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Deneme Bitişi</th>
                <th className="px-4 py-3">Dönem Sonu</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <SubscriptionRowItem key={sub.id} sub={sub} plans={plans} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
