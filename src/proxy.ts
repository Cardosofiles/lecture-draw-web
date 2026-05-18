import { NextRequest, NextResponse } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/raffle",
  "/participants",
  "/transfer",
  "/sql-console",
  "/config",
];
const adminPaths = ["/sql-console"];
const authPaths = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPath = authPaths.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAuthPath) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (isProtected && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionToken && adminPaths.some((p) => pathname.startsWith(p))) {
    try {
      const response = await fetch(
        `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/auth/get-session`,
        {
          headers: {
            Cookie: `better-auth.session_token=${sessionToken}`,
          },
        },
      );
      const session = await response.json();
      if (!session?.user || session.user.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isAuthPath && sessionToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
