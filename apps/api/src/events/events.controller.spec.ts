import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';

describe('EventsController', () => {
  let controller: EventsController;
  let eventsService: EventsService;

  const mockEventsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findUserEvents: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockEventsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EventsController>(EventsController);
    eventsService = module.get<EventsService>(EventsService);
  });

  describe('findAll', () => {
    it('should return paginated events', async () => {
      const mockEvents = {
        events: [
          {
            id: 1,
            title: 'Test Event',
            description: 'Test Description',
            start_date: new Date(),
            end_date: new Date(),
            location: 'Test Location',
            ticket_price: 50,
            max_capacity: 100,
            status: 'PUBLISHED',
            category: 'MUSIC',
          },
        ],
        pagination: {
          page: 1,
          limit: 5,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockEventsService.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findAll({}, { user: mockUser } as any);

      expect(eventsService.findAll).toHaveBeenCalledWith({}, mockUser.id);
      expect(result.data).toEqual(mockEvents.events);
      expect(result.pagination).toEqual(mockEvents.pagination);
    });

    it('should handle query parameters', async () => {
      const queryDto = {
        search: 'concert',
        category: 'MUSIC' as any,
        page: 2,
        limit: 10,
      };

      const mockEvents = {
        events: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: true,
        },
      };

      mockEventsService.findAll.mockResolvedValue(mockEvents);

      await controller.findAll(queryDto, { user: mockUser } as any);

      expect(eventsService.findAll).toHaveBeenCalledWith(queryDto, mockUser.id);
    });
  });

  describe('findOne', () => {
    it('should return a single event', async () => {
      const eventId = 1;
      const mockEvent = {
        id: 1,
        title: 'Test Event',
        description: 'Test Description',
        start_date: new Date(),
        end_date: new Date(),
        location: 'Test Location',
        ticket_price: 50,
        max_capacity: 100,
        status: 'PUBLISHED',
        category: 'MUSIC',
      };

      mockEventsService.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne(eventId.toString(), {
        user: mockUser,
      } as any);

      expect(eventsService.findOne).toHaveBeenCalledWith(
        eventId,
        mockUser.id,
        mockUser.role,
      );
      expect(result.data).toEqual(mockEvent);
    });
  });

  describe('create', () => {
    it('should create a new event', async () => {
      const createEventDto = {
        title: 'New Event',
        description: 'New Description',
        start_date: new Date(),
        end_date: new Date(),
        location: 'New Location',
        ticket_price: 75,
        capacity: 200,
        category: 'MUSIC' as any,
      };

      const mockEvent = {
        id: 1,
        ...createEventDto,
        status: 'PUBLISHED',
        organizer_id: mockUser.id,
      };

      mockEventsService.create.mockResolvedValue(mockEvent);

      const result = await controller.create(createEventDto, {
        user: mockUser,
      } as any);

      expect(eventsService.create).toHaveBeenCalledWith(
        createEventDto,
        mockUser.id,
      );
      expect(result.data).toEqual(mockEvent);
    });
  });
});
