"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/session";
import { findSubscriptionByBusiness, updateSubscriptionStatus, updateSubscriptionPlan, findPlanById } from "@/lib/db/repo/plans";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";
import type { SubscriptionStatus } from "@/lib/types";

export async function updateSubscriptionStatusAction(businessId: string, status: SubscriptionStatus) {
  const user = await requireSuperAdmin();
  const subscription = findSubscriptionByBusiness(businessId);
  if (!subscription) throw new Error("Abonelik bulunamadı.");

  updateSubscriptionStatus(businessId, status);
  recordAuditLog({
    businessId,
    actorUserId: user.id,
    action: "subscription.status_changed",
    entityType: "subscription",
    entityId: subscription.id,
    meta: { from: subscription.status, to: status },
  });

  revalidatePath("/admin/abonelikler");
  revalidatePath("/admin");
}

export async function updateSubscriptionPlanAction(businessId: string, planId: string) {
  const user = await requireSuperAdmin();
  const subscription = findSubscriptionByBusiness(businessId);
  if (!subscription) throw new Error("Abonelik bulunamadı.");
  const plan = findPlanById(planId);
  if (!plan) throw new Error("Plan bulunamadı.");

  updateSubscriptionPlan(businessId, planId);
  recordAuditLog({
    businessId,
    actorUserId: user.id,
    action: "subscription.plan_changed",
    entityType: "subscription",
    entityId: subscription.id,
    meta: { from: subscription.planId, to: planId },
  });

  revalidatePath("/admin/abonelikler");
  revalidatePath("/admin");
}
