import { getDb, uid, nowIso } from "../client";
import { b } from "../mappers";
import type { Review } from "@/lib/types";

function mapReview(row: any): Review {
  return {
    id: row.id,
    businessId: row.business_id,
    customerName: row.customer_name,
    rating: row.rating,
    comment: row.comment,
    isPublished: b(row.is_published),
    createdAt: row.created_at,
  };
}

export function listReviews(businessId: string, opts: { onlyPublished?: boolean } = {}): Review[] {
  const sql = opts.onlyPublished
    ? "SELECT * FROM reviews WHERE business_id = ? AND is_published = 1 ORDER BY created_at DESC"
    : "SELECT * FROM reviews WHERE business_id = ? ORDER BY created_at DESC";
  return getDb().prepare(sql).all(businessId).map(mapReview);
}

export function getReviewStats(businessId: string): { count: number; average: number } {
  const row: any = getDb()
    .prepare("SELECT COUNT(*) as cnt, COALESCE(AVG(rating), 0) as avg FROM reviews WHERE business_id = ? AND is_published = 1")
    .get(businessId);
  return { count: row.cnt as number, average: Math.round((row.avg as number) * 10) / 10 };
}

export function createReview(businessId: string, input: { customerName: string; rating: number; comment?: string | null }): Review {
  const id = uid();
  getDb()
    .prepare(
      `INSERT INTO reviews (id, business_id, customer_name, rating, comment, is_published, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)`
    )
    .run(id, businessId, input.customerName, input.rating, input.comment ?? null, nowIso());
  return mapReview(getDb().prepare("SELECT * FROM reviews WHERE id = ?").get(id));
}

export function setReviewPublished(id: string, isPublished: boolean) {
  getDb().prepare("UPDATE reviews SET is_published = ? WHERE id = ?").run(isPublished ? 1 : 0, id);
}

export function deleteReview(id: string) {
  getDb().prepare("DELETE FROM reviews WHERE id = ?").run(id);
}
