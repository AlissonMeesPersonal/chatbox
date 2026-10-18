import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

type Protected = { ciphertext: string; iv: string; tag: string };

function encryptionKey(): Buffer {
  const value = process.env.VIANTE_TOKEN_ENCRYPTION_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error('Private channel token encryption key not configured');
  }
  return Buffer.from(value, 'hex');
}

function publicDbConfig() {
  const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serverSecret = process.env.VIANTE_INGEST_SECRET;
  if (!endpoint || !key || !serverSecret) throw new Error('Missing server-only Viante channel configuration');
  return { endpoint, key, serverSecret };
}

export function encryptChannelToken(token: string): Protected {
  if (!token || token.length < 20 || token.length > 4096) throw new Error('Invalid provider token');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return {
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

function decryptChannelToken(box: Protected): string {
  const iv = Buffer.from(box.iv, 'base64');
  const tag = Buffer.from(box.tag, 'base64');
  const ciphertext = Buffer.from(box.ciphertext, 'base64');
  if (iv.length !== 12 || tag.length !== 16 || ciphertext.length > 4096) throw new Error('Invalid token box');
  const cipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(ciphertext), cipher.final()]).toString('utf8');
}

async function privateRpc(endpoint: string, args: Record<string, unknown>): Promise<unknown> {
  const config = publicDbConfig();
  const response = await fetch(config.endpoint + '/rest/v1/rpc/' + endpoint, {
    method: 'POST',
    headers: { apikey: config.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...args, p_secret: config.serverSecret }),
    cache: 'no-store',
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error('Private token RPC unavailable');
  return await response.json() as unknown;
}

export async function saveChannelToken(phoneId: string, token: string): Promise<boolean> {
  if (!/^\d{5,30}$/.test(phoneId)) return false;
  const box = encryptChannelToken(token);
  return (await privateRpc('viante_vi_store_token', {
    p_phone: phoneId,
    p_ciphertext: box.ciphertext,
    p_iv: box.iv,
    p_tag: box.tag,
  })) === true;
}

export async function loadChannelToken(phoneId: string): Promise<string | null> {
  if (!/^\d{5,30}$/.test(phoneId)) return null;
  const rows = await privateRpc('viante_vi_get_token', { p_phone: phoneId });
  if (!Array.isArray(rows) || !rows.length) return null;
  const box = rows[0] as Protected;
  if (!box?.ciphertext || !box?.iv || !box?.tag) return null;
  return decryptChannelToken(box);
}
