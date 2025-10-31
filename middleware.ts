import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const encoder = new TextEncoder();

async function isValid(token: string | undefined) {
  if (!token) return false;
  try {
    const secret = encoder.encode(
      process.env.AUTH_SECRET ||
        (process.env.NODE_ENV !== 'production' ? 'dev-secret-change-me' : '')
    );
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('auth')?.value;
  const ok = await isValid(token);

  const isPublic = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register');

  if (!ok) {
    // Logged out: allow only home, login, register; block others
    if (isPublic) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Logged in: block login/register (and optionally home → send to dashboard)
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all pages except API and static assets
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
