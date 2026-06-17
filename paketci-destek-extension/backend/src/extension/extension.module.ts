import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { TicketModule } from '../tickets/ticket.module';
import { ExtensionController } from './extension.controller';
import { ExtensionService } from './extension.service';

@Module({
  imports: [TicketModule, MailModule],
  controllers: [ExtensionController],
  providers: [ExtensionService]
})
export class ExtensionModule {}
