import { NextRequest, NextResponse } from 'next/server';
import { authApi, isSameOrigin, writeAuthCookies } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Origem não autorizada', { status: 403 });
  try {
    const body = await request.json();
    const token = typeof body.access_token === 'string' ? body.access_token : '';
    const refresh = typeof body.refresh_token === 'string' ? body.refresh_token : '';
    if (!token || !refresh || token.length > 8192 || refresh.length > 8192) return new NextResponse('Sessão inválida', { status: 400 });
    const user = await authApi('user', undefined, token, 'GET');
    if (!user.ok || typeof user.data.id !== 'string') return new NextResponse('Sessão inválida', { status: 401 });
    await writeAuthCookies({ access_token: token, refresh_token: refresh, expires_in: 3600 });
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return new NextResponse('Não foi possível validar o link', { status: 400 });
  }
}
