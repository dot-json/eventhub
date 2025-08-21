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
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
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
    try {
      const tickets = await this.ticketsService.purchaseTicket(
        purchaseTicketDto,
        req.user.id,
      );
      return ResponseBuilder.successWithCount(
        tickets,
        `${tickets.length} ticket(s) purchased successfully`,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to purchase ticket',
      );
    }
  }

  @Get('my-tickets')
  @Roles(UserRole.CUSTOMER, UserRole.ORGANIZER, UserRole.ADMIN)
  async getAllUserTickets(
    @Request() req: any,
  ): Promise<ApiResponse<Ticket[]> & { count: number }> {
    try {
      const tickets = await this.ticketsService.getAllUserTickets(req.user.id);
      return ResponseBuilder.successWithCount(
        tickets,
        tickets.length > 0
          ? 'Tickets retrieved successfully'
          : 'No tickets found',
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to retrieve tickets',
      );
    }
  }

  @Get('my-tickets/:eventId')
  @Roles(UserRole.CUSTOMER, UserRole.ORGANIZER, UserRole.ADMIN)
  async getUserTicketsForEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Request() req: any,
  ): Promise<ApiResponse<Ticket[]> & { count: number }> {
    try {
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
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to retrieve event tickets',
      );
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Omit<ApiResponse, 'data'>> {
    try {
      await this.ticketsService.remove(id);
      return ResponseBuilder.successNoData('Ticket deleted successfully');
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to delete ticket',
      );
    }
  }
}
