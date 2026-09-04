import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.join(import.meta.dirname, '..', '..')
const read = (p: string) => readFileSync(path.join(root, p), 'utf8')

/**
 * The raffle excludes admins everywhere (drawRaffle, getParticipantCount,
 * getAllParticipants). Any other place that counts or lists participants must
 * apply the same filter, or the UI shows a number the draw will not honour.
 */
describe('participant counting is consistent across the app', () => {
  const callers = ['src/app/(dashboard)/layout.tsx', 'src/app/(dashboard)/dashboard/page.tsx']

  for (const file of callers) {
    it(`${file} excludes admins when counting raffle entries`, () => {
      const src = read(file)
      const bareCount = /raffleEntry\.count\(\s*\)/.test(src)
      expect(
        bareCount,
        `${file} calls raffleEntry.count() with no admin filter, so the ` +
          `count disagrees with getParticipantCount() and /api/participants/count`
      ).toBe(false)
    })
  }

  it('the transfer page offers the same recipient set as getAllParticipants()', () => {
    const src = read('src/app/(dashboard)/transfer/page.tsx')
    expect(
      /role:\s*\{\s*not:\s*["']admin["']\s*\}/.test(src),
      'transfer/page.tsx lists admins as transfer recipients'
    ).toBe(true)
  })
})

describe('the seed script can reach the database', () => {
  it('prisma/seed.ts loads environment variables', () => {
    const src = read('prisma/seed.ts')
    expect(
      /dotenv\/config|loadEnvFile|process\.loadEnvFile/.test(src),
      '`pnpm db:seed` runs `tsx prisma/seed.ts`, which does not read .env — ' +
        'DATABASE_URL is undefined and the seed fails'
    ).toBe(true)
  })
})

describe('auto-enrolment excludes admins', () => {
  it('the Better Auth create hook cannot rely on role at creation time', () => {
    const src = read('src/lib/auth.ts')
    // `role` always defaults to "user" on create; admins are promoted later by
    // the seed, so this guard never fires and admins do get a RaffleEntry.
    const guardsOnRole = /u\.role === "admin"/.test(src)
    const guardsOnEmail = /ADMIN_EMAIL/.test(src)
    expect(
      !guardsOnRole || guardsOnEmail,
      "auth.ts skips enrolment when role === 'admin', but role is always " +
        "'user' at create time — compare against ADMIN_EMAIL instead"
    ).toBe(true)
  })
})
