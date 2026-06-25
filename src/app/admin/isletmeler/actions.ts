"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/session";
import { findBusinessById, setBusinessStatus, createBusiness, updateBusiness, slugExists } from "@/lib/db/repo/businesses";
import { findUserByEmail, createUser } from "@/lib/db/repo/users";
import { hashPassword } from "@/lib/password";
import { generateUniqueSlug } from "@/lib/slug";
import { seedDefaultAccountingCategories } from "@/lib/db/repo/accounting";
import { findPlanById, createSubscription } from "@/lib/db/repo/plans";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";

export async function setBusinessStatusAction(businessId: string, status: "active" | "inactive") {
  const user = await requireSuperAdmin();
  const business = findBusinessById(businessId);
  if (!business) throw new Error("İşletme bulunamadı.");

  setBusinessStatus(businessId, status);
  recordAuditLog({
    businessId,
    actorUserId: user.id,
    action: status === "active" ? "business.activated" : "business.suspended",
    entityType: "business",
    entityId: businessId,
  });

  revalidatePath("/admin/isletmeler");
  revalidatePath("/admin");
}

export interface UpdateBusinessInput {
  name: string;
  sector: string;
  phone: string;
  email: string;
  city: string;
}

export async function updateBusinessAction(businessId: string, input: UpdateBusinessInput) {
  const actor = await requireSuperAdmin();
  const existing = findBusinessById(businessId);
  if (!existing) throw new Error("İşletme bulunamadı.");

  const name = input.name.trim();
  if (!name) throw new Error("İşletme adı zorunludur.");

  const business = updateBusiness(businessId, {
    name,
    sector: input.sector,
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    city: input.city.trim() || null,
  });

  recordAuditLog({
    businessId,
    actorUserId: actor.id,
    action: "business.updated",
    entityType: "business",
    entityId: businessId,
  });

  revalidatePath("/admin/isletmeler");
  revalidatePath("/admin");
  return business;
}

export interface CreateBusinessInput {
  name: string;
  sector: string;
  phone: string;
  email: string;
  city: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPassword: string;
  planId: string;
  billingCycle: "monthly" | "yearly";
  subscriptionStatus: "trial" | "active";
}

export async function createBusinessAction(input: CreateBusinessInput) {
  const actor = await requireSuperAdmin();

  const name = input.name.trim();
  const ownerFullName = input.ownerFullName.trim();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();

  if (!name) throw new Error("İşletme adı zorunludur.");
  if (!ownerFullName) throw new Error("İşletme sahibi adı zorunludur.");
  if (!ownerEmail) throw new Error("İşletme sahibi e-postası zorunludur.");
  if (input.ownerPassword.length < 6) throw new Error("Şifre en az 6 karakter olmalıdır.");
  if (findUserByEmail(ownerEmail)) throw new Error("Bu e-posta adresi zaten kullanımda.");

  const plan = findPlanById(input.planId);
  if (!plan) throw new Error("Plan bulunamadı.");

  const slug = generateUniqueSlug(name, (candidate) => slugExists(candidate));
  const passwordHash = await hashPassword(input.ownerPassword);
  const owner = createUser({ email: ownerEmail, passwordHash, fullName: ownerFullName, role: "OWNER" });

  const business = createBusiness({
    ownerUserId: owner.id,
    name,
    slug,
    sector: input.sector,
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    city: input.city.trim() || null,
  });

  seedDefaultAccountingCategories(business.id);

  const trialEndsAt =
    input.subscriptionStatus === "trial" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null;
  createSubscription({
    businessId: business.id,
    planId: plan.id,
    status: input.subscriptionStatus,
    billingCycle: input.billingCycle,
    trialEndsAt,
  });

  recordAuditLog({
    businessId: business.id,
    actorUserId: actor.id,
    action: "business.created",
    entityType: "business",
    entityId: business.id,
    meta: { name: business.name, ownerEmail },
  });

  revalidatePath("/admin/isletmeler");
  revalidatePath("/admin");
  return business;
}
