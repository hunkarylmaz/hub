"use client";

import { ClipboardCheck, Wallet, Percent, BadgeDollarSign } from "lucide-react";
import { StatCard } from "@/components/ui/Stat";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { StaffEarnings } from "@/lib/db/repo/staff";
import type { Staff } from "@/lib/types";
import { COMPENSATION_TYPE_LABELS } from "@/lib/types";
import { formatCurrencyTRY } from "@/lib/utils";

export function KazanclarimClient({
  staff,
  monthEarnings,
  allTimeEarnings,
}: {
  staff: Staff | null;
  monthEarnings: StaffEarnings | null;
  allTimeEarnings: StaffEarnings | null;
}) {
  if (!staff || !monthEarnings || !allTimeEarnings) {
    return (
      <EmptyState
        icon={Wallet}
        title="Personel kaydı bulunamadı"
        description="Bu hesap herhangi bir çalışan kaydına bağlı değil. İşletme sahibinle iletişime geç."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Çalışma Tipi</CardTitle>
            <CardDescription>İşletme sahibi tarafından belirlenir</CardDescription>
          </div>
          <Badge>{COMPENSATION_TYPE_LABELS[staff.compensationType]}</Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 text-sm">
          {(staff.compensationType === "FIXED" || staff.compensationType === "FIXED_COMMISSION") && (
            <div>
              <p className="text-navy-400">Sabit Maaş</p>
              <p className="mt-0.5 font-semibold text-navy-900">{formatCurrencyTRY(staff.baseSalary)}</p>
            </div>
          )}
          {(staff.compensationType === "COMMISSION" || staff.compensationType === "FIXED_COMMISSION") && (
            <div>
              <p className="text-navy-400">Komisyon Oranı</p>
              <p className="mt-0.5 font-semibold text-navy-900">%{staff.commissionRate}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-navy-900">Bu Ay</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tamamlanan İşlem" value={String(monthEarnings.completedCount)} icon={ClipboardCheck} accent="navy" />
          <StatCard label="Ciro" value={formatCurrencyTRY(monthEarnings.totalRevenue)} icon={Wallet} accent="amber" />
          <StatCard label="Komisyon" value={formatCurrencyTRY(monthEarnings.commissionEarned)} icon={Percent} accent="emerald" />
          <StatCard label="Toplam Kazanç" value={formatCurrencyTRY(monthEarnings.totalEarnings)} icon={BadgeDollarSign} accent="violet" />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-navy-900">Tüm Zamanlar</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tamamlanan İşlem" value={String(allTimeEarnings.completedCount)} icon={ClipboardCheck} accent="navy" />
          <StatCard label="Ciro" value={formatCurrencyTRY(allTimeEarnings.totalRevenue)} icon={Wallet} accent="amber" />
          <StatCard label="Komisyon" value={formatCurrencyTRY(allTimeEarnings.commissionEarned)} icon={Percent} accent="emerald" />
          <StatCard label="Toplam Kazanç" value={formatCurrencyTRY(allTimeEarnings.totalEarnings)} icon={BadgeDollarSign} accent="violet" />
        </div>
      </div>
    </div>
  );
}
