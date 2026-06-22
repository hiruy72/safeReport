# SafeHer

A secure platform for anonymous gender-based violence reporting with identity verification, case tracking, and police investigation tools.

## Stack

- **Web:** Next.js 15, TypeScript, Tailwind CSS, React Query
- **API:** Node.js, Express, TypeScript (modular monolith)
- **Database:** PostgreSQL + Prisma
- **Cache:** Redis

## Quick Start

### 1. Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (for Postgres & Redis)

### 2. Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start database services
pnpm docker:up

# Push schema & seed admin user
pnpm db:push
pnpm db:seed
```

### 3. Run

```bash
# API + Web together
pnpm dev

# Or separately
pnpm dev:api   # http://localhost:4000
pnpm dev:web   # http://localhost:3000
```

### 4. Default Admin

- **Email:** admin@safeher.local
- **Password:** Admin123!

## Project Structure

```
safeHer/
├── apps/web/           Next.js frontend
├── services/api/       Express REST API
├── packages/db/        Prisma schema & client
├── packages/shared-types/  Shared TypeScript types
└── docker-compose.yml  Postgres + Redis
```

## API Endpoints (Phase 1)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/victims/register | Victim registration |
| POST | /api/victims/reports | Submit report |
| GET | /api/victims/cases | Victim case list |
| GET | /api/police/dashboard | Police stats |
| GET | /api/police/cases | Station cases |
| POST | /api/admin/police/:id/approve | Approve officer |
| POST | /api/admin/victims/:id/verify | Verify victim ID |

## Phase 2+ (Not Yet Implemented)

- AI suspect matching & evidence analysis (Python/FastAPI)
- Mobile app (Expo/React Native)
- S3 evidence storage, email/SMS notifications
- 2FA, witness portal, crime hotspot map

