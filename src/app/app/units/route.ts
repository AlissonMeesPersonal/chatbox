import { NextRequest, NextResponse } from 'next/server';
import { accessToken, authApi, getIdentity, isSameOrigin, tokenAal } from '@/lib/auth';
import { tenantApi } from '@/lib/tenant-api';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'https://chatbox-cyan-five.vercel.app';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  const user = await getIdentity();
  const token = await accessToken();
  if (!user?.email_confirmed_at || !token || tokenAal(token) !== 'aal2') {
    return new NextResponse('Não autorizado', { status: 403 });
  }
  const form = await request.formData();
  const org = String(form.get('organization_id') ?? '');
  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!UUID.test(org) || name.length < 2 || name.length > 160
      || (email.length > 0 && (email.length > 254 || !EMAIL.test(email)))) {
    return new NextResponse('Dados da unidade inválidos', { status: 400 });
  }
  // Atomic DB creation: a unit + optional invitation are always scoped to the owner company.
  const response = await tenantApi('rpc/viante_owner_create_unit_with_invite', 'POST', {
    p_org: org, p_name: name, p_email: email || null,
  }, token);
  if (!response.ok || !Array.isArray(response.data) || !response.data[0]?.unit_id) {
    return NextResponse.redirect(new URL('/app?org=' + org + '&status=unit-error', request.url), 303);
  }
  const invitation = response.data[0].invitation_id;
  if (!email || !invitation) {
    return NextResponse.redirect(new URL('/app?org=' + org + '&status=unit-created', request.url), 303);
  }
  const callback = APP_ORIGIN + '/auth/finish?flow=unit&invite=' + invitation;
  try {
    const sent = await authApi('otp?redirect_to=' + encodeURIComponent(callback), {
      email,
      create_user: true,
    });
    return NextResponse.redirect(new URL('/app?org=' + org + '&status='
      + (sent.ok ? 'unit-invite-requested' : 'unit-invite-email-failed'), request.url), 303);
  } catch {
    return NextResponse.redirect(new URL('/app?org=' + org + '&status=unit-invite-email-failed', request.url), 303);
  }
}
