"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn, formatCurrencyTRY } from "@/lib/utils";
import { formatDateLongTR } from "@/lib/date";
import type { Plan, Subscription, SubscriptionStatus } from "@/lib/types";
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/types";
import { selectPlanAction } from "./actions";

const STATUS_BADGE_CLASSES: Record<SubscriptionStatus, string> = {
  trial: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  past_due: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  cancelled: "bg-navy-50 text-navy-600 ring-1 ring-inset ring-navy-200",
  suspended: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

function limitLabel(value: number | null, unit: string): string {
  return value === null ? `Sınırsız ${unit}` : `${value} ${unit}`;
}

function FeatureRow({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {enabled ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : <X className="h-4 w-4 shrink-0 text-navy-300" />}
      <span className={enabled ? "text-navy-700" : "text-navy-400"}>{label}</span>
    </div>
  );
}

export function AbonelikClient({ plans, subscription }: { plans: Plan[]; subscription: Subscription | null }) {
  const router = useRouter();
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentPlan = subscription ? plans.find((p) => p.id === subscription.planId) ?? null : null;

  function handleSelectPlan(planId: string) {
    setError(null);
    setPendingPlanId(planId);
    startTransition(async () => {
      try {
        await selectPlanAction(planId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Plan değiştirilemedi.");
      } finally {
        setPendingPlanId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Mevcut Plan</CardTitle>
            <CardDescription>Aktif abonelik durumun ve dönem bilgileri</CardDescription>
          </div>
          <CreditCard className="h-5 w-5 shrink-0 text-navy-400" />
        </CardHeader>
        <CardContent>
          {subscription && currentPlan ? (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <p className="text-lg font-semibold text-navy-900">{currentPlan.name}</p>
                  <span className={cn("status-badge", STATUS_BADGE_CLASSES[subscription.status])}>
                    {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-navy-500">
                  {formatCurrencyTRY(currentPlan.monthlyPrice)}/ay &middot; {formatCurrencyTRY(currentPlan.yearlyPrice)}/yıl
                </p>
                {subscription.status === "trial" && subscription.trialEndsAt && (
                  <p className="mt-2 text-sm text-amber-700">Deneme süresi bitiş: {formatDateLongTR(subscription.trialEndsAt)}</p>
                )}
                {subscription.currentPeriodEnd && (
                  <p className="mt-2 text-sm text-navy-500">Sonraki yenileme: {formatDateLongTR(subscription.currentPeriodEnd)}</p>
                )}
              </div>
              <div className="grid gap-1 text-sm text-navy-500">
                <span>{limitLabel(currentPlan.maxStaff, "personel")}</span>
                <span>{limitLabel(currentPlan.maxBranches, "şube")}</span>
                <span>{limitLabel(currentPlan.maxMonthlyAppointments, "aylık randevu")}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-navy-500">Henüz bir aboneliğin yok, aşağıdan bir plan seç.</p>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan?.id === plan.id;
          return (
            <Card key={plan.id} className={cn(isCurrent && "ring-2 ring-violet-500")}>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-base font-semibold text-navy-900">{plan.name}</p>
                  <p className="mt-1 text-2xl font-bold text-navy-900">
                    {formatCurrencyTRY(plan.monthlyPrice)}
                    <span className="text-sm font-medium text-navy-400">/ay</span>
                  </p>
                  <p className="text-xs text-navy-400">{formatCurrencyTRY(plan.yearlyPrice)}/yıl</p>
                </div>
                <div className="space-y-1.5 border-t border-navy-50 pt-3">
                  <FeatureRow enabled label={limitLabel(plan.maxStaff, "personel")} />
                  <FeatureRow enabled label={limitLabel(plan.maxBranches, "şube")} />
                  <FeatureRow enabled label={limitLabel(plan.maxMonthlyAppointments, "aylık randevu")} />
                  <FeatureRow enabled={plan.hasAccounting} label="Ön muhasebe" />
                  <FeatureRow enabled={plan.hasAdvancedReports} label="Gelişmiş raporlar" />
                  <FeatureRow enabled={plan.hasSmsWhatsapp} label="SMS / WhatsApp bildirimleri" />
                </div>
                <Button
                  variant={isCurrent ? "outline" : "primary"}
                  className="w-full"
                  disabled={isCurrent}
                  loading={pendingPlanId === plan.id && isPending}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {isCurrent ? "Mevcut Plan" : "Bu Plana Geç"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
