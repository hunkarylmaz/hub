"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/session";
import {
  createCustomer,
  updateCustomer,
  findCustomerById,
  getCustomerStats,
  listCustomerNotes,
  addCustomerNote,
} from "@/lib/db/repo/customers";
import { listAppointmentsForCustomer } from "@/lib/db/repo/appointments";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";

function revalidateCustomerViews() {
  revalidatePath("/panel/musteriler");
  revalidatePath("/panel");
}

export interface CustomerFormInput {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  tags?: string[];
  kvkkConsent?: boolean;
}

export async function createCustomerAction(input: CustomerFormInput) {
  const { user, business } = await requireBusinessContext();
  const fullName = input.fullName.trim();
  if (!fullName) throw new Error("Ad Soyad zorunludur.");

  const customer = createCustomer(business.id, {
    fullName,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    birthDate: input.birthDate || null,
    gender: input.gender || null,
    tags: input.tags ?? [],
    kvkkConsent: input.kvkkConsent ?? false,
  });

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "customer.created",
    entityType: "customer",
    entityId: customer.id,
  });

  revalidateCustomerViews();
  return customer;
}

export async function updateCustomerAction(
  customerId: string,
  input: Partial<CustomerFormInput> & { warningNote?: string | null }
) {
  const { user, business } = await requireBusinessContext();
  const existing = findCustomerById(customerId);
  if (!existing || existing.businessId !== business.id) throw new Error("Müşteri bulunamadı.");

  const updated = updateCustomer(customerId, input);

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "customer.updated",
    entityType: "customer",
    entityId: customerId,
  });

  revalidateCustomerViews();
  return updated;
}

export async function addCustomerNoteAction(customerId: string, note: string, isWarning = false) {
  const { user, business } = await requireBusinessContext();
  const existing = findCustomerById(customerId);
  if (!existing || existing.businessId !== business.id) throw new Error("Müşteri bulunamadı.");

  const trimmed = note.trim();
  if (!trimmed) throw new Error("Not boş olamaz.");

  const created = addCustomerNote(business.id, customerId, user.id, trimmed, isWarning);
  if (isWarning) updateCustomer(customerId, { warningNote: trimmed });

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: isWarning ? "customer.note.warning" : "customer.note.added",
    entityType: "customer",
    entityId: customerId,
  });

  revalidateCustomerViews();
  return created;
}

export async function fetchCustomerDetailAction(customerId: string) {
  const { business } = await requireBusinessContext();
  const customer = findCustomerById(customerId);
  if (!customer || customer.businessId !== business.id) throw new Error("Müşteri bulunamadı.");

  return {
    customer,
    stats: getCustomerStats(customerId),
    notes: listCustomerNotes(customerId),
    appointments: listAppointmentsForCustomer(customerId),
  };
}
