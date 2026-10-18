import { NextRequest, NextResponse } from 'next/server';
import { accessToken, authApi, getIdentity, isPlatformAdmin, isSameOrigin, tokenAal } from '@/lib/auth';
import { tenantApi } from '@/lib/tenant-api';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function back(req: NextRequest, status: string) {
  return NextResponse.redirect(new URL('/admin?status=' + status, req.url), 303);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  const user = await getIdentity();
  const token = await accessToken();
  if (!user?.email_confirmed_at || !token || tokenAal(token) !== 'aal2' || !(await isPlatformAdmin(user.id, token))) {
    return new NextResponse('Não autorizado', { status: 403 });
  }
  const form = await request.formData();
  const organizationId = String(form.get('organization_id') ?? '');
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!UUID.test(organizationId) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return back(request, 'invite-invalid');
  }
  // Permission, tenant existence and role are checked again by this AAL2-protected DB RPC.
  const created = await tenantApi('rpc/viante_ceo_invite_owner', 'POST', {
    p_organization_id: organizationId,
    p_email: email,
  }, token);
  if (!created.ok || typeof created.data !== 'string' || !UUID.test(created.data)) {
    return back(request, 'invite-error');
  }
  // A recipient must still verify their email and AAL2 in the database before joining the tenant.
  // Use the fixed production origin: never trust Host / X-Forwarded-Host for redirect_to.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chatbox-cyan-five.vercel.app';
  const callback = appUrl + '/auth/finish?flow=invite&invite=' + created.data;
  const sent = await authApi('otp?redirect_to=' + encodeURIComponent(callback), {
    email,
    create_user: true,
  }).catch(() => ({ ok: false }));
  return back(request, sent.ok ? 'invite-sent' : 'invite-delivery-failed');
}
