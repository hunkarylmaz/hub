import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildSupportRequestResponse, SupportRequestResponse } from '../common/response';
import { DuplicateTicketException, FileTooLargeException, FileTypeNotSupportedException } from '../common/errors';
import { MailService } from '../mail/mail.service';
import { TicketService } from '../tickets/ticket.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';

/** extension/config.js > ALLOWED_ATTACHMENT_TYPES ile AYNI tutulmalıdır. */
const ALLOWED_ATTACHMENT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

@Injectable()
export class ExtensionService {
  constructor(
    private readonly ticketService: TicketService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService
  ) {}

  async createSupportRequest(
    dto: CreateSupportRequestDto,
    attachment?: Express.Multer.File
  ): Promise<SupportRequestResponse> {
    if (attachment) {
      this.assertValidAttachment(attachment);
    }

    const senderEmail = dto.sender.email.trim().toLowerCase();
    await this.ticketService.assertEmailNotRateLimited(senderEmail);

    const duplicate = await this.ticketService.findActiveDuplicate(
      dto.package.paketciPackageId ?? null,
      dto.package.orderNumber ?? null
    );
    if (duplicate) {
      throw new DuplicateTicketException(duplicate.ticketNumber);
    }

    const ticket = await this.ticketService.createTicket({ dto, createdFromUrl: dto.page.url });

    await this.mailService.queueNewTicketMails(
      ticket.id,
      attachment
        ? {
            filename: attachment.originalname,
            contentBase64: attachment.buffer.toString('base64'),
            contentType: attachment.mimetype
          }
        : undefined
    );

    return buildSupportRequestResponse(ticket.ticketNumber);
  }

  private assertValidAttachment(file: Express.Multer.File): void {
    const maxSize = Number(this.configService.get('MAX_ATTACHMENT_SIZE_BYTES') ?? 5 * 1024 * 1024);
    if (file.size > maxSize) {
      throw new FileTooLargeException(maxSize);
    }
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
      throw new FileTypeNotSupportedException();
    }
  }
}
