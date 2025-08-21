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
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
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
    try {
      const events = await this.eventsService.findAll();
      return ResponseBuilder.successWithCount(
        events,
        'Events retrieved successfully',
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
        error.message || 'Failed to retrieve events',
      );
    }
  }

  @Get('my-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  async findMyEvents(@Request() req: RequestType & { user: { id: number } }) {
    try {
      const events = await this.eventsService.findByOrganizer(req.user.id);
      return ResponseBuilder.successWithCount(
        events,
        'My events retrieved successfully',
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
        error.message || 'Failed to retrieve my events',
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const eventId = parseInt(id, 10);
      if (isNaN(eventId)) {
        throw new BadRequestException('Invalid event ID format');
      }
      const event = await this.eventsService.findOne(eventId);
      return ResponseBuilder.success(event, 'Event retrieved successfully');
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
        error.message || 'Failed to retrieve event',
      );
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  async create(
    @Body(new ValidationPipe()) createEventDto: CreateEventDto,
    @Request() req: RequestType & { user: { id: number } },
  ) {
    try {
      const event = await this.eventsService.create(
        createEventDto,
        req.user.id,
      );
      return ResponseBuilder.success(event, 'Event created successfully');
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
        error.message || 'Failed to create event',
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateEventDto: UpdateEventDto,
  ) {
    try {
      const eventId = parseInt(id, 10);
      if (isNaN(eventId)) {
        throw new BadRequestException('Invalid event ID format');
      }
      const event = await this.eventsService.update(eventId, updateEventDto);
      return ResponseBuilder.success(event, 'Event updated successfully');
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
        error.message || 'Failed to update event',
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      const eventId = parseInt(id, 10);
      if (isNaN(eventId)) {
        throw new BadRequestException('Invalid event ID format');
      }
      await this.eventsService.remove(eventId);
      return ResponseBuilder.successNoData('Event deleted successfully');
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
        error.message || 'Failed to delete event',
      );
    }
  }
}
