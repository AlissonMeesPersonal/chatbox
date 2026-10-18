import { NextRequest, NextResponse } from 'next/server';
import {
  accessToken, authApi, clearAuthCookies, isSameOrigin, writeAuthCookies,
  type AuthTokens,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';
const CANONICAL_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://chatbox-cyan-five.vercel.app';
const CEO_EMAIL = 'alissonmeespersonal@gmail.com';

function go(request: NextRequest, target: string) {
  return NextResponse.redirect(new URL(target, request.url), { status: 303 });
}
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  const form = await request.formData();
  const action = String(form.get('intent') ?? '');
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  try {
    if (action === 'logout') {
      const token = await accessToken();
      if (token) await authApi('logout', {}, token).catch(() => null);
      await clearAuthCookies();
      return go(request, '/login?status=signedout');
    }
    if (action === 'update-password') {
      if (password.length < 12 || password.length > 128) return go(request, '/reset-password?status=weak');
      const token = await accessToken();
      if (!token) return go(request, '/login?status=expired');
      const result = await authApi('user', { password }, token, 'PUT');
      if (!result.ok) return go(request, '/reset-password?status=error');
      return go(request, '/entry');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return go(request, '/login?status=invalid');
    }
    if (action === 'sign-in') {
      const result = await authApi('token?grant_type=password', { email, password });
      if (!result.ok || !result.data.access_token || !result.data.refresh_token) {
        return go(request, '/login?status=invalid');
      }
      await writeAuthCookies(result.data as AuthTokens);
      return go(request, '/entry');
    }
    if (action === 'sign-up') {
      // Self-service sign-up is disabled for other accounts until tenant invitations exist.
      if (email !== CEO_EMAIL) return go(request, '/login?status=invite-only');
      if (password.length < 12 || password.length > 128) return go(request, '/login?status=weak');
      const callback = encodeURIComponent(CANONICAL_URL + '/auth/finish?flow=signup');
      const result = await authApi('signup?redirect_to=' + callback, { email, password });
      // Always use generic response so this endpoint cannot enumerate Auth users.
      if (!result.ok && result.status === 429) return go(request, '/login?status=limited');
      return go(request, '/login?status=check-email');
    }
    if (action === 'magic') {
      // Existing accounts only. Never create arbitrary user accounts through this route.
      const callback = encodeURIComponent(CANONICAL_URL + '/auth/finish?flow=login');
      const res = await authApi('otp?redirect_to=' + callback, { email, create_user: false });
      if (!res.ok && res.status === 429) return go(request, '/login?status=limited');
      return go(request, '/login?status=check-email');
    }
    if (action === 'recover') {
      const callback = encodeURIComponent(CANONICAL_URL + '/auth/finish?flow=recovery');
      await authApi('recover?redirect_to=' + callback, { email }).catch(() => null);
      return go(request, '/login?status=check-email');
    }
  } catch {
    return go(request, '/login?status=unavailable');
  }
  return new NextResponse('Ação inválida', { status: 400 });
}
