import { getDb } from "@/lib/db/client";
import { addDaysKey, combineDateTime, isoWeekday, timeToMinutes, minutesToTime } from "@/lib/date";
import { listWorkingHours, listStaffWorkingHours, listBlockedTimes, findSpecialDay } from "@/lib/db/repo/staff";
import { listServiceIdsForStaff, listStaffIdsForService } from "@/lib/db/repo/services";
import { findStaffById, listStaff } from "@/lib/db/repo/staff";
import type { Service } from "@/lib/types";

export interface MinuteSegment {
  startMin: number;
  endMin: number;
}

export interface AvailableSlot {
  time: string; // "14:30"
  startAt: string; // ISO instant
  endAt: string; // ISO instant (service end, excludes buffer)
  staffId: string | null;
}

const SLOT_GRANULARITY_MINUTES = 15;

function subtractSegment(segments: MinuteSegment[], hole: MinuteSegment): MinuteSegment[] {
  const result: MinuteSegment[] = [];
  for (const seg of segments) {
    if (hole.endMin <= seg.startMin || hole.startMin >= seg.endMin) {
      result.push(seg);
      continue;
    }
    if (hole.startMin > seg.startMin) result.push({ startMin: seg.startMin, endMin: Math.min(hole.startMin, seg.endMin) });
    if (hole.endMin < seg.endMin) result.push({ startMin: Math.max(hole.endMin, seg.startMin), endMin: seg.endMin });
  }
  return result.filter((s) => s.endMin > s.startMin);
}

function subtractAll(segments: MinuteSegment[], holes: MinuteSegment[]): MinuteSegment[] {
  let current = segments;
  for (const hole of holes) current = subtractSegment(current, hole);
  return current;
}

function intersectSegments(a: MinuteSegment[], b: MinuteSegment[]): MinuteSegment[] {
  const result: MinuteSegment[] = [];
  for (const sa of a) {
    for (const sb of b) {
      const start = Math.max(sa.startMin, sb.startMin);
      const end = Math.min(sa.endMin, sb.endMin);
      if (end > start) result.push({ startMin: start, endMin: end });
    }
  }
  return result;
}

/** Business-level open window (minute-of-day segments) for a given date, after special-day overrides + lunch break. */
function getBusinessWindow(businessId: string, dateKey: string): MinuteSegment[] {
  const specialDay = findSpecialDay(businessId, dateKey, null);
  if (specialDay) {
    if (specialDay.isClosed) return [];
    if (specialDay.openTime && specialDay.closeTime) {
      return [{ startMin: timeToMinutes(specialDay.openTime), endMin: timeToMinutes(specialDay.closeTime) }];
    }
  }

  const hours = listWorkingHours(businessId).find((h) => h.weekday === isoWeekdayFromKey(dateKey));
  if (!hours || hours.isClosed || !hours.openTime || !hours.closeTime) return [];

  let segments: MinuteSegment[] = [{ startMin: timeToMinutes(hours.openTime), endMin: timeToMinutes(hours.closeTime) }];
  if (hours.breakStart && hours.breakEnd) {
    segments = subtractSegment(segments, { startMin: timeToMinutes(hours.breakStart), endMin: timeToMinutes(hours.breakEnd) });
  }
  return segments;
}

function isoWeekdayFromKey(dateKey: string): number {
  const utcNoon = new Date(`${dateKey}T12:00:00Z`);
  return isoWeekday(utcNoon);
}

/** Staff-level open window for a given date, after staff special-day overrides + staff break. */
function getStaffWindow(staffId: string, dateKey: string): MinuteSegment[] {
  const specialDay = findStaffSpecialDay(staffId, dateKey);
  if (specialDay) {
    if (specialDay.isClosed) return [];
    if (specialDay.openTime && specialDay.closeTime) {
      return [{ startMin: timeToMinutes(specialDay.openTime), endMin: timeToMinutes(specialDay.closeTime) }];
    }
  }

  const hours = listStaffWorkingHours(staffId).find((h) => h.weekday === isoWeekdayFromKey(dateKey));
  if (!hours) return [{ startMin: 0, endMin: 24 * 60 }]; // no override defined -> defer fully to business hours
  if (hours.isOff || !hours.startTime || !hours.endTime) return [];

  let segments: MinuteSegment[] = [{ startMin: timeToMinutes(hours.startTime), endMin: timeToMinutes(hours.endTime) }];
  if (hours.breakStart && hours.breakEnd) {
    segments = subtractSegment(segments, { startMin: timeToMinutes(hours.breakStart), endMin: timeToMinutes(hours.breakEnd) });
  }
  return segments;
}

