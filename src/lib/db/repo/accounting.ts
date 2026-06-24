import { getDb, uid, nowIso } from "../client";
import type { AccountingCategory, IncomeRecord, ExpenseRecord, CashRegister, PaymentMethod } from "@/lib/types";

function mapCategory(row: any): AccountingCategory {
  return {
    id: row.id,
    businessId: row.business_id,
    type: row.type,
    name: row.name,
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
  };
}

export function listAccountingCategories(businessId: string, type?: "income" | "expense"): AccountingCategory[] {
  if (type) {
    return getDb()
      .prepare("SELECT * FROM accounting_categories WHERE business_id = ? AND type = ? ORDER BY name ASC")
      .all(businessId, type)
      .map(mapCategory);
  }
  return getDb().prepare("SELECT * FROM accounting_categories WHERE business_id = ? ORDER BY type ASC, name ASC").all(businessId).map(mapCategory);
}

export function createAccountingCategory(businessId: string, type: "income" | "expense", name: string, isDefault = false): AccountingCategory {
  const id = uid();
  getDb()
    .prepare("INSERT INTO accounting_categories (id, business_id, type, name, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, businessId, type, name, isDefault ? 1 : 0, nowIso());
  return mapCategory(getDb().prepare("SELECT * FROM accounting_categories WHERE id = ?").get(id));
}

export function seedDefaultAccountingCategories(businessId: string) {
  const incomeDefaults = ["Hizmet Geliri", "Ürün Satışı", "Diğer Gelir"];
  const expenseDefaults = ["Kira", "Personel Ödemesi", "Ürün / Malzeme", "Fatura", "Komisyon", "Diğer Gider"];
  for (const name of incomeDefaults) createAccountingCategory(businessId, "income", name, true);
  for (const name of expenseDefaults) createAccountingCategory(businessId, "expense", name, true);
}

function mapIncome(row: any): IncomeRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    branchId: row.branch_id,
    date: row.date,
    amount: row.amount,
    paymentMethod: row.payment_method,
    description: row.description,
    customerId: row.customer_id,
    appointmentId: row.appointment_id,
    serviceId: row.service_id,
    staffId: row.staff_id,
    categoryId: row.category_id,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
  };
}

export interface IncomeInput {
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description?: string | null;
  customerId?: string | null;
  appointmentId?: string | null;
  serviceId?: string | null;
  staffId?: string | null;
  categoryId?: string | null;
  status?: "paid" | "pending" | "cancelled";
}

export function createIncomeRecord(businessId: string, createdByUserId: string | null, input: IncomeInput): IncomeRecord {
  const id = uid();
  getDb()
    .prepare(
      `INSERT INTO income_records
        (id, business_id, branch_id, date, amount, payment_method, description, customer_id, appointment_id, service_id, staff_id, category_id, status, created_by_user_id, created_at)
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      businessId,
      input.date,
      input.amount,
      input.paymentMethod,
      input.description ?? null,
      input.customerId ?? null,
      input.appointmentId ?? null,
      input.serviceId ?? null,
      input.staffId ?? null,
      input.categoryId ?? null,
      input.status ?? "paid",
      createdByUserId,
      nowIso()
    );
  return mapIncome(getDb().prepare("SELECT * FROM income_records WHERE id = ?").get(id));
}

export function listIncomeRecords(businessId: string, from?: string, to?: string): IncomeRecord[] {
  if (from && to) {
    return getDb()
      .prepare("SELECT * FROM income_records WHERE business_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, created_at DESC")
      .all(businessId, from, to)
      .map(mapIncome);
  }
  return getDb().prepare("SELECT * FROM income_records WHERE business_id = ? ORDER BY date DESC, created_at DESC").all(businessId).map(mapIncome);
}

function mapExpense(row: any): ExpenseRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    branchId: row.branch_id,
    date: row.date,
    amount: row.amount,
    categoryId: row.category_id,
    description: row.description,
    paymentMethod: row.payment_method,
    receiptUrl: row.receipt_url,
    supplierName: row.supplier_name,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
  };
}

export interface ExpenseInput {
  date: string;
  amount: number;
  categoryId?: string | null;
  description?: string | null;
  paymentMethod: PaymentMethod;
  receiptUrl?: string | null;
  supplierName?: string | null;
}

export function createExpenseRecord(businessId: string, createdByUserId: string | null, input: ExpenseInput): ExpenseRecord {
  const id = uid();
  getDb()
    .prepare(
      `INSERT INTO expense_records (id, business_id, branch_id, date, amount, category_id, description, payment_method, receipt_url, supplier_name, created_by_user_id, created_at)
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, businessId, input.date, input.amount, input.categoryId ?? null, input.description ?? null, input.paymentMethod, input.receiptUrl ?? null, input.supplierName ?? null, createdByUserId, nowIso());
  return mapExpense(getDb().prepare("SELECT * FROM expense_records WHERE id = ?").get(id));
}

