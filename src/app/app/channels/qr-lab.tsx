'use client';

import { useState } from 'react';
import { ExternalLink, QrCode, Smartphone, MessageCircle, ShieldAlert } from 'lucide-react';

const DEMO = '/demo/chat';
const formatNumber = (s: string) => s.replace(/[^0-9]/g, '').slice(0, 15);

export function QrLab() {
  const [phone, setPhone] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [generated, setGenerated] = useState('');
  const valid = /^[1-9][0-9]{9,14}$/.test(formatNumber(phone));
  const waUrl = generated ? 'https://wa.me/' + generated + '?text=' +
    encodeURIComponent('Olá! Quero testar o atendimento do Viante.') : null;

  return <section style={{ marginTop: 22, border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: 14, padding: 'clamp(18px, 3vw, 26px)' }}>
    <header style={{ marginBottom: 19 }}>
      <span className="eyebrow">MODO DE TESTE · SEM CONEXÃO COM A META</span>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, marginTop: 8 }}><QrCode size={24}/> Testar com QR Code</h2>
      <p style={{ lineHeight: 1.65, color: 'var(--muted)', marginTop: 9 }}>
        Antes de integrar um número real, você pode visualizar a experiência no celular e abrir uma conversa de teste com seu próprio WhatsApp.
      </p>
    </header>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))', gap: 18 }}>
      <article style={{ padding: 20, border: '1px solid var(--border)', background: 'var(--elevated)', borderRadius: 13 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17 }}><Smartphone size={19}/> 1. Prévia do atendimento</h3>
        <p style={{ color: 'var(--muted)', margin: '11px 0 16px', lineHeight: 1.65 }}>
          Aponte a câmera para o QR e abra a versão interativa no celular. Envie mensagens fictícias para a Vi e veja a perspectiva do atendente.
        </p>
        <div style={{ background: '#fff', borderRadius: 13, padding: 13, width: 'fit-content', margin: '0 auto 16px' }}>
          <img width="220" height="220" src="/api/demo/qr" alt="QR Code para abrir a demonstração do atendimento Viante no celular" style={{ display: 'block', maxWidth: '100%', height: 'auto' }}/>
        </div>
        <a className="button primary" href={DEMO} target="_blank" rel="noopener noreferrer" style={{ width: '100%' }}>Abrir demonstração <ExternalLink size={15}/></a>
      </article>
      <article style={{ padding: 20, border: '1px solid var(--border)', background: 'var(--elevated)', borderRadius: 13 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17 }}><MessageCircle size={19}/> 2. Testar meu número</h3>
        <p style={{ color: 'var(--muted)', margin: '11px 0 16px', lineHeight: 1.65 }}>
          Gere um QR que abre uma conversa comum no WhatsApp do seu número. Isso testa a abertura do chat, mas não conecta suas mensagens à Inbox do Viante.
        </p>
        <label htmlFor="test-phone" style={{ display: 'grid', gap: 8, marginBottom: 12 }}>Número com DDI + DDD (somente dígitos)
          <input id="test-phone" type="tel" inputMode="tel" autoComplete="off"
            value={phone} onChange={e => { setPhone(formatNumber(e.target.value)); setGenerated(''); setAccepted(false); }}
            maxLength={15} placeholder="Ex.: 51999999999 (use 55 antes)" aria-describedby="phone-help"/>
        </label>
        <p id="phone-help" style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Formato brasileiro: 55 + DDD + número. O telefone não será salvo pelo Viante.</p>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>
          <input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} style={{ marginTop: 4 }}/>
          Autorizo enviar este número ao gerador externo de QR Code somente para construir a imagem do link de conversa.
        </label>
        <button type="button" className="button" disabled={!accepted || !valid} onClick={()=>setGenerated(formatNumber(phone))} style={{ width: '100%' }}>Gerar QR de conversa</button>
        {generated && waUrl && <div style={{ marginTop: 17, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#fff', padding: 13, borderRadius: 12 }}>
            <img alt="QR Code para abrir conversa comum no WhatsApp do número informado" src={'/api/demo/qr?phone=' + generated} width={220} height={220} style={{ display: 'block', maxWidth: '100%', height: 'auto' }}/>
          </div>
          <div style={{ marginTop: 12 }}><a href={waUrl} className="button" target="_blank" rel="noopener noreferrer">Abrir conversa no WhatsApp <ExternalLink size={15}/></a></div>
        </div>}
      </article>
    </div>
    <p style={{ marginTop: 18, padding: 14, border: '1px solid var(--border)', borderRadius: 9, color: 'var(--muted)', display: 'flex', alignItems: 'flex-start', gap: 10, lineHeight: 1.6 }}>
      <ShieldAlert size={18}/>
      <span><strong style={{ color: 'var(--text)' }}>Importante:</strong> estes QRs são para prévia e abertura de conversa, não são QRs de pareamento do WhatsApp Web. Para receber mensagens reais no Viante, conecte o número pela integração oficial da Meta. O QR de coexistência oficial, quando disponível para a empresa, faz parte do processo autorizado pela Meta.</span>
    </p>
  </section>;
}
