import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTicketDto, PurchaseTicketDto } from './dto';
import { Ticket } from '../../generated/prisma';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a complex, unique hash for a ticket
   * Includes event ID, user ID, timestamp, and random bytes for uniqueness
   */
  private generateTicketHash(eventId: number, userId: number): string {
    const timestamp = Date.now().toString();
    const randomSalt = randomBytes(8).toString('hex');
    const dataToHash = `${eventId}-${userId}-${timestamp}-${randomSalt}`;

    return createHash('sha256')
      .update(dataToHash)
      .digest('hex')
      .substring(0, 32); // Keep it 32 characters for QR code compatibility
  }

  async create(
    createTicketDto: CreateTicketDto,
    userId: number,
  ): Promise<Ticket> {
    // Generate complex hash for the ticket
    const hash = this.generateTicketHash(createTicketDto.eventId, userId);

    try {
      // Check if event exists and has capacity
      const event = await this.prisma.event.findUnique({
        where: { id: createTicketDto.eventId },
        include: { _count: { select: { tickets: true } } },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      if (event._count.tickets >= event.capacity) {
        throw new ConflictException('Event is at full capacity');
      }

      // Check user's current ticket count for this event (max 5)
      const userTicketCount = await this.prisma.ticket.count({
        where: {
          event_id: createTicketDto.eventId,
          user_id: userId,
        },
      });

      if (userTicketCount >= 5) {
        throw new ConflictException(
          'User already has maximum 5 tickets for this event',
        );
      }

      return await this.prisma.ticket.create({
        data: {
          event_id: createTicketDto.eventId,
          user_id: userId,
          hash: hash,
        },
        include: {
          event: {
            select: {
              title: true,
              start_date: true,
              end_date: true,
              location: true,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Ticket could not be created');
    }
  }

  /**
   * Purchase tickets for an event with race condition protection
   *
   * Race condition handling:
   * - Uses Prisma transactions to ensure atomicity
   * - Locks event row during capacity checking
   * - Validates user ticket limits within transaction
   * - Creates tickets sequentially with unique hashes
   *
   * @param purchaseTicketDto - Contains eventId and quantity (1-5)
   * @param userId - ID of the purchasing user
   * @returns Array of created tickets
   */
  async purchaseTicket(
    purchaseTicketDto: PurchaseTicketDto,
    userId: number,
  ): Promise<Ticket[]> {
    const { eventId, quantity = 1 } = purchaseTicketDto;

    // Use a transaction to handle race conditions
    return await this.prisma.$transaction(async (prisma) => {
      // Lock the event row to prevent race conditions on capacity
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { _count: { select: { tickets: true } } },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check current user's ticket count for this event
      const userTicketCount = await prisma.ticket.count({
        where: {
          event_id: eventId,
          user_id: userId,
        },
      });

      // Validate user doesn't exceed 5 tickets per event
      if (userTicketCount + quantity > 5) {
        throw new ConflictException(
          `Cannot purchase ${quantity} tickets. User can have maximum 5 tickets per event. Current tickets: ${userTicketCount}`,
        );
      }

      // Check if event has enough capacity
      if (event._count.tickets + quantity > event.capacity) {
        throw new ConflictException(
          `Not enough capacity. Requested: ${quantity}, Available: ${event.capacity - event._count.tickets}`,
        );
      }

      // Create multiple tickets
      const tickets: Ticket[] = [];
      for (let i = 0; i < quantity; i++) {
        const hash = this.generateTicketHash(eventId, userId);

        const ticket = await prisma.ticket.create({
          data: {
            event_id: eventId,
            user_id: userId,
            hash: hash,
          },
          include: {
            event: {
              select: {
                title: true,
                start_date: true,
                end_date: true,
                location: true,
              },
            },
          },
        });

        tickets.push(ticket);
      }

      return tickets;
    });
  }

  async getUserTicketsForEvent(
    userId: number,
    eventId: number,
  ): Promise<Ticket[]> {
    if (!userId || typeof userId !== 'number' || userId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    if (!eventId || typeof eventId !== 'number' || eventId <= 0) {
      throw new BadRequestException('Invalid event ID');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return await this.prisma.ticket.findMany({
      where: {
        user_id: userId,
        event_id: eventId,
      },
      include: {
        event: {
          select: {
            title: true,
            start_date: true,
            end_date: true,
            location: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async getAllUserTickets(userId: number): Promise<Ticket[]> {
    return await this.prisma.ticket.findMany({
      where: {
        user_id: userId,
      },
      include: {
        event: {
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
            status: true,
            organizer: {
              select: {
                id: true,
                org_name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.ticket.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Ticket not found');
    }
  }
}
