import { NextRequest, NextResponse } from 'next/server';
import { authApi, writeAuthCookies, type AuthTokens } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const rawType = request.nextUrl.searchParams.get('type');
  const type = rawType === 'signup' || rawType === 'email' || rawType === 'recovery' || rawType === 'invite' ? rawType : null;
  if (!tokenHash || tokenHash.length > 1024 || !type) {
    return NextResponse.redirect(new URL('/login?status=invalid-link', request.url));
  }
  try {
    const result = await authApi('verify', { token_hash: tokenHash, type });
    if (!result.ok) throw new Error('Invalid token');
    if (typeof result.data.access_token === 'string' && typeof result.data.refresh_token === 'string') {
      await writeAuthCookies(result.data as AuthTokens);
    }
    return NextResponse.redirect(new URL(type === 'recovery' ? '/reset-password' : '/admin', request.url));
  } catch {
    return NextResponse.redirect(new URL('/login?status=invalid-link', request.url));
  }
}
