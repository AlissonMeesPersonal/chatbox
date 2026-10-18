import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const requiresAuth = path.startsWith('/admin') || path.startsWith('/app') || path.startsWith('/mfa') || path.startsWith('/activate-ceo') || path.startsWith('/reset-password');
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  let response = NextResponse.next({ request });
  let verifiedAccess = access;

  // Refresh only close to expiration. The server page independently verifies
  // each bearer token with Supabase Auth; this JWT payload is NOT trusted for authorization.
  let mustRefresh = !access;
  if (access) {
    try {
      const payload = JSON.parse(Buffer.from(access.split('.')[1]!, 'base64url').toString('utf8'));
      mustRefresh = typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000 + 90;
    } catch {
      mustRefresh = true;
    }
  }

  if (mustRefresh && refresh && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const result = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
        cache: 'no-store',
      });
      const data = await result.json();
      if (result.ok && typeof data.access_token === 'string' && typeof data.refresh_token === 'string') {
        verifiedAccess = data.access_token;
        request.cookies.set(ACCESS_COOKIE, data.access_token);
        request.cookies.set(REFRESH_COOKIE, data.refresh_token);
        response = NextResponse.next({ request });
        const opts = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
        };
        response.cookies.set(ACCESS_COOKIE, data.access_token, { ...opts, maxAge: Math.min(data.expires_in ?? 3600, 3600) });
        response.cookies.set(REFRESH_COOKIE, data.refresh_token, { ...opts, maxAge: 60 * 60 * 24 * 30 });
      } else {
        verifiedAccess = undefined;
        response.cookies.delete(ACCESS_COOKIE);
        response.cookies.delete(REFRESH_COOKIE);
      }
    } catch {
      verifiedAccess = undefined;
    }
  }

  if (requiresAuth && !verifiedAccess) {
    const redirect = NextResponse.redirect(new URL('/login?status=signin', request.url));
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    return redirect;
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/app/:path*', '/mfa/:path*', '/activate-ceo/:path*', '/reset-password/:path*'],
};
