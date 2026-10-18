import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, MessageCircle, Bot, CheckCircle2 } from 'lucide-react';
import { accessToken, getIdentity, isPlatformAdmin } from '@/lib/auth';
import { myMemberships, tenantApi } from '@/lib/tenant-api';

type Inbound = {
  id: string; organization_id: string; unit_id: string;
  customer_wa_id: string; sender_name: string | null;
  message_text: string | null; message_type: string; received_at: string;
};
type Unit = { id: string; name: string };
type ViReply = { id: string; unit_id: string; recipient: string; message_body: string; status: string; created_at: string; sent_at: string | null };
export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  const user = await getIdentity();
  const access = await accessToken();
  if (!user || !access) redirect('/login?status=signin');
  if (await isPlatformAdmin(user.id, access)) redirect('/admin');
  if (!(await myMemberships(access)).length) redirect('/entry');
  const [messagesResult, unitsResult, repliesResult] = await Promise.all([
    tenantApi('viante_whatsapp_inbound?select=id,organization_id,unit_id,customer_wa_id,sender_name,message_text,message_type,received_at&order=received_at.desc&limit=100', 'GET', undefined, access),
    tenantApi('viante_units?select=id,name&order=name.asc', 'GET', undefined, access),
    tenantApi('rpc/viante_visible_vi_outbox', 'POST', {}, access),
  ]);
  const messages = messagesResult.ok && Array.isArray(messagesResult.data) ? messagesResult.data as Inbound[] : [];
  const units = unitsResult.ok && Array.isArray(unitsResult.data) ? unitsResult.data as Unit[] : [];
  const replies = repliesResult.ok && Array.isArray(repliesResult.data) ? repliesResult.data as ViReply[] : [];
  return <main style={{ maxWidth: 1100, padding: 'clamp(20px,4vw,50px)', minHeight: '100dvh', margin: '0 auto' }}>
    <Link href="/app" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><ArrowLeft size={16}/> Minha empresa</Link>
    <header style={{ margin: '27px 0 28px' }}>
      <span className="eyebrow">VIANTE · WHATSAPP CLOUD API</span>
      <h1 style={{ fontSize: 30, marginTop: 8 }}>WhatsApp · Conversas de teste</h1>
      <p style={{ color: 'var(--muted)', marginTop: 10 }}>Mensagens recebidas e respostas da Vi com status de envio. Atualize a página para acompanhar o teste real.</p>
    </header>
    <p style={{ marginBottom: 20 }}><Link href="/app/channels">Configurar números WhatsApp</Link></p>
    {messages.length === 0 ? <section style={{ padding: 30, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14 }}>
      <MessageCircle size={26}/>
      <h2 style={{ marginTop: 14 }}>Nenhuma mensagem real recebida</h2>
      <p style={{ marginTop: 10, color: 'var(--muted)' }}>Conecte um número pela Meta, conclua a assinatura de webhooks e envie uma mensagem de outro telefone para testar.</p>
    </section> : <div style={{ display: 'grid', gap: 12 }}>{messages.map(m =>
      <article key={m.id} style={{ padding: 19, border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: 12 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <strong>{m.sender_name || m.customer_wa_id}</strong>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(m.received_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
        </header>
        <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>
          {units.find(u => u.id === m.unit_id)?.name || 'Unidade autorizada'} · {m.customer_wa_id}
        </p>
        <p style={{ marginTop: 12, lineHeight: 1.65, overflowWrap: 'anywhere' }}>
          {m.message_text || 'Mensagem ' + m.message_type + ' recebida (visualização da mídia em desenvolvimento)'}
        </p>
      </article>
    )}</div>}
    <section style={{ marginTop: 28 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 17, fontSize: 21 }}><Bot size={21}/> Respostas da Vi</h2>
      {replies.length === 0
        ? <p style={{ padding: 21, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--muted)' }}>
          A Vi ainda não respondeu nenhuma mensagem. Para testar, conecte o número na Meta e ative a automação no painel de canais.
        </p>
        : <div style={{ display: 'grid', gap: 12 }}>
          {replies.map(reply => <article key={reply.id} style={{ padding: 19, background: 'var(--panel)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <strong style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}><Bot size={16}/> Vi → {reply.recipient}</strong>
              <span style={{ color: reply.status === 'sent' ? 'var(--accent)' : 'var(--muted)', fontSize: 12, display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                {reply.status === 'sent' && <CheckCircle2 size={14}/>}
                {reply.status === 'sent' ? 'Aceita pela Meta' : reply.status === 'pending' ? 'Aguardando envio' : reply.status === 'sending' ? 'Enviando' : 'Falha de envio'}
              </span>
            </header>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              {units.find(u => u.id === reply.unit_id)?.name || 'Unidade autorizada'} · {new Date(reply.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>
            <p style={{ marginTop: 13, whiteSpace: 'pre-line', lineHeight: 1.65, overflowWrap: 'anywhere' }}>{reply.message_body}</p>
          </article>)}
        </div>}
    </section>
    <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 25, lineHeight: 1.6 }}>
      O status “Aceita pela Meta” confirma a resposta da API, não necessariamente a entrega no celular.
      Transferência efetiva para agentes, respostas humanas dentro do Viante e importação de histórico serão integradas posteriormente.
    </p>
  </main>;
}
