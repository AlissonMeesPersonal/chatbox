'use client';

import { useState } from 'react';

type Enrollment = { id: string; qr?: string; secret?: string };
export function MfaSetup({ existingFactorId }: { existingFactorId: string | null }) {
  const [enrolled, setEnrolled] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const factorId = existingFactorId || enrolled?.id;

  async function submit(body: Record<string, string>) {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/auth/mfa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível continuar.');
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível continuar.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function enroll() {
    const data = await submit({ intent: 'enroll' });
    if (data?.id) setEnrolled({ id: data.id, qr: data.qr, secret: data.secret });
  }

  async function verify() {
    if (!factorId) return;
    const result = await submit({ intent: 'verify', factorId, code });
    if (!result?.ok) return;
    setLoading(true);
    try {
      await fetch('/auth/claim', { method: 'POST', headers: { accept: 'application/json' }, credentials: 'same-origin' });
    } finally {
      window.location.replace('/admin');
    }
  }

  const qrSrc = enrolled?.qr ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(enrolled.qr) : null;
  return <section style={{ display: 'grid', gap: 18 }}>
    {!factorId && <button className="button primary" onClick={enroll} disabled={loading}>Configurar autenticador</button>}
    {enrolled && <div style={{ display: 'grid', gap: 10 }}>
      <p>Escaneie o QR Code usando Google Authenticator, Microsoft Authenticator ou outro aplicativo TOTP.</p>
      {qrSrc && <img src={qrSrc} width={210} height={210} alt="QR Code de configuração TOTP" style={{ background: 'white', padding: 12, borderRadius: 12 }}/>}
      {enrolled.secret && <p style={{ fontSize: 12, overflowWrap: 'anywhere' }}>Código manual: <code>{enrolled.secret}</code></p>}
    </div>}
    {factorId && <form onSubmit={e => { e.preventDefault(); void verify(); }} style={{ display: 'grid', gap: 12 }}>
      <label htmlFor="totp">Código de seis dígitos</label>
      <input id="totp" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" required maxLength={6}/>
      <button className="button primary" disabled={loading || code.length !== 6}>Verificar e entrar</button>
    </form>}
    {error && <p role="alert" style={{ color: '#ff9999' }}>{error}</p>}
    <form action="/auth/action" method="post"><input type="hidden" name="intent" value="logout"/><button className="button" type="submit">Sair</button></form>
  </section>;
}
