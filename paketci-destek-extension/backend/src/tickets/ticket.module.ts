import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller';
import { TicketNumberService } from './ticket-number.service';
import { TicketService } from './ticket.service';

@Module({
  controllers: [TicketController],
  providers: [TicketService, TicketNumberService],
  exports: [TicketService]
})
export class TicketModule {}
