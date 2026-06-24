import { getDb, uid, nowIso } from "../client";
import { b } from "../mappers";
import type { User, UserRole } from "@/lib/types";

function mapUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    avatarUrl: row.avatar_url,
    isActive: b(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findUserByEmail(email: string): User | null {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(email.trim());
  return row ? mapUser(row) : null;
}

export function findUserById(id: string): User | null {
  const row = getDb().prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? mapUser(row) : null;
}

export function createUser(input: {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
}): User {
  const id = uid();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, avatar_url, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, 1, ?, ?)`
    )
    .run(id, input.email.trim().toLowerCase(), input.passwordHash, input.fullName, input.phone ?? null, input.role, now, now);
  return findUserById(id)!;
}

export function updateUserProfile(
  id: string,
  input: Partial<{ fullName: string; phone: string | null; avatarUrl: string | null }>
): User {
  const current = findUserById(id);
  if (!current) throw new Error("Kullanıcı bulunamadı");
  const fullName = input.fullName ?? current.fullName;
  const phone = input.phone === undefined ? current.phone : input.phone;
  const avatarUrl = input.avatarUrl === undefined ? current.avatarUrl : input.avatarUrl;
  getDb()
    .prepare("UPDATE users SET full_name = ?, phone = ?, avatar_url = ?, updated_at = ? WHERE id = ?")
    .run(fullName, phone, avatarUrl, nowIso(), id);
  return findUserById(id)!;
}

export function updateUserPassword(id: string, passwordHash: string) {
  getDb().prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(passwordHash, nowIso(), id);
}

export function listAllUsers(): User[] {
  const rows = getDb().prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  return rows.map(mapUser);
}
