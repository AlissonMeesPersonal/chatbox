import { NextRequest, NextResponse } from 'next/server';
import { accessToken, getIdentity, isSameOrigin, tokenAal } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  const identity = await getIdentity();
  const token = await accessToken();
  if (!identity || !identity.email_confirmed_at || !token || tokenAal(token) !== 'aal2') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false }, { status: 503 });
  const response = await fetch(url + '/rest/v1/rpc/viante_claim_ceo', {
    method: 'POST',
    headers: { apikey: key, authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: '{}',
    cache: 'no-store',
  });
  const activated = response.ok && (await response.json().catch(() => false)) === true;
  if (request.headers.get('accept')?.includes('application/json')) {
    return NextResponse.json({ ok: activated }, { status: activated ? 200 : 403 });
  }
  return NextResponse.redirect(new URL(activated ? '/admin' : '/admin?status=denied', request.url), { status: 303 });
}
