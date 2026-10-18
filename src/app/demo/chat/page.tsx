'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCheck, Send, RotateCcw, Smartphone, MessageCircle, Bot, ShieldCheck } from 'lucide-react';

type Entry = { id: number; sender: 'client' | 'bot'; text: string; time: string };
const INTRO: Entry[] = [
  { id: 1, sender: 'client', text: 'Olá, tudo bem?', time: '10:30' },
  { id: 2, sender: 'bot', text: 'Olá! Sou a Vi, assistente virtual. Como posso ajudar hoje?\n\n1 · Saber sobre planos\n2 · Cancelamento\n3 · Falar com a unidade', time: '10:30' },
];
const options = [
  { label: '1 · Saber planos', text: '1' },
  { label: '2 · Cancelamento', text: '2' },
  { label: '3 · Falar com unidade', text: '3' },
];
const nextMessage = (text: string) => {
  const value = text.trim().toLowerCase();
  if (/^(1|planos?|preços?|precos?)$/.test(value)) return 'Claro! Posso apresentar planos e valores. Na plataforma real, essa resposta será configurada pela empresa. Para falar com a unidade, digite 3.';
  if (/^(2|cancelar|cancelamento)$/.test(value)) return 'Entendi. Uma equipe responsável poderá continuar o atendimento de cancelamento quando o fluxo real estiver conectado. Digite 3 para falar com a unidade.';
  if (/^(3|atendente|humano|unidade|falar com unidade)$/.test(value)) return 'Ótimo! Qual unidade você deseja?\n\n1 · Unidade Santa Cruz\n2 · Unidade Vera Cruz\n3 · Voltar ao menu';
  if (/^santa cruz|^unidade santa cruz/.test(value)) return 'Selecionei a unidade Santa Cruz! Um atendente dessa unidade poderá assumir a conversa no Viante quando houver WhatsApp conectado.';
  if (value === 'menu' || value === 'voltar') return INTRO[1].text;
  return 'Recebi sua mensagem de teste! Esta é uma simulação local da experiência Viante. Na conexão oficial com a Meta, as mensagens reais aparecerão na Inbox.';
};

