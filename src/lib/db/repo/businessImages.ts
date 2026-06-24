import { getDb, uid, nowIso } from "../client";
import type { BusinessImage } from "@/lib/types";

function mapBusinessImage(row: any): BusinessImage {
  return {
    id: row.id,
    businessId: row.business_id,
    url: row.url,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function listBusinessImages(businessId: string): BusinessImage[] {
  return getDb()
    .prepare("SELECT * FROM business_images WHERE business_id = ? ORDER BY sort_order ASC, created_at ASC")
    .all(businessId)
    .map(mapBusinessImage);
}

export function addBusinessImage(businessId: string, url: string): BusinessImage {
  const id = uid();
  const row: any = getDb().prepare("SELECT COALESCE(MAX(sort_order), -1) as maxOrder FROM business_images WHERE business_id = ?").get(businessId);
  const sortOrder = (row.maxOrder as number) + 1;
  getDb()
    .prepare("INSERT INTO business_images (id, business_id, url, sort_order, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, businessId, url, sortOrder, nowIso());
  return mapBusinessImage(getDb().prepare("SELECT * FROM business_images WHERE id = ?").get(id));
}

export function deleteBusinessImage(id: string) {
  getDb().prepare("DELETE FROM business_images WHERE id = ?").run(id);
}