export function listExpenseRecords(businessId: string, from?: string, to?: string): ExpenseRecord[] {
  if (from && to) {
    return getDb()
      .prepare("SELECT * FROM expense_records WHERE business_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, created_at DESC")
      .all(businessId, from, to)
      .map(mapExpense);
  }
  return getDb().prepare("SELECT * FROM expense_records WHERE business_id = ? ORDER BY date DESC, created_at DESC").all(businessId).map(mapExpense);
}

export interface DailySummary {
  date: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
}

export function getDailySummary(businessId: string, date: string): DailySummary {
  const income: any = getDb()
    .prepare(
      `SELECT COALESCE(SUM(amount),0) as total,
        COALESCE(SUM(CASE WHEN payment_method='cash' THEN amount ELSE 0 END),0) as cash,
        COALESCE(SUM(CASE WHEN payment_method='card' THEN amount ELSE 0 END),0) as card,
        COALESCE(SUM(CASE WHEN payment_method='transfer' THEN amount ELSE 0 END),0) as transfer
       FROM income_records WHERE business_id = ? AND date = ? AND status = 'paid'`
    )
    .get(businessId, date);
  const expense: any = getDb()
    .prepare("SELECT COALESCE(SUM(amount),0) as total FROM expense_records WHERE business_id = ? AND date = ?")
    .get(businessId, date);
  return {
    date,
    totalIncome: income.total,
    totalExpense: expense.total,
    net: income.total - expense.total,
    cashTotal: income.cash,
    cardTotal: income.card,
    transferTotal: income.transfer,
  };
}

export function getRangeSummary(businessId: string, from: string, to: string): DailySummary {
  const income: any = getDb()
    .prepare(
      `SELECT COALESCE(SUM(amount),0) as total,
        COALESCE(SUM(CASE WHEN payment_method='cash' THEN amount ELSE 0 END),0) as cash,
        COALESCE(SUM(CASE WHEN payment_method='card' THEN amount ELSE 0 END),0) as card,
        COALESCE(SUM(CASE WHEN payment_method='transfer' THEN amount ELSE 0 END),0) as transfer
       FROM income_records WHERE business_id = ? AND date >= ? AND date <= ? AND status = 'paid'`
    )
    .get(businessId, from, to);
  const expense: any = getDb()
    .prepare("SELECT COALESCE(SUM(amount),0) as total FROM expense_records WHERE business_id = ? AND date >= ? AND date <= ?")
    .get(businessId, from, to);
  return {
    date: `${from}_${to}`,
    totalIncome: income.total,
    totalExpense: expense.total,
    net: income.total - expense.total,
    cashTotal: income.cash,
    cardTotal: income.card,
    transferTotal: income.transfer,
  };
}

function mapCashRegister(row: any): CashRegister {
  return {
    id: row.id,
    businessId: row.business_id,
    branchId: row.branch_id,
    date: row.date,
    openingBalance: row.opening_balance,
    closingBalance: row.closing_balance,
    totalIncome: row.total_income,
    totalExpense: row.total_expense,
    cashTotal: row.cash_total,
    cardTotal: row.card_total,
    transferTotal: row.transfer_total,
    note: row.note,
    closedAt: row.closed_at,
    closedByUserId: row.closed_by_user_id,
    createdAt: row.created_at,
  };
}

export function listCashRegisters(businessId: string): CashRegister[] {
  return getDb().prepare("SELECT * FROM cash_registers WHERE business_id = ? ORDER BY date DESC").all(businessId).map(mapCashRegister);
}
