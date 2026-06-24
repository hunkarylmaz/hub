"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/session";
import { dateKey } from "@/lib/date";
import { findServiceById } from "@/lib/db/repo/services";
import { findStaffById } from "@/lib/db/repo/staff";
import { findOrCreateCustomerByPhone, findCustomerById, incrementNoShow } from "@/lib/db/repo/customers";
import {
  createAppointment,
  findAppointmentById,
  updateAppointmentDetails,
  updateAppointmentStatus,
} from "@/lib/db/repo/appointments";
import { createIncomeRecord, listAccountingCategories } from "@/lib/db/repo/accounting";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";
import { getAvailableSlotsForDate, isSlotStillAvailable, type AvailableSlot } from "@/lib/availability";
import type { AppointmentStatus, PaymentMethod } from "@/lib/types";

function revalidateAppointmentViews() {
  revalidatePath("/panel/takvim");
  revalidatePath("/panel/randevular");
  revalidatePath("/panel");
}

export async function fetchAvailableSlotsAction(input: {
  serviceId: string;
  staffId?: string | null;
  dateKey: string;
}): Promise<AvailableSlot[]> {
  const { business } = await requireBusinessContext();
  const service = findServiceById(input.serviceId);
  if (!service || service.businessId !== business.id) throw new Error("Hizmet bulunamadı.");

  return getAvailableSlotsForDate({
    businessId: business.id,
    service,
    staffId: input.staffId ?? undefined,
    dateKey: input.dateKey,
  });
}

export interface CreateAppointmentPayload {
  serviceId: string;
  staffId: string | null;
  startAt: string;
  endAt: string;
  price: number;
  customerId?: string | null;
  newCustomer?: { fullName: string; phone: string } | null;
  customerNote?: string | null;
  internalNote?: string | null;
}

export async function createAppointmentAction(payload: CreateAppointmentPayload) {
  const { user, business } = await requireBusinessContext();

  const service = findServiceById(payload.serviceId);
  if (!service || service.businessId !== business.id) throw new Error("Hizmet bulunamadı.");

  if (payload.staffId) {
    const staff = findStaffById(payload.staffId);
    if (!staff || staff.businessId !== business.id) throw new Error("Personel bulunamadı.");
  }

  let customerId = payload.customerId ?? null;
  if (customerId) {
    const existing = findCustomerById(customerId);
    if (!existing || existing.businessId !== business.id) throw new Error("Müşteri bulunamadı.");
  } else {
    const fullName = payload.newCustomer?.fullName.trim();
    const phone = payload.newCustomer?.phone.trim();
    if (!fullName || !phone) throw new Error("Müşteri adı ve telefonu zorunludur.");
    const customer = findOrCreateCustomerByPhone(business.id, { fullName, phone });
    customerId = customer.id;
  }

  const available = isSlotStillAvailable({
    businessId: business.id,
    service,
    staffId: payload.staffId,
    startAt: payload.startAt,
  });
  if (!available) throw new Error("Bu saat artık uygun değil, lütfen başka bir saat seçin.");

  const appointment = createAppointment({
    businessId: business.id,
    customerId,
    staffId: payload.staffId,
    serviceId: service.id,
    startAt: payload.startAt,
    endAt: payload.endAt,
    price: payload.price,
    status: "confirmed",
    paymentStatus: "pending",
    customerNote: payload.customerNote || null,
    internalNote: payload.internalNote || null,
    source: "panel",
    createdByUserId: user.id,
  });

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "appointment.created",
    entityType: "appointment",
    entityId: appointment.id,
  });

  revalidateAppointmentViews();
  return appointment;
}

export interface RescheduleAppointmentPayload {
  appointmentId: string;
  staffId: string | null;
  startAt: string;
  endAt: string;
}

export async function rescheduleAppointmentAction(payload: RescheduleAppointmentPayload) {
  const { user, business } = await requireBusinessContext();
  const current = findAppointmentById(payload.appointmentId);
  if (!current || current.businessId !== business.id) throw new Error("Randevu bulunamadı.");
  if (current.status === "cancelled" || current.status === "completed") {
    throw new Error("Tamamlanmış veya iptal edilmiş randevular yeniden planlanamaz.");
  }

  const service = findServiceById(current.serviceId);
  if (!service) throw new Error("Hizmet bulunamadı.");

  const available = isSlotStillAvailable({
    businessId: business.id,
    service,
    staffId: payload.staffId,
    startAt: payload.startAt,
  });
  if (!available) throw new Error("Bu saat artık uygun değil, lütfen başka bir saat seçin.");

  updateAppointmentDetails(payload.appointmentId, {
    staffId: payload.staffId,
    startAt: payload.startAt,
    endAt: payload.endAt,
  });

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "appointment.rescheduled",
    entityType: "appointment",
    entityId: payload.appointmentId,
  });

  revalidateAppointmentViews();
}

export interface UpdateStatusOptions {
  reason?: string;
  paymentMethod?: PaymentMethod;
}

export async function updateAppointmentStatusAction(
  appointmentId: string,
  toStatus: AppointmentStatus,
  opts: UpdateStatusOptions = {}
) {
  const { user, business } = await requireBusinessContext();
  const appt = findAppointmentById(appointmentId);
  if (!appt || appt.businessId !== business.id) throw new Error("Randevu bulunamadı.");

  updateAppointmentStatus(appointmentId, toStatus, user.id, opts.reason ?? null);

  if (toStatus === "cancelled" && opts.reason) {
    updateAppointmentDetails(appointmentId, { cancellationReason: opts.reason });
  }

  if (toStatus === "no_show") {
    incrementNoShow(appt.customerId);
  }

  if (toStatus === "completed") {
    const method: PaymentMethod = opts.paymentMethod ?? "cash";
    const categories = listAccountingCategories(business.id, "income");
    const category = categories.find((c) => c.name === "Hizmet Geliri") ?? categories[0] ?? null;
    createIncomeRecord(business.id, user.id, {
      date: dateKey(new Date(appt.startAt)),
      amount: appt.price,
      paymentMethod: method,
      description: "Randevu tahsilatı",
      customerId: appt.customerId,
      appointmentId: appt.id,
      serviceId: appt.serviceId,
      staffId: appt.staffId,
      categoryId: category?.id ?? null,
      status: "paid",
    });
    updateAppointmentDetails(appointmentId, { paymentStatus: "paid" });
  }

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: `appointment.status.${toStatus}`,
    entityType: "appointment",
    entityId: appointmentId,
  });

  revalidateAppointmentViews();
}