export default function DemoChatPage() {
  const [messages, setMessages] = useState<Entry[]>(INTRO);
  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState<'client' | 'agent'>('client');
  const last = useMemo(() => messages.at(-1), [messages]);

  function send(value: string) {
    const text = value.trim().slice(0, 500);
    if (!text) return;
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setMessages(current => [...current,
      { id: current.length + 1, sender: 'client', text, time },
      { id: current.length + 2, sender: 'bot', text: nextMessage(text), time },
    ]);
    setDraft('');
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    send(draft);
  }
  const bubble = (m: Entry) => (
    <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'client' ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '86%', padding: '11px 13px', whiteSpace: 'pre-line',
        background: m.sender === 'client' ? '#d9fdd3' : 'white', color: '#162822',
        borderRadius: m.sender === 'client' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        lineHeight: 1.55, fontSize: 13, boxShadow: '0 1px 3px #0001',
      }}>
        {m.text}
        <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, alignItems: 'center', color: '#687e72', marginTop: 3, fontSize: 10 }}>{m.time}{m.sender === 'client' && <CheckCheck size={13}/>}</span>
      </div>
    </div>
  );
  return <main style={{ maxWidth: 1120, padding: 'clamp(16px, 4vw, 42px)', margin: '0 auto', minHeight: '100dvh' }}>
    <Link href="/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}><ArrowLeft size={16}/> Voltar à demonstração</Link>
    <header style={{ margin: '23px 0 22px' }}>
      <span className="eyebrow">VIANTE LAB · DEMONSTRAÇÃO</span>
      <h1 style={{ fontSize: 'clamp(23px, 4vw, 34px)', marginTop: 8 }}>Experimente uma conversa</h1>
      <p style={{ color: 'var(--muted)', marginTop: 10, lineHeight: 1.6 }}>Teste o atendimento automatizado e visualize como a conversa ficaria para a equipe. Nenhuma mensagem vai para o WhatsApp real.</p>
    </header>
    <nav style={{ display: 'flex', gap: 10, marginBottom: 20 }} aria-label="Perspectiva da demonstração">
      <button className={tab === 'client' ? 'button primary' : 'button'} type="button" onClick={()=>setTab('client')}><Smartphone size={16}/> Cliente</button>
      <button className={tab === 'agent' ? 'button primary' : 'button'} type="button" onClick={()=>setTab('agent')}><MessageCircle size={16}/> Painel atendente</button>
      <button type="button" className="button" onClick={()=>{setMessages(INTRO);setDraft('');}} title="Reiniciar simulação"><RotateCcw size={16}/></button>
    </nav>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: 24 }}>
      <div style={{ display: tab === 'client' ? 'flex' : 'none', flexDirection: 'column', minHeight: 540, maxWidth: 470, width: '100%', margin: '0 auto', borderRadius: 17, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 25px 75px #0003' }}>
        <div style={{ padding: '17px', background: '#115b4d', color: 'white', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ background: '#d7f2e6', color: '#115b4d', padding: 12, borderRadius: '50%', fontWeight: 800 }}>V</span>
          <div><strong>Atendimento · Unidade teste</strong><p style={{ fontSize: 11, opacity: .8, marginTop: 4 }}>Canal demonstrativo, sem conexão com Meta</p></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 12, padding: 17, background: '#e7e0d3', minHeight: 360, maxHeight: 440, overflowY: 'auto' }} aria-live="polite">
          {messages.map(bubble)}
        </div>
        <div style={{ display: 'flex', gap: 7, padding: 10, background: '#e7e0d3', flexWrap: 'wrap' }}>
          {options.map(o=><button type="button" key={o.text} onClick={()=>send(o.text)} style={{ fontSize: 11, padding: '7px 9px', background: '#f5fff9', color: '#115b4d', borderRadius: 12, border: '1px solid #bdd7c5' }}>{o.label}</button>)}
        </div>
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, background: '#eee8da', padding: 10 }}>
          <input aria-label="Mensagem de teste" placeholder="Escreva uma mensagem..." maxLength={500} value={draft} onChange={e=>setDraft(e.target.value)}
            style={{ flex: 1, borderRadius: 22, background: 'white', color: '#182722' }}/>
          <button type="submit" aria-label="Enviar mensagem de teste" style={{ color: 'white', background: '#0c8060', padding: 13, borderRadius: '50%', display: 'grid', placeItems: 'center' }}><Send size={17}/></button>
        </form>
      </div>
      <div style={{ display: tab === 'agent' ? 'grid' : 'none', gridTemplateRows: 'auto auto 1fr auto', gap: 0, minHeight: 540, borderRadius: 17, border: '1px solid var(--border)', background: 'var(--panel)', overflow: 'hidden' }}>
        <div style={{ padding: 19, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div><span className="eyebrow">INBOX · UNIDADE TESTE</span><h2 style={{ marginTop: 6 }}>Conversa #DEMO-001</h2></div><Bot color="#22c58b" size={24}/>
        </div>
        <div style={{ padding: 14, background: 'var(--accent-soft)', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}><ShieldCheck size={17}/> Prévia local, nenhum contato ou mensagem real armazenado</div>
        <div style={{ display: 'grid', gap: 12, alignContent: 'start', padding: 19, maxHeight: 410, overflowY: 'auto' }} aria-live="polite">
          {messages.map(m=><div key={m.id} style={{ background: m.sender === 'client' ? 'var(--elevated)' : 'var(--bubble)', padding: 13, borderRadius: 10 }}>
            <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 5 }}>{m.sender === 'client' ? 'Cliente demonstração' : 'Vi · Resposta automática'} · {m.time}</p>
            <p style={{ whiteSpace: 'pre-line', fontSize: 13, lineHeight: 1.55 }}>{m.text}</p>
          </div>)}
        </div>
        <div style={{ padding: 13, borderTop: '1px solid var(--border)', color: 'var(--muted)', fontSize: 12 }}>
          Última mensagem: {last?.sender === 'client' ? 'cliente' : 'automação'} · Uso demonstrativo
        </div>
      </div>
    </section>
    <p style={{ marginTop: 24, color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 }}>Para visualizar a conversa no lado do atendente, selecione a aba «Painel atendente». A simulação permanece somente neste dispositivo e não conecta o número do WhatsApp.</p>
  </main>;
}
