import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [UsersModule, AuthModule, EventsModule, TicketsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
