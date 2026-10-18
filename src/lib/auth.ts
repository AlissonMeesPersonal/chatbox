import { cookies } from 'next/headers';

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
};
export type AuthIdentity = { id: string; email?: string; email_confirmed_at?: string | null };

export const ACCESS_COOKIE = 'viante_access';
export const REFRESH_COOKIE = 'viante_refresh';

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase Auth não configurado');
  return { url: url.replace(/\/$/, ''), key };
}

export async function authApi(
  endpoint: string, body?: unknown, accessToken?: string, method = 'POST'
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const { url, key } = config();
  const response = await fetch(url + '/auth/v1/' + endpoint, {
    method,
    headers: {
      apikey: key,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(accessToken ? { authorization: 'Bearer ' + accessToken } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export async function writeAuthCookies(tokens: AuthTokens) {
  const jar = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  jar.set(ACCESS_COOKIE, tokens.access_token, {
    ...cookieOptions, maxAge: Math.max(60, Math.min(tokens.expires_in ?? 3600, 3600)),
  });
  jar.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...cookieOptions, maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export async function accessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}

export async function getIdentity(): Promise<AuthIdentity | null> {
  const access = await accessToken();
  if (!access) return null;
  const result = await authApi('user', undefined, access, 'GET');
  if (!result.ok || typeof result.data.id !== 'string') return null;
  return result.data as AuthIdentity;
}

// The Auth server verifies the bearer token before we inspect its signed claims.
export function tokenAal(verifiedToken: string): string {
  try {
    const b64 = verifiedToken.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!b64) return 'aal1';
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    return typeof payload.aal === 'string' ? payload.aal : 'aal1';
  } catch {
    return 'aal1';
  }
}

export async function isPlatformAdmin(userId: string, access: string): Promise<boolean> {
  const { url, key } = config();
  const response = await fetch(
    url + '/rest/v1/viante_platform_admins?select=user_id&user_id=eq.' + encodeURIComponent(userId) + '&limit=1',
    {
      headers: { apikey: key, authorization: 'Bearer ' + access },
      cache: 'no-store',
    },
  );
  if (!response.ok) return false;
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) && rows.length === 1 && rows[0]?.user_id === userId;
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return origin !== null && origin === new URL(request.url).origin;
}

export function publicBaseUrl(request: Request): string {
  return new URL(request.url).origin;
}
