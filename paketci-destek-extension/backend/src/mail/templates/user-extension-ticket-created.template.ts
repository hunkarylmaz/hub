import { SupportTicket } from '@prisma/client';
import { escapeHtml } from '../../common/sanitize';
import { BuiltMail } from './types';

export interface UserTicketMailContext {
  ticket: SupportTicket;
  supportTrackingUrl?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Açık',
  in_progress: 'İnceleniyor',
  resolved: 'Çözüldü',
  closed: 'Kapatıldı'
};

const DESCRIPTION_SUMMARY_MAX_LENGTH = 280;

/**
 * Template key: user_extension_ticket_created
 * Subject: Destek talebiniz alındı - #{ticketNumber}
 * Alıcı: ticket.senderEmail
 */
export function buildUserExtensionTicketCreatedMail(context: UserTicketMailContext): BuiltMail {
  const { ticket, supportTrackingUrl } = context;
  const subject = `Destek talebiniz alındı - #${ticket.ticketNumber}`;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background-color:#1f2937;padding:20px 32px;">
            <span style="color:#ffffff;font-size:18px;font-weight:bold;">Paketçi Destek Sistemi</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px 0;font-size:20px;color:#111827;">Talebiniz Başarıyla Alınmıştır</h1>
            <p style="margin:0 0 16px 0;color:#374151;line-height:1.6;">
              Merhaba ${escapeHtml(ticket.senderName)},<br /><br />
              Paketinizle ilgili destek talebiniz başarıyla alınmıştır. Operasyon ekibimiz talebinizi
              inceleyerek en kısa sürede dönüş sağlayacaktır.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:6px;margin-bottom:20px;">
              <tr>
                <td style="padding:6px 12px;color:#6b7280;font-size:13px;width:160px;border-bottom:1px solid #f3f4f6;">Ticket No</td>
                <td style="padding:6px 12px;color:#111827;font-size:13px;border-bottom:1px solid #f3f4f6;">${escapeHtml(ticket.ticketNumber)}</td>
              </tr>
              ${
                ticket.paketciOrderNumber
                  ? `<tr>
                <td style="padding:6px 12px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">Sipariş No</td>
                <td style="padding:6px 12px;color:#111827;font-size:13px;border-bottom:1px solid #f3f4f6;">${escapeHtml(ticket.paketciOrderNumber)}</td>
              </tr>`
                  : ''
              }
              <tr>
                <td style="padding:6px 12px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">Sorun Tipi</td>
                <td style="padding:6px 12px;color:#111827;font-size:13px;border-bottom:1px solid #f3f4f6;">${escapeHtml(ticket.category)}</td>
              </tr>
              <tr>
                <td style="padding:6px 12px;color:#6b7280;font-size:13px;">Durum</td>
                <td style="padding:6px 12px;color:#111827;font-size:13px;">${escapeHtml(STATUS_LABELS[ticket.status] ?? ticket.status)}</td>
              </tr>
            </table>
            <div style="margin:0 0 24px 0;padding:16px;background-color:#f9fafb;border-left:4px solid #6366f1;border-radius:4px;">
              <p style="margin:0 0 6px 0;font-weight:bold;color:#111827;">Açıklama Özeti</p>
              <p style="margin:0;color:#374151;white-space:pre-wrap;">${escapeHtml(truncate(ticket.description, DESCRIPTION_SUMMARY_MAX_LENGTH))}</p>
            </div>
            ${
              supportTrackingUrl
                ? `<a href="${escapeHtml(supportTrackingUrl)}" style="display:inline-block;padding:10px 20px;background-color:#4f46e5;color:#ffffff;border-radius:6px;text-decoration:none;font-weight:bold;">Talebimi Takip Et</a>`
                : ''
            }
            <p style="margin:24px 0 0 0;color:#374151;">Saygılarımızla,<br />Paketçi Destek Ekibi</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background-color:#f9fafb;color:#6b7280;font-size:12px;">
            Bu otomatik bir bildirimdir — Paketçi Destek Sistemi.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}…`;
}
