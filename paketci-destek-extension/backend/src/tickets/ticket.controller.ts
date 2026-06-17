import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../common/admin-api-key.guard';
import { ListSupportRequestsQueryDto } from './dto/list-support-requests.query.dto';
import { TicketService } from './ticket.service';

/**
 * v1 admin uçları — gerçek admin panel/JWT auth gelene kadar AdminApiKeyGuard
 * ile korunur (bkz. common/admin-api-key.guard.ts).
 */
@Controller('admin/support-requests')
@UseGuards(AdminApiKeyGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  async list(@Query() query: ListSupportRequestsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const { items, total } = await this.ticketService.listTickets({
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return { success: true, page, pageSize, total, items };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const ticket = await this.ticketService.getTicketById(id);
    if (!ticket) {
      throw new NotFoundException({ success: false, errorCode: 'NOT_FOUND', message: 'Talep bulunamadı.' });
    }
    return { success: true, item: ticket };
  }
}