function findStaffSpecialDay(staffId: string, dateKey: string) {
  const row: any = getDb().prepare("SELECT * FROM special_days WHERE staff_id = ? AND date = ?").get(staffId, dateKey);
  if (!row) return null;
  return {
    isClosed: row.is_closed === 1,
    openTime: row.open_time as string | null,
    closeTime: row.close_time as string | null,
  };
}

function getBlockedSegments(businessId: string, staffId: string | null, dateKey: string): MinuteSegment[] {
  const dayStartIso = combineDateTime(dateKey, "00:00");
  const dayEndIso = combineDateTime(dateKey, "23:59");
  const blocked = listBlockedTimes(businessId, dayStartIso, dayEndIso).filter((bt) => !bt.staffId || bt.staffId === staffId);
  return blocked.map((bt) => clipToDateMinutes(bt.startAt, bt.endAt, dateKey)).filter((s): s is MinuteSegment => s !== null);
}

function clipToDateMinutes(startIso: string, endIso: string, dateKey: string): MinuteSegment | null {
  const dayStart = new Date(combineDateTime(dateKey, "00:00")).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const s = Math.max(new Date(startIso).getTime(), dayStart);
  const e = Math.min(new Date(endIso).getTime(), dayEnd);
  if (e <= s) return null;
  return { startMin: Math.round((s - dayStart) / 60000), endMin: Math.round((e - dayStart) / 60000) };
}

/** Existing non-cancelled appointments for a resource (staff or staffless service/venue) occupying time on this date, including each appointment's own service buffer. */
function getOccupiedSegments(businessId: string, dateKey: string, opts: { staffId?: string; serviceIdForVenue?: string }): MinuteSegment[] {
  const dayStartIso = combineDateTime(dateKey, "00:00");
  const dayEndIso = combineDateTime(dateKey, "23:59");
  const db = getDb();
  let rows: any[];
  if (opts.staffId) {
    rows = db
      .prepare(
        `SELECT a.start_at, a.end_at, sv.buffer_minutes as buffer FROM appointments a
         JOIN services sv ON sv.id = a.service_id
         WHERE a.staff_id = ? AND a.status NOT IN ('cancelled','no_show') AND a.start_at < ? AND a.end_at > ?`
      )
      .all(opts.staffId, dayEndIso, dayStartIso);
  } else {
    rows = db
      .prepare(
        `SELECT a.start_at, a.end_at, sv.buffer_minutes as buffer FROM appointments a
         JOIN services sv ON sv.id = a.service_id
         WHERE a.business_id = ? AND a.service_id = ? AND a.staff_id IS NULL AND a.status NOT IN ('cancelled','no_show')
         AND a.start_at < ? AND a.end_at > ?`
      )
      .all(businessId, opts.serviceIdForVenue ?? null, dayEndIso, dayStartIso);
  }

  const segments: MinuteSegment[] = [];
  for (const row of rows) {
    const bufferedEnd = new Date(new Date(row.end_at).getTime() + row.buffer * 60000).toISOString();
    const seg = clipToDateMinutes(row.start_at, bufferedEnd, dateKey);
    if (seg) segments.push(seg);
  }
  return segments;
}

function generateStarts(segments: MinuteSegment[], durationMinutes: number, fromMinuteInclusive: number): number[] {
  const starts: number[] = [];
  for (const seg of segments) {
    let t = Math.ceil(Math.max(seg.startMin, fromMinuteInclusive) / SLOT_GRANULARITY_MINUTES) * SLOT_GRANULARITY_MINUTES;
    while (t + durationMinutes <= seg.endMin) {
      starts.push(t);
      t += SLOT_GRANULARITY_MINUTES;
    }
  }
  return starts;
}

export interface AvailabilityParams {
  businessId: string;
  service: Service;
  staffId?: string | null;
  dateKey: string;
  minNoticeHours?: number;
  nowIso?: string;
}

