import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_BODY = 262144;

function secureEqual(a: string, b: string) {
  const aa = Buffer.from(a, 'utf8'), bb = Buffer.from(b, 'utf8');
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

/** Meta verifies the callback by sending hub.challenge with our private token. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const token = process.env.META_WEBHOOK_VERIFY_TOKEN;
  const challenge = q.get('hub.challenge');
  if (!token || q.get('hub.mode') !== 'subscribe'
      || !q.get('hub.verify_token') || !secureEqual(q.get('hub.verify_token')!, token)
      || challenge === null || challenge.length > 256) {
    return new NextResponse('Invalid webhook verification', { status: 403 });
  }
  return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } });
}

type WaMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
};
type WaValue = {
  metadata?: { phone_number_id?: string };
  contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
  messages?: WaMessage[];
};

export async function POST(request: NextRequest) {
  const appSecret = process.env.META_APP_SECRET;
  const ingestSecret = process.env.VIANTE_INGEST_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Fail closed: never acknowledge real messaging if secrets are not configured.
  if (!appSecret || !ingestSecret || !supabaseUrl || !publishableKey) {
    return new NextResponse('Webhook not configured', { status: 503 });
  }
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) {
    return new NextResponse('Payload too large', { status: 413 });
  }
  const raw = Buffer.from(await request.arrayBuffer());
  if (raw.length > MAX_BODY) return new NextResponse('Payload too large', { status: 413 });
  const signature = request.headers.get('x-hub-signature-256') ?? '';
  const expected = 'sha256=' + createHmac('sha256', appSecret).update(raw).digest('hex');
  if (!secureEqual(signature, expected)) {
    return new NextResponse('Webhook signature rejected', { status: 401 });
  }

  try {
    const payload = JSON.parse(raw.toString('utf8')) as {
      object?: string;
      entry?: Array<{ changes?: Array<{ field?: string; value?: WaValue }> }>;
    };
    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ received: true }, { headers: { 'Cache-Control': 'no-store' } });
    }
    // No externally-provided org/unit is trusted. DB looks up destination by Meta phone_number_id.
    for (const entry of (payload.entry ?? []).slice(0, 50)) {
      for (const change of (entry.changes ?? []).slice(0, 50)) {
        if (change.field !== 'messages') continue;
        const value = change.value;
        const phone = value?.metadata?.phone_number_id;
        if (!phone || !/^\d{5,30}$/.test(phone)) continue;
        for (const message of (value?.messages ?? []).slice(0, 50)) {
          if (!message.id || !message.from || message.id.length > 255
            || !/^\d{5,30}$/.test(message.from)) continue;
          const name = value?.contacts?.find(c => c.wa_id === message.from)?.profile?.name ?? '';
          const body = message.text?.body ?? message.button?.text
            ?? message.interactive?.button_reply?.title
            ?? message.interactive?.list_reply?.title ?? null;
          const ts = Number(message.timestamp);
          const reqBody = {
            p_ingest_secret: ingestSecret,
            p_phone_id: phone,
            p_message_id: message.id,
            p_sender: message.from,
            p_name: name.slice(0, 180),
            p_type: (message.type ?? 'unknown').slice(0, 50),
            p_text: typeof body === 'string' ? body.slice(0, 4000) : null,
            p_timestamp: Number.isSafeInteger(ts) ? ts : null,
          };
          const response = await fetch(supabaseUrl + '/rest/v1/rpc/viante_ingest_whatsapp', {
            method: 'POST',
            headers: {
              apikey: publishableKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(reqBody),
            cache: 'no-store',
          });
          if (!response.ok) {
            // Non-2xx allows Meta to retry transient errors; DB deduplicates message IDs.
            return new NextResponse('Temporary ingestion error', { status: 503 });
          }

          // First-number pilot only: a SERVER-ONLY access token, bound to exactly
          // one Meta phone ID, can send after verified inbound messages.
          // No tenant can trigger sending from another WABA/phone number.
          const outboundToken = process.env.META_TEST_WHATSAPP_TOKEN;
          const pilotPhone = process.env.META_TEST_PHONE_NUMBER_ID;
          if (!outboundToken || !pilotPhone || pilotPhone !== phone ||
              message.type !== 'text' || typeof body !== 'string') continue;

          const rpc = async (name: string, data: Record<string, unknown>) => {
            const result = await fetch(supabaseUrl + '/rest/v1/rpc/' + name, {
              method: 'POST',
              headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
              cache: 'no-store',
            });
            if (!result.ok) throw new Error('Internal responder state unavailable');
            return await result.json() as unknown;
          };
          try {
            await rpc('viante_vi_prepare', {
              p_secret: ingestSecret,
              p_phone: phone,
              p_inbound_meta_id: message.id,
            });
            const pending = await rpc('viante_vi_claim', {
              p_secret: ingestSecret,
              p_phone: phone,
              p_meta_id: message.id,
            }) as Array<{ outbox_id: string; recipient: string; message_body: string }>;
            if (!Array.isArray(pending) || pending.length === 0) continue;
            const job = pending[0];
            if (typeof job?.recipient !== 'string' || !/^\d{5,30}$/.test(job.recipient) ||
                typeof job?.message_body !== 'string' || job.message_body.length > 3500 ||
                !/^[0-9a-f-]{36}$/i.test(job.outbox_id)) {
              return new NextResponse('Invalid outbound task', { status: 503 });
            }
            let sentId = '';
            let success = false;
            try {
              const version = process.env.META_GRAPH_API_VERSION || 'v24.0';
              const send = await fetch('https://graph.facebook.com/' + version + '/' + phone + '/messages', {
                method: 'POST',
                headers: {
                  Authorization: 'Bearer ' + outboundToken,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  recipient_type: 'individual',
                  to: job.recipient,
                  type: 'text',
                  text: { preview_url: false, body: job.message_body },
                  context: { message_id: message.id },
                }),
                cache: 'no-store',
                signal: AbortSignal.timeout(13000),
              });
              if (send.ok) {
                const result = await send.json() as { messages?: Array<{ id?: string }> };
                sentId = result.messages?.[0]?.id ?? '';
                success = Boolean(sentId);
              }
            } catch {
              // Keep outbound task pending for Meta's authenticated webhook retry.
            }
            await rpc('viante_vi_ack', {
              p_secret: ingestSecret,
              p_outbox_id: job.outbox_id,
              p_success: success,
              p_meta_sent_id: sentId,
            });
            if (!success) {
              // Do not falsely acknowledge a WhatsApp reply as delivered.
              return new NextResponse('Meta outbound reply temporarily unavailable', { status: 503 });
            }
          } catch {
            return new NextResponse('Vi responder unavailable; retry later', { status: 503 });
          }
        }
      }
    }
    return NextResponse.json({ received: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return new NextResponse('Invalid webhook payload', { status: 400 });
  }
}
