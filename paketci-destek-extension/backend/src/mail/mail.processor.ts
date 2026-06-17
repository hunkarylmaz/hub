import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { MailLogService } from './mail-log.service';
import { MailJobData, MailJobType, MailQueueService, MAIL_QUEUE_NAME } from './mail-queue.service';
import { MailTemplateService } from './mail-template.service';
import { GoogleSmtpProvider } from './providers/google-smtp.provider';

/**
 * BullMQ worker — "mail" kuyruğundaki job'ları tüketir. Başarısız gönderim
 * 3 kez retry edilir (attempts ayarı enqueue sırasında verilir, bkz.
 * mail-queue.service.ts). Ticket oluşturma işlemi mail gönderiminden
 * BAĞIMSIZDIR: mail başarısız olsa bile ticket zaten oluşturulmuş olur.
 */
@Injectable()
export class MailProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailProcessor.name);
  private worker!: Worker<MailJobData>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mailProvider: GoogleSmtpProvider,
    private readonly mailLogService: MailLogService,
    private readonly mailQueueService: MailQueueService,
    private readonly mailTemplateService: MailTemplateService
  ) {}

  onModuleInit(): void {
    this.worker = new Worker<MailJobData>(MAIL_QUEUE_NAME, (job) => this.handle(job), {
      connection: {
        host: this.configService.get<string>('REDIS_HOST'),
        port: Number(this.configService.get('REDIS_PORT'))
      }
    });

    this.worker.on('failed', (job, error) => {
      this.logger.warn(`Mail job başarısız: ${job?.id} (${job?.name}) — ${error.message}`);
    });
  }

  private async handle(job: Job<MailJobData>): Promise<void> {
    const type = job.name as MailJobType;
    const { ticketId } = job.data;

    await this.mailQueueService.markProcessing(ticketId, type);

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { packageSnapshot: true }
    });
    if (!ticket) {
      throw new Error(`Ticket bulunamadı: ${ticketId}`);
    }

    const mail =
      type === 'admin_new_extension_ticket'
        ? this.mailTemplateService.buildAdminNewTicketMail(ticket, ticket.packageSnapshot)
        : this.mailTemplateService.buildUserTicketCreatedMail(ticket);

    const logId = await this.mailLogService.upsertPendingLog({
      ticketId: ticket.id,
      provider: 'google_smtp',
      templateKey: type,
      recipientEmail: Array.isArray(mail.to) ? mail.to.join(', ') : mail.to,
      recipientName: type === 'user_extension_ticket_created' ? ticket.senderName : null,
      subject: mail.subject
    });

    try {
      await this.mailProvider.send({
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
        attachments: job.data.attachment
          ? [
              {
                filename: job.data.attachment.filename,
                content: Buffer.from(job.data.attachment.contentBase64, 'base64'),
                contentType: job.data.attachment.contentType
              }
            ]
          : undefined
      });

      await this.mailLogService.markSent(logId);
      await this.mailQueueService.markCompleted(ticketId, type);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen mail gönderim hatası';
      const attemptsMade = (job.attemptsMade ?? 0) + 1;
      const maxAttempts = job.opts.attempts ?? 1;
      const isFinalAttempt = attemptsMade >= maxAttempts;

      await this.mailLogService.recordFailedAttempt(logId, message, isFinalAttempt);
      if (isFinalAttempt) {
        await this.mailQueueService.markFailed(ticketId, type, message, attemptsMade);
      }

      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
  }
}
