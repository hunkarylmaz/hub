import { PackageSnapshot, SupportTicket } from '@prisma/client';
import { escapeHtml } from '../../common/sanitize';
import { BuiltMail } from './types';

export interface AdminTicketMailContext {
  ticket: SupportTicket;
  packageSnapshot: PackageSnapshot | null;
  adminPanelUrl: string;
  isCritical: boolean;
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Düşük',
  normal: 'Normal',
  high: 'Yüksek',
  urgent: 'Acil',
  critical: 'Kritik'
};

type TableRow = [label: string, value: string | null | undefined];

/**
 * Template key: admin_new_extension_ticket
 * Subject: [Yeni Paket Talebi] #{ticketNumber} - Paket #{orderNumber}
 *          urgent/critical ise: [Acil Paket Talebi] #{ticketNumber} - {category} - Paket #{orderNumber}
 * Tüm kullanıcı verisi escapeHtml() ile geçirilir (XSS savunması, mail istemcisi DOM'a yazar).
 */
export function buildAdminNewExtensionTicketMail(context: AdminTicketMailContext): BuiltMail {
  const { ticket, packageSnapshot, adminPanelUrl, isCritical } = context;
  const orderNumber = packageSnapshot?.orderNumber ?? ticket.paketciOrderNumber ?? '-';

  const subject = isCritical
    ? `[Acil Paket Talebi] #${ticket.ticketNumber} - ${ticket.category} - Paket #${orderNumber}`
    : `[Yeni Paket Talebi] #${ticket.ticketNumber} - Paket #${orderNumber}`;

  const priorityLabel = PRIORITY_LABELS[ticket.priority] ?? ticket.priority;

  const ticketRows: TableRow[] = [
    ['Ticket No', ticket.ticketNumber],
    ['Başlık', ticket.title],
    ['Sorun Tipi', ticket.category],
    ['Öncelik', priorityLabel],
    ['Durum', ticket.status],
    ['Kaynak', ticket.source],
    ['Oluşturulma Tarihi', ticket.createdAt.toLocaleString('tr-TR')]
  ];

  const packageRows: TableRow[] = [
    ['Paket ID', packageSnapshot?.paketciPackageId],
    ['Sipariş No', packageSnapshot?.orderNumber],
    ['Restoran', packageSnapshot?.restaurantName],
    ['Şube', packageSnapshot?.branchName],
    ['Kurye', packageSnapshot?.courierName],
    ['Paket Durumu', packageSnapshot?.packageStatus],
    ['Teslimat Durumu', packageSnapshot?.deliveryStatus],
    ['Ödeme Tipi', packageSnapshot?.paymentType],
    ['Tutar', packageSnapshot?.packageTotal]
  ];

  const senderRows: TableRow[] = [
    ['Ad Soyad', ticket.senderName],
    ['E-posta', ticket.senderEmail],
    ['Telefon', ticket.senderPhone]
  ];

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
            <h1 style="margin:0 0 8px 0;font-size:20px;color:#111827;">Yeni Destek Talebi Oluşturuldu</h1>
            <p style="margin:0 0 20px 0;">
              <span style="display:inline-block;padding:4px 12px;border-radius:12px;background-color:${isCritical ? '#fee2e2' : '#e0f2fe'};color:${isCritical ? '#b91c1c' : '#0369a1'};font-size:13px;font-weight:bold;">
                ${escapeHtml(priorityLabel)} Öncelik
              </span>
            </p>
            ${renderTable('Ticket Bilgileri', ticketRows)}
            ${renderTable('Paket Bilgileri', packageRows)}
            ${renderTable('Gönderici Bilgileri', senderRows)}
            <div style="margin:20px 0;padding:16px;background-color:#f9fafb;border-left:4px solid #6366f1;border-radius:4px;">
              <p style="margin:0 0 6px 0;font-weight:bold;color:#111827;">Açıklama</p>
              <p style="margin:0;color:#374151;white-space:pre-wrap;">${escapeHtml(ticket.description)}</p>
            </div>
            <div style="margin-top:24px;">
              <a href="${escapeHtml(adminPanelUrl)}" style="display:inline-block;padding:10px 20px;background-color:#4f46e5;color:#ffffff;border-radius:6px;text-decoration:none;font-weight:bold;margin-right:8px;">Admin Panelde Görüntüle</a>
              ${
                packageSnapshot?.paketciDetailUrl
                  ? `<a href="${escapeHtml(packageSnapshot.paketciDetailUrl)}" style="display:inline-block;padding:10px 20px;background-color:#ffffff;color:#4f46e5;border:1px solid #4f46e5;border-radius:6px;text-decoration:none;font-weight:bold;">Paketçi'de Görüntüle</a>`
                  : ''
              }
            </div>
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

function renderTable(title: string, rows: TableRow[]): string {
  const visibleRows = rows.filter(([, value]) => value !== null && value !== undefined && value !== '');
  if (visibleRows.length === 0) return '';

  const rowsHtml = visibleRows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:6px 12px;color:#6b7280;font-size:13px;width:160px;border-bottom:1px solid #f3f4f6;">${escapeHtml(label)}</td>
        <td style="padding:6px 12px;color:#111827;font-size:13px;border-bottom:1px solid #f3f4f6;">${escapeHtml(String(value))}</td>
      </tr>`
    )
    .join('');

  return `
  <div style="margin-bottom:20px;">
    <p style="margin:0 0 6px 0;font-weight:bold;color:#111827;font-size:14px;">${escapeHtml(title)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:6px;">
      ${rowsHtml}
    </table>
  </div>`;
}
