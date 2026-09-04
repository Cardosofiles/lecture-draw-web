# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint

pnpm db:generate  # Regenerate Prisma Client (run after schema changes)
pnpm db:push      # Apply schema to the database
pnpm db:seed      # Seed initial data
pnpm db:studio    # Open Prisma Studio

pnpm test             # Vitest, full suite
pnpm test:unit        # Unit tests only (no database)
pnpm test:integration # Integration tests — hit the real Neon database
```

Tests live in `tests/` (`unit/`, `integration/`, `helpers/`). The integration
suite talks to the database in `DATABASE_URL`, so it asserts on real seeded data.

## Architecture

**lecture-draw-web** is a PC raffle system for a tech lecture event. Authenticated users sign in via OAuth and are automatically entered as participants. Admins draw prizes and can transfer them to other participants.

### Route groups

- `(auth)/login` — OAuth login page (Google + GitHub via Better Auth)
- `(dashboard)/` — Protected shell with a VS Code–themed layout (ActivityBar, Sidebar, TabBar, StatusBar, Terminal). All dashboard pages live here.
  - `dashboard/` — Landing with event info
  - `raffle/` — Draw prizes, display winners
  - `participants/` — List participants
  - `transfer/` — Transfer a prize to another participant
  - `sql-console/` — Admin-only raw SQL console with query logging

### Key layers

| Layer          | Location                               | Notes                                                                                           |
| -------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Auth           | `src/lib/auth.ts`                      | Better Auth with Prisma adapter; exposes `auth` (server). Client-side: `src/lib/auth-client.ts` |
| Database       | `src/lib/prisma.ts`                    | Singleton Prisma client; generated client output is `src/generated/prisma`                      |
| Server Actions | `src/actions/`                         | `raffle.ts`, `sql-console.ts`, `users.ts` — preferred over API routes for mutations             |
| API Routes     | `src/app/api/`                         | Auth catch-all (`[...all]`), participant count, raffle draw/transfer, account deletion          |
| Data Fetching  | TanStack Query v5 + Axios              | `Providers` in `src/components/providers.tsx` wraps the tree; `staleTime: 60s`                  |
| UI             | Shadcn UI + Radix UI + Tailwind CSS v4 | No theme provider — `next-themes` is a dependency but Providers only wraps QueryClient          |

### User model extensions

`User` has two custom fields beyond Better Auth defaults:

- `role` — `"user"` (default) or `"admin"`
- `isParticipant` — whether the user is eligible for the raffle

### Database schema highlights

- `RaffleEntry` — one-to-one with User; presence means the user is entered
- `RafflePrize` — numbered prizes; `winnerId` set on draw, `transferredToId` set on transfer
- `RaffleEvent` — event metadata (only one `isActive` event expected at a time)
- `QueryLog` — records every SQL console query (userId, sql, duration, rowCount, error)

### Environment variables

See `.env.example` for required vars:

- `DATABASE_URL` — Neon PostgreSQL connection string
- `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `ADMIN_EMAIL` — email that receives admin role on seed
