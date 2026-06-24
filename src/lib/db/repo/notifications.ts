import { getDb, uid, nowIso } from "../client";
import { b } from "../mappers";
import type { NotificationRecord, NotificationChannel } from "@/lib/types";

function mapNotification(row: any): NotificationRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    channel: row.channel,
    isRead: b(row.is_read),
    relatedAppointmentId: row.related_appointment_id,
    createdAt: row.created_at,
  };
}

export function createNotification(input: {
  businessId?: string | null;
  userId?: string | null;
  type: string;
  title: string;
  body?: string | null;
  channel?: NotificationChannel;
  relatedAppointmentId?: string | null;
}): NotificationRecord {
  const id = uid();
  getDb()
    .prepare(
      `INSERT INTO notifications (id, business_id, user_id, type, title, body, channel, is_read, related_appointment_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
    .run(id, input.businessId ?? null, input.userId ?? null, input.type, input.title, input.body ?? null, input.channel ?? "inapp", input.relatedAppointmentId ?? null, nowIso());
  return mapNotification(getDb().prepare("SELECT * FROM notifications WHERE id = ?").get(id));
}

export function findNotificationById(id: string): NotificationRecord | null {
  const row = getDb().prepare("SELECT * FROM notifications WHERE id = ?").get(id);
  return row ? mapNotification(row) : null;
}

export function listNotificationsForBusiness(businessId: string, limit = 50): NotificationRecord[] {
  return getDb()
    .prepare("SELECT * FROM notifications WHERE business_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(businessId, limit)
    .map(mapNotification);
}

export function countUnreadNotifications(businessId: string): number {
  const row: any = getDb().prepare("SELECT COUNT(*) as c FROM notifications WHERE business_id = ? AND is_read = 0").get(businessId);
  return row.c as number;
}

export function markNotificationRead(id: string) {
  getDb().prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
}

export function markAllNotificationsRead(businessId: string) {
  getDb().prepare("UPDATE notifications SET is_read = 1 WHERE business_id = ?").run(businessId);
}
