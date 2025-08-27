import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTicketDto, PurchaseTicketDto } from './dto';
import { Prisma, Ticket, EventStatus } from '../../generated/prisma';
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
      .substring(0, 32); // 32 characters for QR code compatibility
  }

  /**
   * Validate ticket hash format
   *
   * @param hash - Ticket hash to validate
   * @returns
   */
  private validateTicketHash(hash: string): boolean {
    const hashRegex = /^[a-f0-9]{32}$/; // 32 hex characters
    return hashRegex.test(hash);
  }

  async create(
    createTicketDto: CreateTicketDto,
    userId: number,
  ): Promise<Ticket> {
    // Generate complex hash for the ticket
    const hash = this.generateTicketHash(createTicketDto.event_id, userId);

    try {
      // Check if event exists and has capacity
      const event = await this.prisma.event.findUnique({
        where: { id: createTicketDto.event_id },
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
          event_id: createTicketDto.event_id,
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
          event_id: createTicketDto.event_id,
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
    const { event_id, quantity = 1 } = purchaseTicketDto;

    // Validate quantity upfront
    if (quantity < 1 || quantity > 5) {
      throw new BadRequestException('Quantity must be between 1 and 5');
    }

    interface LockedEvent {
      id: number;
      title: string;
      location: string;
      capacity: number;
      start_date: Date;
      end_date: Date;
      status: EventStatus;
      tickets_sold: number;
    }

    return await this.prisma.$transaction(
      async (prisma) => {
        // Lock the event row using raw SQL for PostgreSQL
        const events = await prisma.$queryRaw<Array<LockedEvent>>`
          UPDATE events 
          SET tickets_sold = tickets_sold + ${quantity}
          WHERE id = ${event_id} 
          AND status = 'PUBLISHED'
          AND tickets_sold + ${quantity} <= capacity
          RETURNING id, title, location, capacity, start_date, end_date, status, tickets_sold;
        `;

        const event = events[0];

        if (!event) {
          throw new NotFoundException('Event not found');
        }

        // Check if event is published
        if (event.status !== 'PUBLISHED') {
          throw new ConflictException(
            'Tickets can only be purchased for published events',
          );
        }

        // Check current ticket count for the event (derived from tickets table)
        const currentTicketCount = await prisma.ticket.count({
          where: { event_id: event_id },
        });

        // Check user ticket count for this event
        const userTicketCount = await prisma.ticket.count({
          where: {
            event_id: event_id,
            user_id: userId,
          },
        });

        // Validate user ticket limit (max 5 tickets)
        if (userTicketCount + quantity > 5) {
          throw new ConflictException(
            `Cannot purchase ${quantity} tickets. User can have maximum 5 tickets per event. Current tickets: ${userTicketCount}`,
          );
        }

        // Validate event capacity
        if (currentTicketCount + quantity > event.capacity) {
          throw new ConflictException(
            `Not enough capacity. Requested: ${quantity}, Available: ${event.capacity - currentTicketCount}`,
          );
        }

        // Create multiple tickets in a single query
        const ticketData = Array.from({ length: quantity }, () => ({
          event_id: event_id,
          user_id: userId,
          hash: this.generateTicketHash(event_id, userId),
        }));

        await prisma.ticket.createMany({
          data: ticketData,
          skipDuplicates: true, // Prevent duplicate hashes if unique constraint exists
        });

        // Fetch created tickets with event details for response
        const createdTickets = await prisma.ticket.findMany({
          where: {
            event_id: event_id,
            user_id: userId,
            hash: { in: ticketData.map((t) => t.hash) },
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

        // If fewer tickets were created than requested (e.g., due to duplicates), throw error
        if (createdTickets.length < quantity) {
          throw new ConflictException(
            'Failed to create all requested tickets. Please try again.',
          );
        }

        return createdTickets;
      },
      {
        // Use SERIALIZABLE isolation for maximum concurrency safety
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        // Set a timeout to prevent long locks
        maxWait: 5000, // 5 seconds max wait for transaction
        timeout: 30000, // 30 seconds max transaction time
      },
    );
  }

  async validateTicket(hash: string): Promise<Ticket> {
    if (!this.validateTicketHash(hash)) {
      throw new BadRequestException('Invalid ticket hash format');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { hash },
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

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: ticket.event_id },
    });

    if (!event) {
      throw new NotFoundException('Associated event not found');
    }

    if (ticket.used_at) {
      throw new ConflictException('Ticket has already been used');
    }

    const now = new Date();
    const eventStart = new Date(event.start_date);
    const eventEnd = new Date(event.end_date);
    if (now < eventStart || now > eventEnd) {
      throw new ConflictException('Ticket is not valid for this time');
    }

    return await this.prisma.ticket.update({
      where: { hash },
      data: { used_at: new Date() },
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
