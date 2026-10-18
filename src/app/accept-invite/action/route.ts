import { NextRequest, NextResponse } from 'next/server';
import { accessToken, getIdentity, isSameOrigin, tokenAal } from '@/lib/auth';
import { tenantApi } from '@/lib/tenant-api';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  const user = await getIdentity();
  const token = await accessToken();
  if (!user?.email_confirmed_at || !token || tokenAal(token) !== 'aal2') {
    return new NextResponse('Autenticação multifator necessária', { status: 403 });
  }
  const form = await request.formData();
  const id = String(form.get('invitation_id') ?? '');
  if (!UUID.test(id)) return new NextResponse('Convite inválido', { status: 400 });
  const result = await tenantApi('rpc/viante_accept_invite', 'POST', { p_invitation_id: id }, token);
  if (!result.ok || typeof result.data !== 'string' || !UUID.test(result.data)) {
    return NextResponse.redirect(new URL('/accept-invite?invite=' + id + '&status=error', request.url), 303);
  }
  return NextResponse.redirect(new URL('/reset-password?status=welcome', request.url), 303);
}
