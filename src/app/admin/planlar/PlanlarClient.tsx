"use client";

import { useState } from "react";
import { Pencil, Check, X, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatCurrencyTRY } from "@/lib/utils";
import type { Plan } from "@/lib/types";
import { PlanModal } from "./PlanModal";

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

export function PlanlarClient({ plans }: { plans: Plan[] }) {
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const modalOpen = editing !== null || creating;

  return (
    <div>
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Yeni Plan Ekle
        </Button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const hasMonthlyDiscount = plan.originalMonthlyPrice !== null && plan.originalMonthlyPrice > plan.monthlyPrice;
          const hasYearlyDiscount = plan.originalYearlyPrice !== null && plan.originalYearlyPrice > plan.yearlyPrice;
          return (
            <Card key={plan.id} className={cn(!plan.isActive && "opacity-60")}>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-navy-900">{plan.name}</p>
                    <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-navy-900">
                      {hasMonthlyDiscount && (
                        <span className="text-base font-medium text-navy-300 line-through">
                          {formatCurrencyTRY(plan.originalMonthlyPrice!)}
                        </span>
                      )}
                      {formatCurrencyTRY(plan.monthlyPrice)}
                      <span className="text-sm font-medium text-navy-400">/ay</span>
                    </p>
                    <p className="text-xs text-navy-400">
                      {hasYearlyDiscount && (
                        <span className="mr-1.5 line-through">{formatCurrencyTRY(plan.originalYearlyPrice!)}</span>
                      )}
                      {formatCurrencyTRY(plan.yearlyPrice)}/yıl
                    </p>
                  </div>
                  <Badge className={cn(plan.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-navy-50 text-navy-500 ring-navy-200")}>
                    {plan.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                <div className="space-y-1.5 border-t border-navy-50 pt-3">
                  <FeatureRow enabled label={limitLabel(plan.maxStaff, "personel")} />
                  <FeatureRow enabled label={limitLabel(plan.maxBranches, "şube")} />
                  <FeatureRow enabled label={limitLabel(plan.maxMonthlyAppointments, "aylık randevu")} />
                  <FeatureRow enabled={plan.hasAccounting} label="Ön muhasebe" />
                  <FeatureRow enabled={plan.hasAdvancedReports} label="Gelişmiş raporlar" />
                  <FeatureRow enabled={plan.hasSmsWhatsapp} label="SMS / WhatsApp bildirimleri" />
                </div>
                <Button variant="outline" className="w-full" onClick={() => setEditing(plan)}>
                  <Pencil className="h-4 w-4" /> Düzenle
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <PlanModal
        open={modalOpen}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        plan={editing}
      />
    </div>
  );
}
