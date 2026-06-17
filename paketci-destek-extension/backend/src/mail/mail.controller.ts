import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../common/admin-api-key.guard';
import { ListSupportRequestsQueryDto } from '../tickets/dto/list-support-requests.query.dto';
import { SendTestMailDto } from './dto/send-test-mail.dto';
import { MailLogService } from './mail-log.service';
import { MailService } from './mail.service';

/** v1 admin uçları — AdminApiKeyGuard ile korunur (bkz. common/admin-api-key.guard.ts). */
@Controller()
@UseGuards(AdminApiKeyGuard)
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly mailLogService: MailLogService
  ) {}

  @Post('mail/test')
  async sendTestMail(@Body() body: SendTestMailDto) {
    const result = await this.mailService.sendTestMail(body.to);
    return { success: true, messageId: result.messageId };
  }

  @Get('admin/mail/logs')
  async listLogs(@Query() query: ListSupportRequestsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const { items, total } = await this.mailLogService.list({
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return { success: true, page, pageSize, total, items };
  }
}
