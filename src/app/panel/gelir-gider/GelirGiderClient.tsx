"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Wallet, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/Stat";
import { formatCurrencyTRY } from "@/lib/utils";
import { formatDateShortTR, todayKey, addDaysKey, combineDateTime } from "@/lib/date";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import type { AccountingCategory, IncomeRecord, ExpenseRecord, Customer, Service, Staff } from "@/lib/types";
import { deleteIncomeAction, deleteExpenseAction } from "./actions";
import { NewRecordModal, type EditTarget } from "./NewRecordModal";

interface LedgerRow {
  id: string;
  type: "income" | "expense";
  date: string;
  amount: number;
  description: string | null;
  categoryName: string | null;
  paymentMethod: string;
  relatedName: string | null;
  deletable: boolean;
}

const PERIODS = [
  { value: "30", label: "Son 30 Gün" },
  { value: "90", label: "Son 90 Gün" },
  { value: "365", label: "Son 1 Yıl" },
  { value: "all", label: "Tüm Zamanlar" },
] as const;

export function GelirGiderClient({
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
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [period, setPeriod] = useState<string>("30");
  const [showNew, setShowNew] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startDelete] = useTransition();

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c.fullName])), [customers]);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s.name])), [services]);
  const staffMap = useMemo(() => new Map(staff.map((s) => [s.id, s.fullName])), [staff]);
  const incomeById = useMemo(() => new Map(income.map((r) => [r.id, r])), [income]);
  const expenseById = useMemo(() => new Map(expense.map((r) => [r.id, r])), [expense]);

  const rows: LedgerRow[] = useMemo(() => {
    const incomeRows: LedgerRow[] = income.map((r) => ({
      id: r.id,
      type: "income",
      date: r.date,
      amount: r.amount,
      description: r.description,
      categoryName: r.categoryId ? categoryMap.get(r.categoryId) ?? null : null,
      paymentMethod: r.paymentMethod,
      relatedName: r.customerId
        ? [customerMap.get(r.customerId), r.serviceId ? serviceMap.get(r.serviceId) : null, r.staffId ? staffMap.get(r.staffId) : null]
            .filter(Boolean)
            .join(" · ")
        : null,
      deletable: !r.appointmentId,
    }));
    const expenseRows: LedgerRow[] = expense.map((r) => ({
      id: r.id,
      type: "expense",
      date: r.date,
      amount: r.amount,
      description: r.description,
      categoryName: r.categoryId ? categoryMap.get(r.categoryId) ?? null : null,
      paymentMethod: r.paymentMethod,
      relatedName: r.supplierName,
      deletable: true,
    }));
    return [...incomeRows, ...expenseRows].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [income, expense, categoryMap, customerMap, serviceMap, staffMap]);

  const fromDate = period === "all" ? null : addDaysKey(todayKey(), -Number(period));

  const filteredRows = rows.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (fromDate && r.date < fromDate) return false;
    return true;
  });

  const totalIncome = filteredRows.filter((r) => r.type === "income").reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = filteredRows.filter((r) => r.type === "expense").reduce((sum, r) => sum + r.amount, 0);

  function handleEdit(row: LedgerRow) {
    if (row.type === "income") {
      const record = incomeById.get(row.id);
      if (record) setEditTarget({ type: "income", record });
    } else {
      const record = expenseById.get(row.id);
      if (record) setEditTarget({ type: "expense", record });
    }
  }

  function handleDelete(row: LedgerRow) {
    setDeletingId(row.id);
    startDelete(async () => {
      try {
        if (row.type === "income") await deleteIncomeAction(row.id);
        else await deleteExpenseAction(row.id);
        router.refresh();
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Toplam Gelir" value={formatCurrencyTRY(totalIncome)} icon={TrendingUp} accent="emerald" />
        <StatCard label="Toplam Gider" value={formatCurrencyTRY(totalExpense)} icon={TrendingDown} accent="amber" />
        <StatCard label="Net" value={formatCurrencyTRY(totalIncome - totalExpense)} icon={Wallet} accent="violet" />
      </div>

      <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-40">
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}>
              <option value="all">Tümü</option>
              <option value="income">Gelir</option>
              <option value="expense">Gider</option>
            </Select>
          </div>
          <div className="w-40">
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> Yeni Kayıt
        </Button>
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState icon={Wallet} title="Kayıt bulunamadı" description="Filtreleri değiştirin veya yeni bir kayıt ekleyin." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Açıklama</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Yöntem</th>
                <th className="px-4 py-3 text-right">Tutar</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={`${row.type}-${row.id}`} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/60">
                  <td className="whitespace-nowrap px-4 py-3 text-navy-700">{formatDateShortTR(combineDateTime(row.date, "12:00"))}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy-900">{row.description ?? (row.type === "income" ? "Gelir kaydı" : "Gider kaydı")}</p>
                    {row.relatedName && <p className="text-xs text-navy-400">{row.relatedName}</p>}
                  </td>
                  <td className="px-4 py-3 text-navy-500">{row.categoryName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge>{PAYMENT_METHOD_LABELS[row.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS]}</Badge>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${row.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                    {row.type === "income" ? "+" : "-"}
                    {formatCurrencyTRY(row.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.deletable && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(row)}
                          className="rounded-lg p-1.5 text-navy-300 hover:bg-violet-50 hover:text-violet-600"
                          aria-label="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          disabled={deletingId === row.id}
                          className="rounded-lg p-1.5 text-navy-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          aria-label="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewRecordModal
        open={showNew || editTarget !== null}
        onClose={() => {
          setShowNew(false);
          setEditTarget(null);
        }}
        categories={categories}
        editTarget={editTarget}
      />
    </div>
  );
}
