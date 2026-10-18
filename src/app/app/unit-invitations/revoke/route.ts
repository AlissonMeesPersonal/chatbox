import { NextRequest, NextResponse } from 'next/server';
import { accessToken, getIdentity, isSameOrigin, tokenAal } from '@/lib/auth';
import { tenantApi } from '@/lib/tenant-api';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  const user = await getIdentity();
  const token = await accessToken();
  if (!user?.email_confirmed_at || !token || tokenAal(token) !== 'aal2') return new NextResponse('Não autorizado', { status: 403 });
  const form = await request.formData();
  const org = String(form.get('organization_id') ?? '');
  const invite = String(form.get('invitation_id') ?? '');
  if (!UUID.test(org) || !UUID.test(invite)) return new NextResponse('Convite inválido', { status: 400 });
  const response = await tenantApi('rpc/viante_owner_revoke_unit_invite', 'POST', { p_org: org, p_invite: invite }, token);
  const status = response.ok && response.data === true ? 'unit-invite-revoked' : 'unit-invite-error';
  return NextResponse.redirect(new URL('/app?org=' + org + '&status=' + status, request.url), 303);
}
