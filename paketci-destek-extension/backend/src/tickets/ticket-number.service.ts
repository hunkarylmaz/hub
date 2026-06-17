import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Ticket numarası formatı: TCK-{yıl}-{6 haneli sıra} (örn. TCK-2026-000001).
 * Şemada ayrı bir "sequence" tablosu YOK (kullanıcı şema sözleşmesi yalnızca
 * 4 tablo tanımlıyor); bu yüzden sıradaki numara, o yıla ait en yüksek
 * ticket_number değeri okunup +1 yapılarak üretilir. Bu okuma + insert AYNI
 * Prisma transaction'ı içinde çalışır; yarış durumunda (iki eşzamanlı istek
 * aynı numarayı üretirse) ticket_number'daki UNIQUE kısıt insert'i P2002 ile
 * reddeder — TicketService bu durumda transaction'ı yeni bir numarayla
 * tekrar dener (bkz. ticket.service.ts > createTicket retry döngüsü).
 */
@Injectable()
export class TicketNumberService {
  async generate(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TCK-${year}-`;

    const lastTicket = await tx.supportTicket.findFirst({
      where: { ticketNumber: { startsWith: prefix } },
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true }
    });

    const lastSequence = lastTicket ? parseInt(lastTicket.ticketNumber.slice(prefix.length), 10) : 0;
    const nextSequence = (Number.isFinite(lastSequence) ? lastSequence : 0) + 1;

    return `${prefix}${String(nextSequence).padStart(6, '0')}`;
  }
}
