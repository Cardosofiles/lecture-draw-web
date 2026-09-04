import { NextRequest, NextResponse } from 'next/server'

const protectedPaths = [
  '/dashboard',
  '/raffle',
  '/participants',
  '/transfer',
  '/sql-console',
  '/config',
]
const adminPaths = ['/sql-console']
const authPaths = ['/login']

async function verifySession(request: NextRequest) {
  const origin = request.nextUrl.origin
  const cookie = request.headers.get('cookie')
  if (!cookie) return null

  try {
    const response = await fetch(`${origin}/api/auth/get-session`, {
      headers: {
        Cookie: cookie,
      },
    })
    if (!response.ok) return null
    const session = await response.json()
    return session?.user ? session : null
  } catch {
    return null
  }
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.set('better-auth.session_token', '', { path: '/', maxAge: 0 })
  response.cookies.set('__Secure-better-auth.session_token', '', { path: '/', maxAge: 0 })
}

export async function proxy(request: NextRequest) {
  // Normalize 127.0.0.1 to localhost in development so OAuth cookies & callback match
  const host = request.headers.get('host')
  if (host?.startsWith('127.0.0.1')) {
    const url = new URL(request.url)
    url.host = host.replace('127.0.0.1', 'localhost')
    return NextResponse.redirect(url)
  }

  const { pathname } = request.nextUrl

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
  const isAuthPath = authPaths.some((p) => pathname.startsWith(p))

  if (!isProtected && !isAuthPath) {
    return NextResponse.next()
  }

  const sessionToken =
    request.cookies.get('better-auth.session_token')?.value ??
    request.cookies.get('__Secure-better-auth.session_token')?.value

  if (isProtected && !sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (sessionToken && adminPaths.some((p) => pathname.startsWith(p))) {
    const session = await verifySession(request)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (isAuthPath && sessionToken) {
    const session = await verifySession(request)
    if (session?.user) {
      // Authenticated visitor: redirect away from login
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')
      const target =
        callbackUrl?.startsWith('/') && !callbackUrl.startsWith('/login') ? callbackUrl : '/'
      return NextResponse.redirect(new URL(target, request.url))
    }

    // Stale / invalid session token: clear cookie and allow /login to render
    const res = NextResponse.next()
    clearSessionCookies(res)
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
