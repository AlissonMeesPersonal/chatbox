import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { accessToken, getIdentity, isPlatformAdmin } from '@/lib/auth';
import { myMemberships, tenantApi } from '@/lib/tenant-api';

type Inbound = {
  id: string; organization_id: string; unit_id: string;
  customer_wa_id: string; sender_name: string | null;
  message_text: string | null; message_type: string; received_at: string;
};
type Unit = { id: string; name: string };
export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  const user = await getIdentity();
  const access = await accessToken();
  if (!user || !access) redirect('/login?status=signin');
  if (await isPlatformAdmin(user.id, access)) redirect('/admin');
  if (!(await myMemberships(access)).length) redirect('/entry');
  const [messagesResult, unitsResult] = await Promise.all([
    tenantApi('viante_whatsapp_inbound?select=id,organization_id,unit_id,customer_wa_id,sender_name,message_text,message_type,received_at&order=received_at.desc&limit=100', 'GET', undefined, access),
    tenantApi('viante_units?select=id,name&order=name.asc', 'GET', undefined, access),
  ]);
  const messages = messagesResult.ok && Array.isArray(messagesResult.data) ? messagesResult.data as Inbound[] : [];
  const units = unitsResult.ok && Array.isArray(unitsResult.data) ? unitsResult.data as Unit[] : [];
  return <main style={{ maxWidth: 1100, padding: 'clamp(20px,4vw,50px)', minHeight: '100dvh', margin: '0 auto' }}>
    <Link href="/app" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><ArrowLeft size={16}/> Minha empresa</Link>
    <header style={{ margin: '27px 0 28px' }}>
      <span className="eyebrow">VIANTE · WHATSAPP CLOUD API</span>
      <h1 style={{ fontSize: 30, marginTop: 8 }}>Mensagens recebidas</h1>
      <p style={{ color: 'var(--muted)', marginTop: 10 }}>Visualização inicial de mensagens reais recebidas pelo webhook da Meta. Atualize a página para ver novas mensagens.</p>
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
    <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 25 }}>
      Esta tela exibe mensagens recebidas. Envio de respostas, filas, etiquetas e distribuição entre agentes serão integrados na próxima etapa.
    </p>
  </main>;
}
