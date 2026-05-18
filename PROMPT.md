You are a Senior Full Stack Developer. Build a complete Next.js 1 raffle/sorteio system for a tech lecture event. The application theme must visually resemble VS Code (dark sidebar, activity bar, tabs, terminal panel, editor area aesthetic). Follow every requirement below precisely.

---

## PROJECT OVERVIEW

A raffle system for a lecture about AI. The host will raffle 5 complete PC setups (Windows 11 or Ubuntu Linux) among participants. Any user who authenticates via Google or GitHub is automatically enrolled as a participant.

---

## TECH STACK

- Next.js 16 (App Router, TypeScript)
- Better Auth (Google + GitHub OAuth providers)
- Neon DB (serverless PostgreSQL)
- Prisma 7 (PostgreSQL adapter)
- Shadcn UI + Radix UI
- TailwindCSS
- TanStack Query (React Query)
- Axios
- Framer Motion (for raffle animation)

---

## PACKAGE MANAGER

Use **pnpm** exclusively. Do NOT use npm or yarn.

All install commands must use pnpm:

- `pnpm install`
- `pnpm add <package>`
- `pnpm dlx shadcn@latest init`
- `pnpm dlx prisma generate`
- `pnpm dlx prisma db push`
- `pnpm dlx prisma db seed`
- `pnpm dev`

The `package.json` scripts must use pnpm-compatible commands.
Generate a `pnpm-workspace.yaml` if needed.

---

## AUTHENTICATION (Better Auth)

- Configure `better-auth` with Google and GitHub OAuth providers.
- Session stored in the database via Prisma adapter.
- Every new user who signs in for the first time is automatically registered as a raffle participant (isParticipant: true).
- Protect all dashboard routes with middleware (redirect unauthenticated users to /login).
- Auth config file: `src/lib/auth.ts`
- Auth client: `src/lib/auth-client.ts`

```ts
// src/lib/auth.ts example structure
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
```

---

## DATABASE SCHEMA (Prisma 7)

