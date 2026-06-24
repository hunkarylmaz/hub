"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUserByEmail, createUser } from "@/lib/db/repo/users";
import { hashPassword } from "@/lib/password";
import { signSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";

export async function registerAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || password.length < 6) {
    redirect("/kayit?error=invalid");
  }

  if (findUserByEmail(email)) {
    redirect("/kayit?error=exists");
  }

  const passwordHash = await hashPassword(password);
  const user = createUser({ email, passwordHash, fullName, phone: phone || null, role: "OWNER" });
  recordAuditLog({ actorUserId: user.id, action: "register", entityType: "user", entityId: user.id });

  const token = await signSession({ userId: user.id, role: user.role });
  cookies().set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);

  redirect("/onboarding");
}
