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
  BadRequestException,
  Post,
  Request,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard, RolesGuard } from './../guards';
import { Roles } from './../decorators';
import { UserRole } from 'generated/prisma';
import { CreateEventDto, UpdateEventDto } from './dto';
import { Request as RequestType } from 'express';
import { ResponseBuilder } from '../common';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll() {
    const events = await this.eventsService.findAll();
    return ResponseBuilder.successWithCount(
      events,
      'Events retrieved successfully',
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      throw new BadRequestException('Invalid event ID format');
    }
    const event = await this.eventsService.findOne(eventId);
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
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateEventDto: UpdateEventDto,
  ) {
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      throw new BadRequestException('Invalid event ID format');
    }
    const event = await this.eventsService.update(eventId, updateEventDto);
    return ResponseBuilder.success(event, 'Event updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      throw new BadRequestException('Invalid event ID format');
    }
    await this.eventsService.remove(eventId);
    return ResponseBuilder.successNoData('Event deleted successfully');
  }
}