Create `prisma/schema.prisma` with the following models:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String        @id @default(cuid())
  name              String
  email             String        @unique
  emailVerified     Boolean       @default(false)
  image             String?
  role              String        @default("user")
  isParticipant     Boolean       @default(true)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  sessions          Session[]
  accounts          Account[]
  raffleEntries     RaffleEntry[]
  prizesWon         RafflePrize[] @relation("winner")
  prizesTransferred RafflePrize[] @relation("transferredTo")
  queryLogs         QueryLog[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model RaffleEntry {
  id        String   @id @default(cuid())
  userId    String   @unique
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model RafflePrize {
  id              String    @id @default(cuid())
  prizeNumber     Int       @unique
  description     String
  winnerId        String?
  transferredToId String?
  drawnAt         DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  winner          User?     @relation("winner", fields: [winnerId], references: [id])
  transferredTo   User?     @relation("transferredTo", fields: [transferredToId], references: [id])
}

model RaffleEvent {
  id          String    @id @default(cuid())
  title       String
  description String?
  eventDate   DateTime
  location    String?
  isActive    Boolean   @default(true)
  drawnAt     DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model QueryLog {
  id        String   @id @default(cuid())
  userId    String
  sql       String
  duration  Int
  rowCount  Int?
  error     String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## FOLDER STRUCTURE

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            ← VS Code shell (sidebar + main area)
│   │   ├── page.tsx              ← /dashboard home (lecture info panel)
│   │   ├── raffle/page.tsx       ← Raffle panel
│   │   ├── participants/page.tsx
│   │   ├── transfer/page.tsx
│   │   └── sql-console/page.tsx  ← admin only
│   ├── api/
│   │   ├── auth/[...all]/route.ts
│   │   ├── raffle/draw/route.ts
│   │   ├── raffle/transfer/route.ts
│   │   └── users/delete-account/route.ts
│   └── layout.tsx
├── actions/
│   └── sql-console.ts
├── components/
│   ├── vscode/
│   │   ├── ActivityBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TabBar.tsx
│   │   ├── StatusBar.tsx
│   │   └── Terminal.tsx
│   ├── raffle/
│   │   ├── RaffleButton.tsx
│   │   ├── WinnerCard.tsx
│   │   └── ParticipantList.tsx
│   └── ui/  ← shadcn components
├── lib/
│   ├── auth.ts
│   ├── auth-client.ts
│   └── prisma.ts
└── middleware.ts
```

---

## UI DESIGN — VS CODE THEME

The entire app must look like VS Code, but using the **HUD/cyberpunk dark palette** from the AI Lecture slide deck. Use these exact CSS variables — they map to Tailwind via `globals.css`. Import "Space Grotesk", "JetBrains Mono" and "Inter" from Google Fonts in `layout.tsx`:

```css
:root {
  /* HUD Dark palette — from the AI Lecture slide deck */
  --vscode-bg: #03060c;
  --vscode-sidebar: #060b16;
  --vscode-activity-bar: #0a1426;
  --vscode-tab-active: #060b16;
  --vscode-tab-inactive: #03060c;
  --vscode-border: rgba(0, 200, 255, 0.14);
  --vscode-text: #e5f1ff;
  --vscode-text-muted: #7b95b8;
  --vscode-accent: #00e5ff;
  --vscode-accent-dim: rgba(0, 229, 255, 0.55);
  --vscode-accent-ghost: rgba(0, 229, 255, 0.18);
  --vscode-blue: #5aa9ff;
  --vscode-magenta: #ff39d2;
  --vscode-magenta-dim: rgba(255, 57, 210, 0.5);
  --vscode-orange: #ff9e2c;
  --vscode-green: #2cf2a3;
  --vscode-red: #ff4d6d;
  --vscode-text-mute: #4a607e;
  --vscode-status-bar: #00e5ff;

  /* Grid overlay */
  --grid: rgba(0, 200, 255, 0.06);
  --grid-strong: rgba(0, 200, 255, 0.14);

  /* Typography */
  --font-display: "Space Grotesk", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --font-body: "Inter", system-ui, sans-serif;
}
```

Layout structure:

```
┌─────────────────────────────────────────────────────┐
│ Activity Bar │     Sidebar        │   Editor Area    │
│  (48px wide) │   (240px wide)     │   (flex-1)       │
│              │                    │                  │
│   [icons]    │  Explorer          │  [Page Content]  │
│              │  ├── 📄 Sorteio    │                  │
│              │  ├── 👥 Participan │                  │
│              │  ├── 🎁 Transferir │                  │
│              │  └── 🔧 SQL Console│                  │
│              │                    │                  │
├──────────────┴────────────────────┴──────────────────┤
│ Status Bar: ● Connected to NeonDB  |  X participants  │
└─────────────────────────────────────────────────────┘
```

On mobile, the sidebar collapses into a bottom navigation bar. The activity bar is hidden on screens below md breakpoint.

---

## PAGES & FEATURES

### /login

- Centered card with VS Code dark theme
- Title: "AI Lecture — Sorteio de PCs"
- Subtitle: "Faça login para participar do sorteio"
- Two buttons: "Continue com Google" and "Continue com GitHub" using Better Auth client `signIn.social()`
- Show live participant count: "X pessoas já participando"

### /dashboard (Lecture Info Panel)

- Event title, date, location
- Description about the AI lecture
- Total participants count
- Whether the raffle has already been drawn
- Countdown timer to the raffle (if not drawn yet)
- Animated gradient background on the info card

### /raffle (Raffle Panel — MAIN FEATURE)

- Admin-only "Realizar Sorteio" button that triggers the draw
- After draw: display 5 WinnerCards in a responsive grid (1 col mobile, 2 tablet, 5 desktop)
- Each WinnerCard shows:
  - Prize number badge (e.g., "#1")
  - Prize description (e.g., "PC Setup — Windows 11")
  - Winner avatar (Next.js Image component)
  - Winner name
  - Winner email (partially masked)
  - "Transferir Prêmio" button visible only to the prize winner
  - Framer Motion staggered reveal animation with glow effect on each card
- If raffle not drawn yet: show a spinning lottery animation with participant avatars rotating

### /participants

- List all participants in a VS Code "file explorer" style tree
- Each row: avatar, name, email, join date, status badge (Participando / Premiado)
- Search input styled as VS Code search bar
- Total count shown in sidebar header
- Table on desktop, card grid on mobile

### /transfer

- Form to transfer a prize to another participant
- Only visible/functional if current user has won a prize
- Search and select recipient by name or email (autocomplete dropdown)
- Confirmation modal with VS Code-style dialog box
- Server action handles the transfer and updates RafflePrize

### /sql-console (Admin only)

- Monaco-style textarea (dark background, monospace font, simulated line numbers via CSS counter)
- "Executar" button
- Results displayed in a styled VS Code table
- Collapsible schema browser sidebar (shows all tables and columns)
- Query history panel (last 10 queries from QueryLog model)
- Implement the EXACT server action logic from this reference:

```ts
// src/actions/sql-console.ts — implement ALL of the following:

"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BLOCKED_PATTERNS = [
  /DROP\s+TABLE/i,
  /DROP\s+DATABASE/i,
  /DROP\s+SCHEMA/i,
  /TRUNCATE\s+TABLE/i,
  /ALTER\s+TABLE.+DROP\s+COLUMN/i,
];

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error(
      "Acesso negado: somente administradores podem executar queries.",
    );
  }
  return session;
}

function isReadQuery(sql: string): boolean {
  const q = sql.trim().toUpperCase();
  return q.startsWith("SELECT") || q.startsWith("WITH");
}

function translatePrismaError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("relation") && msg.includes("does not exist"))
    return "Tabela não encontrada. Verifique o nome no esquema.";
  if (msg.includes("column") && msg.includes("does not exist"))
    return "Coluna não encontrada. Verifique o nome da coluna.";
  if (msg.includes("syntax error"))
    return "Erro de sintaxe SQL. Verifique a query.";
  if (msg.includes("permission denied"))
    return "Permissão negada para executar esta operação.";
  if (msg.includes("violates foreign key"))
    return "Violação de chave estrangeira. Há registros dependentes que impedem a operação.";
  if (msg.includes("duplicate key") || msg.includes("unique constraint"))
    return "Registro duplicado. Já existe um valor com esta chave única.";
  if (msg.includes("null value") && msg.includes("not-null"))
    return "Campo obrigatório não pode ser nulo.";
  if (msg.includes("value too long"))
    return "Valor muito longo para o campo especificado.";
  if (msg.includes("division by zero"))
    return "Divisão por zero detectada na query.";
  if (msg.includes("invalid input syntax"))
    return "Valor com formato inválido para o tipo de dado esperado.";
  if (msg.includes("out of range"))
    return "Valor fora do intervalo permitido para o tipo de dado.";
  if (msg.includes("deadlock detected"))
    return "Deadlock detectado. Tente executar a query novamente.";
  if (msg.includes("canceling statement due to conflict"))
    return "Query cancelada por conflito com outra operação. Tente novamente.";
  if (msg.includes("connection") && msg.includes("refused"))
    return "Não foi possível conectar ao banco de dados.";
  return `Erro ao executar query: ${msg}`;
}

