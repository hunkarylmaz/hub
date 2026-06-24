"use client";

import { useMemo, useState } from "react";
import { TrendingDown, TrendingUp, Wallet, Percent } from "lucide-react";
import { StatCard } from "@/components/ui/Stat";
import { Select } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrencyTRY, cn } from "@/lib/utils";
import { todayKey, addDaysKey, formatDateShortTR, combineDateTime, monthKeyToShortTR } from "@/lib/date";
import type { AccountingCategory, IncomeRecord, ExpenseRecord, Service, Staff } from "@/lib/types";
import { IncomeExpenseChart } from "./IncomeExpenseChart";

const PERIODS = [
  { value: "30", label: "Son 30 Gün" },
  { value: "90", label: "Son 90 Gün" },
  { value: "365", label: "Son 1 Yıl" },
  { value: "all", label: "Tüm Zamanlar" },
] as const;

interface BreakdownItem {
  name: string;
  amount: number;
}

function BreakdownList({
  title,
  accent,
  items,
  emptyLabel,
}: {
  title: string;
  accent: "emerald" | "red" | "violet";
  items: BreakdownItem[];
  emptyLabel: string;
}) {
  const max = items[0]?.amount ?? 0;
  const barColor = accent === "emerald" ? "bg-emerald-500" : accent === "red" ? "bg-red-500" : "bg-violet-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-navy-400">{emptyLabel}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-navy-700">{item.name}</span>
                  <span className="shrink-0 font-semibold text-navy-900">{formatCurrencyTRY(item.amount)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-navy-50">
                  <div className={cn("h-full rounded-full", barColor)} style={{ width: `${max > 0 ? (item.amount / max) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RaporlarClient({
  income,
  expense,
  categories,
  services,
  staff,
}: {
  income: IncomeRecord[];
  expense: ExpenseRecord[];
  categories: AccountingCategory[];
  services: Service[];
  staff: Staff[];
}) {
  const [period, setPeriod] = useState<string>("90");

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s.name])), [services]);
  const staffMap = useMemo(() => new Map(staff.map((s) => [s.id, s.fullName])), [staff]);

  const fromDate = period === "all" ? null : addDaysKey(todayKey(), -Number(period));
  const useDaily = period === "30";

  const filteredIncome = useMemo(
    () => income.filter((r) => r.status === "paid" && (!fromDate || r.date >= fromDate)),
    [income, fromDate]
  );
  const filteredExpense = useMemo(() => expense.filter((r) => !fromDate || r.date >= fromDate), [expense, fromDate]);

  const totalIncome = filteredIncome.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = filteredExpense.reduce((sum, r) => sum + r.amount, 0);
  const net = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? (net / totalIncome) * 100 : 0;

  const chartData = useMemo(() => {
    function bucketKey(date: string) {
      return useDaily ? date : date.slice(0, 7);
    }
    function bucketLabel(date: string) {
      return useDaily ? formatDateShortTR(combineDateTime(date, "12:00")) : monthKeyToShortTR(date.slice(0, 7));
    }
    const buckets = new Map<string, { label: string; income: number; expense: number }>();
    for (const r of filteredIncome) {
      const key = bucketKey(r.date);
      const entry = buckets.get(key) ?? { label: bucketLabel(r.date), income: 0, expense: 0 };
      entry.income += r.amount;
      buckets.set(key, entry);
    }
    for (const r of filteredExpense) {
      const key = bucketKey(r.date);
      const entry = buckets.get(key) ?? { label: bucketLabel(r.date), income: 0, expense: 0 };
      entry.expense += r.amount;
      buckets.set(key, entry);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, value]) => value);
  }, [filteredIncome, filteredExpense, useDaily]);

  const incomeByCategory = useMemo(() => groupByAmount(filteredIncome, (r) => (r.categoryId ? categoryMap.get(r.categoryId) ?? "Kategorisiz" : "Kategorisiz")), [filteredIncome, categoryMap]);
  const expenseByCategory = useMemo(() => groupByAmount(filteredExpense, (r) => (r.categoryId ? categoryMap.get(r.categoryId) ?? "Kategorisiz" : "Kategorisiz")), [filteredExpense, categoryMap]);
  const topServices = useMemo(
    () => groupByAmount(filteredIncome.filter((r) => r.serviceId), (r) => serviceMap.get(r.serviceId!) ?? "Bilinmeyen Hizmet").slice(0, 5),
    [filteredIncome, serviceMap]
  );
  const topStaff = useMemo(
    () => groupByAmount(filteredIncome.filter((r) => r.staffId), (r) => staffMap.get(r.staffId!) ?? "Bilinmeyen Çalışan").slice(0, 5),
    [filteredIncome, staffMap]
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <div className="w-44">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Toplam Gelir" value={formatCurrencyTRY(totalIncome)} icon={TrendingUp} accent="emerald" />
        <StatCard label="Toplam Gider" value={formatCurrencyTRY(totalExpense)} icon={TrendingDown} accent="amber" />
        <StatCard label="Net Kâr" value={formatCurrencyTRY(net)} icon={Wallet} accent="violet" />
        <StatCard label="Kâr Marjı" value={`%${margin.toFixed(1)}`} icon={Percent} accent="navy" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Gelir &amp; Gider Trendi</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <EmptyState icon={Wallet} title="Veri yok" description="Seçili dönemde gösterilecek kayıt bulunmuyor." />
          ) : (
            <IncomeExpenseChart data={chartData} />
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <BreakdownList title="Gelir Kategorileri" accent="emerald" items={incomeByCategory} emptyLabel="Gelir kategorisi verisi yok" />
        <BreakdownList title="Gider Kategorileri" accent="red" items={expenseByCategory} emptyLabel="Gider kategorisi verisi yok" />
        <BreakdownList title="En Çok Gelir Getiren Hizmetler" accent="violet" items={topServices} emptyLabel="Hizmet verisi yok" />
        <BreakdownList title="En Çok Gelir Getiren Çalışanlar" accent="violet" items={topStaff} emptyLabel="Çalışan verisi yok" />
      </div>
    </div>
  );
}

function groupByAmount<T extends { amount: number }>(records: T[], keyFn: (r: T) => string): BreakdownItem[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const key = keyFn(r);
    map.set(key, (map.get(key) ?? 0) + r.amount);
  }
  return Array.from(map.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}
