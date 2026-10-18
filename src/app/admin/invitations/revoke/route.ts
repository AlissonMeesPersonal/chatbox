import { NextRequest, NextResponse } from 'next/server';
import { accessToken, getIdentity, isPlatformAdmin, isSameOrigin, tokenAal } from '@/lib/auth';
import { tenantApi } from '@/lib/tenant-api';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  const user = await getIdentity();
  const token = await accessToken();
  if (!user?.email_confirmed_at || !token || tokenAal(token) !== 'aal2' || !(await isPlatformAdmin(user.id,token))) {
    return new NextResponse('Não autorizado', { status: 403 });
  }
  const body = await request.formData();
  const invitationId = String(body.get('invitation_id') ?? '');
  if (!UUID.test(invitationId)) return new NextResponse('Convite inválido', { status: 400 });
  const res = await tenantApi('rpc/viante_ceo_revoke_invite', 'POST', { p_invitation_id: invitationId }, token);
  return NextResponse.redirect(new URL('/admin?status=' + (res.ok && res.data === true ? 'invite-revoked' : 'invite-error'), request.url), 303);
}
