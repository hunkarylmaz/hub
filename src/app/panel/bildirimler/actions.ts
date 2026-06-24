"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/session";
import { findNotificationById, markNotificationRead, markAllNotificationsRead } from "@/lib/db/repo/notifications";

function revalidateBildirimlerViews() {
  revalidatePath("/panel/bildirimler");
  revalidatePath("/panel");
}

export async function markNotificationReadAction(id: string) {
  const { business } = await requireBusinessContext();
  const existing = findNotificationById(id);
  if (!existing || existing.businessId !== business.id) throw new Error("Bildirim bulunamadı.");

  markNotificationRead(id);
  revalidateBildirimlerViews();
}

export async function markAllNotificationsReadAction() {
  const { business } = await requireBusinessContext();
  markAllNotificationsRead(business.id);
  revalidateBildirimlerViews();
}
