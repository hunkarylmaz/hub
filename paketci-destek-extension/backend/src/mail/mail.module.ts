import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailLogService } from './mail-log.service';
import { MailQueueService } from './mail-queue.service';
import { MailTemplateService } from './mail-template.service';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';
import { GoogleSmtpProvider } from './providers/google-smtp.provider';

@Module({
  controllers: [MailController],
  providers: [GoogleSmtpProvider, MailQueueService, MailLogService, MailTemplateService, MailProcessor, MailService],
  exports: [MailService]
})
export class MailModule {}
