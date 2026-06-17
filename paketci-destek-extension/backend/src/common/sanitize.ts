import sanitizeHtml from 'sanitize-html';

/**
 * DOM'dan okunan veya kullanıcının yazdığı TÜM serbest metin alanları
 * (title, description, sender.name, paket alanları) bu fonksiyondan geçer.
 * Hiçbir HTML etiketine izin verilmez — bunlar zengin metin alanları değil,
 * düz metindir; herhangi bir <tag> kaçışsız metne indirilir (XSS savunması).
 */
export function sanitizePlainText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const stripped = sanitizeHtml(String(value), { allowedTags: [], allowedAttributes: {} });
  const trimmed = stripped.replace(/\s+/g, ' ').trim();
  return trimmed || null;
}

export function sanitizeRequiredText(value: string): string {
  const result = sanitizePlainText(value);
  return result || '';
}

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Mail şablonlarında (admin/kullanıcı HTML mail) kullanıcı verisi interpolasyonu
 * öncesi kullanılır — spesifikasyon: "HTML mail template içinde kullanıcı
 * verileri escape edilecek". sanitizePlainText'ten farklıdır: burada amaç HTML
 * etiketlerini KALDIRMAK değil, özel karakterleri mail render'ında güvenli
 * göstermektir.
 */
export function escapeHtml(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}
