/**
 * Load test for the raffle polling endpoint.
 *
 * Simulates N signed-in attendees running <RaffleNotifier /> — each one polls
 * /api/raffle/results on an interval, exactly like the browser does. Reports
 * latency percentiles and error rates so you can see where the app tips over
 * before the lecture does it for you.
 *
 *   LOAD_USERS=400 LOAD_DURATION=60 pnpm exec tsx scripts/load-test.ts
 *
 * Env:
 *   LOAD_TARGET    base URL under test          (default http://localhost:3000)
 *   LOAD_USERS     simultaneous attendees        (default 100)
 *   LOAD_DURATION  seconds to sustain the load   (default 30)
 *   LOAD_INTERVAL  poll interval in ms per user  (default 3000 — the app's value)
 *   LOAD_PATH      endpoint to hammer            (default /api/raffle/results)
 *
 * Synthetic users are created with isParticipant=false so they never show up in
 * the participants list or the draw, and everything is deleted on exit —
 * including on Ctrl-C.
 */
import "dotenv/config";
import { webcrypto } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Mirrors better-call's signCookieValue (HMAC-SHA256, standard base64, then
 * `value.signature` URI-encoded) — its ./crypto subpath is not exported.
 */
async function signCookieValue(value: string, secret: string) {
  const key = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await webcrypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return encodeURIComponent(`${value}.${signature}`);
}

const TARGET = process.env.LOAD_TARGET ?? "http://localhost:3000";
const USERS = Number(process.env.LOAD_USERS ?? 100);
const DURATION = Number(process.env.LOAD_DURATION ?? 30);
const INTERVAL = Number(process.env.LOAD_INTERVAL ?? 3000);
const PATH = process.env.LOAD_PATH ?? "/api/raffle/results";
const TAG = `loadtest-${Date.now()}`;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
} as ConstructorParameters<typeof PrismaClient>[0]);

const latencies: number[] = [];
const statuses = new Map<string, number>();
let inFlight = 0;
let peakInFlight = 0;

function record(key: string) {
  statuses.set(key, (statuses.get(key) ?? 0) + 1);
}

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function createVirtualUsers() {
  const secret = process.env.BETTER_AUTH_SECRET!;
  const cookies: string[] = [];

  for (let i = 0; i < USERS; i++) {
    const user = await prisma.user.create({
      data: {
        name: `Load ${i}`,
        email: `${TAG}-${i}@loadtest.invalid`,
        role: "user",
        isParticipant: false, // invisible to /participants and to the draw
      },
    });
    const token = `${TAG}-tok-${i}-${Math.random().toString(36).slice(2)}`;
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });
    cookies.push(
      `better-auth.session_token=${await signCookieValue(token, secret)}`,
    );
  }
  return cookies;
}

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: TAG } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (!ids.length) return;
  await prisma.session.deleteMany({ where: { userId: { in: ids } } });
  await prisma.raffleEntry.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`\n🧹 removed ${ids.length} synthetic users`);
}

/** One attendee's browser tab, polling until the clock runs out. */
async function virtualUser(cookie: string, deadline: number) {
  // Stagger the start so all tabs do not fire on the same tick
  await new Promise((r) => setTimeout(r, Math.random() * INTERVAL));

  while (Date.now() < deadline) {
    const started = performance.now();
    inFlight++;
    peakInFlight = Math.max(peakInFlight, inFlight);
    try {
      const res = await fetch(`${TARGET}${PATH}`, { headers: { cookie } });
      await res.arrayBuffer();
      latencies.push(performance.now() - started);
      record(String(res.status));
    } catch (e) {
      latencies.push(performance.now() - started);
      record(`network:${e instanceof Error ? e.message.slice(0, 40) : "error"}`);
    } finally {
      inFlight--;
    }
    const jitter = INTERVAL * (0.85 + Math.random() * 0.3);
    await new Promise((r) => setTimeout(r, jitter));
  }
}

async function main() {
  console.log(
    `▶  ${USERS} attendees · ${PATH} every ${INTERVAL}ms · ${DURATION}s · ${TARGET}`,
  );
  console.log(
    `   expected offered load ≈ ${((USERS / INTERVAL) * 1000).toFixed(1)} req/s`,
  );

  process.on("SIGINT", async () => {
    await cleanup();
    process.exit(130);
  });

  console.log("   provisioning sessions...");
  const cookies = await createVirtualUsers();

  const deadline = Date.now() + DURATION * 1000;
  const wall = performance.now();
  await Promise.all(cookies.map((c) => virtualUser(c, deadline)));
  const elapsed = (performance.now() - wall) / 1000;

  const sorted = [...latencies].sort((a, b) => a - b);
  const ok = statuses.get("200") ?? 0;
  const total = latencies.length;

  console.log(`\n── results ─────────────────────────────`);
  console.log(`requests      ${total}  (${(total / elapsed).toFixed(1)} req/s)`);
  console.log(
    `success       ${ok}/${total}  (${((ok / total) * 100).toFixed(2)}%)`,
  );
  console.log(`peak in-flight ${peakInFlight}`);
  console.log(`latency  p50   ${percentile(sorted, 50).toFixed(0)} ms`);
  console.log(`         p90   ${percentile(sorted, 90).toFixed(0)} ms`);
  console.log(`         p95   ${percentile(sorted, 95).toFixed(0)} ms`);
  console.log(`         p99   ${percentile(sorted, 99).toFixed(0)} ms`);
  console.log(`         max   ${(sorted.at(-1) ?? 0).toFixed(0)} ms`);
  console.log(`responses     ${JSON.stringify(Object.fromEntries(statuses))}`);
}

main()
  .catch((e) => {
    console.error("load test failed:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
  });
