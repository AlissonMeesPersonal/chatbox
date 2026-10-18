import { accessToken } from '@/lib/auth';

const cfg = () => ({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
});

export async function tenantApi(endpoint: string, method = 'GET', body?: unknown, token?: string) {
  const { url, key } = cfg();
  const access = token ?? await accessToken();
  if (!url || !key || !access) return { ok: false, status: 401, data: null as unknown };
  try {
    const r = await fetch(url + '/rest/v1/' + endpoint, {
      method,
      headers: {
        apikey: key, authorization: 'Bearer ' + access,
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      cache: 'no-store',
    });
    return { ok: r.ok, status: r.status, data: await r.json().catch(() => null) as unknown };
  } catch {
    return { ok: false, status: 503, data: null as unknown };
  }
}

export type Membership = { organization_id: string; role: string; status: string };
export async function myMemberships(token?: string): Promise<Membership[]> {
  const res = await tenantApi('viante_memberships?select=organization_id,role,status&status=eq.active', 'GET', undefined, token);
  return res.ok && Array.isArray(res.data) ? res.data as Membership[] : [];
}
