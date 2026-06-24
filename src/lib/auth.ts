import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/lib/types";

export const SESSION_COOKIE = "rezervasyo_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 gün

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || "rezervasyo-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  role: UserRole;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") return null;
    return { userId: payload.userId, role: payload.role as UserRole };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
