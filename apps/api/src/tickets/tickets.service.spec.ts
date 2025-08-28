import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma.service';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

describe('TicketsService', () => {
  let service: TicketsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    ticket: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('purchaseTicket', () => {
    const mockEvent = {
      id: 1,
      title: 'Test Event',
      max_capacity: 100,
      ticket_price: 50,
      status: 'PUBLISHED',
      start_date: new Date(Date.now() + 86400000), // Tomorrow
    };

    const userId = 1;
    const eventId = 1;
    const quantity = 2;

    beforeEach(() => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.ticket.count.mockResolvedValue(50); // 50 tickets sold
    });

    it('should purchase tickets successfully', async () => {
      const mockTickets = [
        { id: 1, event_id: eventId, user_id: userId, ticket_code: 'ABC123' },
        { id: 2, event_id: eventId, user_id: userId, ticket_code: 'ABC124' },
      ];

      // Mock the transaction to simulate successful purchase
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTransactionPrisma = {
          ...mockPrismaService,
          $queryRaw: jest.fn().mockResolvedValue([
            {
              id: eventId,
              tickets_sold: 52,
              status: 'PUBLISHED',
              start_date: new Date(Date.now() + 86400000),
            },
          ]),
          event: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockEvent,
              status: 'PUBLISHED',
            }),
          },
          ticket: {
            count: jest.fn().mockResolvedValue(2), // User has 2 tickets, adding 2 more = 4 total
            create: jest
              .fn()
              .mockResolvedValueOnce(mockTickets[0])
              .mockResolvedValueOnce(mockTickets[1]),
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
            findMany: jest.fn().mockResolvedValue(mockTickets),
          },
        };
        return callback(mockTransactionPrisma);
      });

      const result = await service.purchaseTicket(
        { event_id: eventId, quantity },
        userId,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockTickets[0]);
      expect(result[1]).toEqual(mockTickets[1]);
    });

    it('should throw NotFoundException if event does not exist', async () => {
      // Mock the transaction to simulate event not found during transaction
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTransactionPrisma = {
          ...mockPrismaService,
          $queryRaw: jest.fn().mockResolvedValue([]), // Empty result when event not found
        };
        return callback(mockTransactionPrisma);
      });

      await expect(
        service.purchaseTicket({ event_id: eventId, quantity }, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if event is not published', async () => {
      // Mock the transaction to simulate unpublished event
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTransactionPrisma = {
          ...mockPrismaService,
          $queryRaw: jest.fn().mockResolvedValue([
            {
              id: eventId,
              tickets_sold: 50,
              status: 'DRAFT', // Not published
              start_date: new Date(Date.now() + 86400000),
            },
          ]),
        };
        return callback(mockTransactionPrisma);
      });

      await expect(
        service.purchaseTicket({ event_id: eventId, quantity }, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if not enough capacity', async () => {
      // Mock the transaction to simulate capacity check
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTransactionPrisma = {
          ...mockPrismaService,
          $queryRaw: jest.fn().mockResolvedValue([
            {
              id: eventId,
              tickets_sold: 99, // Only 1 ticket left, but requesting 2
              status: 'PUBLISHED',
              start_date: new Date(Date.now() + 86400000),
              capacity: 100,
            },
          ]),
          ticket: {
            count: jest.fn().mockResolvedValue(2), // User already has 2 tickets
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
            findMany: jest.fn().mockResolvedValue([]),
          },
        };
        return callback(mockTransactionPrisma);
      });

      await expect(
        service.purchaseTicket({ event_id: eventId, quantity }, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid quantity', async () => {
      await expect(
        service.purchaseTicket({ event_id: eventId, quantity: 0 }, userId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.purchaseTicket({ event_id: eventId, quantity: -1 }, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findUserTickets', () => {
    it('should return user tickets for a specific event', async () => {
      const userId = 1;
      const eventId = 1;
      const mockTickets = [
        {
          id: 1,
          event_id: eventId,
          user_id: userId,
          ticket_code: 'ABC123',
          purchase_date: new Date(),
        },
      ];

      mockPrismaService.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await service.getUserTicketsForEvent(userId, eventId);

      expect(prismaService.ticket.findMany).toHaveBeenCalledWith({
        where: { user_id: userId, event_id: eventId },
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
        orderBy: { created_at: 'desc' },
      });
      expect(result).toEqual(mockTickets);
    });

    it('should return all user tickets if no eventId provided', async () => {
      const userId = 1;
      const mockTickets = [
        {
          id: 1,
          event_id: 1,
          user_id: userId,
          ticket_code: 'ABC123',
          purchase_date: new Date(),
        },
        {
          id: 2,
          event_id: 2,
          user_id: userId,
          ticket_code: 'ABC124',
          purchase_date: new Date(),
        },
      ];

      mockPrismaService.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await service.getAllUserTickets(userId);

      expect(prismaService.ticket.findMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              start_date: true,
              end_date: true,
              location: true,
              ticket_price: true,
              capacity: true,
              status: true,
              category: true,
              organizer: {
                select: {
                  id: true,
                  email: true,
                  org_name: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });
      expect(result).toEqual(mockTickets);
    });
  });
});
