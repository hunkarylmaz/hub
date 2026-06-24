"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/session";
import { findUserByEmail, createUser } from "@/lib/db/repo/users";
import { findBusinessById, addBusinessUser } from "@/lib/db/repo/businesses";
import { hashPassword } from "@/lib/password";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";
import type { UserRole } from "@/lib/types";

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  businessId?: string;
}

export async function createUserAction(input: CreateUserInput) {
  const actor = await requireSuperAdmin();

  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const isBusinessUser = input.role !== "SUPER_ADMIN";
  const businessId = input.businessId?.trim() || "";

  if (!fullName) throw new Error("Ad soyad zorunludur.");
  if (!email) throw new Error("E-posta zorunludur.");
  if (input.password.length < 6) throw new Error("Şifre en az 6 karakter olmalıdır.");
  if (findUserByEmail(email)) throw new Error("Bu e-posta adresi zaten kullanımda.");
  if (isBusinessUser && !businessId) throw new Error("İşletme kullanıcıları için bir işletme seçilmelidir.");

  let business = null;
  if (isBusinessUser) {
    business = findBusinessById(businessId);
    if (!business) throw new Error("Seçilen işletme bulunamadı.");
  }

  const passwordHash = await hashPassword(input.password);
  const user = createUser({ email, passwordHash, fullName, phone: phone || null, role: input.role });

  if (business) {
    addBusinessUser(business.id, user.id, input.role as "OWNER" | "STAFF");
  }

  recordAuditLog({
    businessId: business?.id,
    actorUserId: actor.id,
    action: "user.created",
    entityType: "user",
    entityId: user.id,
    meta: { email: user.email, role: user.role, businessId: business?.id ?? null },
  });

  revalidatePath("/admin/kullanicilar");
  const { passwordHash: _omit, ...safeUser } = user;
  return safeUser;
}
