import { getDb, uid, nowIso } from "../client";
import { b, parseJson } from "../mappers";
import type { Business, BusinessUser } from "@/lib/types";

function mapBusiness(row: any): Business {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    slug: row.slug,
    sector: row.sector,
    phone: row.phone,
    email: row.email,
    city: row.city,
    district: row.district,
    address: row.address,
    instagram: row.instagram,
    website: row.website,
    description: row.description,
    logoUrl: row.logo_url,
    coverUrl: row.cover_url,
    themeColor: row.theme_color,
    status: row.status,
    onboardingStep: row.onboarding_step,
    onboardingCompleted: b(row.onboarding_completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBusinessUser(row: any): BusinessUser {
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    role: row.role,
    permissions: parseJson(row.permissions, {}),
    createdAt: row.created_at,
  };
}

export function slugExists(slug: string): boolean {
  return !!getDb().prepare("SELECT id FROM businesses WHERE slug = ?").get(slug);
}

export function createBusiness(input: {
  ownerUserId: string;
  name: string;
  slug: string;
  sector: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  instagram?: string | null;
  website?: string | null;
  description?: string | null;
}): Business {
  const id = uid();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO businesses
        (id, owner_user_id, name, slug, sector, phone, email, city, district, address, instagram, website, description,
         logo_url, cover_url, theme_color, status, onboarding_step, onboarding_completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, '#5817B0', 'active', 'services', 0, ?, ?)`
    )
    .run(
      id,
      input.ownerUserId,
      input.name,
      input.slug,
      input.sector,
      input.phone ?? null,
      input.email ?? null,
      input.city ?? null,
      input.district ?? null,
      input.address ?? null,
      input.instagram ?? null,
      input.website ?? null,
      input.description ?? null,
      now,
      now
    );

  getDb()
    .prepare(
      `INSERT INTO business_users (id, business_id, user_id, role, permissions, created_at) VALUES (?, ?, ?, 'OWNER', '{}', ?)`
    )
    .run(uid(), id, input.ownerUserId, now);

  return findBusinessById(id)!;
}

export function findBusinessById(id: string): Business | null {
  const row = getDb().prepare("SELECT * FROM businesses WHERE id = ?").get(id);
  return row ? mapBusiness(row) : null;
}

export function findBusinessBySlug(slug: string): Business | null {
  const row = getDb().prepare("SELECT * FROM businesses WHERE slug = ?").get(slug);
  return row ? mapBusiness(row) : null;
}

export function findBusinessByOwnerId(ownerUserId: string): Business | null {
  const row = getDb()
    .prepare("SELECT * FROM businesses WHERE owner_user_id = ? ORDER BY created_at ASC LIMIT 1")
    .get(ownerUserId);
  return row ? mapBusiness(row) : null;
}

export function findBusinessUserForUser(userId: string): BusinessUser | null {
  const row = getDb()
    .prepare("SELECT * FROM business_users WHERE user_id = ? ORDER BY created_at ASC LIMIT 1")
    .get(userId);
  return row ? mapBusinessUser(row) : null;
}

export function listBusinessUsers(businessId: string): (BusinessUser & { fullName: string; email: string; phone: string | null })[] {
  const rows = getDb()
    .prepare(
      `SELECT bu.*, u.full_name, u.email, u.phone FROM business_users bu
       JOIN users u ON u.id = bu.user_id WHERE bu.business_id = ? ORDER BY bu.created_at ASC`
    )
    .all(businessId);
  return rows.map((row: any) => ({ ...mapBusinessUser(row), fullName: row.full_name, email: row.email, phone: row.phone }));
}

export function addBusinessUser(businessId: string, userId: string, role: "OWNER" | "STAFF", permissions: Record<string, boolean> = {}) {
  getDb()
    .prepare("INSERT INTO business_users (id, business_id, user_id, role, permissions, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(uid(), businessId, userId, role, JSON.stringify(permissions), nowIso());
}

export function updateBusiness(id: string, patch: Partial<Business>): Business {
  const current = findBusinessById(id);
  if (!current) throw new Error("İşletme bulunamadı");
  const merged = { ...current, ...patch };
  getDb()
    .prepare(
      `UPDATE businesses SET name=?, sector=?, phone=?, email=?, city=?, district=?, address=?, instagram=?, website=?,
       description=?, logo_url=?, cover_url=?, theme_color=?, onboarding_step=?, onboarding_completed=?, updated_at=?
       WHERE id = ?`
    )
    .run(
      merged.name,
      merged.sector,
      merged.phone,
      merged.email,
      merged.city,
      merged.district,
      merged.address,
      merged.instagram,
      merged.website,
      merged.description,
      merged.logoUrl,
      merged.coverUrl,
      merged.themeColor,
      merged.onboardingStep,
      merged.onboardingCompleted ? 1 : 0,
      nowIso(),
      id
    );
  return findBusinessById(id)!;
}

export function setBusinessStatus(id: string, status: "active" | "inactive") {
  getDb().prepare("UPDATE businesses SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(), id);
}

export function listBusinesses(): Business[] {
  const rows = getDb().prepare("SELECT * FROM businesses ORDER BY created_at DESC").all();
  return rows.map(mapBusiness);
}

export function countBusinesses(): number {
  const row: any = getDb().prepare("SELECT COUNT(*) as c FROM businesses").get();
  return row.c as number;
}

// ---------- Public directory ----------

export interface DirectoryFilters {
  city?: string;
  sector?: string;
  query?: string;
}

/** Lists businesses with an active subscription, optionally filtered by city/sector/name-or-service search. Powers the public /isletmeler directory. */
export function listDirectoryBusinesses(filters: DirectoryFilters = {}): Business[] {
  let sql = `
    SELECT DISTINCT b.* FROM businesses b
    JOIN subscriptions s ON s.business_id = b.id
    LEFT JOIN services sv ON sv.business_id = b.id AND sv.is_active = 1
    WHERE b.status = 'active' AND s.status = 'active'`;
  const params: any[] = [];
  if (filters.city) {
    sql += " AND b.city = ?";
    params.push(filters.city);
  }
  if (filters.sector) {
    sql += " AND b.sector = ?";
    params.push(filters.sector);
  }
  if (filters.query) {
    sql += " AND (b.name LIKE ? OR sv.name LIKE ?)";
    params.push(`%${filters.query}%`, `%${filters.query}%`);
  }
  sql += " ORDER BY b.created_at DESC";
  return getDb().prepare(sql).all(...params).map(mapBusiness);
}

export function listDirectoryCities(): string[] {
  const rows = getDb()
    .prepare(
      `SELECT DISTINCT b.city as city FROM businesses b
       JOIN subscriptions s ON s.business_id = b.id
       WHERE b.status = 'active' AND s.status = 'active' AND b.city IS NOT NULL
       ORDER BY b.city ASC`
    )
    .all();
  return rows.map((r: any) => r.city as string);
}
