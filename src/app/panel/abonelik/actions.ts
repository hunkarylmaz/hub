"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/session";
import { findPlanById, findSubscriptionByBusiness, createSubscription, updateSubscriptionPlan } from "@/lib/db/repo/plans";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";

export async function selectPlanAction(planId: string) {
  const { user, business } = await requireBusinessContext();
  const plan = findPlanById(planId);
  if (!plan || !plan.isActive) throw new Error("Plan bulunamadı.");

  const existing = findSubscriptionByBusiness(business.id);
  if (existing) {
    updateSubscriptionPlan(business.id, planId);
  } else {
    createSubscription({ businessId: business.id, planId, status: "trial" });
  }

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "subscription.plan_changed",
    entityType: "subscription",
    entityId: business.id,
    meta: { planId, planName: plan.name },
  });

  revalidatePath("/panel/abonelik");
}
