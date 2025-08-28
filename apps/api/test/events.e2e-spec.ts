import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('Events (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Clean database
    await prismaService.ticket.deleteMany();
    await prismaService.event.deleteMany();
    await prismaService.user.deleteMany();

    // Create test user (organizer) and get auth token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        role: 'ORGANIZER',
      })
      .expect(201);

    authToken = registerResponse.body.data.access_token;
    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    await prismaService.ticket.deleteMany();
    await prismaService.event.deleteMany();
    await prismaService.user.deleteMany();
    await app.close();
  });

  describe('/events (GET)', () => {
    beforeEach(async () => {
      // Create test event
      await prismaService.event.create({
        data: {
          title: 'Test Event',
          description: 'Test Description',
          start_date: new Date(Date.now() + 86400000), // Tomorrow
          end_date: new Date(Date.now() + 172800000), // Day after tomorrow
          location: 'Test Location',
          ticket_price: 50,
          capacity: 100,
          tickets_sold: 0,
          status: 'PUBLISHED',
          category: 'MUSIC',
          organizer_id: userId,
        },
      });
    });

    afterEach(async () => {
      await prismaService.event.deleteMany();
    });

    it('should return public events', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        title: 'Test Event',
        status: 'PUBLISHED',
      });
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter events by category', async () => {
      await request(app.getHttpServer())
        .get('/events?category=SPORTS')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(0);
        });

      await request(app.getHttpServer())
        .get('/events?category=MUSIC')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
        });
    });

    it('should search events by title', async () => {
      await request(app.getHttpServer())
        .get('/events?search=Test')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
        });

      await request(app.getHttpServer())
        .get('/events?search=Nonexistent')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(0);
        });
    });

    it('should paginate results', async () => {
      await request(app.getHttpServer())
        .get('/events?page=1&limit=1')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.pagination.page).toBe(1);
          expect(res.body.pagination.limit).toBe(1);
        });
    });
  });

  describe('/events (POST)', () => {
    it('should create a new event', async () => {
      const eventData = {
        title: 'New Event',
        description: 'New Description',
        start_date: new Date(Date.now() + 86400000).toISOString(),
        end_date: new Date(Date.now() + 172800000).toISOString(),
        location: 'New Location',
        ticket_price: 75,
        capacity: 200,
        category: 'SPORTS',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.data).toMatchObject({
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        ticket_price: eventData.ticket_price.toString(), // Prisma returns Decimal as string
        capacity: eventData.capacity,
        category: eventData.category,
        organizer_id: userId,
      });
    });

    it('should require authentication', async () => {
      const eventData = {
        title: 'Unauthorized Event',
        description: 'Should fail',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        location: 'Nowhere',
        ticket_price: 0,
        capacity: 1,
        category: 'OTHER',
      };

      await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .expect(401);
    });
  });

  describe('/events/:id (GET)', () => {
    let eventId: number;

    beforeEach(async () => {
      const event = await prismaService.event.create({
        data: {
          title: 'Single Event',
          description: 'Single Description',
          start_date: new Date(Date.now() + 86400000),
          end_date: new Date(Date.now() + 172800000),
          location: 'Single Location',
          ticket_price: 50,
          capacity: 100,
          tickets_sold: 0,
          status: 'PUBLISHED',
          category: 'MUSIC',
          organizer_id: userId,
        },
      });
      eventId = event.id;
    });

    afterEach(async () => {
      await prismaService.event.deleteMany();
    });

    it('should return a single event', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: eventId,
        title: 'Single Event',
      });
    });

    it('should return 404 for non-existent event', async () => {
      await request(app.getHttpServer())
        .get('/events/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
