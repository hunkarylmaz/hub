import { getDb, uid, nowIso } from "../client";
import { b } from "../mappers";
import type { Service, ServiceCategory } from "@/lib/types";

function mapCategory(row: any): ServiceCategory {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function mapService(row: any): Service {
  return {
    id: row.id,
    businessId: row.business_id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    bufferMinutes: row.buffer_minutes,
    price: row.price,
    currency: row.currency,
    color: row.color,
    isOnlineBookable: b(row.is_online_bookable),
    requiresDeposit: b(row.requires_deposit),
    depositAmount: row.deposit_amount,
    isActive: b(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listCategories(businessId: string): ServiceCategory[] {
  return getDb()
    .prepare("SELECT * FROM service_categories WHERE business_id = ? ORDER BY sort_order ASC, created_at ASC")
    .all(businessId)
    .map(mapCategory);
}

export function createCategory(businessId: string, name: string, color = "#7C3AED"): ServiceCategory {
  const id = uid();
  getDb()
    .prepare("INSERT INTO service_categories (id, business_id, name, color, sort_order, created_at) VALUES (?, ?, ?, ?, 0, ?)")
    .run(id, businessId, name, color, nowIso());
  return mapCategory(getDb().prepare("SELECT * FROM service_categories WHERE id = ?").get(id));
}

export function listServices(businessId: string, opts: { onlyActive?: boolean } = {}): Service[] {
  const sql = opts.onlyActive
    ? "SELECT * FROM services WHERE business_id = ? AND is_active = 1 ORDER BY created_at ASC"
    : "SELECT * FROM services WHERE business_id = ? ORDER BY created_at ASC";
  return getDb().prepare(sql).all(businessId).map(mapService);
}

export function findServiceById(id: string): Service | null {
  const row = getDb().prepare("SELECT * FROM services WHERE id = ?").get(id);
  return row ? mapService(row) : null;
}

export interface ServiceInput {
  categoryId?: string | null;
  name: string;
  description?: string | null;
  durationMinutes: number;
  bufferMinutes?: number;
  price: number;
  color?: string;
  isOnlineBookable?: boolean;
  requiresDeposit?: boolean;
  depositAmount?: number;
}

export function createService(businessId: string, input: ServiceInput): Service {
  const id = uid();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO services
        (id, business_id, category_id, name, description, duration_minutes, buffer_minutes, price, currency, color,
         is_online_bookable, requires_deposit, deposit_amount, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'TRY', ?, ?, ?, ?, 1, ?, ?)`
    )
    .run(
      id,
      businessId,
      input.categoryId ?? null,
      input.name,
      input.description ?? null,
      input.durationMinutes,
      input.bufferMinutes ?? 0,
      input.price,
      input.color ?? "#3B82F6",
      input.isOnlineBookable === false ? 0 : 1,
      input.requiresDeposit ? 1 : 0,
      input.depositAmount ?? 0,
      now,
      now
    );
  return findServiceById(id)!;
}

export function updateService(id: string, input: Partial<ServiceInput> & { isActive?: boolean }): Service {
  const current = findServiceById(id);
  if (!current) throw new Error("Hizmet bulunamadı");
  const merged = {
    categoryId: input.categoryId === undefined ? current.categoryId : input.categoryId,
    name: input.name ?? current.name,
    description: input.description === undefined ? current.description : input.description,
    durationMinutes: input.durationMinutes ?? current.durationMinutes,
    bufferMinutes: input.bufferMinutes ?? current.bufferMinutes,
    price: input.price ?? current.price,
    color: input.color ?? current.color,
    isOnlineBookable: input.isOnlineBookable ?? current.isOnlineBookable,
    requiresDeposit: input.requiresDeposit ?? current.requiresDeposit,
    depositAmount: input.depositAmount ?? current.depositAmount,
    isActive: input.isActive ?? current.isActive,
  };
  getDb()
    .prepare(
      `UPDATE services SET category_id=?, name=?, description=?, duration_minutes=?, buffer_minutes=?, price=?, color=?,
       is_online_bookable=?, requires_deposit=?, deposit_amount=?, is_active=?, updated_at=? WHERE id=?`
    )
    .run(
      merged.categoryId,
      merged.name,
      merged.description,
      merged.durationMinutes,
      merged.bufferMinutes,
      merged.price,
      merged.color,
      merged.isOnlineBookable ? 1 : 0,
      merged.requiresDeposit ? 1 : 0,
      merged.depositAmount,
      merged.isActive ? 1 : 0,
      nowIso(),
      id
    );
  return findServiceById(id)!;
}

export function deleteService(id: string) {
  getDb().prepare("DELETE FROM staff_services WHERE service_id = ?").run(id);
  getDb().prepare("DELETE FROM services WHERE id = ?").run(id);
}

export function listServiceIdsForStaff(staffId: string): string[] {
  return getDb()
    .prepare("SELECT service_id FROM staff_services WHERE staff_id = ?")
    .all(staffId)
    .map((r: any) => r.service_id);
}

export function listStaffIdsForService(serviceId: string): string[] {
  return getDb()
    .prepare("SELECT staff_id FROM staff_services WHERE service_id = ?")
    .all(serviceId)
    .map((r: any) => r.staff_id);
}

export function setStaffServices(staffId: string, serviceIds: string[]) {
  const db = getDb();
  db.prepare("DELETE FROM staff_services WHERE staff_id = ?").run(staffId);
  const ins = db.prepare("INSERT INTO staff_services (id, staff_id, service_id) VALUES (?, ?, ?)");
  for (const serviceId of serviceIds) ins.run(uid(), staffId, serviceId);
}

export function setServiceStaff(serviceId: string, staffIds: string[]) {
  const db = getDb();
  db.prepare("DELETE FROM staff_services WHERE service_id = ?").run(serviceId);
  const ins = db.prepare("INSERT INTO staff_services (id, staff_id, service_id) VALUES (?, ?, ?)");
  for (const staffId of staffIds) ins.run(uid(), staffId, serviceId);
}
