<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Diretrizes para Antigravity CLI (Gemini 3.8) — `lecture-draw-web`

Este documento contém todas as instruções, regras arquiteturais, convenções de código e diretrizes de desenvolvimento necessárias para orientar o **Antigravity CLI (alimentado por Gemini 3.8)** neste repositório.

---

## 1. Visão Geral do Sistema

O **`lecture-draw-web`** é um sistema de sorteio de computadores desenvolvido para uma palestra sobre Inteligência Artificial realizada na **Unitri**. O anfitrião sorteia **5 configurações completas de PC** (Windows 11 ou Ubuntu Linux) entre os participantes presentes.

- **Cenário de Alta Concorrência**: ~400 participantes conectados simultaneamente através do mesmo IP (rede NAT do evento), realizando login via OAuth e visualizando o sorteio em tempo real.
- **Identidade Visual**: Interface inspirada no **VS Code**, utilizando paleta escura HUD Cyberpunk com cores neon (`#00e5ff`, `#ff39d2`, `#2cf2a3`), tipografia técnica (_Space Grotesk_, _JetBrains Mono_, _Inter_) e animações fluidas via Framer Motion.

---

## 2. Stack Tecnológica & Pacotes Chave

| Camada                  | Tecnologia                                              | Detalhes & Restrições                                                                           |
| :---------------------- | :------------------------------------------------------ | :---------------------------------------------------------------------------------------------- |
| **Framework**           | **Next.js 16.2.6** (App Router, TypeScript)             | **Atenção:** Middleware foi renomeado para **Proxy** (`src/proxy.ts`). Não use `middleware.ts`. |
| **Linguagem / Runtime** | **TypeScript 5** / **React 19.2.4**                     | Server Components e Server Actions preferenciais para mutações.                                 |
| **Banco de Dados**      | **PostgreSQL 17**                                       | Neon DB (Serverless) em produção; Docker local na porta **5433**.                               |
| **ORM**                 | **Prisma 7.8.0** com `@prisma/adapter-pg`               | Cliente gerado em `src/generated/prisma`. Sempre use `pnpm db:generate`.                        |
| **Autenticação**        | **Better Auth 1.6.11**                                  | Providers Google e GitHub. Rate limit adaptado para IP compartilhado (NAT).                     |
| **State / Fetching**    | **TanStack React Query v5** + **Axios**                 | `Providers` em `src/components/providers.tsx` com `staleTime: 60s`.                             |
| **Estilização**         | **Tailwind CSS v4** (`@tailwindcss/postcss`) + Radix UI | Variáveis de tema definidas em `src/app/globals.css`.                                           |
| **Animações**           | **Framer Motion 12**                                    | Efeitos de revelação e stagger nos cards dos ganhadores.                                        |
| **Testes**              | **Vitest 4.1.11**                                       | Testes unitários (`tests/unit`) e de integração (`tests/integration`).                          |
| **Package Manager**     | **pnpm 11.20.0** (Exclusivo)                            | **PROIBIDO** usar `npm` ou `yarn`. Todas as operações usam `pnpm`.                              |

---

## 3. Regras de Negócio Críticas (Invioláveis)

### 3.1. Autenticação e Participação (BR-01 a BR-06)

- **Exclusividade OAuth**: Login unicamente via Google ou GitHub. Não existe cadastro de senha manual.
- **Inscrição Automática**: Qualquer usuário não-admin que autentica pela primeira vez é registrado automaticamente como participante (`RaffleEntry` criado via hook `databaseHooks.user.create.after` em `src/lib/auth.ts`).
- **Administradores NÃO Concorrem**: Admins têm `isParticipant: false` e **nunca** possuem registro em `RaffleEntry`. O seed ou hook de autenticação remove qualquer `RaffleEntry` associado ao `ADMIN_EMAIL`.
- **Despacho Raiz (`src/app/page.tsx`)**: O caminho `/` redireciona para `/dashboard` se autenticado e para `/login` se não autenticado. **Nunca** redirecione um usuário autenticado de volta para `/login` para evitar loop infinito com `src/proxy.ts`.

