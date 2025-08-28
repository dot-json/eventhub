import {
  PrismaClient,
  UserRole,
  EventStatus,
  $Enums,
} from '../generated/prisma';
import * as bcrypt from 'bcryptjs';
import { set } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEEDER] Starting database seeding...');

  console.log('[SEEDER] Cleaning existing data...');
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // Reset auto-increment sequences to start from 1
  console.log('[SEEDER] Resetting ID sequences...');
  await prisma.$executeRaw`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE events_id_seq RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE tickets_id_seq RESTART WITH 1`;

  const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  };

  console.log('[SEEDER] Creating admin user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@eventhub.local',
      password: await hashPassword('admin123'),
      first_name: 'Admin',
      last_name: 'User',
      role: UserRole.ADMIN,
    },
  });

  console.log('[SEEDER] Creating organizer user...');
  const organizer = await prisma.user.create({
    data: {
      email: 'organizer@eventhub.local',
      password: await hashPassword('organizer123'),
      first_name: 'Jane',
      last_name: 'Smith',
      org_name: 'EventPro Productions',
      role: UserRole.ORGANIZER,
    },
  });

  console.log('[SEEDER] Creating customer users...');
  const customers: any[] = [];

  const customerData = [
    {
      email: 'customer1@eventhub.local',
      first_name: 'John',
      last_name: 'Doe',
    },
    {
      email: 'customer2@eventhub.local',
      first_name: 'Alice',
      last_name: 'Johnson',
    },
    {
      email: 'customer3@eventhub.local',
      first_name: 'Bob',
      last_name: 'Wilson',
    },
    {
      email: 'customer4@eventhub.local',
      first_name: 'Charlie',
      last_name: 'Brown',
    },
    {
      email: 'customer5@eventhub.local',
      first_name: 'David',
      last_name: 'Williams',
    },
    {
      email: 'customer6@eventhub.local',
      first_name: 'Eve',
      last_name: 'Davis',
    },
    {
      email: 'customer7@eventhub.local',
      first_name: 'Frank',
      last_name: 'Miller',
    },
  ];

  for (const customerInfo of customerData) {
    const customer = await prisma.user.create({
      data: {
        email: customerInfo.email,
        password: await hashPassword('customer123'),
        first_name: customerInfo.first_name,
        last_name: customerInfo.last_name,
        role: UserRole.CUSTOMER,
      },
    });
    customers.push(customer);
  }

  console.log('[SEEDER] Creating events...');

  const today = new Date();
  const liveEvent = await prisma.event.create({
    data: {
      title: 'Summer Music Festival 2025',
      description:
        'A spectacular 3-day music festival featuring top artists from around the world. Experience amazing performances across multiple stages with food, drinks, and unforgettable memories.',
      category: $Enums.EventCategory.MUSIC,
      start_date: set(new Date(today.getTime() - 24 * 60 * 60 * 1000), {
        hours: 9,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }), // Yesterday
      end_date: set(new Date(today.getTime() + 27 * 60 * 60 * 1000), {
        hours: 17,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }), // In 3 days
      location: 'Central Park, New York',
      capacity: 5000,
      ticket_price: 125,
      tickets_sold: 1200,
      status: EventStatus.PUBLISHED,
      organizer_id: organizer.id,
    },
  });
  console.log(`[SEEDER] Live event created: ${liveEvent.title}`);

  // Upcoming Events
  const upcomingEvents = [
    {
      title: 'Tech Conference 2025',
      description:
        'Join industry leaders and innovators for a day of cutting-edge technology discussions, networking opportunities, and insights into the future of tech.',
      category: $Enums.EventCategory.CONFERENCE,
      start_date: new Date('2025-09-15T09:00:00Z'),
      end_date: new Date('2025-09-15T18:00:00Z'),
      location: 'Convention Center, San Francisco',
      capacity: 1000,
      ticket_price: 199,
      tickets_sold: 750,
    },
    {
      title: 'Food & Wine Tasting',
      description:
        'An exquisite evening of wine tasting paired with gourmet cuisine prepared by renowned chefs. Perfect for food enthusiasts and wine connoisseurs.',
      category: $Enums.EventCategory.CULINARY,
      start_date: new Date('2025-10-02T19:00:00Z'),
      end_date: new Date('2025-10-02T23:00:00Z'),
      location: 'Downtown Hotel Ballroom, Chicago',
      capacity: 200,
      ticket_price: 150,
      tickets_sold: 50,
    },
    {
      title: 'Christmas Market & Concert',
      description:
        'Celebrate the holiday season with a magical Christmas market featuring local artisans, followed by a festive concert with seasonal favorites.',
      category: $Enums.EventCategory.FAIR,
      start_date: new Date('2025-12-20T16:00:00Z'),
      end_date: new Date('2025-12-20T22:00:00Z'),
      location: 'Town Square, Boston',
      capacity: 3000,
      ticket_price: 50,
      tickets_sold: 2800,
    },
    {
      title: 'Jazz Night Extravaganza',
      description:
        'Experience an unforgettable evening of live jazz performances by top artists in an intimate setting.',
      category: $Enums.EventCategory.MUSIC,
      start_date: new Date('2025-09-20T20:00:00Z'),
      end_date: new Date('2025-09-20T23:00:00Z'),
      location: 'Blue Note Jazz Club, New York',
      capacity: 300,
      ticket_price: 75,
      tickets_sold: 200,
    },
    {
      title: 'Marathon City Run',
      description:
        'Join thousands of runners in this annual city marathon, featuring scenic routes and a vibrant community atmosphere.',
      category: $Enums.EventCategory.SPORTS,
      start_date: new Date('2025-10-05T07:00:00Z'),
      end_date: new Date('2025-10-05T14:00:00Z'),
      location: 'Central Park, New York',
      capacity: 5000,
      ticket_price: 60,
      tickets_sold: 4500,
    },
    {
      title: 'Modern Art Showcase',
      description:
        'Explore contemporary artworks from emerging and established artists in this curated gallery exhibition.',
      category: $Enums.EventCategory.ART,
      start_date: new Date('2025-10-10T10:00:00Z'),
      end_date: new Date('2025-10-17T18:00:00Z'),
      location: 'City Art Gallery, Los Angeles',
      capacity: 500,
      ticket_price: 20,
      tickets_sold: 300,
    },
    {
      title: 'AI Innovation Summit',
      description:
        'A conference exploring the latest advancements in artificial intelligence, featuring keynote speakers and hands-on demos.',
      category: $Enums.EventCategory.CONFERENCE,
      start_date: new Date('2025-10-12T08:00:00Z'),
      end_date: new Date('2025-10-13T17:00:00Z'),
      location: 'Tech Hub, Seattle',
      capacity: 800,
      ticket_price: 250,
      tickets_sold: 600,
    },
    {
      title: 'Photography Workshop',
      description:
        'Learn professional photography techniques from industry experts in this hands-on workshop.',
      category: $Enums.EventCategory.WORKSHOP,
      start_date: new Date('2025-10-15T09:00:00Z'),
      end_date: new Date('2025-10-15T16:00:00Z'),
      location: 'Community Center, Austin',
      capacity: 50,
      ticket_price: 120,
      tickets_sold: 40,
    },
    {
      title: 'Leadership Seminar',
      description:
        'Develop your leadership skills with insights from top executives in this interactive seminar.',
      category: $Enums.EventCategory.SEMINAR,
      start_date: new Date('2025-10-18T10:00:00Z'),
      end_date: new Date('2025-10-18T15:00:00Z'),
      location: 'Business School, Chicago',
      capacity: 150,
      ticket_price: 99,
      tickets_sold: 100,
    },
    {
      title: 'Sculpture Exhibition',
      description:
        'Discover stunning sculptures from local and international artists in this open-air exhibition.',
      category: $Enums.EventCategory.EXHIBITION,
      start_date: new Date('2025-10-20T11:00:00Z'),
      end_date: new Date('2025-10-27T19:00:00Z'),
      location: 'City Park, Denver',
      capacity: 1000,
      ticket_price: 15,
      tickets_sold: 700,
    },
    {
      title: 'Charity Gala for Education',
      description:
        'Support education initiatives at this elegant gala featuring live music, auctions, and inspiring speeches.',
      category: $Enums.EventCategory.CHARITY,
      start_date: new Date('2025-11-01T18:00:00Z'),
      end_date: new Date('2025-11-01T23:00:00Z'),
      location: 'Grand Hotel, Miami',
      capacity: 400,
      ticket_price: 200,
      tickets_sold: 300,
    },
    {
      title: 'Shakespeare in the Park',
      description:
        'Enjoy a captivating outdoor performance of Shakespeare\'s classic play, "A Midsummer Night\'s Dream."',
      category: $Enums.EventCategory.THEATRE,
      start_date: new Date('2025-11-05T19:00:00Z'),
      end_date: new Date('2025-11-05T21:30:00Z'),
      location: 'City Park Amphitheater, Portland',
      capacity: 600,
      ticket_price: 25,
      tickets_sold: 500,
    },
    {
      title: 'Halloween Dance Party',
      description:
        'Get ready for a spooky night of dancing, costumes, and live DJ performances at this Halloween bash.',
      category: $Enums.EventCategory.PARTY,
      start_date: new Date('2025-10-31T21:00:00Z'),
      end_date: new Date('2025-11-01T02:00:00Z'),
      location: 'Nightclub, Las Vegas',
      capacity: 700,
      ticket_price: 40,
      tickets_sold: 600,
    },
    {
      title: 'Fall Craft Fair',
      description:
        'Shop unique handmade goods from local artisans at this vibrant fall craft fair.',
      category: $Enums.EventCategory.FAIR,
      start_date: new Date('2025-11-08T10:00:00Z'),
      end_date: new Date('2025-11-08T17:00:00Z'),
      location: 'Community Grounds, Atlanta',
      capacity: 2000,
      ticket_price: 10,
      tickets_sold: 1500,
    },
    {
      title: 'Fashion Runway Show',
      description:
        'Witness the latest trends in this dazzling fashion show featuring top designers and models.',
      category: $Enums.EventCategory.FASHION,
      start_date: new Date('2025-11-10T20:00:00Z'),
      end_date: new Date('2025-11-10T22:00:00Z'),
      location: 'Fashion District, New York',
      capacity: 500,
      ticket_price: 80,
      tickets_sold: 400,
    },
    {
      title: 'Stand-Up Comedy Night',
      description:
        'Laugh out loud with top comedians performing their best sets in this hilarious comedy show.',
      category: $Enums.EventCategory.COMEDY,
      start_date: new Date('2025-11-15T20:00:00Z'),
      end_date: new Date('2025-11-15T22:00:00Z'),
      location: 'Comedy Club, Boston',
      capacity: 250,
      ticket_price: 35,
      tickets_sold: 200,
    },
    {
      title: 'Indie Film Festival',
      description:
        'Celebrate independent cinema with screenings of groundbreaking films and Q&A sessions with directors.',
      category: $Enums.EventCategory.FILM,
      start_date: new Date('2025-11-20T18:00:00Z'),
      end_date: new Date('2025-11-23T22:00:00Z'),
      location: 'Art House Theater, San Francisco',
      capacity: 300,
      ticket_price: 45,
      tickets_sold: 200,
    },
    {
      title: 'Rock Legends Concert',
      description:
        'Rock out with legendary bands performing their greatest hits in this electrifying concert.',
      category: $Enums.EventCategory.MUSIC,
      start_date: new Date('2025-11-25T19:00:00Z'),
      end_date: new Date('2025-11-25T23:00:00Z'),
      location: 'Arena, Los Angeles',
      capacity: 5000,
      ticket_price: 90,
      tickets_sold: 4000,
    },
    {
      title: 'Yoga Retreat',
      description:
        'Rejuvenate with a day of yoga, meditation, and wellness workshops in a serene environment.',
      category: $Enums.EventCategory.WORKSHOP,
      start_date: new Date('2025-11-30T08:00:00Z'),
      end_date: new Date('2025-11-30T17:00:00Z'),
      location: 'Retreat Center, Sedona',
      capacity: 100,
      ticket_price: 150,
      tickets_sold: 80,
    },
    {
      title: 'Holiday Charity Run',
      description:
        'Run for a cause in this festive 5K, supporting local charities with every step.',
      category: $Enums.EventCategory.CHARITY,
      start_date: new Date('2025-12-05T09:00:00Z'),
      end_date: new Date('2025-12-05T12:00:00Z'),
      location: 'City Park, Seattle',
      capacity: 1000,
      ticket_price: 30,
      tickets_sold: 800,
    },
    {
      title: 'Winter Fashion Expo',
      description:
        'Discover winter fashion trends from leading designers in this exclusive expo.',
      category: $Enums.EventCategory.FASHION,
      start_date: new Date('2025-12-10T11:00:00Z'),
      end_date: new Date('2025-12-12T18:00:00Z'),
      location: 'Convention Center, Miami',
      capacity: 700,
      ticket_price: 60,
      tickets_sold: 500,
    },
    {
      title: 'Broadway Musical Premiere',
      description:
        'Experience the world premiere of a new Broadway musical, filled with stunning performances and music.',
      category: $Enums.EventCategory.THEATRE,
      start_date: new Date('2025-12-15T19:30:00Z'),
      end_date: new Date('2025-12-15T22:00:00Z'),
      location: 'Theater District, New York',
      capacity: 1200,
      ticket_price: 120,
      tickets_sold: 1000,
    },
    {
      title: 'Winter Food Festival',
      description:
        'Savor seasonal dishes from top chefs at this cozy winter food festival.',
      category: $Enums.EventCategory.CULINARY,
      start_date: new Date('2025-12-18T12:00:00Z'),
      end_date: new Date('2025-12-18T20:00:00Z'),
      location: 'Waterfront, San Diego',
      capacity: 1500,
      ticket_price: 70,
      tickets_sold: 1200,
    },
    {
      title: 'Improv Comedy Show',
      description:
        'Enjoy a night of spontaneous laughter with talented improvisers creating comedy on the spot.',
      category: $Enums.EventCategory.COMEDY,
      start_date: new Date('2025-12-22T20:00:00Z'),
      end_date: new Date('2025-12-22T22:00:00Z'),
      location: 'Improv Theater, Chicago',
      capacity: 200,
      ticket_price: 30,
      tickets_sold: 150,
    },
    {
      title: "New Year's Eve Gala",
      description:
        'Ring in the new year with a glamorous gala featuring live music, dancing, and a midnight countdown.',
      category: $Enums.EventCategory.PARTY,
      start_date: new Date('2025-12-31T21:00:00Z'),
      end_date: new Date('2026-01-01T02:00:00Z'),
      location: 'Grand Ballroom, Las Vegas',
      capacity: 800,
      ticket_price: 150,
      tickets_sold: 700,
    },
  ];

  for (const eventData of upcomingEvents) {
    const event = await prisma.event.create({
      data: {
        ...eventData,
        status: EventStatus.PUBLISHED,
        organizer_id: organizer.id,
      },
    });
    console.log(`[SEEDER] Upcoming event created: ${event.title}`);
  }

  // Past Events
  const pastEvents = [
    {
      title: 'Spring Art Exhibition',
      description:
        'A curated collection of contemporary art from emerging and established artists, showcasing diverse styles and mediums.',
      category: $Enums.EventCategory.ART,
      start_date: new Date('2025-05-10T10:00:00Z'),
      end_date: new Date('2025-05-12T18:00:00Z'),
      location: 'Modern Art Gallery, Los Angeles',
      capacity: 500,
      ticket_price: 25,
      tickets_sold: 0, // Sold out
    },
    {
      title: 'Business Networking Brunch',
      description:
        'Connect with fellow entrepreneurs and business professionals over a delicious brunch. Exchange ideas, make connections, and grow your network.',
      category: $Enums.EventCategory.CONFERENCE,
      start_date: new Date('2025-06-08T10:00:00Z'),
      end_date: new Date('2025-06-08T14:00:00Z'),
      location: 'Rooftop Terrace, Miami',
      capacity: 150,
      ticket_price: 75,
      tickets_sold: 0, // Sold out
    },
  ];

  for (const eventData of pastEvents) {
    const event = await prisma.event.create({
      data: {
        ...eventData,
        status: EventStatus.PUBLISHED,
        organizer_id: organizer.id,
      },
    });
    console.log(`[SEEDER] Past event created: ${event.title}`);
  }

  // Create some tickets for customers (for past and live events)
  console.log('[SEEDER] Creating tickets...');

  // Create tickets for the live event
  for (let i = 0; i < 2; i++) {
    const ticket = await prisma.ticket.create({
      data: {
        event_id: liveEvent.id,
        user_id: customers[i].id,
        hash: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        used_at: null,
      },
    });
    // increment ticket count for live event
    await prisma.event.update({
      where: { id: ticket.event_id },
      data: { tickets_sold: { increment: 1 } },
    });
    console.log(
      `[SEEDER] Ticket created for ${customers[i].first_name} - ${liveEvent.title}`,
    );
  }

  // Get past events to create used tickets
  const pastEventsList = await prisma.event.findMany({
    where: {
      end_date: {
        lt: new Date(),
      },
    },
  });

  // Create some used tickets for past events
  for (const pastEvent of pastEventsList) {
    for (let i = 0; i < customers.length; i++) {
      const ticket = await prisma.ticket.create({
        data: {
          event_id: pastEvent.id,
          user_id: customers[i].id,
          hash: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          used_at: new Date(), // Mark as used since event is over
        },
      });
      // increment ticket count for live event
      await prisma.event.update({
        where: { id: ticket.event_id },
        data: { tickets_sold: { increment: 1 } },
      });
      console.log(
        `[SEEDER] Used ticket created for ${customers[i].first_name} - ${pastEvent.title}`,
      );
    }
  }

  console.log('\n[SEEDER] Database seeding completed successfully!');
  console.log('\n[SEEDER] Seeded data summary:');
  console.log(`[SEEDER] Admin: admin@eventhub.local (password: admin123)`);
  console.log(
    `[SEEDER] Organizer: organizer@eventhub.local (password: organizer123)`,
  );
  console.log(
    `[SEEDER] Customers: ${customers.length}, customer(n)@eventhub.local (password: customer123)`,
  );
  console.log(
    `[SEEDER] Events: 1 live, ${upcomingEvents.length} upcoming, ${pastEvents.length} past`,
  );
  console.log(`[SEEDER] Tickets: Created for customers attending events`);
}

main()
  .catch((e) => {
    console.error('[SEEDER] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
