import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PackageSnapshot, SupportTicket, TicketPriority } from '@prisma/client';
import { buildAdminNewExtensionTicketMail } from './templates/admin-new-extension-ticket.template';
import { buildUserExtensionTicketCreatedMail } from './templates/user-extension-ticket-created.template';

export interface PreparedMail {
  to: string | string[];
  subject: string;
  html: string;
}

const CRITICAL_PRIORITIES: TicketPriority[] = [TicketPriority.urgent, TicketPriority.critical];

@Injectable()
export class MailTemplateService {
  constructor(private readonly configService: ConfigService) {}

  buildAdminNewTicketMail(ticket: SupportTicket, packageSnapshot: PackageSnapshot | null): PreparedMail {
    const isCritical = CRITICAL_PRIORITIES.includes(ticket.priority);
    const adminPanelUrl = this.configService.get<string>('ADMIN_PANEL_URL') ?? '';

    const { subject, html } = buildAdminNewExtensionTicketMail({ ticket, packageSnapshot, adminPanelUrl, isCritical });

    const recipients = this.parseEmailList(this.configService.get<string>('ADMIN_NOTIFICATION_EMAILS'));
    if (isCritical) {
      recipients.push(...this.parseEmailList(this.configService.get<string>('CRITICAL_TICKET_EMAILS')));
    }

    return { to: Array.from(new Set(recipients)), subject, html };
  }

  buildUserTicketCreatedMail(ticket: SupportTicket): PreparedMail {
    const { subject, html } = buildUserExtensionTicketCreatedMail({ ticket, supportTrackingUrl: null });
    return { to: ticket.senderEmail, subject, html };
  }

  private parseEmailList(value: string | undefined): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);
  }
}