### 3.2. Proteção de Rotas & Proxy (Next.js 16)

- O arquivo de interceptação é **`src/proxy.ts`** (convenção do Next.js 16, **não** crie `middleware.ts`).
- Rotas protegidas: `/dashboard`, `/raffle`, `/participants`, `/transfer`, `/sql-console`, `/config`. Usuários sem sessão são redirecionados para `/login?callbackUrl=<pathname>`.
- Rota administrativa: `/sql-console` exige verificação de `session.user.role === 'admin'`. Não-admins são redirecionados para `/dashboard`.

### 3.3. Sorteio de Prêmios (BR-10 a BR-16)

- **Apenas Administradores**: Somente usuários com `role === 'admin'` podem invocar o sorteio via `drawRaffle()`.
- **Quórum Mínimo**: São necessários pelo menos **5 participantes elegíveis** com `RaffleEntry` (não-admins).
- **Algoritmo**: O sorteio deve utilizar obrigatoriamente **Fisher-Yates shuffle** para aleatoriedade uniforme.
- **Garantia Atômica Anti-Duplicidade**: O sorteio deve ocorrer em uma única transação Prisma (`prisma.$transaction`). A trava atômica utiliza:
  ```ts
  const claimed = await tx.raffleEvent.updateMany({
    where: { id: activeEvent.id, drawnAt: null },
    data: { drawnAt: now },
  })
  if (claimed.count === 0) throw new Error('O sorteio deste evento já foi realizado.')
  ```
- **Operação Única**: Um evento sorteado (`drawnAt !== null`) não pode ser re-sorteado.

### 3.4. Transferência de Prêmios (BR-17 a BR-21)

- Apenas o **ganhador original** (`winnerId === session.user.id`) pode transferir seu prêmio.
- **Transferência Única**: Se `transferredToId` já estiver preenchido, nova transferência é rejeitada.
- **Destinatário Válido**: Deve ser participante ativo (`isParticipant === true`), não-admin e diferente do próprio ganhador (auto-transferência proibida).
- **Rastreabilidade**: Toda transferência atualiza `transferredToId` no `RafflePrize` e cria um registro atômico em `TransferLog`.

### 3.5. Exclusão de Conta (BR-22 a BR-24)

- Ao excluir a conta via `deleteAccount()` (`src/actions/users.ts`):
  1. Prêmios ganhos pelo usuário têm `winnerId` e `drawnAt` resetados para `null` (retornam ao pool).
  2. Prêmios recebidos por transferência têm `transferredToId` resetado para `null`.
  3. Registros em `TransferLog` e `QueryLog` associados ao usuário são deletados **antes** da exclusão do `User` (devido a restrições de Foreign Key `ON DELETE RESTRICT`).
  4. O usuário é deletado, cascateando `Session`, `Account` e `RaffleEntry`.
  5. Redirecionamento obrigatório para `/login`.

### 3.6. Console SQL do Administrador (BR-25 a BR-29)

- Exclusivo para administradores.
- **Apenas Leitura**: Somente instruções que iniciam com `SELECT` ou `WITH` são permitidas.
- **Padrões Bloqueados**: Bloqueio rigoroso via regex para `DROP`, `TRUNCATE` e `ALTER ... DROP`.
- Todas as execuções de queries são registradas na tabela `QueryLog` (com duração, contagem de linhas e erros).

### 3.7. Otimizações de Alta Concorrência (400 participantes)

- **Cache de Resultados (`src/app/api/raffle/results/route.ts`)**: Cache in-memory de 2 segundos com coalescência de promessas (`inFlight`), evitando que centenas de requisições simultâneas sobrecarreguem o PostgreSQL.
- **Rate Limit Customizado (`src/lib/auth.ts`)**: Limites do Better Auth configurados em memória para acomodar rajadas da sala inteira saindo pelo mesmo endereço IP (NAT).
- **Backoff e Jitter no Polling (`src/lib/raffle-notifications.ts`)**: Intervalo adaptativo para que clientes não sincronizem requisições simultâneas.

