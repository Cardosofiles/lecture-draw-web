/**
 * Validação ponta a ponta do rate limit do login, contra um servidor de
 * verdade (`next start`), passando pelo handler real do Better Auth.
 *
 *   BASE_URL=http://localhost:3100 pnpm tsx scripts/verify-rate-limit.ts
 *
 * O cenário que importa: todo mundo na palestra sai pelo mesmo IP do NAT da
 * rede local. A chave do rate limit do Better Auth é `<ip>|<path>`, então a
 * sala inteira divide UM balde. Com os defaults (3 req/10s em /sign-in*) o
 * quarto participante a clicar "Entrar" leva 429.
 *
 * Sai com código != 0 se qualquer cenário falhar, para o CI reprovar o build.
 */
import 'dotenv/config'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3100'
const AUTH = `${BASE_URL}/api/auth`

/** Tamanho da plateia esperada — ver lecture-event-constraints. */
const ROOM_SIZE = 400

type Result = { status: number; retryAfter: string | null }

/** Dispara `count` requests com concorrência limitada, todas do mesmo IP. */
async function burst(
  path: string,
  ip: string,
  count: number,
  init: RequestInit = {},
  concurrency = 32
): Promise<Result[]> {
  const results: Result[] = new Array(count)
  let next = 0

  async function worker() {
    for (let i = next++; i < count; i = next++) {
      const res = await fetch(`${AUTH}${path}`, {
        ...init,
        headers: {
          'content-type': 'application/json',
          // Header que o Better Auth lê para derivar o IP (getIp).
          'x-forwarded-for': ip,
          ...(init.headers as Record<string, string> | undefined),
        },
        redirect: 'manual',
      })
      // Drena o corpo: sem isso o undici segura a conexão do pool.
      await res.arrayBuffer()
      results[i] = {
        status: res.status,
        retryAfter: res.headers.get('x-retry-after'),
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, count) }, worker))
  return results
}

const signInBody = JSON.stringify({
  provider: 'google',
  callbackURL: '/dashboard',
})

function tally(results: Result[]) {
  const counts = new Map<number, number>()
  for (const r of results) counts.set(r.status, (counts.get(r.status) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([status, n]) => `${n}×${status}`)
    .join('  ')
}

const failures: string[] = []

function check(name: string, ok: boolean, detail: string) {
  console.log(`${ok ? '✅' : '❌'} ${name}\n   ${detail}`)
  if (!ok) failures.push(name)
}

/** Cada cenário usa um IP próprio para não herdar o balde do anterior. */
async function main() {
  console.log(`\n🔎 Rate limit ponta a ponta — ${AUTH}\n`)

  // Sanidade: o servidor está de pé e é o app certo?
  const ping = await fetch(`${AUTH}/get-session`, {
    headers: { 'x-forwarded-for': '203.0.113.1' },
  })
  if (!ping.ok) {
    console.error(
      `Servidor não respondeu em ${AUTH}/get-session (HTTP ${ping.status}). ` +
        `Suba com \`pnpm build && pnpm start -p 3100\`.`
    )
    process.exit(2)
  }

  // 1. O cenário real: a sala inteira clicando "Entrar com Google" na mesma
  //    janela, todos atrás do mesmo IP. Nenhum 429 pode aparecer.
  const room = await burst('/sign-in/social', '198.51.100.10', ROOM_SIZE, {
    method: 'POST',
    body: signInBody,
  })
  const roomBlocked = room.filter((r) => r.status === 429).length
  check(
    `${ROOM_SIZE} participantes atrás de um IP conseguem logar`,
    roomBlocked === 0,
    `${tally(room)} — bloqueados: ${roomBlocked}`
  )

  // 2. O limite continua existindo: um IP sozinho estourando o teto leva 429
  //    e recebe o X-Retry-After.
  const flood = await burst('/delete-user', '198.51.100.20', 40, {
    method: 'POST',
    body: '{}',
  })
  const firstBlocked = flood.findIndex((r) => r.status === 429)
  const retryAfter = flood.find((r) => r.retryAfter)?.retryAfter ?? null
  check(
    'endpoint sensível (/delete-user) ainda corta em excesso',
    firstBlocked !== -1 && retryAfter !== null,
    `${tally(flood)} — X-Retry-After: ${retryAfter ?? 'ausente'}`
  )

  // 3. O balde é por IP: quem estourou não derruba o vizinho.
  const neighbour = await burst('/delete-user', '198.51.100.21', 1, {
    method: 'POST',
    body: '{}',
  })
  check(
    'IP vizinho não herda o bloqueio',
    neighbour[0].status !== 429,
    `HTTP ${neighbour[0].status} para 198.51.100.21 logo após 198.51.100.20 ser bloqueado`
  )

  // 4. /get-session é chamado por toda página do dashboard; a sala não pode
  //    ser cortada nele.
  const sessions = await burst('/get-session', '198.51.100.30', ROOM_SIZE)
  const sessionsBlocked = sessions.filter((r) => r.status === 429).length
  check(
    `${ROOM_SIZE} chamadas a /get-session do mesmo IP passam`,
    sessionsBlocked === 0,
    `${tally(sessions)} — bloqueados: ${sessionsBlocked}`
  )

  console.log(
    failures.length === 0 ? '\n✅ Rate limit validado.\n' : `\n❌ Falhou: ${failures.join(', ')}\n`
  )
  process.exit(failures.length === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})
