import { Injectable } from '@nestjs/common';
import { MailLog, MailLogStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface CreatePendingLogInput {
  ticketId: string;
  provider: string;
  templateKey: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
}

@Injectable()
export class MailLogService {
  constructor(private readonly prisma: PrismaService) {}

  /** Aynı ticket+template için BullMQ retry'lerinde mevcut "pending" kaydı yeniden kullanır. */
  async upsertPendingLog(input: CreatePendingLogInput): Promise<string> {
    const existing = await this.prisma.mailLog.findFirst({
      where: { ticketId: input.ticketId, templateKey: input.templateKey, status: MailLogStatus.pending },
      orderBy: { createdAt: 'desc' }
    });

    if (existing) {
      return existing.id;
    }

    const created = await this.prisma.mailLog.create({
      data: {
        ticketId: input.ticketId,
        provider: input.provider,
        templateKey: input.templateKey,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName ?? null,
        subject: input.subject,
        status: MailLogStatus.pending
      }
    });
    return created.id;
  }

  async markSent(id: string): Promise<void> {
    await this.prisma.mailLog.update({
      where: { id },
      data: { status: MailLogStatus.sent, sentAt: new Date() }
    });
  }

  /** Her başarısız denemede çağrılır; sadece SON denemede status="failed" olarak işaretler. */
  async recordFailedAttempt(id: string, errorMessage: string, isFinalAttempt: boolean): Promise<void> {
    await this.prisma.mailLog.update({
      where: { id },
      data: {
        errorMessage,
        retryCount: { increment: 1 },
        ...(isFinalAttempt ? { status: MailLogStatus.failed, failedAt: new Date() } : {})
      }
    });
  }

  async list(params: { skip: number; take: number }): Promise<{ items: MailLog[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.mailLog.findMany({
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.mailLog.count()
    ]);
    return { items, total };
  }
}
