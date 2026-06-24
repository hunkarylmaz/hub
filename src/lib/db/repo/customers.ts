import { getDb, uid, nowIso } from "../client";
import { b, parseJson } from "../mappers";
import type { Customer, CustomerNote } from "@/lib/types";

function mapCustomer(row: any): Customer {
  return {
    id: row.id,
    businessId: row.business_id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    birthDate: row.birth_date,
    gender: row.gender,
    tags: parseJson<string[]>(row.tags, []),
    kvkkConsent: b(row.kvkk_consent),
    kvkkConsentAt: row.kvkk_consent_at,
    noShowCount: row.no_show_count,
    warningNote: row.warning_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listCustomers(businessId: string): Customer[] {
  return getDb().prepare("SELECT * FROM customers WHERE business_id = ? ORDER BY created_at DESC").all(businessId).map(mapCustomer);
}

export function findCustomerById(id: string): Customer | null {
  const row = getDb().prepare("SELECT * FROM customers WHERE id = ?").get(id);
  return row ? mapCustomer(row) : null;
}

export function findCustomerByPhone(businessId: string, phone: string): Customer | null {
  const row = getDb().prepare("SELECT * FROM customers WHERE business_id = ? AND phone = ?").get(businessId, phone);
  return row ? mapCustomer(row) : null;
}

export interface CustomerInput {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  tags?: string[];
  kvkkConsent?: boolean;
}

export function createCustomer(businessId: string, input: CustomerInput): Customer {
  const id = uid();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO customers (id, business_id, full_name, phone, email, birth_date, gender, tags, kvkk_consent, kvkk_consent_at,
        no_show_count, warning_note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)`
    )
    .run(
      id,
      businessId,
      input.fullName,
      input.phone ?? null,
      input.email ?? null,
      input.birthDate ?? null,
      input.gender ?? null,
      JSON.stringify(input.tags ?? []),
      input.kvkkConsent ? 1 : 0,
      input.kvkkConsent ? now : null,
      now,
      now
    );
  return findCustomerById(id)!;
}

export function findOrCreateCustomerByPhone(businessId: string, input: CustomerInput): Customer {
  if (input.phone) {
    const existing = findCustomerByPhone(businessId, input.phone);
    if (existing) return existing;
  }
  return createCustomer(businessId, input);
}

export function updateCustomer(id: string, input: Partial<CustomerInput> & { warningNote?: string | null }): Customer {
  const current = findCustomerById(id);
  if (!current) throw new Error("Müşteri bulunamadı");
  const merged = {
    fullName: input.fullName ?? current.fullName,
    phone: input.phone === undefined ? current.phone : input.phone,
    email: input.email === undefined ? current.email : input.email,
    birthDate: input.birthDate === undefined ? current.birthDate : input.birthDate,
    gender: input.gender === undefined ? current.gender : input.gender,
    tags: input.tags ?? current.tags,
    kvkkConsent: input.kvkkConsent ?? current.kvkkConsent,
    warningNote: input.warningNote === undefined ? current.warningNote : input.warningNote,
  };
  getDb()
    .prepare(
      `UPDATE customers SET full_name=?, phone=?, email=?, birth_date=?, gender=?, tags=?, kvkk_consent=?, warning_note=?, updated_at=?
       WHERE id = ?`
    )
    .run(merged.fullName, merged.phone, merged.email, merged.birthDate, merged.gender, JSON.stringify(merged.tags), merged.kvkkConsent ? 1 : 0, merged.warningNote, nowIso(), id);
  return findCustomerById(id)!;
}

export function incrementNoShow(id: string) {
  getDb().prepare("UPDATE customers SET no_show_count = no_show_count + 1, updated_at = ? WHERE id = ?").run(nowIso(), id);
}

export interface CustomerStats {
  totalSpent: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  lastVisitAt: string | null;
}

export function getCustomerStats(customerId: string): CustomerStats {
  const totals: any = getDb()
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN status='completed' THEN price ELSE 0 END), 0) as total_spent,
        COUNT(*) as total_appointments,
        SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) as cancelled,
        MAX(CASE WHEN status='completed' THEN start_at ELSE NULL END) as last_visit
       FROM appointments WHERE customer_id = ?`
    )
    .get(customerId);
  return {
    totalSpent: totals.total_spent || 0,
    totalAppointments: totals.total_appointments || 0,
    completedAppointments: totals.completed || 0,
    cancelledAppointments: totals.cancelled || 0,
    lastVisitAt: totals.last_visit || null,
  };
}

function mapNote(row: any): CustomerNote {
  return {
    id: row.id,
    customerId: row.customer_id,
    businessId: row.business_id,
    authorUserId: row.author_user_id,
    note: row.note,
    isWarning: b(row.is_warning),
    createdAt: row.created_at,
  };
}

export function listCustomerNotes(customerId: string): CustomerNote[] {
  return getDb().prepare("SELECT * FROM customer_notes WHERE customer_id = ? ORDER BY created_at DESC").all(customerId).map(mapNote);
}

export function addCustomerNote(businessId: string, customerId: string, authorUserId: string | null, note: string, isWarning = false): CustomerNote {
  const id = uid();
  getDb()
    .prepare("INSERT INTO customer_notes (id, customer_id, business_id, author_user_id, note, is_warning, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, customerId, businessId, authorUserId, note, isWarning ? 1 : 0, nowIso());
  return mapNote(getDb().prepare("SELECT * FROM customer_notes WHERE id = ?").get(id));
}
