import { Injectable } from '@nestjs/common';
import { MailJobAttachment, MailQueueService } from './mail-queue.service';
import { GoogleSmtpProvider } from './providers/google-smtp.provider';

@Injectable()
export class MailService {
  constructor(
    private readonly mailQueueService: MailQueueService,
    private readonly mailProvider: GoogleSmtpProvider
  ) {}

  /** Ticket oluşturulunca sıraya alınan iki job: admin bildirimi + kullanıcı onayı. */
  async queueNewTicketMails(ticketId: string, attachment?: MailJobAttachment): Promise<void> {
    await this.mailQueueService.enqueue('admin_new_extension_ticket', { ticketId, attachment });
    await this.mailQueueService.enqueue('user_extension_ticket_created', { ticketId });
  }

  /** POST /api/mail/test — kuyruğu atlayıp SMTP bağlantısını anında doğrular. */
  async sendTestMail(to: string): Promise<{ messageId: string }> {
    return this.mailProvider.send({
      to,
      subject: 'Paketçi Destek Sistemi — Test Maili',
      html: '<p>Bu bir test mailidir. Google SMTP entegrasyonu çalışıyor.</p>'
    });
  }
}
