import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_DEMO = 'https://chatbox-cyan-five.vercel.app/demo/chat';
const TEST_TEXT = 'Olá! Quero testar o atendimento do Viante.';

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('phone');
  if (raw !== null && !/^[1-9][0-9]{9,14}$/.test(raw)) {
    return new NextResponse('Informe o número com DDI e DDD, somente dígitos.', { status: 400 });
  }
  // This QR is NOT a WhatsApp Web pairing QR. It opens the visual demo
  // or a normal wa.me conversation. Never transfer credentials or tokens here.
  const destination = raw
    ? 'https://wa.me/' + raw + '?text=' + encodeURIComponent(TEST_TEXT)
    : PUBLIC_DEMO;
  const serviceUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=280x280&format=png&ecc=M&margin=12&data='
    + encodeURIComponent(destination);

  try {
    const upstream = await fetch(serviceUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const ctype = upstream.headers.get('content-type') ?? '';
    if (!upstream.ok || !ctype.startsWith('image/png')) {
      return new NextResponse('Gerador QR indisponível', { status: 503 });
    }
    const payload = await upstream.arrayBuffer();
    if (payload.byteLength > 120000) return new NextResponse('Imagem muito grande', { status: 503 });
    return new NextResponse(payload, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="viante-qr.png"',
        'Cache-Control': raw ? 'private, no-store' : 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse('Gerador QR temporariamente indisponível', { status: 503 });
  }
}
