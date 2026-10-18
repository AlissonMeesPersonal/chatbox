import { NextRequest, NextResponse } from 'next/server';
import { accessToken, getIdentity, isSameOrigin, tokenAal } from '@/lib/auth';
import { tenantApi } from '@/lib/tenant-api';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_ID = /^\d{5,30}$/;
const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v24.0';

function back(request: NextRequest, orgId: string, status: string) {
  return NextResponse.redirect(new URL('/app/channels?org=' + encodeURIComponent(orgId) + '&status=' + status, request.url), 303);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  const identity = await getIdentity();
  const jwt = await accessToken();
  if (!identity?.email_confirmed_at || !jwt || tokenAal(jwt) !== 'aal2') {
    return new NextResponse('Autenticação com MFA obrigatória', { status: 403 });
  }
  // Meta App Secret must be configured server-side before a real connection is allowed.
  if (!process.env.META_APP_SECRET || !process.env.META_WEBHOOK_VERIFY_TOKEN || !process.env.VIANTE_INGEST_SECRET) {
    return back(request, '', 'meta-not-ready');
  }
  const form = await request.formData();
  const orgId = String(form.get('organization_id') ?? '');
  const unitId = String(form.get('unit_id') ?? '');
  const wabaId = String(form.get('waba_id') ?? '').trim();
  const phoneId = String(form.get('phone_number_id') ?? '').trim();
  const apiToken = String(form.get('access_token') ?? '').trim();
  if (!UUID.test(orgId) || !UUID.test(unitId) || !NUMERIC_ID.test(wabaId)
    || !NUMERIC_ID.test(phoneId) || apiToken.length < 40 || apiToken.length > 4096) {
    return back(request, orgId, 'invalid');
  }

  // Meta credentials never reach the database or logs. Validate the WABA
  // directly against Meta before registering its phone number locally.
  try {
    const r = await fetch('https://graph.facebook.com/' + GRAPH_VERSION + '/' + wabaId
      + '/phone_numbers?fields=id,display_phone_number,verified_name&limit=100', {
      headers: { Authorization: 'Bearer ' + apiToken },
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return back(request, orgId, 'meta-rejected');
    const data = await r.json() as { data?: Array<{ id?: string; display_phone_number?: string; verified_name?: string }> };
    const number = data.data?.find(p => p.id === phoneId);
    if (!number?.display_phone_number) return back(request, orgId, 'meta-phone-mismatch');

    // Validate ownership again inside Postgres. No cross-tenant phone transfer.
    const saved = await tenantApi('rpc/viante_owner_register_whatsapp_channel', 'POST', {
      p_org: orgId, p_unit: unitId, p_waba_id: wabaId, p_phone_id: phoneId,
      p_display: number.display_phone_number,
      p_verified: number.verified_name ?? null,
    }, jwt);
    if (!saved.ok) return back(request, orgId, 'already-connected');

    // Meta webhook subscription is required for inbound messages.
    const subscribed = await fetch('https://graph.facebook.com/' + GRAPH_VERSION + '/' + wabaId + '/subscribed_apps', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiToken },
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    if (!subscribed.ok) {
      // Not marked as operational until the app can subscribe. Mark it disabled
      // below using an owner-only RPC; retrying the same details will re-enable.
      await tenantApi('rpc/viante_owner_disable_whatsapp_channel', 'POST', {
        p_org: orgId, p_phone_id: phoneId,
      }, jwt);
      return back(request, orgId, 'meta-subscribe-error');
    }
    return back(request, orgId, 'connected');
  } catch {
    return back(request, orgId, 'meta-unavailable');
  }
}
