import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UseGuards,
  Post,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard, RolesGuard, OptionalJwtAuthGuard } from './../guards';
import { Roles } from './../decorators';
import { UserRole } from '../../generated/prisma';
import { CreateEventDto, UpdateEventDto, QueryEventsDto } from './dto';
import { Request as RequestType } from 'express';
import { ResponseBuilder } from '../common';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(
    @Query(new ValidationPipe({ transform: true })) queryDto: QueryEventsDto,
    @Request() req?: RequestType & { user?: { id: number } },
  ) {
    const userId = req?.user?.id;
    const result = await this.eventsService.findAll(queryDto, userId);
    return ResponseBuilder.successWithPagination(
      result.events,
      'Events retrieved successfully',
      result.pagination,
    );
  }

  @Get('my-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  async findMyEvents(@Request() req: RequestType & { user: { id: number } }) {
    const events = await this.eventsService.findByOrganizer(req.user.id);
    return ResponseBuilder.successWithCount(
      events,
      'My events retrieved successfully',
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ORGANIZER, UserRole.ADMIN)
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestType & { user: { id: number; role: UserRole } },
  ) {
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      throw new BadRequestException('Invalid event ID format');
    }
    const event = await this.eventsService.findOne(
      eventId,
      req.user.id,
      req.user.role,
    );
    return ResponseBuilder.success(event, 'Event retrieved successfully');
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  async create(
    @Body(new ValidationPipe()) createEventDto: CreateEventDto,
    @Request() req: RequestType & { user: { id: number } },
  ) {
    const event = await this.eventsService.create(createEventDto, req.user.id);
    return ResponseBuilder.success(event, 'Event created successfully');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateEventDto: UpdateEventDto,
    @Request() req: RequestType & { user: { id: number; role: UserRole } },
  ) {
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      throw new BadRequestException('Invalid event ID format');
    }
    const event = await this.eventsService.update(
      eventId,
      updateEventDto,
      req.user.id,
      req.user.role,
    );
    return ResponseBuilder.success(event, 'Event updated successfully');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @Request() req: RequestType & { user: { id: number; role: UserRole } },
  ) {
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      throw new BadRequestException('Invalid event ID format');
    }
    await this.eventsService.remove(eventId);
    return ResponseBuilder.successNoData('Event deleted successfully');
  }
}
