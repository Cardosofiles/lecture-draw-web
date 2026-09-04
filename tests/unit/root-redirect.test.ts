import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const redirect = vi.fn((_path: string): never => {
  throw new Error('NEXT_REDIRECT')
})

vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('next/navigation', () => ({ redirect: (p: string) => redirect(p) }))
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: () => getSession() } } }))

const Home = (await import('@/app/page')).default

beforeEach(() => vi.clearAllMocks())

describe('/ dispatcher', () => {
  it('sends an anonymous visitor to /login', async () => {
    getSession.mockResolvedValue(null)
    await expect(Home()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('REGRESSION: never sends a signed-in visitor back to /login', async () => {
    // proxy.ts redirects an authenticated /login to "/". If "/" answered with
    // /login the browser would loop until ERR_TOO_MANY_REDIRECTS.
    getSession.mockResolvedValue({ user: { id: 'u1', role: 'user' } })
    await expect(Home()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirect).toHaveBeenCalledWith('/dashboard')
  })
})
