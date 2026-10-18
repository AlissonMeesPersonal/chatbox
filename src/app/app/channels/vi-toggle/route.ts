import { NextRequest, NextResponse } from 'next/server';
import { accessToken, getIdentity, isSameOrigin, tokenAal } from '@/lib/auth';
import { tenantApi } from '@/lib/tenant-api';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  const identity = await getIdentity();
  const jwt = await accessToken();
  if (!identity?.email_confirmed_at || !jwt || tokenAal(jwt) !== 'aal2') {
    return new NextResponse('Autenticação com MFA necessária', { status: 403 });
  }

  const form = await request.formData();
  const orgId = String(form.get('organization_id') ?? '');
  const channelId = String(form.get('channel_id') ?? '');
  const enable = String(form.get('enabled') ?? '') === 'true';
  if (!UUID.test(orgId) || !UUID.test(channelId)) return new NextResponse('Canal inválido', { status: 400 });

  // Do not allow enabling before a unique company channel was verified and
  // server-only OAuth token saved. Optional single-number pilot requires exact match.
  const channel = await tenantApi(
    'viante_whatsapp_channels?select=phone_number_id,vi_token_ready,status'
      + '&organization_id=eq.' + orgId + '&id=eq.' + channelId + '&limit=1',
    'GET', undefined, jwt,
  );
  const c = channel.ok && Array.isArray(channel.data) ? channel.data[0] : null;
  if (!c || c.status !== 'connected') return new NextResponse('Número não conectado', { status: 403 });

  const configuredPilot = Boolean(process.env.META_TEST_WHATSAPP_TOKEN
    && process.env.META_TEST_PHONE_NUMBER_ID
    && process.env.META_TEST_PHONE_NUMBER_ID === c.phone_number_id);
  if (enable && !c.vi_token_ready && !configuredPilot) {
    return NextResponse.redirect(new URL('/app/channels?org=' + orgId + '&status=vi-token-missing', request.url), 303);
  }
  const result = await tenantApi('rpc/viante_owner_set_vi', 'POST', {
    p_org: orgId, p_channel: channelId, p_enabled: enable,
  }, jwt);

  return NextResponse.redirect(
    new URL('/app/channels?org=' + orgId + '&status=' +
      (result.ok && result.data === true ? enable ? 'vi-on' : 'vi-off' : 'vi-error'), request.url),
    303,
  );
}
