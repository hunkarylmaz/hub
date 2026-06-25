"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { AccountingCategory, PaymentMethod, IncomeRecord, ExpenseRecord } from "@/lib/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import { todayKey } from "@/lib/date";
import { createIncomeAction, createExpenseAction, createAccountingCategoryAction, updateIncomeAction, updateExpenseAction } from "./actions";

export type EditTarget = { type: "income"; record: IncomeRecord } | { type: "expense"; record: ExpenseRecord };

export function NewRecordModal({
  open,
  onClose,
  categories,
  defaultType,
  defaultDate,
  editTarget,
}: {
  open: boolean;
  onClose: () => void;
  categories: AccountingCategory[];
  defaultType?: "income" | "expense";
  defaultDate?: string;
  editTarget?: EditTarget | null;
}) {
  const router = useRouter();
  const isEdit = !!editTarget;
  const [type, setType] = useState<"income" | "expense">(editTarget?.type ?? defaultType ?? "income");
  const [date, setDate] = useState(editTarget?.record.date ?? defaultDate ?? todayKey());
  const [amount, setAmount] = useState(editTarget ? String(editTarget.record.amount) : "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(editTarget?.record.paymentMethod ?? "cash");
  const [categoryId, setCategoryId] = useState(editTarget?.record.categoryId ?? "");
  const [description, setDescription] = useState(editTarget?.record.description ?? "");
  const [supplierName, setSupplierName] = useState(editTarget?.type === "expense" ? editTarget.record.supplierName ?? "" : "");
  const [localCategories, setLocalCategories] = useState(categories);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const [creatingCategory, startCreateCategory] = useTransition();

  useEffect(() => {
    if (!open) return;
    setType(editTarget?.type ?? defaultType ?? "income");
    setDate(editTarget?.record.date ?? defaultDate ?? todayKey());
    setAmount(editTarget ? String(editTarget.record.amount) : "");
    setPaymentMethod(editTarget?.record.paymentMethod ?? "cash");
    setCategoryId(editTarget?.record.categoryId ?? "");
    setDescription(editTarget?.record.description ?? "");
    setSupplierName(editTarget?.type === "expense" ? editTarget.record.supplierName ?? "" : "");
    setLocalCategories(categories);
    setShowNewCategory(false);
    setNewCategoryName("");
    setError(null);
  }, [open, defaultType, defaultDate, categories, editTarget]);

  if (!open) return null;

  const filteredCategories = localCategories.filter((c) => c.type === type);

  function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    startCreateCategory(async () => {
      try {
        const category = await createAccountingCategoryAction(type, newCategoryName);
        setLocalCategories((prev) => [...prev, category]);
        setCategoryId(category.id);
        setShowNewCategory(false);
        setNewCategoryName("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kategori oluşturulamadı.");
      }
    });
  }

  function handleSubmit() {
    setError(null);
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Geçerli bir tutar giriniz.");
      return;
    }
    startSubmit(async () => {
      try {
        if (type === "income") {
          const payload = {
            date,
            amount: numericAmount,
            paymentMethod,
            description: description || null,
            categoryId: categoryId || null,
          };
          if (isEdit && editTarget) await updateIncomeAction(editTarget.record.id, payload);
          else await createIncomeAction(payload);
        } else {
          const payload = {
            date,
            amount: numericAmount,
            paymentMethod,
            description: description || null,
            categoryId: categoryId || null,
            supplierName: supplierName || null,
          };
          if (isEdit && editTarget) await updateExpenseAction(editTarget.record.id, payload);
          else await createExpenseAction(payload);
        }
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : (isEdit ? "Kayıt güncellenemedi." : "Kayıt oluşturulamadı."));
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Kaydı Düzenle" : "Yeni Kayıt"}
      description={isEdit ? "Mevcut gelir veya gider kaydını güncelle" : "Manuel bir gelir veya gider kaydı ekle"}
      size="md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isEdit}
            onClick={() => {
              setType("income");
              setCategoryId("");
            }}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
              type === "income" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-navy-200 text-navy-500 hover:bg-navy-50",
              isEdit && "cursor-not-allowed opacity-60"
            )}
          >
            Gelir
          </button>
          <button
            type="button"
            disabled={isEdit}
            onClick={() => {
              setType("expense");
              setCategoryId("");
            }}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
              type === "expense" ? "border-red-300 bg-red-50 text-red-700" : "border-navy-200 text-navy-500 hover:bg-navy-50",
              isEdit && "cursor-not-allowed opacity-60"
            )}
          >
            Gider
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Tarih</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Tutar (₺)</Label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Ödeme Yöntemi</Label>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Kategori</Label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Kategorisiz</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {!showNewCategory ? (
          <button type="button" onClick={() => setShowNewCategory(true)} className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700">
            <Plus className="h-3.5 w-3.5" /> Yeni kategori ekle
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Kategori adı"
              className="h-9"
            />
            <Button size="sm" loading={creatingCategory} onClick={handleCreateCategory}>
              Ekle
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowNewCategory(false)}>
              Vazgeç
            </Button>
          </div>
        )}

        {type === "expense" && (
          <div>
            <Label>Tedarikçi / Firma</Label>
            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Opsiyonel" />
          </div>
        )}

        <div>
          <Label>Açıklama</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opsiyonel" />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            {isEdit ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
