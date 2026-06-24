import { getDb, uid, nowIso } from "../client";
import type { Appointment, AppointmentStatus, AppointmentSource, PaymentStatus } from "@/lib/types";

function mapAppointment(row: any): Appointment {
  return {
    id: row.id,
    businessId: row.business_id,
    branchId: row.branch_id,
    customerId: row.customer_id,
    staffId: row.staff_id,
    serviceId: row.service_id,
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status,
    price: row.price,
    paymentStatus: row.payment_status,
    customerNote: row.customer_note,
    internalNote: row.internal_note,
    source: row.source,
    cancellationReason: row.cancellation_reason,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface AppointmentWithDetails extends Appointment {
  customerName: string;
  customerPhone: string | null;
  staffName: string | null;
  serviceName: string;
  serviceColor: string;
}

const DETAILS_SELECT = `
  SELECT a.*, c.full_name as customer_name, c.phone as customer_phone,
         s.full_name as staff_name, sv.name as service_name, sv.color as service_color
  FROM appointments a
  JOIN customers c ON c.id = a.customer_id
  LEFT JOIN staff s ON s.id = a.staff_id
  JOIN services sv ON sv.id = a.service_id
`;

function mapDetails(row: any): AppointmentWithDetails {
  return {
    ...mapAppointment(row),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    staffName: row.staff_name,
    serviceName: row.service_name,
    serviceColor: row.service_color,
  };
}

export function findAppointmentById(id: string): Appointment | null {
  const row = getDb().prepare("SELECT * FROM appointments WHERE id = ?").get(id);
  return row ? mapAppointment(row) : null;
}

export function findAppointmentWithDetails(id: string): AppointmentWithDetails | null {
  const row = getDb().prepare(`${DETAILS_SELECT} WHERE a.id = ?`).get(id);
  return row ? mapDetails(row) : null;
}

export function listAppointmentsInRange(businessId: string, fromIso: string, toIso: string): AppointmentWithDetails[] {
  return getDb()
    .prepare(`${DETAILS_SELECT} WHERE a.business_id = ? AND a.start_at < ? AND a.end_at > ? ORDER BY a.start_at ASC`)
    .all(businessId, toIso, fromIso)
    .map(mapDetails);
}

export function listAppointmentsForCustomer(customerId: string): AppointmentWithDetails[] {
  return getDb().prepare(`${DETAILS_SELECT} WHERE a.customer_id = ? ORDER BY a.start_at DESC`).all(customerId).map(mapDetails);
}

export function listAppointmentsForBusiness(
  businessId: string,
  filters: { staffId?: string; serviceId?: string; status?: AppointmentStatus; from?: string; to?: string } = {}
): AppointmentWithDetails[] {
  const clauses = ["a.business_id = ?"];
  const params: any[] = [businessId];
  if (filters.staffId) {
    clauses.push("a.staff_id = ?");
    params.push(filters.staffId);
  }
  if (filters.serviceId) {
    clauses.push("a.service_id = ?");
    params.push(filters.serviceId);
  }
  if (filters.status) {
    clauses.push("a.status = ?");
    params.push(filters.status);
  }
  if (filters.from) {
    clauses.push("a.start_at >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("a.start_at <= ?");
    params.push(filters.to);
  }
  return getDb()
    .prepare(`${DETAILS_SELECT} WHERE ${clauses.join(" AND ")} ORDER BY a.start_at DESC`)
    .all(...params)
    .map(mapDetails);
}

/** Returns true if the staff member has an overlapping non-cancelled appointment in [startAt, endAt). */
export function hasStaffConflict(staffId: string, startAt: string, endAt: string, excludeAppointmentId?: string): boolean {
  const params: any[] = [staffId, endAt, startAt];
  let sql = `SELECT id FROM appointments WHERE staff_id = ? AND start_at < ? AND end_at > ? AND status NOT IN ('cancelled','no_show')`;
  if (excludeAppointmentId) {
    sql += " AND id != ?";
    params.push(excludeAppointmentId);
  }
  return !!getDb().prepare(sql).get(...params);
}

export interface CreateAppointmentInput {
  businessId: string;
  branchId?: string | null;
  customerId: string;
  staffId?: string | null;
  serviceId: string;
  startAt: string;
  endAt: string;
  price: number;
  status?: AppointmentStatus;
  paymentStatus?: PaymentStatus;
  customerNote?: string | null;
  internalNote?: string | null;
  source: AppointmentSource;
  createdByUserId?: string | null;
}

export function createAppointment(input: CreateAppointmentInput): Appointment {
  const id = uid();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO appointments
        (id, business_id, branch_id, customer_id, staff_id, service_id, start_at, end_at, status, price, payment_status,
         customer_note, internal_note, source, cancellation_reason, created_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`
    )
    .run(
      id,
      input.businessId,
      input.branchId ?? null,
      input.customerId,
      input.staffId ?? null,
      input.serviceId,
      input.startAt,
      input.endAt,
      input.status ?? "pending",
      input.price,
      input.paymentStatus ?? "pending",
      input.customerNote ?? null,
      input.internalNote ?? null,
      input.source,
      input.createdByUserId ?? null,
      now,
      now
    );

  getDb()
    .prepare("INSERT INTO appointment_status_history (id, appointment_id, business_id, from_status, to_status, changed_by_user_id, note, created_at) VALUES (?, ?, ?, NULL, ?, ?, NULL, ?)")
    .run(uid(), id, input.businessId, input.status ?? "pending", input.createdByUserId ?? null, now);

  return findAppointmentById(id)!;
}

export function updateAppointmentStatus(id: string, toStatus: AppointmentStatus, changedByUserId: string | null, note?: string | null) {
  const current = findAppointmentById(id);
  if (!current) throw new Error("Randevu bulunamadı");
  const now = nowIso();
  getDb().prepare("UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?").run(toStatus, now, id);
  getDb()
    .prepare("INSERT INTO appointment_status_history (id, appointment_id, business_id, from_status, to_status, changed_by_user_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(uid(), id, current.businessId, current.status, toStatus, changedByUserId, note ?? null, now);
}

export function updateAppointmentDetails(
  id: string,
  input: Partial<{ staffId: string | null; startAt: string; endAt: string; price: number; paymentStatus: PaymentStatus; internalNote: string | null; cancellationReason: string | null }>
): Appointment {
  const current = findAppointmentById(id);
  if (!current) throw new Error("Randevu bulunamadı");
  const merged = { ...current, ...input };
  getDb()
    .prepare(
      `UPDATE appointments SET staff_id=?, start_at=?, end_at=?, price=?, payment_status=?, internal_note=?, cancellation_reason=?, updated_at=?
       WHERE id = ?`
    )
    .run(merged.staffId, merged.startAt, merged.endAt, merged.price, merged.paymentStatus, merged.internalNote, merged.cancellationReason, nowIso(), id);
  return findAppointmentById(id)!;
}

export function listStatusHistory(appointmentId: string) {
  return getDb().prepare("SELECT * FROM appointment_status_history WHERE appointment_id = ? ORDER BY created_at ASC").all(appointmentId);
}

export function countAppointmentsThisMonth(businessId: string, monthStartIso: string, monthEndIso: string): number {
  const row: any = getDb()
    .prepare("SELECT COUNT(*) as c FROM appointments WHERE business_id = ? AND start_at >= ? AND start_at < ?")
    .get(businessId, monthStartIso, monthEndIso);
  return row.c as number;
}
