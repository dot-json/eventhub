import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
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
  user_ticket_count?: number;
  organizer: {
    id: number;
    org_name: string | null;
  };
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    queryDto: QueryEventsDto = {},
    userId?: number,
  ): Promise<EventSummary[]> {
    const {
      search,
      category,
      start_date,
      end_date,
      sort_by = 'date_asc',
      limit = 50,
      offset = 0,
    } = queryDto;

    const where: Prisma.EventWhereInput = {
      status: 'PUBLISHED',
      end_date: { gte: new Date() },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    // Date range filters using Budapest timezone (Europe/Budapest)
    // Currently UTC+2 (CEST - Central European Summer Time)
    if (start_date) {
      // Show events that are still active on or after this date
      // (events that end on or after the start_date)
      const startOfDay = new Date(`${start_date}T00:00:00+02:00`);
      where.end_date = { gte: startOfDay };
    }
    if (end_date) {
      // Show events that are active on or before this date
      // (events that start on or before the end_date)
      const endOfDay = new Date(`${end_date}T23:59:59+02:00`);
      where.start_date = { lte: endOfDay };
    }

    let orderBy: Prisma.EventOrderByWithRelationInput = {};
    switch (sort_by) {
      case 'date_asc':
        orderBy = { start_date: 'asc' };
        break;
      case 'date_desc':
        orderBy = { start_date: 'desc' };
        break;
      case 'ticket_price_asc':
        orderBy = { ticket_price: 'asc' };
        break;
      case 'ticket_price_desc':
        orderBy = { ticket_price: 'desc' };
        break;
      default:
        orderBy = { start_date: 'desc' };
    }
    if (userId) {
      // Include ticket count when userId is provided
      const events = await this.prisma.event.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
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
          _count: {
            select: {
              tickets: {
                where: {
                  user_id: userId,
                },
              },
            },
          },
        },
      });

      return events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        start_date: event.start_date,
        end_date: event.end_date,
        location: event.location,
        capacity: event.capacity,
        ticket_price: event.ticket_price,
        tickets_sold: event.tickets_sold,
        status: event.status,
        organizer: event.organizer,
        user_ticket_count: event._count.tickets,
      }));
    } else {
      // Standard query without ticket counts for anonymous users
      const events = await this.prisma.event.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
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

      return events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        start_date: event.start_date,
        end_date: event.end_date,
        location: event.location,
        capacity: event.capacity,
        ticket_price: event.ticket_price,
        tickets_sold: event.tickets_sold,
        status: event.status,
        organizer: event.organizer,
      }));
    }
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

  async findOne(
    id: number,
    userId: number,
    userRole?: string,
  ): Promise<EventSummary> {
    // Build the where clause - customers can only see published events
    const baseWhere: Prisma.EventWhereInput = { id };
    if (userRole === 'CUSTOMER') {
      baseWhere.status = 'PUBLISHED';
    }

    const event = await this.prisma.event.findFirst({
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
        _count: {
          select: {
            tickets: {
              where: {
                user_id: userId,
              },
            },
          },
        },
      },
      where: baseWhere,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Transform to include user_ticket_count
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      start_date: event.start_date,
      end_date: event.end_date,
      location: event.location,
      capacity: event.capacity,
      ticket_price: event.ticket_price,
      tickets_sold: event.tickets_sold,
      status: event.status,
      organizer: event.organizer,
      user_ticket_count: event._count.tickets,
    };
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
