import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SupportTicket, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizePlainText, sanitizeRequiredText } from '../common/sanitize';
import { RateLimitedException } from '../common/errors';
import { CreateSupportRequestDto } from '../extension/dto/create-support-request.dto';
import { TicketNumberService } from './ticket-number.service';

/** "Açık" sayılan durumlar — duplicate kontrolünde bu durumdaki ticket'lar dikkate alınır. */
const OPEN_STATUSES: TicketStatus[] = [TicketStatus.open, TicketStatus.in_progress];

const TICKET_NUMBER_INSERT_MAX_ATTEMPTS = 5;

export interface CreateTicketInput {
  dto: CreateSupportRequestDto;
  createdFromUrl: string;
}

@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketNumberService: TicketNumberService,
    private readonly configService: ConfigService
  ) {}

  /** Aynı e-postadan saatte en fazla N talep — servis seviyesi ek limit (guard, multipart body'ye erişemiyor). */
  async assertEmailNotRateLimited(email: string): Promise<void> {
    const limit = Number(this.configService.get('SUPPORT_REQUEST_PER_EMAIL_HOURLY_LIMIT') ?? 5);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentCount = await this.prisma.supportTicket.count({
      where: { senderEmail: email, createdAt: { gte: oneHourAgo } }
    });

    if (recentCount >= limit) {
      throw new RateLimitedException();
    }
  }

  /** Aynı paket için açık (open/in_progress) bir ticket varsa onu döner; yoksa null. */
  async findActiveDuplicate(paketciPackageId: string | null, paketciOrderNumber: string | null): Promise<SupportTicket | null> {
    if (!paketciPackageId && !paketciOrderNumber) return null;

    return this.prisma.supportTicket.findFirst({
      where: {
        status: { in: OPEN_STATUSES },
        OR: [
          ...(paketciPackageId ? [{ paketciPackageId }] : []),
          ...(paketciOrderNumber ? [{ paketciOrderNumber }] : [])
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Ticket + package_snapshot kaydını TEK transaction içinde oluşturur.
   * Ticket numarası aynı transaction içinde üretildiğinden eşzamanlı iki
   * istek aynı numarayı üretebilir (bkz. TicketNumberService yorumu);
   * bu durumda P2002 (unique constraint) hatası alınır ve transaction
   * yeni bir numarayla tekrar denenir.
   */
  async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
    const { dto, createdFromUrl } = input;

    for (let attempt = 1; attempt <= TICKET_NUMBER_INSERT_MAX_ATTEMPTS; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const ticketNumber = await this.ticketNumberService.generate(tx);

          return tx.supportTicket.create({
            data: {
              ticketNumber,
              source: dto.source,
              extensionVersion: dto.extensionVersion,
              priority: dto.ticket.priority,
              category: dto.ticket.category,
              title: sanitizeRequiredText(dto.ticket.title),
              description: sanitizeRequiredText(dto.ticket.description),
              senderName: sanitizeRequiredText(dto.sender.name),
              senderEmail: dto.sender.email.trim().toLowerCase(),
              senderPhone: sanitizePlainText(dto.sender.phone),
              paketciPackageId: sanitizePlainText(dto.package.paketciPackageId),
              paketciOrderNumber: sanitizePlainText(dto.package.orderNumber),
              paketciDetailUrl: sanitizePlainText(dto.package.paketciDetailUrl),
              createdFromUrl: sanitizePlainText(createdFromUrl),
              packageSnapshot: {
                create: {
                  paketciPackageId: sanitizePlainText(dto.package.paketciPackageId),
                  orderNumber: sanitizePlainText(dto.package.orderNumber),
                  restaurantName: sanitizePlainText(dto.package.restaurantName),
                  branchName: sanitizePlainText(dto.package.branchName),
                  courierName: sanitizePlainText(dto.package.courierName),
                  packageStatus: sanitizePlainText(dto.package.packageStatus),
                  deliveryStatus: sanitizePlainText(dto.package.deliveryStatus),
                  paymentType: sanitizePlainText(dto.package.paymentType),
                  packageTotal: sanitizePlainText(dto.package.packageTotal),
                  customerNameMasked: sanitizePlainText(dto.package.customerNameMasked),
                  customerPhoneMasked: sanitizePlainText(dto.package.customerPhoneMasked),
                  customerAddressMasked: sanitizePlainText(dto.package.customerAddressMasked),
                  packageCreatedAt: sanitizePlainText(dto.package.packageCreatedAt),
                  paketciDetailUrl: sanitizePlainText(dto.package.paketciDetailUrl),
                  rawSnapshot: dto.package as Prisma.InputJsonValue
                }
              }
            },
            include: { packageSnapshot: true }
          });
        });
      } catch (error) {
        const isUniqueViolation = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!isUniqueViolation || attempt === TICKET_NUMBER_INSERT_MAX_ATTEMPTS) {
          throw error;
        }
      }
    }

    throw new Error('Ticket numarası üretilemedi.');
  }

  async listTickets(params: { skip: number; take: number }): Promise<{ items: SupportTicket[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: { packageSnapshot: true }
      }),
      this.prisma.supportTicket.count()
    ]);
    return { items, total };
  }

  async getTicketById(id: string): Promise<SupportTicket | null> {
    return this.prisma.supportTicket.findUnique({
      where: { id },
      include: { packageSnapshot: true, mailLogs: true }
    });
  }
}
