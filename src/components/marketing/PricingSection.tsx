"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatCurrencyTRY } from "@/lib/utils";
import type { Plan } from "@/lib/types";

export function PricingSection({ plans }: { plans: Plan[] }) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <section id="fiyatlandirma" className="bg-surface-subtle py-20 sm:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-navy-900 sm:text-4xl">Size uygun planı seçin</h2>
          <p className="mt-4 text-navy-500">İşletmenizin büyüklüğüne göre ölçeklenen, şeffaf fiyatlandırma.</p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-navy-200 bg-white p-1 shadow-card">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                cycle === "monthly" ? "bg-navy-900 text-white" : "text-navy-500 hover:text-navy-900"
              )}
            >
              Aylık
            </button>
            <button
              type="button"
              onClick={() => setCycle("yearly")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                cycle === "yearly" ? "bg-navy-900 text-white" : "text-navy-500 hover:text-navy-900"
              )}
            >
              Yıllık
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  cycle === "yearly" ? "bg-violet-500 text-white" : "bg-emerald-50 text-emerald-700"
                )}
              >
                2 ay hediye
              </span>
            </button>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-3">
          {plans.map((plan, i) => {
            const popular = i === 1;
            const price = cycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const originalPrice = cycle === "monthly" ? plan.originalMonthlyPrice : plan.originalYearlyPrice;
            const hasDiscount = originalPrice !== null && originalPrice > price;
            const suffix = cycle === "monthly" ? "/ay" : "/yıl";

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl border bg-white p-6 transition-transform duration-300 hover:-translate-y-1",
                  popular ? "border-violet-300 shadow-glow" : "border-navy-100 shadow-card"
                )}
              >
                {popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white ring-violet-600">
                    En Popüler
                  </Badge>
                )}
                <p className="text-base font-semibold text-navy-900">{plan.name}</p>
                <p className="mt-3 flex items-baseline gap-2 text-3xl font-bold text-navy-900">
                  {hasDiscount && (
                    <span className="text-lg font-medium text-navy-300 line-through">
                      {formatCurrencyTRY(originalPrice!)}
                    </span>
                  )}
                  {formatCurrencyTRY(price)}
                  <span className="text-sm font-medium text-navy-400">{suffix}</span>
                </p>
                <p className="text-xs text-navy-400">
                  {cycle === "monthly"
                    ? `${formatCurrencyTRY(plan.yearlyPrice)}/yıl ödemede`
                    : `${formatCurrencyTRY(Math.round(plan.yearlyPrice / 12))}/ay'a denk gelir`}
                </p>
                <div className="mt-5 space-y-2 border-t border-navy-50 pt-5 text-sm">
                  <div className="flex items-center gap-2 text-navy-700">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    {plan.maxStaff === null ? "Sınırsız personel" : `${plan.maxStaff} personel`}
                  </div>
                  <div className="flex items-center gap-2 text-navy-700">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    {plan.maxBranches === null ? "Sınırsız şube" : `${plan.maxBranches} şube`}
                  </div>
                  <div className="flex items-center gap-2 text-navy-700">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    {plan.maxMonthlyAppointments === null ? "Sınırsız aylık randevu" : `${plan.maxMonthlyAppointments} aylık randevu`}
                  </div>
                  {plan.hasAccounting && (
                    <div className="flex items-center gap-2 text-navy-700">
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" /> Ön muhasebe
                    </div>
                  )}
                  {plan.hasAdvancedReports && (
                    <div className="flex items-center gap-2 text-navy-700">
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" /> Gelişmiş raporlar
                    </div>
                  )}
                  {plan.hasSmsWhatsapp && (
                    <div className="flex items-center gap-2 text-navy-700">
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" /> SMS / WhatsApp bildirimleri
                    </div>
                  )}
                </div>
                <Link href="/kayit" className="mt-6 block">
                  <Button variant={popular ? "secondary" : "outline"} className="w-full">
                    Ücretsiz Dene
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
