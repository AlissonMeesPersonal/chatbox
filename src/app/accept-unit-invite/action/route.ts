import { NextRequest, NextResponse } from 'next/server';
import { accessToken, getIdentity, isSameOrigin, tokenAal } from '@/lib/auth';
import { tenantApi } from '@/lib/tenant-api';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  const user = await getIdentity();
  const token = await accessToken();
  if (!user?.email_confirmed_at || !token || tokenAal(token) !== 'aal2') {
    return new NextResponse('Segundo fator obrigatório', { status: 403 });
  }
  const body = await request.formData();
  const invitation = String(body.get('invitation_id') ?? '');
  if (!UUID.test(invitation)) return new NextResponse('Convite inválido', { status: 400 });
  const response = await tenantApi('rpc/viante_accept_unit_invite', 'POST', { p_invitation_id: invitation }, token);
  return NextResponse.redirect(new URL(
    response.ok && typeof response.data === 'string'
      ? '/reset-password?status=welcome'
      : '/accept-unit-invite?invite=' + invitation + '&status=error',
    request.url,
  ), 303);
}
