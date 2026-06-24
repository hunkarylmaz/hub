"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getDb } from "@/lib/db/client";
import { slugExists, createBusiness, updateBusiness, findBusinessByOwnerId } from "@/lib/db/repo/businesses";
import { normalizeSlug, isReservedSlug, isValidSlugFormat } from "@/lib/slug";
import { createService, setStaffServices } from "@/lib/db/repo/services";
import { createStaff, setWorkingHours } from "@/lib/db/repo/staff";
import { seedDefaultAccountingCategories } from "@/lib/db/repo/accounting";
import { listPlans, createSubscription } from "@/lib/db/repo/plans";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";

export async function checkSlugAvailability(rawSlug: string): Promise<{ available: boolean; reason?: string; normalized: string }> {
  const normalized = normalizeSlug(rawSlug);
  if (!isValidSlugFormat(normalized)) {
    return { available: false, reason: "Adres en az 3 karakter olmalı, yalnızca küçük harf/rakam/tire içerebilir.", normalized };
  }
  if (isReservedSlug(normalized)) return { available: false, reason: "Bu adres sistem tarafından rezerve edilmiş.", normalized };
  if (slugExists(normalized)) return { available: false, reason: "Bu adres başka bir işletme tarafından kullanılıyor.", normalized };
  return { available: true, normalized };
}

export interface OnboardingServiceInput {
  name: string;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
}

export interface OnboardingStaffInput {
  fullName: string;
  title: string;
  phone: string;
}

export interface OnboardingHourInput {
  weekday: number;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
}

export interface OnboardingPayload {
  business: {
    name: string;
    slug: string;
    sector: string;
    phone: string;
    email: string;
    city: string;
    district: string;
    address: string;
    description: string;
  };
  services: OnboardingServiceInput[];
  staff: OnboardingStaffInput[];
  hours: OnboardingHourInput[];
}

export async function completeOnboardingAction(input: OnboardingPayload) {
  const user = await requireRole(["OWNER"]);

  if (findBusinessByOwnerId(user.id)) {
    redirect("/panel");
  }

  if (!input.business.name.trim()) throw new Error("İşletme adı zorunludur.");
  if (input.services.length === 0) throw new Error("En az bir hizmet eklemelisiniz.");

  const slugCheck = await checkSlugAvailability(input.business.slug);
  if (!slugCheck.available) throw new Error(slugCheck.reason ?? "Geçersiz adres.");

  const db = getDb();
  db.exec("BEGIN");
  try {
    const business = createBusiness({
      ownerUserId: user.id,
      name: input.business.name.trim(),
      slug: slugCheck.normalized,
      sector: input.business.sector,
      phone: input.business.phone || null,
      email: input.business.email || null,
      city: input.business.city || null,
      district: input.business.district || null,
      address: input.business.address || null,
      description: input.business.description || null,
    });

    const createdServices = input.services
      .filter((s) => s.name.trim())
      .map((s) =>
        createService(business.id, {
          name: s.name.trim(),
          durationMinutes: Math.max(5, s.durationMinutes || 30),
          bufferMinutes: Math.max(0, s.bufferMinutes || 0),
          price: Math.max(0, s.price || 0),
        })
      );

    const createdStaff = input.staff
      .filter((s) => s.fullName.trim())
      .map((s) => createStaff(business.id, { fullName: s.fullName.trim(), title: s.title || null, phone: s.phone || null }));

    for (const member of createdStaff) {
      setStaffServices(member.id, createdServices.map((s) => s.id));
    }

    setWorkingHours(
      business.id,
      input.hours.map((h) => ({
        weekday: h.weekday,
        isClosed: h.isClosed,
        openTime: h.isClosed ? null : h.openTime,
        closeTime: h.isClosed ? null : h.closeTime,
        breakStart: null,
        breakEnd: null,
      }))
    );

    seedDefaultAccountingCategories(business.id);

    const plans = listPlans();
    if (plans.length > 0) {
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      createSubscription({ businessId: business.id, planId: plans[0].id, status: "trial", trialEndsAt });
    }

    updateBusiness(business.id, { onboardingStep: "done", onboardingCompleted: true });
    db.exec("COMMIT");

    recordAuditLog({ businessId: business.id, actorUserId: user.id, action: "onboarding_completed", entityType: "business", entityId: business.id });
    redirect(`/onboarding/hazir?slug=${encodeURIComponent(business.slug)}`);
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
