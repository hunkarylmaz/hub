"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/session";
import { updatePlan as updatePlanRepo, findPlanById } from "@/lib/db/repo/plans";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";
import type { Plan } from "@/lib/types";

export async function updatePlanAction(planId: string, patch: Partial<Omit<Plan, "id">>) {
  const user = await requireSuperAdmin();
  const existing = findPlanById(planId);
  if (!existing) throw new Error("Plan bulunamadı.");

  const updated = updatePlanRepo(planId, patch);
  recordAuditLog({
    actorUserId: user.id,
    action: "plan.updated",
    entityType: "plan",
    entityId: planId,
  });

  revalidatePath("/admin/planlar");
  revalidatePath("/admin/abonelikler");
  revalidatePath("/panel/abonelik");
  return updated;
}
