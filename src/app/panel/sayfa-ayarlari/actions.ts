"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/session";
import { updateBusiness } from "@/lib/db/repo/businesses";
import { setWorkingHours } from "@/lib/db/repo/staff";
import { updatePublicPageSettings } from "@/lib/db/repo/publicPageSettings";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";

function revalidateSayfaAyarlariViews() {
  revalidatePath("/panel/sayfa-ayarlari");
  revalidatePath("/panel/genel-bakis");
  revalidatePath("/panel/takvim");
}

export interface BusinessProfileInput {
  name: string;
  sector: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  instagram: string | null;
  website: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  themeColor: string;
}

export async function updateBusinessProfileAction(input: BusinessProfileInput) {
  const { user, business } = await requireBusinessContext();
  const name = input.name.trim();
  if (!name) throw new Error("İşletme adı zorunludur.");

  const updated = updateBusiness(business.id, { ...input, name });

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "business.profile_updated",
    entityType: "business",
    entityId: business.id,
  });

  revalidateSayfaAyarlariViews();
  return updated;
}

export interface BookingSettingsInput {
  showAddress: boolean;
  showPhone: boolean;
  autoConfirm: boolean;
  depositEnabled: boolean;
  bookingWindowDays: number;
  minNoticeHours: number;
  cancellationPolicy: string | null;
  kvkkText: string | null;
}

export async function updateBookingSettingsAction(input: BookingSettingsInput) {
  const { user, business } = await requireBusinessContext();
  const updated = updatePublicPageSettings(business.id, input);

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "business.booking_settings_updated",
    entityType: "business",
    entityId: business.id,
  });

  revalidateSayfaAyarlariViews();
  return updated;
}

export interface BusinessHourInput {
  weekday: number;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
}

export async function saveBusinessHoursAction(hours: BusinessHourInput[]) {
  const { user, business } = await requireBusinessContext();
  setWorkingHours(business.id, hours);

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "business.hours_updated",
    entityType: "business",
    entityId: business.id,
  });

  revalidateSayfaAyarlariViews();
}
