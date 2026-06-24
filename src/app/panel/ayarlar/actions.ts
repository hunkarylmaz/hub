"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/session";
import { updateUserProfile, updateUserPassword, findUserById } from "@/lib/db/repo/users";
import { hashPassword, verifyPassword } from "@/lib/password";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";

export interface AccountProfileInput {
  fullName: string;
  phone: string | null;
}

export async function updateAccountProfileAction(input: AccountProfileInput) {
  const { user, business } = await requireBusinessContext();
  const fullName = input.fullName.trim();
  if (!fullName) throw new Error("Ad Soyad zorunludur.");

  updateUserProfile(user.id, { fullName, phone: input.phone });

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "user.profile_updated",
    entityType: "user",
    entityId: user.id,
  });

  revalidatePath("/panel/ayarlar");
  revalidatePath("/panel");
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function changePasswordAction(input: ChangePasswordInput) {
  const { user, business } = await requireBusinessContext();
  if (input.newPassword.length < 6) throw new Error("Yeni şifre en az 6 karakter olmalı.");

  const fullUser = findUserById(user.id);
  if (!fullUser) throw new Error("Kullanıcı bulunamadı.");

  const valid = await verifyPassword(input.currentPassword, fullUser.passwordHash);
  if (!valid) throw new Error("Mevcut şifre yanlış.");

  const newHash = await hashPassword(input.newPassword);
  updateUserPassword(user.id, newHash);

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "user.password_changed",
    entityType: "user",
    entityId: user.id,
  });
}
