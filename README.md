# 🖥️ AI Lecture — Sorteio de PCs

Sistema de sorteio para palestra sobre Inteligência Artificial. O host sorteia 5 configurações completas de PC entre todos os participantes autenticados via Google ou GitHub.

## 🎨 UI Theme

O app imita o VS Code com paleta HUD cyberpunk escura:
- Activity Bar (48px) + Sidebar (240px) + Editor Area
- Cores neon: `#00e5ff` (cyan), `#ff39d2` (magenta), `#2cf2a3` (green)
- Fontes: Space Grotesk, JetBrains Mono, Inter
- Animações com Framer Motion

## 🛠️ Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Auth | Better Auth (Google + GitHub OAuth) |
| Database | Neon DB (PostgreSQL serverless) |
| ORM | Prisma 7 |
| UI | Shadcn UI + Radix UI + TailwindCSS v4 |
| Data Fetching | TanStack Query v5 + Axios |
| Animações | Framer Motion |
| Package Manager | **pnpm** |

## 🚀 Setup

### 1. Clone e instale dependências

```bash
pnpm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local`:

```env
DATABASE_URL=              # Neon DB → Connection String
BETTER_AUTH_SECRET=        # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=seu@email.com  # será promovido a admin no seed
```

### 3. Configure o banco de dados

```bash
# Gera o Prisma Client
pnpm db:generate

# Aplica o schema no Neon DB
pnpm db:push

# Popula com evento e prêmios
pnpm db:seed
```

### 4. Inicie o servidor

```bash
pnpm dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 📁 Estrutura

```
src/
├── app/
│   ├── (auth)/login/          ← Login com Google/GitHub
│   ├── (dashboard)/
│   │   ├── layout.tsx         ← Shell VS Code
│   │   ├── page.tsx           ← Painel da palestra
│   │   ├── raffle/            ← Sorteio + ganhadores
│   │   ├── participants/      ← Lista de participantes
│   │   ├── transfer/          ← Transferência de prêmio
│   │   └── sql-console/       ← Admin: console SQL
│   └── api/
├── actions/                   ← Server Actions
├── components/
│   ├── vscode/               ← ActivityBar, Sidebar, TabBar...
│   ├── raffle/               ← RafflePage, WinnerCard...
│   └── sql/                  ← SqlConsoleView
└── lib/                      ← auth.ts, prisma.ts, auth-client.ts
```

## 🔑 Configurar OAuth

### Google
1. [console.cloud.google.com](https://console.cloud.google.com)
2. Criar projeto → APIs & Services → Credentials
3. OAuth 2.0 Client ID → Web Application
4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### GitHub
1. [github.com/settings/developers](https://github.com/settings/developers)
2. OAuth Apps → New OAuth App
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

## 👑 Administrador

Execute o seed com `ADMIN_EMAIL` definido para promover o usuário a admin:
```bash
ADMIN_EMAIL=seu@email.com pnpm db:seed
```

Ou via SQL Console (após ser admin):
```sql
UPDATE "User" SET role = 'admin' WHERE email = 'seu@email.com';
```

## 📦 Scripts

```bash
pnpm dev          # Dev server
pnpm build        # Build de produção
pnpm start        # Servidor de produção
pnpm db:generate  # Gera Prisma Client
pnpm db:push      # Aplica schema no banco
pnpm db:seed      # Popula dados iniciais
pnpm db:studio    # Prisma Studio (UI do banco)
pnpm lint         # ESLint
```

## 🎯 Funcionalidades

- ✅ Login com Google e GitHub (auto-inscrição no sorteio)
- ✅ Dashboard com countdown timer para o evento
- ✅ Sorteio com Fisher-Yates shuffle (admin only)
- ✅ WinnerCards com animação stagger (Framer Motion)
- ✅ Transferência de prêmio com modal de confirmação
- ✅ Lista de participantes com busca
- ✅ SQL Console com histórico de queries (admin only)
- ✅ UI VS Code com paleta cyberpunk
- ✅ Responsive (mobile bottom nav + desktop sidebar)
- ✅ Proteção de rotas por role (middleware)