function buildSuccessMessage(sql: string, rowCount: number): string {
  const q = sql.trim().toUpperCase();
  const n = rowCount;
  if (q.startsWith("SELECT"))
    return `${n} ${n === 1 ? "linha retornada" : "linhas retornadas"}`;
  if (q.startsWith("INSERT"))
    return `${n} ${n === 1 ? "registro inserido" : "registros inseridos"} com sucesso`;
  if (q.startsWith("UPDATE"))
    return `${n} ${n === 1 ? "registro atualizado" : "registros atualizados"} com sucesso`;
  if (q.startsWith("DELETE"))
    return `${n} ${n === 1 ? "registro deletado" : "registros deletados"} com sucesso`;
  if (q.startsWith("CREATE")) return "Objeto criado com sucesso";
  if (q.startsWith("ALTER")) return "Estrutura alterada com sucesso";
  if (q.startsWith("WITH"))
    return `${n} ${n === 1 ? "linha retornada" : "linhas retornadas"}`;
  if (q.startsWith("BEGIN") || q.startsWith("COMMIT"))
    return `Transação executada · ${n} ${n === 1 ? "linha afetada" : "linhas afetadas"}`;
  return "Query executada com sucesso";
}

export async function executeSQL(sql: string) {
  const session = await requireAdmin();
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(sql)) {
      throw new Error(`Operação bloqueada por segurança: ${pattern.source}`);
    }
  }
  const start = Date.now();
  let rows: Record<string, unknown>[] = [];
  let error: string | null = null;
  let rowCount: number | null = null;
  try {
    if (isReadQuery(sql)) {
      const result = await prisma.$queryRawUnsafe(sql);
      rows = (result as Record<string, unknown>[]) ?? [];
      rowCount = rows.length;
    } else {
      const affected = await prisma.$executeRawUnsafe(sql);
      rows = [];
      rowCount = affected;
    }
  } catch (e) {
    error = translatePrismaError(e);
  }
  const duration = Date.now() - start;
  try {
    await prisma.queryLog.create({
      data: { userId: session.user.id, sql, duration, rowCount, error },
    });
  } catch (logError) {
    console.warn("[sql-console] Falha ao registrar query log:", logError);
  }
  if (error) throw new Error(error);
  return {
    rows,
    duration,
    rowCount,
    message: buildSuccessMessage(sql, rowCount ?? 0),
  };
}

