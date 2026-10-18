import Link from 'next/link';
import { ExternalLink, QrCode, Smartphone, ShieldAlert } from 'lucide-react';

/**
 * Purely visual demo QR: never accepts a phone number, asks for linked-device
 * access, or pretends to connect WhatsApp. Actual connection uses Meta signup.
 */
export function QrLab() {
  return <section style={{ marginTop: 22, border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: 14, padding: 'clamp(18px, 3vw, 26px)' }}>
    <header style={{ marginBottom: 17 }}>
      <span className="eyebrow">DEMONSTRAÇÃO VISUAL · SEM ACESSO AO WHATSAPP</span>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 19, marginTop: 8 }}><QrCode size={21}/> Testar a interface pelo celular</h2>
      <p style={{ color: 'var(--muted)', lineHeight: 1.65, marginTop: 10 }}>
        Este QR abre apenas uma simulação do Viante. Ele não vincula seu número, não importa conversas e não envia mensagens de verdade.
      </p>
    </header>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
      <div style={{ padding: 12, background: '#fff', borderRadius: 11, maxWidth: 190 }}>
        <img src="/api/demo/qr" width="170" height="170" alt="QR de demonstração; abre uma página simulada do Viante" style={{ display: 'block', maxWidth: '100%', height: 'auto' }}/>
      </div>
      <div style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
        <p style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Smartphone size={18}/> Prévia das mensagens entre cliente e Vi</p>
        <Link className="button" href="/demo/chat" target="_blank" rel="noopener noreferrer">Abrir simulação <ExternalLink size={15}/></Link>
        <p style={{ display: 'flex', gap: 8, color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 }}>
          <ShieldAlert size={17}/> Para conectar o número de verdade, use a autorização da Meta acima, não este código.
        </p>
      </div>
    </div>
  </section>;
}
