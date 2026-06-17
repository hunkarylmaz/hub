import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * IP bazlı global rate limit guard'ı. `ThrottlerModule.forRoot()` ile
 * RATE_LIMIT_TTL/RATE_LIMIT_MAX .env değerleri kullanılarak yapılandırılır
 * (bkz. app.module.ts). `/extension/support-requests` rotası, controller
 * üzerinde `@Throttle(...)` dekoratörüyle daha sıkı bir limite tabi tutulur.
 *
 * E-posta bazlı ek limit (aynı e-postadan saatte N talep) burada DEĞİL,
 * veritabanı sorgusu gerektirdiği için ExtensionService içinde uygulanır
 * (multipart body, guard aşamasında henüz parse edilmemiş olabilir).
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {}
