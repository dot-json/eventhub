import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventStatus, Event, $Enums, Prisma, UserRole } from 'generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma.service';

export type EventSummary = {
  id: number;
  title: string;
  description: string;
  category: $Enums.EventCategory | null;
  start_date: Date;
  end_date: Date;
  location: string;
  capacity: number;
  ticket_price: Decimal;
  tickets_sold: number;
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
        tickets_sold: true,
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
        tickets_sold: true,
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
        tickets_sold: true,
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
          start_date: createEventDto.start_date,
          end_date: createEventDto.end_date,
          location: createEventDto.location,
          capacity: createEventDto.capacity,
          ticket_price: createEventDto.ticket_price,
          tickets_sold: 0,
          status: EventStatus.DRAFT,
          organizer_id,
        },
      });
    } catch (error) {
      throw new ConflictException('Event could not be created');
    }
  }

  async update(
    id: number,
    updateEventDto: UpdateEventDto,
    organizer_id: number,
    user_role: UserRole,
  ): Promise<EventSummary> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.organizer_id !== organizer_id && user_role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to update this event');
    }

    const data: Partial<Prisma.EventUpdateInput> = {};

    if (updateEventDto.title !== undefined) {
      data.title = updateEventDto.title;
    }

    if (updateEventDto.description !== undefined) {
      data.description = updateEventDto.description;
    }

    if (updateEventDto.category !== undefined) {
      data.category = updateEventDto.category;
    }

    if (updateEventDto.start_date !== undefined) {
      data.start_date = updateEventDto.start_date;
    }

    if (updateEventDto.end_date !== undefined) {
      data.end_date = updateEventDto.end_date;
    }

    if (updateEventDto.location !== undefined) {
      data.location = updateEventDto.location;
    }

    if (updateEventDto.capacity !== undefined) {
      if (updateEventDto.capacity < event.tickets_sold) {
        throw new BadRequestException(
          'Capacity cannot be less than tickets sold',
        );
      } else {
        data.capacity = updateEventDto.capacity;
      }
    }

    if (updateEventDto.status !== undefined) {
      data.status = updateEventDto.status;
    }

    if (updateEventDto.ticket_price !== undefined) {
      data.ticket_price = updateEventDto.ticket_price;
    }

    try {
      return await this.prisma.event.update({
        where: { id },
        data,
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
          tickets_sold: true,
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
