import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AdminUnauthorizedException } from './errors';

/**
 * v1 GEÇİCİ KORUMA: /api/admin/* ve /api/mail/test rotaları için paylaşılan
 * sır tabanlı basit kontrol (header: X-Admin-Api-Key). Bu, gerçek bir admin
 * login/JWT sistemi DEĞİLDİR — sadece bu uçların tamamen açık kalmasını
 * önler. v2'de admin panel + JWT/RBAC geldiğinde bu guard kaldırılıp
 * gerçek auth guard'ı ile değiştirilmelidir.
 */
@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header('x-admin-api-key');
    const expected = process.env.ADMIN_API_KEY;

    if (!expected || !provided || provided !== expected) {
      throw new AdminUnauthorizedException();
    }
    return true;
  }
}
