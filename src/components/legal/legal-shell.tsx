import Link from 'next/link';
import type { ReactNode } from 'react';

export function LegalShell({ title, eyebrow, intro, children }: {
  title: string;
  eyebrow: string;
  intro: string;
  children: ReactNode;
}) {
  return <main style={{
    background: 'var(--canvas)',
    minHeight: '100dvh', color: 'var(--text)',
    padding: 'clamp(22px,5vw,72px) 18px 44px',
  }}>
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 15, marginBottom: 56 }}>
        <Link href="/login" className="wordmark" aria-label="Voltar ao Viante"><span className="brand-symbol">v</span>viante<span className="wordmark-dot">.</span></Link>
        <Link className="button" href="/login">Acessar plataforma</Link>
      </header>
      <div style={{ maxWidth: 750 }}>
        <span className="eyebrow">{eyebrow}</span>
        <h1 style={{ fontSize: 'clamp(32px,5vw,50px)', lineHeight: 1.18, margin: '13px 0 20px', letterSpacing: '-1.1px' }}>{title}</h1>
        <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--muted)' }}>{intro}</p>
        <p style={{ marginTop: 19, color: 'var(--muted)', fontSize: 12 }}>Última atualização: 18 de outubro de 2026.</p>
      </div>
      <div style={{ background: 'var(--panel)', borderRadius: 19, border: '1px solid var(--border)', marginTop: 36, padding: 'clamp(22px,5vw,45px)', display: 'grid', gap: 30, lineHeight: 1.85 }}>
        {children}
      </div>
      <footer style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 15, marginTop: 40, paddingTop: 26, borderTop: '1px solid var(--border)', color: 'var(--muted)', fontSize: 13 }}>
        <span>© 2026 Viante · Plataforma de atendimento empresarial</span>
        <nav aria-label="Documentos legais" style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Link href="/politica-de-privacidade">Privacidade</Link>
          <Link href="/termos-de-uso">Termos de uso</Link>
          <Link href="/exclusao-de-dados">Exclusão de dados</Link>
        </nav>
      </footer>
    </div>
  </main>;
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section style={{ display: 'grid', gap: 11 }}>
    <h2 style={{ fontSize: 19, lineHeight: 1.4 }}>{title}</h2>
    <div style={{ display: 'grid', gap: 13, color: 'var(--muted)', fontSize: 14, lineHeight: 1.85 }}>{children}</div>
  </section>;
}
