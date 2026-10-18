import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_DEMO = 'https://chatbox-cyan-five.vercel.app/demo/chat';

export async function GET(req: NextRequest) {
  // The earlier phone-based QR was a wa.me deep link, NOT an account pairing QR.
  // Permanently disable this misleading option. Existing WhatsApp Business numbers
  // must be connected through official Meta Embedded Signup.
  if (req.nextUrl.searchParams.has('phone')) {
    return new NextResponse(
      'O QR de número antigo foi desativado. Ele não vinculava contas. Acesse /app/channels para iniciar a autorização oficial da Meta.',
      { status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  const serviceUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=280x280&format=png&ecc=M&margin=12&data='
    + encodeURIComponent(PUBLIC_DEMO);

  try {
    const upstream = await fetch(serviceUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok || !(upstream.headers.get('content-type') ?? '').startsWith('image/png')) {
      return new NextResponse('Gerador QR indisponível', { status: 503 });
    }
    const buffer = await upstream.arrayBuffer();
    if (buffer.byteLength > 120000) return new NextResponse('Imagem muito grande', { status: 503 });
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="viante-demo-qr.png"',
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse('Gerador QR temporariamente indisponível', { status: 503 });
  }
}
