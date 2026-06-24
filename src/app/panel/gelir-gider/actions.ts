"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/session";
import {
  createIncomeRecord,
  createExpenseRecord,
  createAccountingCategory,
  findIncomeRecordById,
  findExpenseRecordById,
  deleteIncomeRecord,
  deleteExpenseRecord,
  type IncomeInput,
  type ExpenseInput,
} from "@/lib/db/repo/accounting";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";

function revalidateAccountingViews() {
  revalidatePath("/panel/on-muhasebe");
  revalidatePath("/panel/gelir-gider");
  revalidatePath("/panel/raporlar");
  revalidatePath("/panel");
}

export async function createIncomeAction(input: IncomeInput) {
  const { user, business } = await requireBusinessContext();
  if (!input.amount || input.amount <= 0) throw new Error("Tutar sıfırdan büyük olmalıdır.");

  const record = createIncomeRecord(business.id, user.id, input);

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "income.created",
    entityType: "income_record",
    entityId: record.id,
  });

  revalidateAccountingViews();
  return record;
}

export async function createExpenseAction(input: ExpenseInput) {
  const { user, business } = await requireBusinessContext();
  if (!input.amount || input.amount <= 0) throw new Error("Tutar sıfırdan büyük olmalıdır.");

  const record = createExpenseRecord(business.id, user.id, input);

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "expense.created",
    entityType: "expense_record",
    entityId: record.id,
  });

  revalidateAccountingViews();
  return record;
}

export async function deleteIncomeAction(id: string) {
  const { user, business } = await requireBusinessContext();
  const existing = findIncomeRecordById(id);
  if (!existing || existing.businessId !== business.id) throw new Error("Kayıt bulunamadı.");
  if (existing.appointmentId) throw new Error("Randevuya bağlı gelir kayıtları silinemez.");

  deleteIncomeRecord(id);

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "income.deleted",
    entityType: "income_record",
    entityId: id,
  });

  revalidateAccountingViews();
}

export async function deleteExpenseAction(id: string) {
  const { user, business } = await requireBusinessContext();
  const existing = findExpenseRecordById(id);
  if (!existing || existing.businessId !== business.id) throw new Error("Kayıt bulunamadı.");

  deleteExpenseRecord(id);

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "expense.deleted",
    entityType: "expense_record",
    entityId: id,
  });

  revalidateAccountingViews();
}

export async function createAccountingCategoryAction(type: "income" | "expense", name: string) {
  const { business } = await requireBusinessContext();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Kategori adı zorunludur.");

  const category = createAccountingCategory(business.id, type, trimmed);
  revalidateAccountingViews();
  return category;
}
