# NexusMarket — Backend

Express 4 + TypeScript + Prisma + PostgreSQL + Redis + Socket.io.

## Quick start

```bash
# 1. Bring up postgres + redis + mailhog + minio at the repo root
cp .env.example .env
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

The API will be available at `http://localhost:4000/api/v1`.

## Layout

```
backend/
├── prisma/
│   ├── schema.prisma       # 28+ models
│   └── seed.ts             # realistic test data
├── src/
│   ├── api/v1/             # versioned REST routes
│   │   ├── auth/           # register / login / refresh / logout / me
│   │   ├── users/
│   │   ├── marketplace/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── automation/
│   │   ├── rental/
│   │   ├── support/
│   │   ├── admin/
│   │   ├── notifications/
│   │   └── analytics/
│   ├── config/env.ts       # zod-validated env
│   ├── database/
│   │   ├── prisma.ts       # singleton client
│   │   └── redis.ts        # ioredis singleton
│   ├── jobs/               # BullMQ workers
│   ├── middleware/         # auth, error, rateLimit, requestId
│   ├── services/           # business logic
│   ├── utils/              # logger, errors, jwt, password, validate
│   ├── websocket/          # Socket.io setup
│   ├── app.ts              # Express app builder
│   └── server.ts           # entry point
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | tsx watch — hot-reload server on port 4000 |
| `npm run build` | TypeScript compile to `dist/` |
| `npm start` | Run compiled production server |
| `npm run typecheck` | TS check, no emit |
| `npm run prisma:migrate` | Apply migrations in dev |
| `npm run prisma:deploy` | Apply migrations in production |
| `npm run prisma:seed` | Populate DB with realistic test data |
| `npm run prisma:studio` | Open Prisma Studio at :5555 |
| `npm test` | vitest --run |

## API versioning

Everything lives under `/api/v1/...`. Future breaking changes go to `/api/v2`. See `src/api/v1/index.ts` for the route table.

## WebSocket

Socket.io listens on the same HTTP server. Clients authenticate via the access token in the `auth` handshake payload.

## Background jobs

BullMQ queues live in `src/jobs/`. Workers are started by `server.ts` when `WORKER_ENABLED=true` (or when running `npm run dev`).

## Status

This PR (#2) ships the **scaffold + auth module**. Domain modules (marketplace, orders, automation, etc.) come in subsequent PRs as outlined in `PROJECT.md`.
