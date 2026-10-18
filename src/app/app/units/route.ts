import { NextRequest, NextResponse } from 'next/server';
import { accessToken, getIdentity, isSameOrigin, tokenAal } from '@/lib/auth';
import { tenantApi } from '@/lib/tenant-api';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  if (!UUID.test(org) || name.length < 2 || name.length > 160) return new NextResponse('Dados inválidos', { status: 400 });
  // The database RPC revalidates current active owner/admin membership and AAL2.
  const response = await tenantApi('rpc/viante_owner_create_unit', 'POST', {
    p_organization_id: org, p_name: name,
  }, token);
  return NextResponse.redirect(new URL('/app?org=' + org + '&status=' + (response.ok ? 'unit-created' : 'unit-error'), request.url), 303);
}
