import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "@/lib/auth";
import { findUserById } from "@/lib/db/repo/users";
import { findBusinessByOwnerId, findBusinessUserForUser, findBusinessById } from "@/lib/db/repo/businesses";
import type { SafeUser, Business, UserRole } from "@/lib/types";

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getSession();
  if (!session) return null;
  const user = findUserById(session.userId);
  if (!user || !user.isActive) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  return user;
}

export async function requireRole(roles: UserRole[]): Promise<SafeUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/giris");
  return user;
}

export interface BusinessContext {
  user: SafeUser;
  business: Business;
  membershipRole: "OWNER" | "STAFF";
  permissions: Record<string, boolean>;
}

/** Resolves the active business for the logged-in OWNER/STAFF user, redirecting if none exists yet. */
export async function requireBusinessContext(): Promise<BusinessContext> {
  const user = await requireRole(["OWNER", "STAFF"]);

  if (user.role === "OWNER") {
    const ownedBusiness = findBusinessByOwnerId(user.id);
    if (ownedBusiness) return { user, business: ownedBusiness, membershipRole: "OWNER", permissions: {} };
  }

  const membership = findBusinessUserForUser(user.id);
  if (!membership) redirect(user.role === "OWNER" ? "/onboarding" : "/giris");
  const business = findBusinessById(membership.businessId);
  if (!business) redirect("/giris");
  return { user, business, membershipRole: membership.role, permissions: membership.permissions };
}

export async function requireSuperAdmin(): Promise<SafeUser> {
  return requireRole(["SUPER_ADMIN"]);
}
