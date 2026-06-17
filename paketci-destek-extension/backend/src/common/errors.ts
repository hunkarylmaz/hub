import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Tüm özel hata sınıfları bir `errorCode` taşır; Chrome eklentisinin
 * apiClient.js > mapErrorResponse() fonksiyonu bu kodu okuyup Türkçe
 * kullanıcı mesajına çevirir. Mesaj metni burada İNGİLİZCE/teknik olabilir,
 * kullanıcıya gösterilecek metin eklenti tarafında tutulur.
 */
export class AppException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    status: HttpStatus,
    public readonly extra?: Record<string, unknown>
  ) {
    super({ success: false, errorCode, message, ...extra }, status);
  }
}

export class DuplicateTicketException extends AppException {
  constructor(existingTicketNumber: string) {
    super('DUPLICATE_TICKET', 'Bu paket için zaten açık bir talep var.', HttpStatus.CONFLICT, {
      existingTicketNumber
    });
  }
}

export class AdminUnauthorizedException extends AppException {
  constructor() {
    super('UNAUTHORIZED', 'Yetkisiz işlem.', HttpStatus.UNAUTHORIZED);
  }
}

export class RateLimitedException extends AppException {
  constructor() {
    super('RATE_LIMITED', 'Çok fazla talep gönderdiniz. Lütfen kısa süre sonra tekrar deneyin.', HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class FileTooLargeException extends AppException {
  constructor(maxSizeBytes: number) {
    super('FILE_TOO_LARGE', `Dosya boyutu ${maxSizeBytes} byte sınırını aşıyor.`, HttpStatus.BAD_REQUEST);
  }
}

export class FileTypeNotSupportedException extends AppException {
  constructor() {
    super('FILE_TYPE_NOT_SUPPORTED', 'Desteklenmeyen dosya türü.', HttpStatus.BAD_REQUEST);
  }
}

export class InvalidPayloadException extends AppException {
  constructor(details: string[]) {
    super('VALIDATION_ERROR', 'Gönderilen veri doğrulamadan geçemedi.', HttpStatus.BAD_REQUEST, { details });
  }
}
