import { getDb, uid, nowIso } from "../client";
import { parseJson } from "../mappers";
import type { AuditLog } from "@/lib/types";

function mapLog(row: any): AuditLog {
  return {
    id: row.id,
    businessId: row.business_id,
    actorUserId: row.actor_user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
  };
}

export function recordAuditLog(input: {
  businessId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}) {
  getDb()
    .prepare("INSERT INTO audit_logs (id, business_id, actor_user_id, action, entity_type, entity_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(uid(), input.businessId ?? null, input.actorUserId ?? null, input.action, input.entityType, input.entityId ?? null, JSON.stringify(input.meta ?? {}), nowIso());
}

export function listAuditLogs(limit = 100): (AuditLog & { actorName: string | null; businessName: string | null })[] {
  const rows = getDb()
    .prepare(
      `SELECT al.*, u.full_name as actor_name, b.name as business_name FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_user_id
       LEFT JOIN businesses b ON b.id = al.business_id
       ORDER BY al.created_at DESC LIMIT ?`
    )
    .all(limit);
  return rows.map((row: any) => ({ ...mapLog(row), actorName: row.actor_name, businessName: row.business_name }));
}

export function listAuditLogsForBusiness(businessId: string, limit = 100): AuditLog[] {
  return getDb()
    .prepare("SELECT * FROM audit_logs WHERE business_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(businessId, limit)
    .map(mapLog);
}