export async function getSchemaBrowser() {
  await requireAdmin();
  const columns = await prisma.$queryRaw<
    Array<{ table_name: string; column_name: string; data_type: string }>
  >`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `;
  const schema: Record<string, Array<{ column: string; type: string }>> = {};
  for (const row of columns) {
    if (!schema[row.table_name]) schema[row.table_name] = [];
    schema[row.table_name].push({
      column: row.column_name,
      type: row.data_type,
    });
  }
  return schema;
}
```

---

## SERVER ACTIONS

### `src/actions/raffle.ts`

```ts
"use server";
// drawRaffle(): Admin only.
// Randomly selects 5 unique participants from RaffleEntry using Fisher-Yates shuffle.
// Creates/updates 5 RafflePrize records setting winnerId.
// Sets RaffleEvent.drawnAt to now().
// Returns array of { prize, user } objects.

// transferPrize(prizeId: string, recipientId: string):
// Validates current user is the winner of that prize.
// Validates recipient exists and isParticipant === true.
// Updates RafflePrize: set transferredToId = recipientId.
// Returns updated prize.
```

### `src/actions/users.ts`

```ts
"use server";
// deleteAccount():
// Gets current session via auth.api.getSession().
// If user has won prizes: sets prize winnerId to null (prize becomes unawarded).
// Deletes user's RaffleEntry (if not cascade).
// Deletes user record via Prisma (cascades Session, Account, QueryLog).
// Redirects to /login after deletion.
```

---

## API ROUTES

- `POST /api/raffle/draw` — Trigger raffle draw (admin only), calls drawRaffle() action
- `POST /api/raffle/transfer` — Transfer prize, calls transferPrize() action
- `DELETE /api/users/delete-account` — Delete own account, calls deleteAccount() action

---

## MIDDLEWARE

```ts
// src/middleware.ts
// Protect all /dashboard/* routes: redirect to /login if no valid session.
// Protect /sql-console specifically: redirect if user role !== 'admin'.
// Use Better Auth session resolution from request headers.
// Export config matcher for App Router compatibility.
```

---

## ENVIRONMENT VARIABLES

Create `.env.example` with:

```env
DATABASE_URL=             # Neon DB PostgreSQL connection string
BETTER_AUTH_SECRET=       # Random 32+ char secret
BETTER_AUTH_URL=          # e.g. http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=      # e.g. http://localhost:3000
```

---

## SEED DATA

Create `prisma/seed.ts` that:

1. Creates a RaffleEvent:
   - title: "Palestra sobre IA — Sorteio de PCs"
   - description: "Evento de sorteio de 5 configurações completas de PC para participantes da palestra sobre Inteligência Artificial."
   - eventDate: set to a future date
   - location: "Belo Horizonte, MG"
2. Seeds 5 RafflePrize records:
   - Prize 1: "PC Setup #1 — Windows 11"
   - Prize 2: "PC Setup #2 — Ubuntu Linux"
   - Prize 3: "PC Setup #3 — Windows 11"
   - Prize 4: "PC Setup #4 — Ubuntu Linux"
   - Prize 5: "PC Setup #5 — Escolha do Ganhador"

---

## README.md

Generate a complete README with all setup steps using pnpm:

```bash
# Install dependencies
pnpm install

# Setup database
pnpm dlx prisma generate
pnpm dlx prisma db push
pnpm dlx prisma db seed

# Run development server
pnpm dev
```

---

## DELIVERABLES CHECKLIST

- [ ] Complete Next.js 16 project with App Router and TypeScript
- [ ] Better Auth configured with Google + GitHub providers
- [ ] Prisma 7 schema with all models and relations
- [ ] VS Code UI theme applied globally via CSS variables
- [ ] /login page with Google and GitHub social buttons
- [ ] /dashboard with lecture info panel and countdown timer
- [ ] /raffle page with winner cards + Framer Motion stagger animations
- [ ] /participants page with VS Code explorer-style list
- [ ] /transfer page with prize transfer form and confirmation modal
- [ ] /sql-console (admin only) with exact reference implementation
- [ ] Delete account functionality from user profile
- [ ] Responsive layout (mobile bottom nav + desktop sidebar)
- [ ] All Server Actions implemented with proper guards
- [ ] Middleware protecting routes by role
- [ ] Prisma seed script with RaffleEvent and RafflePrize data
- [ ] .env.example file
- [ ] README.md with full pnpm setup instructions
- [ ] All commands use pnpm exclusively — no npm or yarn references anywhere

Generate the complete project. Start with `package.json` and folder structure, then implement every file with complete, production-ready code. Do not use placeholder comments — write all actual implementation code.
