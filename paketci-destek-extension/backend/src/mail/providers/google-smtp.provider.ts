import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { IMailProvider, SendMailOptions, SendMailResult } from '../mail-provider.interface';

/**
 * GÜVENLİK: GOOGLE_SMTP_PASSWORD SADECE process.env üzerinden okunur, hiçbir
 * yerde loglanmaz, hiçbir API response'unda dönmez. Bu değer normal Google
 * hesap şifresi değil, 2FA'lı hesapta üretilen bir "App Password" olmalıdır
 * (bkz. .env.example yorumları). Chrome eklentisi bu sınıfı hiç görmez.
 */
@Injectable()
export class GoogleSmtpProvider implements IMailProvider, OnModuleInit {
  private transporter!: Transporter;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('GOOGLE_SMTP_HOST'),
      port: Number(this.configService.get('GOOGLE_SMTP_PORT')),
      secure: this.configService.get('GOOGLE_SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('GOOGLE_SMTP_USER'),
        pass: this.configService.get<string>('GOOGLE_SMTP_PASSWORD')
      }
    });
  }

  async send(options: SendMailOptions): Promise<SendMailResult> {
    const fromName = this.configService.get<string>('MAIL_FROM_NAME');
    const fromEmail = this.configService.get<string>('MAIL_FROM_EMAIL');
    const replyTo = this.configService.get<string>('MAIL_REPLY_TO');

    const info = await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      replyTo,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType
      }))
    });

    return { messageId: info.messageId };
  }
}
