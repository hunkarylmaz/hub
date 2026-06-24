import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Generates a random human-typeable password for newly created staff logins. */
export function generateTempPassword(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (n) => PASSWORD_CHARS[n % PASSWORD_CHARS.length]).join("");
}
