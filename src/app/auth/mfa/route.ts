import { NextRequest, NextResponse } from 'next/server';
import { accessToken, authApi, getIdentity, isSameOrigin, writeAuthCookies, type AuthTokens } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  const identity = await getIdentity();
  const token = await accessToken();
  if (!identity?.email_confirmed_at || !token) return NextResponse.json({ error: 'Confirme seu e-mail e entre novamente.' }, { status: 401 });
  try {
    const input = await request.json();
    const intent = String(input.intent ?? '');
    if (intent === 'enroll') {
      const result = await authApi('factors', { factor_type: 'totp', friendly_name: 'Viante CEO' }, token);
      if (!result.ok) return NextResponse.json({ error: 'Não foi possível gerar o autenticador.' }, { status: 400 });
      const totp = result.data.totp as { qr_code?: string; secret?: string } | undefined;
      return NextResponse.json({ id: result.data.id, qr: totp?.qr_code, secret: totp?.secret }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const factor = String(input.factorId ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(factor)) return NextResponse.json({ error: 'Autenticador inválido.' }, { status: 400 });
    if (intent === 'verify') {
      const code = String(input.code ?? '');
      if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: 'Digite os seis números do autenticador.' }, { status: 400 });
      const challenge = await authApi('factors/' + factor + '/challenge', {}, token);
      if (!challenge.ok || typeof challenge.data.id !== 'string') return NextResponse.json({ error: 'Não foi possível validar o autenticador.' }, { status: 400 });
      const verified = await authApi('factors/' + factor + '/verify', { challenge_id: challenge.data.id, code }, token);
      if (!verified.ok || typeof verified.data.access_token !== 'string' || typeof verified.data.refresh_token !== 'string') {
        return NextResponse.json({ error: 'Código incorreto ou expirado.' }, { status: 400 });
      }
      await writeAuthCookies(verified.data as AuthTokens);
      return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    }
  } catch {
    return NextResponse.json({ error: 'Falha na autenticação. Tente novamente.' }, { status: 400 });
  }
  return new NextResponse('Ação inválida', { status: 400 });
}
