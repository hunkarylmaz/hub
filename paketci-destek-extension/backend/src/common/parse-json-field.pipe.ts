import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform, Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InvalidPayloadException } from './errors';

/**
 * multipart/form-data isteklerinde "payload" alanı bir JSON STRING olarak
 * gelir (FormData içinde dosya ile birlikte JSON taşımanın standart yolu).
 * Bu pipe: (1) JSON.parse eder, (2) hedef DTO sınıfına dönüştürür,
 * (3) class-validator ile DOĞRULAR. Geçersizse 400 + VALIDATION_ERROR döner.
 */
@Injectable()
export class ParseJsonFieldPipe<T extends object> implements PipeTransform<string, Promise<T>> {
  constructor(private readonly dtoClass: Type<T>) {}

  async transform(value: string, _metadata: ArgumentMetadata): Promise<T> {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException('"payload" alanı zorunludur ve JSON string olmalıdır.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new BadRequestException('"payload" alanı geçerli bir JSON string değil.');
    }

    const instance = plainToInstance(this.dtoClass, parsed);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true
    });

    if (errors.length > 0) {
      const details = errors.map((err) => {
        const constraints = err.constraints ? Object.values(err.constraints).join(', ') : 'geçersiz alan';
        return `${err.property}: ${constraints}`;
      });
      throw new InvalidPayloadException(details);
    }

    return instance;
  }
}
