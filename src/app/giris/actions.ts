"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUserByEmail } from "@/lib/db/repo/users";
import { verifyPassword } from "@/lib/password";
import { signSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    redirect(`/giris?error=missing${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  const user = findUserByEmail(email);
  if (!user || !user.isActive) {
    redirect(`/giris?error=invalid${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    redirect(`/giris?error=invalid${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  const token = await signSession({ userId: user.id, role: user.role });
  cookies().set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  recordAuditLog({ actorUserId: user.id, action: "login", entityType: "user", entityId: user.id });

  if (next && next.startsWith("/")) redirect(next);
  redirect(user.role === "SUPER_ADMIN" ? "/admin" : "/panel");
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE);
  redirect("/giris");
}
