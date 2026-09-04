import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy, config } from '@/proxy'

const BASE = 'http://localhost:3000'

function request(path: string, sessionToken?: string) {
  const headers = new Headers()
  if (sessionToken) {
    headers.set('cookie', `better-auth.session_token=${sessionToken}`)
  }
  return new NextRequest(new URL(path, BASE), { headers })
}

/** Where a NextResponse sends the browser, or null when it passes through. */
function locationOf(res: Response) {
  return res.status >= 300 && res.status < 400
    ? new URL(res.headers.get('location')!).pathname + new URL(res.headers.get('location')!).search
    : null
}

afterEach(() => vi.unstubAllGlobals())

describe('proxy — matcher', () => {
  it('does not run on API routes or Next internals', () => {
    const matcher = (config.matcher as string[])[0]
    const re = new RegExp(`^${matcher}$`.replace(/\(\?!/g, '(?!'))
    expect(re.test('/api/auth/callback')).toBe(false)
    expect(re.test('/_next/static/chunk.js')).toBe(false)
    expect(re.test('/dashboard')).toBe(true)
  })
})

describe('proxy — unauthenticated visitors', () => {
  const protectedPaths = [
    '/dashboard',
    '/raffle',
    '/participants',
    '/transfer',
    '/sql-console',
    '/config',
  ]

  for (const path of protectedPaths) {
    it(`redirects ${path} to /login carrying the callbackUrl`, async () => {
      const res = await proxy(request(path))
      expect(locationOf(res)).toBe(`/login?callbackUrl=${encodeURIComponent(path)}`)
    })
  }

  it('lets /login through', async () => {
    const res = await proxy(request('/login'))
    expect(locationOf(res)).toBeNull()
  })

  it('lets an unlisted public path through untouched', async () => {
    const res = await proxy(request('/some-marketing-page'))
    expect(locationOf(res)).toBeNull()
  })
})

describe('proxy — authenticated visitors', () => {
  it('lets a signed-in user reach /dashboard', async () => {
    const res = await proxy(request('/dashboard', 'tok'))
    expect(locationOf(res)).toBeNull()
  })

  it('sends a signed-in user off /login to the root dispatcher (BR-06)', async () => {
    const res = await proxy(request('/login', 'tok'))
    expect(locationOf(res)).toBe('/')
  })

  it('honours the callbackUrl that the protected-path redirect set', async () => {
    const res = await proxy(request('/login?callbackUrl=%2Fraffle', 'tok'))
    expect(locationOf(res)).toBe('/raffle')
  })

  it('ignores an off-site callbackUrl', async () => {
    const res = await proxy(request('/login?callbackUrl=https%3A%2F%2Fevil.example', 'tok'))
    expect(locationOf(res)).toBe('/')
  })
})

describe('proxy — admin-only paths', () => {
  it('bounces a non-admin off /sql-console', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ user: { role: 'user' } }))
    )
    const res = await proxy(request('/sql-console', 'tok'))
    expect(locationOf(res)).toBe('/dashboard')
  })

  it('lets an admin into /sql-console', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ user: { role: 'admin' } }))
    )
    const res = await proxy(request('/sql-console', 'tok'))
    expect(locationOf(res)).toBeNull()
  })

  it('fails closed when the session lookup errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      })
    )
    const res = await proxy(request('/sql-console', 'tok'))
    expect(locationOf(res)).toBe('/dashboard')
  })

  it('fails closed when the session response has no user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({}))
    )
    const res = await proxy(request('/sql-console', 'tok'))
    expect(locationOf(res)).toBe('/dashboard')
  })
})
