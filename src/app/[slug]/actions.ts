"use server";

import { findBusinessBySlug } from "@/lib/db/repo/businesses";
import { getOrCreatePublicPageSettings } from "@/lib/db/repo/publicPageSettings";
import { findServiceById } from "@/lib/db/repo/services";
import { findStaffById } from "@/lib/db/repo/staff";
import { findOrCreateCustomerByPhone } from "@/lib/db/repo/customers";
import { createAppointment } from "@/lib/db/repo/appointments";
import { createNotification } from "@/lib/db/repo/notifications";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";
import { createReview } from "@/lib/db/repo/reviews";
import { getAvailableSlotsForDate, isSlotStillAvailable, findNextAvailableSlot, type AvailableSlot, type NextAvailableSlot } from "@/lib/availability";
import { addDaysKey, todayKey, formatDateTimeTR } from "@/lib/date";
import type { AppointmentStatus, Business, PublicPageSettings, Review, Service } from "@/lib/types";

function resolveBusiness(slug: string): Business {
  const business = findBusinessBySlug(slug);
  if (!business || business.status !== "active") throw new Error("İşletme bulunamadı.");
  return business;
}

function resolveBookableService(businessId: string, serviceId: string): Service {
  const service = findServiceById(serviceId);
  if (!service || service.businessId !== businessId || !service.isActive || !service.isOnlineBookable) {
    throw new Error("Hizmet bulunamadı.");
  }
  return service;
}

function assertBookableStaff(businessId: string, staffId: string) {
  const staff = findStaffById(staffId);
  if (!staff || staff.businessId !== businessId || !staff.isActive || !staff.isBookableOnline) {
    throw new Error("Personel bulunamadı.");
  }
}

function clampToBookingWindow(dateKey: string, settings: PublicPageSettings): boolean {
  const minKey = todayKey();
  const maxKey = addDaysKey(minKey, settings.bookingWindowDays);
  return dateKey >= minKey && dateKey <= maxKey;
}

export async function fetchPublicSlotsAction(input: {
  slug: string;
  serviceId: string;
  staffId?: string | null;
  dateKey: string;
}): Promise<AvailableSlot[]> {
  const business = resolveBusiness(input.slug);
  const settings = getOrCreatePublicPageSettings(business.id);
  const service = resolveBookableService(business.id, input.serviceId);
  if (input.staffId) assertBookableStaff(business.id, input.staffId);
  if (!clampToBookingWindow(input.dateKey, settings)) return [];

  return getAvailableSlotsForDate({
    businessId: business.id,
    service,
    staffId: input.staffId ?? undefined,
    dateKey: input.dateKey,
    minNoticeHours: settings.minNoticeHours,
  });
}

export async function fetchNextAvailableSlotAction(input: {
  slug: string;
  serviceId: string;
  staffId?: string | null;
  dateKey: string;
}): Promise<NextAvailableSlot | null> {
  const business = resolveBusiness(input.slug);
  const settings = getOrCreatePublicPageSettings(business.id);
  const service = resolveBookableService(business.id, input.serviceId);
  if (input.staffId) assertBookableStaff(business.id, input.staffId);

  const maxKey = addDaysKey(todayKey(), settings.bookingWindowDays);
  const startKey = addDaysKey(input.dateKey, 1) > maxKey ? input.dateKey : addDaysKey(input.dateKey, 1);

  return findNextAvailableSlot({
    businessId: business.id,
    service,
    staffId: input.staffId ?? undefined,
    minNoticeHours: settings.minNoticeHours,
    startDateKey: startKey,
    maxDaysAhead: Math.max(0, Math.min(settings.bookingWindowDays, 60)),
  });
}

export interface CreatePublicAppointmentPayload {
  slug: string;
  serviceId: string;
  staffId: string | null;
  startAt: string;
  endAt: string;
  fullName: string;
  phone: string;
  customerNote?: string | null;
  kvkkConsent: boolean;
}

export interface CreatePublicAppointmentResult {
  status: AppointmentStatus;
  startAt: string;
  endAt: string;
}

export async function createPublicAppointmentAction(
  payload: CreatePublicAppointmentPayload
): Promise<CreatePublicAppointmentResult> {
  const business = resolveBusiness(payload.slug);
  const settings = getOrCreatePublicPageSettings(business.id);
  const service = resolveBookableService(business.id, payload.serviceId);
  if (payload.staffId) assertBookableStaff(business.id, payload.staffId);

  const fullName = payload.fullName.trim();
  const phone = payload.phone.trim();
  if (!fullName || !phone) throw new Error("Ad Soyad ve telefon numarası zorunludur.");
  if (!payload.kvkkConsent) throw new Error("Devam etmek için KVKK metnini onaylamalısınız.");

  const available = isSlotStillAvailable({
    businessId: business.id,
    service,
    staffId: payload.staffId,
    startAt: payload.startAt,
  });
  if (!available) throw new Error("Bu saat artık uygun değil, lütfen başka bir saat seçin.");

  const customer = findOrCreateCustomerByPhone(business.id, { fullName, phone, kvkkConsent: true });

  const appointment = createAppointment({
    businessId: business.id,
    customerId: customer.id,
    staffId: payload.staffId,
    serviceId: service.id,
    startAt: payload.startAt,
    endAt: payload.endAt,
    price: service.price,
    status: settings.autoConfirm ? "confirmed" : "pending",
    paymentStatus: "pending",
    customerNote: payload.customerNote || null,
    source: "public",
    createdByUserId: null,
  });

  createNotification({
    businessId: business.id,
    type: "appointment_created",
    title: "Yeni randevu talebi",
    body: `${fullName} — ${service.name} — ${formatDateTimeTR(appointment.startAt)}`,
    relatedAppointmentId: appointment.id,
  });

  recordAuditLog({
    businessId: business.id,
    action: "appointment.created",
    entityType: "appointment",
    entityId: appointment.id,
    meta: { source: "public" },
  });

  return { status: appointment.status, startAt: appointment.startAt, endAt: appointment.endAt };
}

export interface CreatePublicReviewPayload {
  slug: string;
  customerName: string;
  rating: number;
  comment?: string | null;
}

export async function createPublicReviewAction(payload: CreatePublicReviewPayload): Promise<Review> {
  const business = resolveBusiness(payload.slug);

  const customerName = payload.customerName.trim();
  const rating = Math.round(payload.rating);
  if (!customerName) throw new Error("Ad Soyad zorunludur.");
  if (rating < 1 || rating > 5) throw new Error("Lütfen 1 ile 5 arasında bir puan seçin.");

  return createReview(business.id, {
    customerName,
    rating,
    comment: payload.comment?.trim() || null,
  });
}
