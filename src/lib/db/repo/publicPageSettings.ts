import { getDb, uid, nowIso } from "../client";
import { b, parseJson } from "../mappers";
import type { PublicPageSettings } from "@/lib/types";

function mapSettings(row: any): PublicPageSettings {
  return {
    id: row.id,
    businessId: row.business_id,
    themeColor: row.theme_color,
    descriptionOverride: row.description_override,
    showAddress: b(row.show_address),
    showPhone: b(row.show_phone),
    autoConfirm: b(row.auto_confirm),
    cancellationPolicy: row.cancellation_policy,
    kvkkText: row.kvkk_text,
    bookingWindowDays: row.booking_window_days,
    minNoticeHours: row.min_notice_hours,
    depositEnabled: b(row.deposit_enabled),
    socialLinks: parseJson(row.social_links, {}),
    updatedAt: row.updated_at,
  };
}

const DEFAULT_KVKK_TEXT =
  "Randevu oluşturarak, iletişim bilgilerinizin işletme tarafından randevu yönetimi amacıyla 6698 sayılı KVKK kapsamında işlenmesini kabul edersiniz.";

export function getOrCreatePublicPageSettings(businessId: string): PublicPageSettings {
  const existing = getDb().prepare("SELECT * FROM public_page_settings WHERE business_id = ?").get(businessId);
  if (existing) return mapSettings(existing);
  const id = uid();
  getDb()
    .prepare(
      `INSERT INTO public_page_settings
        (id, business_id, theme_color, description_override, show_address, show_phone, auto_confirm, cancellation_policy,
         kvkk_text, booking_window_days, min_notice_hours, deposit_enabled, social_links, updated_at)
       VALUES (?, ?, '#5817B0', NULL, 1, 1, 1, NULL, ?, 30, 2, 0, '{}', ?)`
    )
    .run(id, businessId, DEFAULT_KVKK_TEXT, nowIso());
  return mapSettings(getDb().prepare("SELECT * FROM public_page_settings WHERE id = ?").get(id));
}

export function updatePublicPageSettings(businessId: string, patch: Partial<PublicPageSettings>): PublicPageSettings {
  const current = getOrCreatePublicPageSettings(businessId);
  const merged = { ...current, ...patch };
  getDb()
    .prepare(
      `UPDATE public_page_settings SET theme_color=?, description_override=?, show_address=?, show_phone=?, auto_confirm=?,
       cancellation_policy=?, kvkk_text=?, booking_window_days=?, min_notice_hours=?, deposit_enabled=?, social_links=?, updated_at=?
       WHERE business_id = ?`
    )
    .run(
      merged.themeColor,
      merged.descriptionOverride,
      merged.showAddress ? 1 : 0,
      merged.showPhone ? 1 : 0,
      merged.autoConfirm ? 1 : 0,
      merged.cancellationPolicy,
      merged.kvkkText,
      merged.bookingWindowDays,
      merged.minNoticeHours,
      merged.depositEnabled ? 1 : 0,
      JSON.stringify(merged.socialLinks ?? {}),
      nowIso(),
      businessId
    );
  return getOrCreatePublicPageSettings(businessId);
}
