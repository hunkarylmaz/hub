"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/session";
import { findBusinessById, setBusinessStatus } from "@/lib/db/repo/businesses";
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
