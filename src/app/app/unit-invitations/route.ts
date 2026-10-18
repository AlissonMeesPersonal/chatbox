import { NextRequest, NextResponse } from 'next/server';
import { accessToken, authApi, getIdentity, isSameOrigin, tokenAal } from '@/lib/auth';
import { tenantApi } from '@/lib/tenant-api';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'https://chatbox-cyan-five.vercel.app';

function go(req: NextRequest, org: string, status: string) {
  return NextResponse.redirect(new URL('/app?org=' + org + '&status=' + status, req.url), 303);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  const user = await getIdentity();
  const token = await accessToken();
  if (!user?.email_confirmed_at || !token || tokenAal(token) !== 'aal2') {
    return new NextResponse('Acesso com MFA obrigatório', { status: 403 });
  }
  const form = await request.formData();
  const org = String(form.get('organization_id') ?? '');
  const unit = String(form.get('unit_id') ?? '');
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!UUID.test(org) || !UUID.test(unit) || !EMAIL.test(email) || email.length > 254) {
    return new NextResponse('Informe uma unidade válida e e-mail corporativo', { status: 400 });
  }

  const result = await tenantApi('rpc/viante_owner_invite_unit', 'POST', {
    p_org: org, p_unit: unit, p_email: email,
  }, token);
  if (!result.ok || typeof result.data !== 'string' || !UUID.test(result.data)) {
    return go(request, org, 'unit-invite-error');
  }
  const callback = APP_ORIGIN + '/auth/finish?flow=unit&invite=' + result.data;
  try {
    const delivery = await authApi('otp?redirect_to=' + encodeURIComponent(callback), {
      email,
      create_user: true,
    });
    return go(request, org, delivery.ok ? 'unit-invite-requested' : 'unit-invite-email-failed');
  } catch {
    return go(request, org, 'unit-invite-email-failed');
  }
}
