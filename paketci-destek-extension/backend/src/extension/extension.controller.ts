import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ParseJsonFieldPipe } from '../common/parse-json-field.pipe';
import { FileTypeNotSupportedException } from '../common/errors';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { ExtensionService } from './extension.service';

/** extension/config.js > ALLOWED_ATTACHMENT_TYPES ile AYNI tutulmalıdır — burada ilk savunma hattı (multer fileFilter). */
const ALLOWED_ATTACHMENT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
/** .env > MAX_ATTACHMENT_SIZE_BYTES ile AYNI tutulmalıdır. Decorator değerlendirme anında ConfigService henüz erişilebilir değildir; otoriter kontrol ExtensionService'tedir. */
const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;

@Controller('extension')
export class ExtensionController {
  constructor(private readonly extensionService: ExtensionService) {}

  /**
   * Bu rota global throttler limitinden (app.module.ts > ThrottlerModule)
   * daha SIKI bir limite tabidir — destek talebi oluşturma DB yazımı +
   * mail kuyruğu tetiklediği için maliyetli bir işlemdir.
   */
  @Post('support-requests')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('attachment', {
      limits: { fileSize: MAX_ATTACHMENT_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
          callback(new FileTypeNotSupportedException(), false);
          return;
        }
        callback(null, true);
      }
    })
  )
  async createSupportRequest(
    // NOT: Parametre tipi BİLEREK `unknown` — `CreateSupportRequestDto` yazılırsa
    // global ValidationPipe bu parametreyi de (henüz JSON.parse edilmemiş ham
    // string haliyle) class-validator ile doğrulamaya çalışır ve ParseJsonFieldPipe
    // çalışmadan 400 döner. `unknown`/`any` tipi, design:paramtypes metadata'sını
    // `Object` olarak işaretler; ValidationPipe.toValidate() bunu atlar, böylece
    // doğrulamayı SADECE ParseJsonFieldPipe yapar.
    @Body('payload', new ParseJsonFieldPipe(CreateSupportRequestDto)) payloadRaw: unknown,
    @UploadedFile() attachment: Express.Multer.File | undefined
  ) {
    const payload = payloadRaw as CreateSupportRequestDto;
    return this.extensionService.createSupportRequest(payload, attachment);
  }
}
