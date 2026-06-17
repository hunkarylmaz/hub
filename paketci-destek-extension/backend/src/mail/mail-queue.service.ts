import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailQueueJobStatus, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

export const MAIL_QUEUE_NAME = 'mail';

/** Spesifikasyondaki iki job tipi — değerler aynı zamanda mail_logs.template_key olarak kullanılır. */
export type MailJobType = 'admin_new_extension_ticket' | 'user_extension_ticket_created';

export interface MailJobAttachment {
  filename: string;
  contentBase64: string;
  contentType?: string;
}

export interface MailJobData {
  ticketId: string;
  attachment?: MailJobAttachment;
}

/**
 * BullMQ tabanlı mail kuyruğu üreticisi. Her enqueue çağrısı hem Redis'e
 * (BullMQ) hem de mail_queue_jobs tablosuna (uygulama seviyesi izleme,
 * admin panelde sorgulanabilir kalıcı kayıt) yazar.
 */
@Injectable()
export class MailQueueService implements OnModuleDestroy {
  readonly queue: Queue<MailJobData>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.queue = new Queue<MailJobData>(MAIL_QUEUE_NAME, {
      connection: {
        host: this.configService.get<string>('REDIS_HOST'),
        port: Number(this.configService.get('REDIS_PORT'))
      }
    });
  }

  async enqueue(type: MailJobType, data: MailJobData): Promise<void> {
    await this.prisma.mailQueueJob.create({
      data: {
        ticketId: data.ticketId,
        type,
        status: MailQueueJobStatus.queued,
        payload: { ticketId: data.ticketId, hasAttachment: Boolean(data.attachment) } satisfies Prisma.InputJsonValue
      }
    });

    await this.queue.add(type, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false
    });
  }

  async markProcessing(ticketId: string, type: MailJobType): Promise<void> {
    await this.updateLatestJob(ticketId, type, { status: MailQueueJobStatus.processing });
  }

  async markCompleted(ticketId: string, type: MailJobType): Promise<void> {
    await this.updateLatestJob(ticketId, type, { status: MailQueueJobStatus.completed });
  }

  async markFailed(ticketId: string, type: MailJobType, lastError: string, retryCount: number): Promise<void> {
    await this.updateLatestJob(ticketId, type, { status: MailQueueJobStatus.failed, lastError, retryCount });
  }

  private async updateLatestJob(
    ticketId: string,
    type: MailJobType,
    data: Partial<{ status: MailQueueJobStatus; lastError: string; retryCount: number }>
  ): Promise<void> {
    const latest = await this.prisma.mailQueueJob.findFirst({
      where: { ticketId, type },
      orderBy: { createdAt: 'desc' }
    });
    if (!latest) return;

    await this.prisma.mailQueueJob.update({ where: { id: latest.id }, data });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
