const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", I: "i",
  İ: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
};

export function normalizeSlug(input: string): string {
  const replaced = input
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("");
  return replaced
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export const RESERVED_SLUGS = new Set([
  "panel", "admin", "giris", "kayit", "onboarding", "api", "fiyatlandirma",
  "hakkimizda", "iletisim", "gizlilik", "kvkk", "kullanim-sartlari", "sektorler",
  "ozellikler", "demo", "_next", "favicon.ico", "robots.txt", "sitemap.xml",
  "blog", "destek", "yardim", "app", "static", "assets", "public",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

export function isValidSlugFormat(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 60;
}

export function generateUniqueSlug(base: string, exists: (slug: string) => boolean): string {
  const normalized = normalizeSlug(base) || "isletme";
  let candidate = normalized;
  let i = 2;
  while (isReservedSlug(candidate) || exists(candidate)) {
    candidate = `${normalized}-${i}`;
    i += 1;
  }
  return candidate;
}
