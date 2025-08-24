import {
  PrismaClient,
  UserRole,
  EventStatus,
  $Enums,
} from '../generated/prisma';
import * as bcrypt from 'bcryptjs';

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
      start_date: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Yesterday
      end_date: new Date(today.getTime() + 27 * 60 * 60 * 1000), // In 3 days
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
        is_used: false,
      },
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
          is_used: true, // Mark as used since event is over
        },
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
    `[SEEDER] Customers: customer1@eventhub.local, customer2@eventhub.local, customer3@eventhub.local (password: customer123)`,
  );
  console.log(`[SEEDER] Events: 1 live, 3 upcoming, 2 past`);
  console.log(`[SEEDER] Tickets: Created for customers attending events`);
  console.log(
    '\n[SEEDER] You can now log in and test the application with these accounts!',
  );
}

main()
  .catch((e) => {
    console.error('[SEEDER] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