---

## 4. Estrutura do Repositório

```
lecture-draw-web/
├── AGENTS.md                  # Este arquivo (regras para o Antigravity / IA)
├── CLAUDE.md                  # Configuração de agentes legada / ponte para AGENTS.md
├── package.json               # Dependências e scripts pnpm
├── prisma.config.ts           # Configuração do Prisma v7
├── docker-compose.yml         # Postgres local na porta 5433
├── vitest.config.mts          # Configuração de testes Vitest
├── src/
│   ├── actions/               # Server Actions ('use server')
│   │   ├── raffle.ts          # Sorteio e transferência de prêmios
│   │   ├── sql-console.ts     # Execução de SQL seguro para admin
│   │   └── users.ts           # Exclusão de conta e consulta de participantes
│   ├── app/                   # App Router do Next.js 16
│   │   ├── (auth)/login/      # Tela de login com Google / GitHub
│   │   ├── (dashboard)/       # Layout shell VS Code e páginas protegidas
│   │   │   ├── layout.tsx     # Shell com ActivityBar, Sidebar, TabBar, StatusBar, etc.
│   │   │   ├── dashboard/     # Painel principal do evento e countdown
│   │   │   ├── raffle/        # Visualização do sorteio e animação de ganhadores
│   │   │   ├── participants/  # Lista de inscritos estilo explorer do VS Code
│   │   │   ├── transfer/      # Formulário de transferência de prêmio
│   │   │   ├── sql-console/   # Console SQL (admin only)
│   │   │   └── config/        # Perfil e zona de exclusão de conta
│   │   ├── api/               # Handlers HTTP REST
│   │   │   ├── auth/[...all]/ # Endpoints do Better Auth
│   │   │   ├── participants/  # Contagem pública de inscritos (/count)
│   │   │   ├── raffle/        # Endpoints de sorteio, resultados e transferência
│   │   │   └── users/         # Exclusão de conta via API
│   │   ├── globals.css        # Variáveis de tema HUD Dark VS Code e estilos base
│   │   ├── layout.tsx         # Root Layout com fontes e Providers
│   │   └── page.tsx           # Despachante raiz (/ -> /dashboard ou /login)
│   ├── proxy.ts               # Proxy do Next.js 16 (proteção e roteamento)
│   ├── components/
│   │   ├── dashboard/         # Componentes da home (DashboardHome, TechStack)
│   │   ├── raffle/            # RafflePage, WinnerCard, WinnerModal, Notifier
│   │   ├── sql/               # SqlConsoleView e visualizador de schemas
│   │   ├── vscode/            # ActivityBar, Sidebar, TabBar, StatusBar, Terminal, MobileNav
│   │   └── providers.tsx      # Provider TanStack Query
│   ├── lib/
│   │   ├── auth.ts            # Instância Better Auth (server)
│   │   ├── auth-client.ts     # Cliente Better Auth (browser)
│   │   ├── prisma.ts          # Singleton do Prisma Client
│   │   └── raffle-notifications.ts # Lógica pura de cálculo de notificações/polling
│   └── generated/prisma/      # Prisma Client gerado (NÃO EDITAR MANUALMENTE)
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados relacional
│   └── seed.ts                # Seed de evento, prêmios e promoção de admin
├── tests/
│   ├── helpers/               # Utilitários de mock (Prisma, sessões)
│   ├── integration/           # Testes com banco real (PostgreSQL/Neon)
│   └── unit/                  # Testes unitários rápidos (ações, proxy, helpers)
└── docs/                      # Documentação de negócio, responsividade e prompts
```

---

## 5. Comandos de Desenvolvimento e Validação

> [!IMPORTANT]
> **Use exclusivamente `pnpm`**. O uso de `npm` ou `yarn` quebra o lockfile e o pipeline de CI.

### 5.1. Ciclo de Desenvolvimento

```bash
pnpm dev              # Inicia o servidor Next.js em modo desenvolvimento (localhost:3000)
pnpm build            # Compila o projeto para produção
pnpm start            # Executa a build de produção localmente
```

