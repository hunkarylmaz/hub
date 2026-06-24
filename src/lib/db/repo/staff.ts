import { getDb, uid, nowIso } from "../client";
import { b } from "../mappers";
import type { Staff, WorkingHour, StaffWorkingHour, BlockedTime, SpecialDay, CompensationType } from "@/lib/types";

function mapStaff(row: any): Staff {
  return {
    id: row.id,
    businessId: row.business_id,
    branchId: row.branch_id,
    userId: row.user_id,
    fullName: row.full_name,
    photoUrl: row.photo_url,
    phone: row.phone,
    email: row.email,
    title: row.title,
    isBookableOnline: b(row.is_bookable_online),
    isActive: b(row.is_active),
    compensationType: row.compensation_type,
    baseSalary: row.base_salary,
    commissionRate: row.commission_rate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listStaff(businessId: string, opts: { onlyActive?: boolean } = {}): Staff[] {
  const sql = opts.onlyActive
    ? "SELECT * FROM staff WHERE business_id = ? AND is_active = 1 ORDER BY created_at ASC"
    : "SELECT * FROM staff WHERE business_id = ? ORDER BY created_at ASC";
  return getDb().prepare(sql).all(businessId).map(mapStaff);
}

export function findStaffById(id: string): Staff | null {
  const row = getDb().prepare("SELECT * FROM staff WHERE id = ?").get(id);
  return row ? mapStaff(row) : null;
}

export interface StaffInput {
  branchId?: string | null;
  fullName: string;
  photoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  title?: string | null;
  isBookableOnline?: boolean;
  compensationType?: CompensationType;
  baseSalary?: number;
  commissionRate?: number;
}

export function createStaff(businessId: string, input: StaffInput, userId: string | null = null): Staff {
  const id = uid();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO staff (id, business_id, branch_id, user_id, full_name, photo_url, phone, email, title,
        is_bookable_online, is_active, compensation_type, base_salary, commission_rate, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      businessId,
      input.branchId ?? null,
      userId,
      input.fullName,
      input.photoUrl ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.title ?? null,
      input.isBookableOnline === false ? 0 : 1,
      input.compensationType ?? "FIXED",
      input.baseSalary ?? 0,
      input.commissionRate ?? 0,
      now,
      now
    );
  return findStaffById(id)!;
}

export function updateStaff(id: string, input: Partial<StaffInput> & { isActive?: boolean }): Staff {
  const current = findStaffById(id);
  if (!current) throw new Error("Çalışan bulunamadı");
  const merged = {
    branchId: input.branchId === undefined ? current.branchId : input.branchId,
    fullName: input.fullName ?? current.fullName,
    photoUrl: input.photoUrl === undefined ? current.photoUrl : input.photoUrl,
    phone: input.phone === undefined ? current.phone : input.phone,
    email: input.email === undefined ? current.email : input.email,
    title: input.title === undefined ? current.title : input.title,
    isBookableOnline: input.isBookableOnline ?? current.isBookableOnline,
    isActive: input.isActive ?? current.isActive,
    compensationType: input.compensationType ?? current.compensationType,
    baseSalary: input.baseSalary ?? current.baseSalary,
    commissionRate: input.commissionRate ?? current.commissionRate,
  };
  getDb()
    .prepare(
      `UPDATE staff SET branch_id=?, full_name=?, photo_url=?, phone=?, email=?, title=?, is_bookable_online=?, is_active=?,
       compensation_type=?, base_salary=?, commission_rate=?, updated_at=?
       WHERE id = ?`
    )
    .run(
      merged.branchId,
      merged.fullName,
      merged.photoUrl,
      merged.phone,
      merged.email,
      merged.title,
      merged.isBookableOnline ? 1 : 0,
      merged.isActive ? 1 : 0,
      merged.compensationType,
      merged.baseSalary,
      merged.commissionRate,
      nowIso(),
      id
    );
  return findStaffById(id)!;
}

export function findStaffByUserId(userId: string): Staff | null {
  const row = getDb().prepare("SELECT * FROM staff WHERE user_id = ?").get(userId);
  return row ? mapStaff(row) : null;
}

export interface StaffEarnings {
  staffId: string;
  compensationType: CompensationType;
  baseSalary: number;
  commissionRate: number;
  completedCount: number;
  totalRevenue: number;
  commissionEarned: number;
  totalEarnings: number;
}

/** Computes a staff member's earnings from completed appointments in an optional date range (ISO instants, inclusive start / exclusive end). */
export function calculateStaffEarnings(staffId: string, fromIso?: string, toIso?: string): StaffEarnings {
  const staff = findStaffById(staffId);
  if (!staff) throw new Error("Çalışan bulunamadı");

  let row: any;
  if (fromIso && toIso) {
    row = getDb()
      .prepare(
        `SELECT COUNT(*) as cnt, COALESCE(SUM(price), 0) as revenue FROM appointments
         WHERE staff_id = ? AND status = 'completed' AND start_at >= ? AND start_at < ?`
      )
      .get(staffId, fromIso, toIso);
  } else {
    row = getDb()
      .prepare(`SELECT COUNT(*) as cnt, COALESCE(SUM(price), 0) as revenue FROM appointments WHERE staff_id = ? AND status = 'completed'`)
      .get(staffId);
  }

  const completedCount = row.cnt as number;
  const totalRevenue = row.revenue as number;
  const commissionEarned =
    staff.compensationType === "COMMISSION" || staff.compensationType === "FIXED_COMMISSION"
      ? Math.round(totalRevenue * (staff.commissionRate / 100) * 100) / 100
      : 0;
  const baseSalary = staff.compensationType === "FIXED" || staff.compensationType === "FIXED_COMMISSION" ? staff.baseSalary : 0;

  return {
    staffId,
    compensationType: staff.compensationType,
    baseSalary: staff.baseSalary,
    commissionRate: staff.commissionRate,
    completedCount,
    totalRevenue,
    commissionEarned,
    totalEarnings: baseSalary + commissionEarned,
  };
}

export function deleteStaff(id: string) {
  getDb().prepare("DELETE FROM staff_services WHERE staff_id = ?").run(id);
  getDb().prepare("DELETE FROM staff_working_hours WHERE staff_id = ?").run(id);
  getDb().prepare("DELETE FROM staff WHERE id = ?").run(id);
}

// ---------- Working hours (business-level) ----------

function mapWorkingHour(row: any): WorkingHour {
  return {
    id: row.id,
    businessId: row.business_id,
    branchId: row.branch_id,
    weekday: row.weekday,
    isClosed: b(row.is_closed),
    openTime: row.open_time,
    closeTime: row.close_time,
    breakStart: row.break_start,
    breakEnd: row.break_end,
  };
}

export function listWorkingHours(businessId: string): WorkingHour[] {
  return getDb()
    .prepare("SELECT * FROM working_hours WHERE business_id = ? ORDER BY weekday ASC")
    .all(businessId)
    .map(mapWorkingHour);
}

export function setWorkingHours(
  businessId: string,
  hours: { weekday: number; isClosed: boolean; openTime: string | null; closeTime: string | null; breakStart: string | null; breakEnd: string | null }[]
) {
  const db = getDb();
  db.prepare("DELETE FROM working_hours WHERE business_id = ?").run(businessId);
  const ins = db.prepare(
    `INSERT INTO working_hours (id, business_id, branch_id, weekday, is_closed, open_time, close_time, break_start, break_end)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)`
  );
  for (const h of hours) {
    ins.run(uid(), businessId, h.weekday, h.isClosed ? 1 : 0, h.openTime, h.closeTime, h.breakStart, h.breakEnd);
  }
}

// ---------- Staff working hours ----------

function mapStaffWorkingHour(row: any): StaffWorkingHour {
  return {
    id: row.id,
    staffId: row.staff_id,
    weekday: row.weekday,
    isOff: b(row.is_off),
    startTime: row.start_time,
    endTime: row.end_time,
    breakStart: row.break_start,
    breakEnd: row.break_end,
  };
}

export function listStaffWorkingHours(staffId: string): StaffWorkingHour[] {
  return getDb()
    .prepare("SELECT * FROM staff_working_hours WHERE staff_id = ? ORDER BY weekday ASC")
    .all(staffId)
    .map(mapStaffWorkingHour);
}

export function setStaffWorkingHours(
  staffId: string,
  hours: { weekday: number; isOff: boolean; startTime: string | null; endTime: string | null; breakStart: string | null; breakEnd: string | null }[]
) {
  const db = getDb();
  db.prepare("DELETE FROM staff_working_hours WHERE staff_id = ?").run(staffId);
  const ins = db.prepare(
    `INSERT INTO staff_working_hours (id, staff_id, weekday, is_off, start_time, end_time, break_start, break_end)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const h of hours) {
    ins.run(uid(), staffId, h.weekday, h.isOff ? 1 : 0, h.startTime, h.endTime, h.breakStart, h.breakEnd);
  }
}

// ---------- Blocked times ----------

function mapBlockedTime(row: any): BlockedTime {
  return {
    id: row.id,
    businessId: row.business_id,
    staffId: row.staff_id,
    startAt: row.start_at,
    endAt: row.end_at,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export function listBlockedTimes(businessId: string, fromIso?: string, toIso?: string): BlockedTime[] {
  if (fromIso && toIso) {
    return getDb()
      .prepare("SELECT * FROM blocked_times WHERE business_id = ? AND start_at < ? AND end_at > ? ORDER BY start_at ASC")
      .all(businessId, toIso, fromIso)
      .map(mapBlockedTime);
  }
  return getDb().prepare("SELECT * FROM blocked_times WHERE business_id = ? ORDER BY start_at ASC").all(businessId).map(mapBlockedTime);
}

export function createBlockedTime(businessId: string, input: { staffId?: string | null; startAt: string; endAt: string; reason?: string | null }): BlockedTime {
  const id = uid();
  getDb()
    .prepare("INSERT INTO blocked_times (id, business_id, staff_id, start_at, end_at, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, businessId, input.staffId ?? null, input.startAt, input.endAt, input.reason ?? null, nowIso());
  return mapBlockedTime(getDb().prepare("SELECT * FROM blocked_times WHERE id = ?").get(id));
}

export function deleteBlockedTime(id: string) {
  getDb().prepare("DELETE FROM blocked_times WHERE id = ?").run(id);
}

// ---------- Special days ----------

function mapSpecialDay(row: any): SpecialDay {
  return {
    id: row.id,
    businessId: row.business_id,
    staffId: row.staff_id,
    date: row.date,
    isClosed: b(row.is_closed),
    openTime: row.open_time,
    closeTime: row.close_time,
    note: row.note,
    createdAt: row.created_at,
  };
}

export function listSpecialDays(businessId: string): SpecialDay[] {
  return getDb().prepare("SELECT * FROM special_days WHERE business_id = ? ORDER BY date ASC").all(businessId).map(mapSpecialDay);
}

export function findSpecialDay(businessId: string, date: string, staffId: string | null): SpecialDay | null {
  const row = staffId
    ? getDb().prepare("SELECT * FROM special_days WHERE business_id = ? AND date = ? AND staff_id = ?").get(businessId, date, staffId)
    : getDb().prepare("SELECT * FROM special_days WHERE business_id = ? AND date = ? AND staff_id IS NULL").get(businessId, date);
  return row ? mapSpecialDay(row) : null;
}

export function createSpecialDay(
  businessId: string,
  input: { staffId?: string | null; date: string; isClosed: boolean; openTime?: string | null; closeTime?: string | null; note?: string | null }
): SpecialDay {
  const id = uid();
  getDb()
    .prepare(
      `INSERT INTO special_days (id, business_id, staff_id, date, is_closed, open_time, close_time, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, businessId, input.staffId ?? null, input.date, input.isClosed ? 1 : 0, input.openTime ?? null, input.closeTime ?? null, input.note ?? null, nowIso());
  return mapSpecialDay(getDb().prepare("SELECT * FROM special_days WHERE id = ?").get(id));
}

export function deleteSpecialDay(id: string) {
  getDb().prepare("DELETE FROM special_days WHERE id = ?").run(id);
}
