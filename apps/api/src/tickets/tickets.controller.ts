import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../generated/prisma';
import { TicketsService } from './tickets.service';
import { PurchaseTicketDto } from './dto';
import { Ticket } from '../../generated/prisma';
import { ApiResponse, ResponseBuilder } from '../common';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('purchase')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async purchaseTicket(
    @Body() purchaseTicketDto: PurchaseTicketDto,
    @Request() req: any,
  ): Promise<ApiResponse<Ticket[]> & { count: number }> {
    const tickets = await this.ticketsService.purchaseTicket(
      purchaseTicketDto,
      req.user.id,
    );
    return ResponseBuilder.successWithCount(
      tickets,
      `${tickets.length} ticket(s) purchased successfully`,
    );
  }

  @Post('validate')
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async validateTicket(
    @Body('hash') hash: string,
  ): Promise<ApiResponse<Ticket>> {
    const ticket = await this.ticketsService.validateTicket(hash);
    return ResponseBuilder.success(ticket, 'Ticket validated successfully');
  }

  @Get('my-tickets')
  @Roles(UserRole.CUSTOMER, UserRole.ORGANIZER, UserRole.ADMIN)
  async getAllUserTickets(
    @Request() req: any,
  ): Promise<ApiResponse<Ticket[]> & { count: number }> {
    const tickets = await this.ticketsService.getAllUserTickets(req.user.id);
    return ResponseBuilder.successWithCount(
      tickets,
      tickets.length > 0
        ? 'Tickets retrieved successfully'
        : 'No tickets found',
    );
  }

  @Get('my-tickets/:eventId')
  @Roles(UserRole.CUSTOMER, UserRole.ORGANIZER, UserRole.ADMIN)
  async getUserTicketsForEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Request() req: any,
  ): Promise<ApiResponse<Ticket[]> & { count: number }> {
    const tickets = await this.ticketsService.getUserTicketsForEvent(
      req.user.id,
      eventId,
    );
    return ResponseBuilder.successWithCount(
      tickets,
      tickets.length > 0
        ? `Found ${tickets.length} ticket(s) for this event`
        : 'No tickets found for this event',
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Omit<ApiResponse, 'data'>> {
    await this.ticketsService.remove(id);
    return ResponseBuilder.successNoData('Ticket deleted successfully');
  }
}
