"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/session";
import { updatePlan as updatePlanRepo, findPlanById, findPlanBySlug, createPlan, listPlans } from "@/lib/db/repo/plans";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";
import { generateUniqueSlug } from "@/lib/slug";
import type { Plan } from "@/lib/types";

export async function createPlanAction(input: Omit<Plan, "id" | "slug" | "sortOrder"> & { slug?: string }) {
  const user = await requireSuperAdmin();
  if (!input.name.trim()) throw new Error("Plan adı zorunludur.");

  const slug = generateUniqueSlug(input.slug?.trim() || input.name, (candidate) => findPlanBySlug(candidate) !== null);
  const sortOrder = listPlans().length;

  const created = createPlan({
    name: input.name.trim(),
    slug,
    monthlyPrice: input.monthlyPrice,
    yearlyPrice: input.yearlyPrice,
    originalMonthlyPrice: input.originalMonthlyPrice,
    originalYearlyPrice: input.originalYearlyPrice,
    maxStaff: input.maxStaff,
    maxBranches: input.maxBranches,
    maxMonthlyAppointments: input.maxMonthlyAppointments,
    hasAccounting: input.hasAccounting,
    hasAdvancedReports: input.hasAdvancedReports,
    hasSmsWhatsapp: input.hasSmsWhatsapp,
    isActive: input.isActive,
    sortOrder,
  });

  recordAuditLog({
    actorUserId: user.id,
    action: "plan.created",
    entityType: "plan",
    entityId: created.id,
    meta: { name: created.name },
  });

  revalidatePath("/admin/planlar");
  revalidatePath("/");
  return created;
}

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
  revalidatePath("/");
  return updated;
}