/** Eligible staff for a service: active, online-bookable, assigned to the service. */
export function getEligibleStaffIds(businessId: string, serviceId: string): string[] {
  const assigned = new Set(listStaffIdsForService(serviceId));
  return listStaff(businessId, { onlyActive: true })
    .filter((s) => s.isBookableOnline && assigned.has(s.id))
    .map((s) => s.id);
}

export function getAvailableSlotsForDate(params: AvailabilityParams): AvailableSlot[] {
  const { businessId, service, dateKey } = params;
  const minNoticeMinutes = (params.minNoticeHours ?? 0) * 60;
  const now = params.nowIso ? new Date(params.nowIso) : new Date();
  const dayStart = new Date(combineDateTime(dateKey, "00:00")).getTime();
  const minutesFromNow = (now.getTime() + minNoticeMinutes * 60000 - dayStart) / 60000;
  const fromMinute = Math.max(0, minutesFromNow);

  const businessWindow = getBusinessWindow(businessId, dateKey);
  if (businessWindow.length === 0) return [];

  let eligibleStaffIds = params.staffId ? [params.staffId] : getEligibleStaffIds(businessId, service.id);
  eligibleStaffIds = eligibleStaffIds.filter((id) => !!findStaffById(id));

  if (eligibleStaffIds.length === 0) {
    // Staffless / venue-bazlı hizmet: tek kaynak olarak işletmenin/şubenin kendisi kullanılır.
    const blocked = getBlockedSegments(businessId, null, dateKey);
    const occupied = getOccupiedSegments(businessId, dateKey, { serviceIdForVenue: service.id });
    const free = subtractAll(businessWindow, [...blocked, ...occupied]);
    const starts = generateStarts(free, service.durationMinutes, fromMinute);
    return starts.map((startMin) => buildSlot(dateKey, startMin, service.durationMinutes, null));
  }

  const slotMap = new Map<string, AvailableSlot>();
  for (const staffId of eligibleStaffIds) {
    const staffWindow = getStaffWindow(staffId, dateKey);
    const combined = intersectSegments(businessWindow, staffWindow);
    const blocked = getBlockedSegments(businessId, staffId, dateKey);
    const occupied = getOccupiedSegments(businessId, dateKey, { staffId });
    const free = subtractAll(combined, [...blocked, ...occupied]);
    const starts = generateStarts(free, service.durationMinutes, fromMinute);
    for (const startMin of starts) {
      const time = minutesToTime(startMin);
      if (!slotMap.has(time)) slotMap.set(time, buildSlot(dateKey, startMin, service.durationMinutes, staffId));
    }
  }
  return Array.from(slotMap.values()).sort((a, b) => a.time.localeCompare(b.time));
}

function buildSlot(dateKey: string, startMin: number, durationMinutes: number, staffId: string | null): AvailableSlot {
  const time = minutesToTime(startMin);
  const startAt = combineDateTime(dateKey, time);
  const endAt = new Date(new Date(startAt).getTime() + durationMinutes * 60000).toISOString();
  return { time, startAt, endAt, staffId };
}

export interface NextAvailableSlot extends AvailableSlot {
  dateKey: string;
}

/** Scans forward day-by-day from (and including) startDateKey for the first date with an open slot — powers the "bu tarihte yer yok, en yakın uygun randevu" suggestion. */
export function findNextAvailableSlot(
  params: Omit<AvailabilityParams, "dateKey"> & { startDateKey: string; maxDaysAhead?: number }
): NextAvailableSlot | null {
  const maxDays = params.maxDaysAhead ?? 30;
  for (let i = 0; i <= maxDays; i++) {
    const dateKey = addDaysKey(params.startDateKey, i);
    const slots = getAvailableSlotsForDate({ ...params, dateKey });
    if (slots.length > 0) return { ...slots[0], dateKey };
  }
  return null;
}

/** Server-side guard used before persisting an appointment: re-validates the slot is still free. */
export function isSlotStillAvailable(params: {
  businessId: string;
  service: Service;
  staffId: string | null;
  startAt: string;
}): boolean {
  const dateKey = params.startAt.slice(0, 10);
  const slots = getAvailableSlotsForDate({
    businessId: params.businessId,
    service: params.service,
    staffId: params.staffId ?? undefined,
    dateKey,
  });
  const wanted = params.startAt;
  return slots.some((s) => s.startAt === wanted && (params.staffId ? s.staffId === params.staffId : true));
}
