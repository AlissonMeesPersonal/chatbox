import { NextRequest, NextResponse } from 'next/server';
import { accessToken, getIdentity, isPlatformAdmin, isSameOrigin, tokenAal } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  const user = await getIdentity();
  const token = await accessToken();
  if (!user?.email_confirmed_at || !token || tokenAal(token) !== 'aal2' || !(await isPlatformAdmin(user.id, token))) {
    return new NextResponse('Não autorizado', { status: 403 });
  }
  const form = await request.formData();
  const name = String(form.get('name') ?? '').trim();
  const slug = String(form.get('slug') ?? '').trim().toLowerCase();
  if (name.length < 2 || name.length > 160 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 80) {
    return NextResponse.redirect(new URL('/admin?status=error', request.url), 303);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.redirect(new URL('/admin?status=error', request.url), 303);
  const response = await fetch(url + '/rest/v1/rpc/viante_ceo_create_org', {
    method: 'POST',
    headers: { apikey: key, authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ p_name: name, p_slug: slug }),
    cache: 'no-store',
  });
  return NextResponse.redirect(new URL(response.ok ? '/admin?status=created' : '/admin?status=error', request.url), 303);
}
