'use client';

import { useEffect, useState } from 'react';
export default function AuthFinish() {
  const [message, setMessage] = useState('Validando o link de autenticação...');
  useEffect(() => {
    let cancelled = false;
    async function finish() {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      // Erase tokens from browser history as early as possible.
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      const access_token = hash.get('access_token');
      const refresh_token = hash.get('refresh_token');
      const type = hash.get('type');
      if (!access_token || !refresh_token) {
        if (!cancelled) setMessage('Link inválido ou expirado. Solicite um novo e-mail.');
        return;
      }
      try {
        const res = await fetch('/auth/session', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ access_token, refresh_token }),
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('invalid');
        window.location.replace(type === 'recovery' || new URLSearchParams(window.location.search).get('flow') === 'recovery' ? '/reset-password' : '/admin');
      } catch {
        if (!cancelled) setMessage('Não foi possível validar a sessão. Volte à tela de login.');
      }
    }
    void finish();
    return () => { cancelled = true; };
  }, []);
  return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
    <div role="status"><h1>Viante</h1><p>{message}</p><a href="/login">Voltar ao login</a></div>
  </main>;
}
