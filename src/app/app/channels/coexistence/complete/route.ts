import { NextRequest, NextResponse } from 'next/server';
import { accessToken, getIdentity, isPlatformAdmin, isSameOrigin, tokenAal } from '@/lib/auth';
import { myMemberships, tenantApi } from '@/lib/tenant-api';
import { saveChannelToken } from '@/lib/meta-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const ID = /^\d{5,30}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v24.0';
function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}
type GraphPhone = { id: string; display_phone_number: string; verified_name?: string };
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail('Origem não autorizada.', 403);
  const identity = await getIdentity();
  const jwt = await accessToken();
  if (!identity?.email_confirmed_at || !jwt || tokenAal(jwt) !== 'aal2' || await isPlatformAdmin(identity.id, jwt)) {
    return fail('Confirme seu login e o segundo fator para autorizar o WhatsApp.', 403);
  }
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret || !process.env.META_EMBEDDED_SIGNUP_CONFIG_ID ||
    !process.env.VIANTE_INGEST_SECRET || !process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return fail('A aplicação Meta ainda não foi configurada no Viante.', 503);
  }
  let data: Record<string, unknown>;
  try { data = await request.json(); } catch { return fail('Dados inválidos.', 400); }
  const orgId = data.organization_id;
  const unitId = data.unit_id;
  const code = data.code;
  const wabaId = data.waba_id;
  const phoneId = data.phone_number_id;
  if (typeof orgId !== 'string' || !UUID.test(orgId) ||
    typeof unitId !== 'string' || !UUID.test(unitId) ||
    typeof code !== 'string' || code.length < 8 || code.length > 1500 ||
    typeof wabaId !== 'string' || !ID.test(wabaId) ||
    typeof phoneId !== 'string' || (phoneId !== '' && !ID.test(phoneId))) {
    return fail('A Meta não enviou uma autorização completa. Tente iniciar a conexão novamente.', 400);
  }
  const memberships = await myMemberships(jwt);
  const allowed = memberships.some(m => m.organization_id === orgId &&
    (m.role === 'owner' || m.role === 'admin') && m.status === 'active');
  if (!allowed) return fail('Você não possui autorização para conectar esta empresa.', 403);
  // Verify unit ownership through RLS as an extra defense, and again in the DB registration RPC.
  const unit = await tenantApi('viante_units?select=id&organization_id=eq.' + orgId + '&id=eq.' + unitId + '&limit=1', 'GET', undefined, jwt);
  if (!unit.ok || !Array.isArray(unit.data) || unit.data.length !== 1) {
    return fail('Unidade inválida para esta empresa.', 403);
  }

  try {
    const endpoint = 'https://graph.facebook.com/' + GRAPH_VERSION;
    // OAuth code is single-use. Never log the code, token, or upstream payload.
    const exchangeUrl = new URL(endpoint + '/oauth/access_token');
    exchangeUrl.searchParams.set('client_id', appId);
    exchangeUrl.searchParams.set('client_secret', appSecret);
    exchangeUrl.searchParams.set('code', code);
    const tokenResult = await fetch(exchangeUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    if (!tokenResult.ok) return fail('O código de autorização da Meta expirou ou não foi aceito.', 400);
    const tokenData = await tokenResult.json() as { access_token?: string };
    const access = tokenData.access_token;
    if (typeof access !== 'string' || access.length < 24) {
      return fail('Não foi possível confirmar a autorização da Meta.', 400);
    }

    const phoneResult = await fetch(endpoint + '/' + wabaId +
      '/phone_numbers?fields=id,display_phone_number,verified_name&limit=100', {
      headers: { Authorization: 'Bearer ' + access },
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    if (!phoneResult.ok) return fail('O aplicativo Meta não autorizou o acesso aos números dessa empresa.', 403);
    const available = (await phoneResult.json() as { data?: GraphPhone[] }).data ?? [];
    const selected = phoneId
      ? available.find(p => p.id === phoneId)
      : available.length === 1 ? available[0] : undefined;
    if (!selected?.id || !ID.test(selected.id) || !selected.display_phone_number) {
      return fail('Não foi possível identificar um único número autorizado. Confira a configuração do cadastro integrado e tente novamente.', 409);
    }

    const subscribe = await fetch(endpoint + '/' + wabaId + '/subscribed_apps', {
      method: 'POST', headers: { Authorization: 'Bearer ' + access }, cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    if (!subscribe.ok) return fail('A Meta não autorizou os webhooks dessa conta. Verifique a inscrição e as permissões do aplicativo.', 422);

    const stored = await tenantApi('rpc/viante_owner_register_whatsapp_channel', 'POST', {
      p_org: orgId, p_unit: unitId, p_waba_id: wabaId,
      p_phone_id: selected.id, p_display: selected.display_phone_number,
      p_verified: selected.verified_name ?? null,
    }, jwt);
    if (!stored.ok) return fail('O número já está vinculado a outra unidade ou sua permissão expirou.', 409);

    // Preserve the authorization for this unit only, encrypted at rest using
    // a Vercel-only AES-256-GCM key. Without a saved token, inbound can work
    // but automatic outbound messages MUST remain disabled.
    const tokenSaved = await saveChannelToken(selected.id, access);
    if (!tokenSaved) {
      await tenantApi('rpc/viante_owner_disable_whatsapp_channel', 'POST',
        { p_org: orgId, p_phone_id: selected.id }, jwt);
      return fail('Falha ao proteger a credencial da Meta. O número não será ativado.', 503);
    }
    return NextResponse.json({
      ok: true, phone_number: selected.display_phone_number,
      inbound_ready: true, history_import_ready: false, auto_reply_enabled: false,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return fail('A conexão com a Meta falhou. Tente novamente.', 503);
  }
}
