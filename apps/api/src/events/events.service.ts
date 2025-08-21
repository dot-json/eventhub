import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventStatus, Event } from 'generated/prisma';
import { PrismaService } from '../prisma.service';

export type EventSummary = {
  id: number;
  title: string;
  description: string;
  category: string | null;
  start_date: Date;
  end_date: Date;
  location: string;
  capacity: number;
  ticket_price: number;
  tickets_remaining: number;
  status: EventStatus;
  organizer: {
    id: number;
    org_name: string | null;
  };
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<EventSummary[]> {
    return this.prisma.event.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        start_date: true,
        end_date: true,
        location: true,
        capacity: true,
        ticket_price: true,
        tickets_remaining: true,
        status: true,
        organizer: {
          select: {
            id: true,
            org_name: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findByOrganizer(organizerId: number): Promise<EventSummary[]> {
    return this.prisma.event.findMany({
      where: {
        organizer_id: organizerId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        start_date: true,
        end_date: true,
        location: true,
        capacity: true,
        ticket_price: true,
        tickets_remaining: true,
        status: true,
        organizer: {
          select: {
            id: true,
            org_name: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<EventSummary> {
    const event = await this.prisma.event.findUnique({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        start_date: true,
        end_date: true,
        location: true,
        capacity: true,
        ticket_price: true,
        tickets_remaining: true,
        status: true,
        organizer: {
          select: {
            id: true,
            org_name: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
      where: { id },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async create(
    createEventDto: CreateEventDto,
    organizer_id: number,
  ): Promise<Event> {
    try {
      return await this.prisma.event.create({
        data: {
          title: createEventDto.title,
          description: createEventDto.description,
          category: createEventDto.category,
          start_date: createEventDto.startDate,
          end_date: createEventDto.endDate,
          location: createEventDto.location,
          capacity: createEventDto.capacity,
          ticket_price: createEventDto.ticket_price,
          tickets_remaining: createEventDto.capacity,
          status: EventStatus.DRAFT,
          organizer_id,
        },
      });
    } catch (error) {
      throw new ConflictException('Event could not be created');
    }
  }

  async update(id: number, data: UpdateEventDto): Promise<Event> {
    try {
      return await this.prisma.event.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new NotFoundException('Event not found');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.event.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Event not found');
    }
  }
}
