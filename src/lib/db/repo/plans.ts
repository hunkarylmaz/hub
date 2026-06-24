import { getDb, uid, nowIso } from "../client";
import { b } from "../mappers";
import type { Plan, Subscription, SubscriptionStatus, BillingCycle } from "@/lib/types";

function mapPlan(row: any): Plan {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    monthlyPrice: row.monthly_price,
    yearlyPrice: row.yearly_price,
    maxStaff: row.max_staff,
    maxBranches: row.max_branches,
    maxMonthlyAppointments: row.max_monthly_appointments,
    hasAccounting: b(row.has_accounting),
    hasAdvancedReports: b(row.has_advanced_reports),
    hasSmsWhatsapp: b(row.has_sms_whatsapp),
    isActive: b(row.is_active),
    sortOrder: row.sort_order,
  };
}

export function listPlans(): Plan[] {
  return getDb().prepare("SELECT * FROM plans ORDER BY sort_order ASC").all().map(mapPlan);
}

export function findPlanById(id: string): Plan | null {
  const row = getDb().prepare("SELECT * FROM plans WHERE id = ?").get(id);
  return row ? mapPlan(row) : null;
}

export function findPlanBySlug(slug: string): Plan | null {
  const row = getDb().prepare("SELECT * FROM plans WHERE slug = ?").get(slug);
  return row ? mapPlan(row) : null;
}

export function createPlan(input: Omit<Plan, "id">): Plan {
  const id = uid();
  getDb()
    .prepare(
      `INSERT INTO plans (id, name, slug, monthly_price, yearly_price, max_staff, max_branches, max_monthly_appointments,
        has_accounting, has_advanced_reports, has_sms_whatsapp, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.name,
      input.slug,
      input.monthlyPrice,
      input.yearlyPrice,
      input.maxStaff,
      input.maxBranches,
      input.maxMonthlyAppointments,
      input.hasAccounting ? 1 : 0,
      input.hasAdvancedReports ? 1 : 0,
      input.hasSmsWhatsapp ? 1 : 0,
      input.isActive ? 1 : 0,
      input.sortOrder
    );
  return findPlanById(id)!;
}

function mapSubscription(row: any): Subscription {
  return {
    id: row.id,
    businessId: row.business_id,
    planId: row.plan_id,
    status: row.status,
    billingCycle: row.billing_cycle,
    trialEndsAt: row.trial_ends_at,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findSubscriptionByBusiness(businessId: string): Subscription | null {
  const row = getDb().prepare("SELECT * FROM subscriptions WHERE business_id = ?").get(businessId);
  return row ? mapSubscription(row) : null;
}

export function createSubscription(input: {
  businessId: string;
  planId: string;
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  trialEndsAt?: string | null;
}): Subscription {
  const id = uid();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO subscriptions (id, business_id, plan_id, status, billing_cycle, trial_ends_at, current_period_start, current_period_end, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, input.businessId, input.planId, input.status ?? "trial", input.billingCycle ?? "monthly", input.trialEndsAt ?? null, now, null, now, now);
  return findSubscriptionByBusiness(input.businessId)!;
}

export function updateSubscriptionStatus(businessId: string, status: SubscriptionStatus) {
  getDb().prepare("UPDATE subscriptions SET status = ?, updated_at = ? WHERE business_id = ?").run(status, nowIso(), businessId);
}

export function updateSubscriptionPlan(businessId: string, planId: string) {
  getDb().prepare("UPDATE subscriptions SET plan_id = ?, updated_at = ? WHERE business_id = ?").run(planId, nowIso(), businessId);
}

export function listAllSubscriptionsWithBusiness(): (Subscription & { businessName: string; businessSlug: string })[] {
  const rows = getDb()
    .prepare(
      `SELECT s.*, b.name as business_name, b.slug as business_slug FROM subscriptions s
       JOIN businesses b ON b.id = s.business_id ORDER BY s.created_at DESC`
    )
    .all();
  return rows.map((row: any) => ({ ...mapSubscription(row), businessName: row.business_name, businessSlug: row.business_slug }));
}