### 5.2. Qualidade de Código & Verificação Estática

```bash
pnpm typecheck        # Executa 'tsc --noEmit' em todo o projeto
pnpm lint:check       # Valida código com ESLint
pnpm lint             # Executa ESLint com autofix quando possível
pnpm format:check     # Verifica conformidade de formatação com Prettier
pnpm format           # Aplica formatação Prettier no repositório inteiro
```

### 5.3. Banco de Dados & Prisma

```bash
docker compose up -d  # Sobe o Postgres 17 local na porta 5433
pnpm db:generate      # Gera o Prisma Client em src/generated/prisma (obrigatório após mudanças no schema)
pnpm db:push          # Sincroniza o schema.prisma com o banco de dados
pnpm db:seed          # Popula evento inicial, 5 prêmios e promove o ADMIN_EMAIL
pnpm db:studio        # Abre interface web visual do banco de dados
```

### 5.4. Testes Automatizados

```bash
pnpm test:unit        # Executa suite de testes unitários (não exige banco de dados)
pnpm test             # Executa suite completa de testes com Vitest
pnpm test:integration # Executa testes de integração (requer DATABASE_URL válida)
pnpm verify:rate-limit# Executa teste E2E de rate limit contra o servidor rodando
```

---

## 6. Diretrizes Obrigatórias para o Agente Antigravity CLI (Gemini 3.8)

Ao trabalhar neste repositório, o modelo Gemini 3.8 deve seguir estritamente os seguintes princípios:

1. **Validação Contínua após Qualquer Edição**:
   - Após modificar arquivos TypeScript ou React, execute sempre:
     ```bash
     pnpm typecheck && pnpm test:unit
     ```
   - Não considere uma tarefa concluída se houver erros de tipos ou testes quebrando.

2. **Next.js 16 — Atenção a Mudanças e Deprecações**:
   - O Next.js 16 renomeou Middleware para **Proxy**. O arquivo do projeto é `src/proxy.ts`. **Não crie `middleware.ts`**.
   - Em caso de dúvidas sobre APIs do Next.js 16 (App Router, Server Actions, Caching), consulte a documentação local empacotada em `node_modules/next/dist/docs/`.

3. **Modificações de Banco e Schema**:
   - Se alterar `prisma/schema.prisma`, execute imediatamente `pnpm db:generate`.
   - Lembre-se de que o Prisma Client gerado reside em `src/generated/prisma`.
   - Ao criar relacionamentos com `User`, atente-se às regras de `ON DELETE`. Tabelas com `RESTRICT` (`TransferLog`, `QueryLog`) requerem exclusão prévia explícita no método `deleteAccount()`.

4. **Padrão de Commits**:
   - Este projeto utiliza **Conventional Commits** com escopos e mensagens preferencialmente em **PT-BR**:
     - `feat(raffle): adiciona contagem regressiva para o sorteio`
     - `fix(proxy): corrige redirecionamento de rotas protegidas`
     - `refactor(auth): melhora tipagem da sessão`
     - `test(users): adiciona teste unitário para exclusão de conta`
   - O Husky valida commits no `commit-msg` e roda `pnpm typecheck` no `pre-push`.

5. **Design System & Responsividade**:
   - Mantenha a identidade visual HUD Cyberpunk / VS Code (veja variáveis `:root` em `src/app/globals.css`).
   - Todos os alvos interativos (botões, links, abas) devem respeitar um tamanho mínimo acessível de **≥ 44px** em dispositivos móveis.
   - Campos de input de busca (como `#search-participants`) devem possuir fonte **≥ 16px** para prevenir zoom automático no Safari iOS.
   - Evite barras de rolagem horizontais indesejadas em resoluções mobile (320px a 430px).

6. **Comunicação com o Desenvolvedor**:
   - Responda de forma concisa, estruturada e em português.
   - Sempre utilize links clicáveis no formato markdown com `file://` para arquivos e símbolos referenciados.
