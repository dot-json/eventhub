# EventHub

A full-stack event management platform built with NestJS and React.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up .env files
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# Start development environment
docker compose -f docker-compose.dev.yml up --build

# Or start production environment
# docker compose up --build

# Setup database
cd apps/api
pnpm db:migrate:deploy
pnpm db:generate
pnpm db:seed
```

## Project Structure

```
eventhub/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # React frontend
├── packages/          # Shared configs
└── prisma/           # Database schema
```

## Backend (NestJS)

- **Port**: 3001
- **Database**: PostgreSQL with Prisma
- **Features**: User auth, events, tickets, role-based access
- **API**: RESTful endpoints with JWT authentication

## Frontend (React)

- **Port**: 3000
- **Framework**: React + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Features**: Event browsing, ticket purchase

## Environment Variables

Create root `.env` file:

```env
# Postgres
POSTGRES_DB=eventhub
POSTGRES_USER=eventhub
POSTGRES_PASSWORD=secret132
POSTGRES_PORT=5432
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:${POSTGRES_PORT}/${POSTGRES_DB}

# API
API_PORT=3001

# Web
WEB_PORT=3000
```

Create apps/api `.env` file:

```env
POSTGRES_DB=eventhub
POSTGRES_USER=eventhub
POSTGRES_PASSWORD=secret132
POSTGRES_PORT=5432

DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}

API_PORT=3001
JWT_SECRET=super-secret-jwt-key
```

## Database

```bash
# Create migration
pnpm db:migrate --name migration_name

# Seed data
pnpm db:seed
```

### Seeder

- **Admin**: admin@eventhub.local:admin123
- **Organizer**: organizer@eventhub.local:organizer123
- **Customer**: customer(n)@eventhub.local:customer123
- **Events**: 1 Live, 25 upcoming, 2 past

## Production

- **Backend**: same as development
- **Frontend**: served on nginx
