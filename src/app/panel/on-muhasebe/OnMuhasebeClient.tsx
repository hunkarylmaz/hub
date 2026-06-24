"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, TrendingDown, TrendingUp, Wallet, Banknote, CreditCard, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/Stat";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrencyTRY } from "@/lib/utils";
import { todayKey, addDaysKey, dateKeyToLongTR, dateKeyToWeekdayTR } from "@/lib/date";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import type { AccountingCategory, IncomeRecord, ExpenseRecord, Customer, Service, Staff } from "@/lib/types";
import { deleteIncomeAction, deleteExpenseAction } from "../gelir-gider/actions";
import { NewRecordModal } from "../gelir-gider/NewRecordModal";

export function OnMuhasebeClient({
  income,
  expense,
  categories,
  customers,
  services,
  staff,
}: {
  income: IncomeRecord[];
  expense: ExpenseRecord[];
  categories: AccountingCategory[];
  customers: Customer[];
  services: Service[];
  staff: Staff[];
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [newType, setNewType] = useState<"income" | "expense" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startDelete] = useTransition();

  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c.fullName])), [customers]);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s.name])), [services]);
  const staffMap = useMemo(() => new Map(staff.map((s) => [s.id, s.fullName])), [staff]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const dayIncome = income.filter((r) => r.date === selectedDate && r.status === "paid");
  const dayExpense = expense.filter((r) => r.date === selectedDate);

  const totalIncome = dayIncome.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = dayExpense.reduce((sum, r) => sum + r.amount, 0);
  const cashTotal = dayIncome.filter((r) => r.paymentMethod === "cash").reduce((sum, r) => sum + r.amount, 0);
  const cardTotal = dayIncome.filter((r) => r.paymentMethod === "card").reduce((sum, r) => sum + r.amount, 0);
  const transferTotal = dayIncome.filter((r) => r.paymentMethod === "transfer").reduce((sum, r) => sum + r.amount, 0);

  function handleDelete(type: "income" | "expense", id: string) {
    setDeletingId(id);
    startDelete(async () => {
      try {
        if (type === "income") await deleteIncomeAction(id);
        else await deleteExpenseAction(id);
        router.refresh();
      } finally {
        setDeletingId(null);
      }
    });
  }

  const isToday = selectedDate === todayKey();

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-navy-100 bg-white px-4 py-3 shadow-card">
        <button
          type="button"
          onClick={() => setSelectedDate((d) => addDaysKey(d, -1))}
          className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
          aria-label="Önceki gün"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-navy-900">
            {dateKeyToWeekdayTR(selectedDate)}, {dateKeyToLongTR(selectedDate)}
          </p>
          {!isToday && (
            <button type="button" onClick={() => setSelectedDate(todayKey())} className="text-xs font-medium text-violet-600 hover:text-violet-700">
              Bugüne dön
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSelectedDate((d) => addDaysKey(d, 1))}
          className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
          aria-label="Sonraki gün"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Günlük Gelir" value={formatCurrencyTRY(totalIncome)} icon={TrendingUp} accent="emerald" />
        <StatCard label="Günlük Gider" value={formatCurrencyTRY(totalExpense)} icon={TrendingDown} accent="amber" />
        <StatCard label="Net Kasa" value={formatCurrencyTRY(totalIncome - totalExpense)} icon={Wallet} accent="violet" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white px-4 py-3">
          <Banknote className="h-4.5 w-4.5 text-navy-400" />
          <div>
            <p className="text-xs text-navy-400">Nakit</p>
            <p className="text-sm font-semibold text-navy-900">{formatCurrencyTRY(cashTotal)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white px-4 py-3">
          <CreditCard className="h-4.5 w-4.5 text-navy-400" />
          <div>
            <p className="text-xs text-navy-400">Kart</p>
            <p className="text-sm font-semibold text-navy-900">{formatCurrencyTRY(cardTotal)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white px-4 py-3">
          <ArrowLeftRight className="h-4.5 w-4.5 text-navy-400" />
          <div>
            <p className="text-xs text-navy-400">Havale/EFT</p>
            <p className="text-sm font-semibold text-navy-900">{formatCurrencyTRY(transferTotal)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-navy-900">Gelir Kayıtları</h3>
            <Button size="sm" variant="outline" onClick={() => setNewType("income")}>
              <Plus className="h-3.5 w-3.5" /> Gelir Ekle
            </Button>
          </div>
          {dayIncome.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Gelir kaydı yok" description="Bu güne ait gelir kaydı bulunmuyor." />
          ) : (
            <div className="space-y-2">
              {dayIncome.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-navy-100 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy-900">{r.description ?? "Gelir kaydı"}</p>
                    <p className="truncate text-xs text-navy-400">
                      {[r.customerId ? customerMap.get(r.customerId) : null, r.serviceId ? serviceMap.get(r.serviceId) : null, r.staffId ? staffMap.get(r.staffId) : null]
                        .filter(Boolean)
                        .join(" · ") || (r.categoryId ? categoryMap.get(r.categoryId) : "—")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge>{PAYMENT_METHOD_LABELS[r.paymentMethod]}</Badge>
                    <span className="font-semibold text-emerald-600">+{formatCurrencyTRY(r.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-navy-900">Gider Kayıtları</h3>
            <Button size="sm" variant="outline" onClick={() => setNewType("expense")}>
              <Plus className="h-3.5 w-3.5" /> Gider Ekle
            </Button>
          </div>
          {dayExpense.length === 0 ? (
            <EmptyState icon={TrendingDown} title="Gider kaydı yok" description="Bu güne ait gider kaydı bulunmuyor." />
          ) : (
            <div className="space-y-2">
              {dayExpense.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-navy-100 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy-900">{r.description ?? "Gider kaydı"}</p>
                    <p className="truncate text-xs text-navy-400">{r.supplierName ?? (r.categoryId ? categoryMap.get(r.categoryId) : "—")}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge>{PAYMENT_METHOD_LABELS[r.paymentMethod]}</Badge>
                    <span className="font-semibold text-red-600">-{formatCurrencyTRY(r.amount)}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete("expense", r.id)}
                      disabled={deletingId === r.id}
                      className="text-xs font-medium text-navy-300 hover:text-red-600 disabled:opacity-50"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <NewRecordModal open={newType !== null} onClose={() => setNewType(null)} categories={categories} defaultType={newType ?? "income"} defaultDate={selectedDate} />
    </div>
  );
}
