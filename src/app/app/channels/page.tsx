import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Cable, MessageCircle, ShieldCheck, ArrowLeft, ExternalLink } from 'lucide-react';
import { accessToken, getIdentity, isPlatformAdmin, tokenAal } from '@/lib/auth';
import { myMemberships, tenantApi } from '@/lib/tenant-api';
import { QrLab } from './qr-lab';
import { MetaCoexistence } from './meta-coexistence';

type Organization = { id: string; name: string };
type Unit = { id: string; organization_id: string; name: string };
type Channel = {
  id: string; organization_id: string; unit_id: string;
  waba_id: string; phone_number_id: string; display_phone_number: string;
  verified_name: string | null; status: 'connected' | 'disabled';
  vi_enabled: boolean; vi_token_ready: boolean;
};
type Props = { searchParams: Promise<{ org?: string; status?: string }> };
const responses: Record<string, string> = {
  connected: 'Número validado na Meta e associado à unidade para receber eventos. Importação de histórico e respostas automáticas da Vi ainda não estão habilitadas.',
  invalid: 'Preencha os identificadores e o token fornecidos pelo painel da Meta.',
  'meta-not-ready': 'O Viante ainda precisa da configuração do aplicativo Meta antes de conectar um número real.',
  'meta-rejected': 'A Meta recusou o token. Verifique a validade e as permissões da conta empresarial.',
  'meta-phone-mismatch': 'O Phone Number ID não pertence à conta WABA informada.',
  'already-connected': 'Não foi possível vincular: verifique suas permissões ou se o número já pertence a outra unidade.',
  'meta-subscribe-error': 'A Meta não aceitou a assinatura dos webhooks; confira o App Meta e as permissões. O canal foi desativado.',
  'meta-unavailable': 'Não foi possível consultar a Meta no momento. Tente novamente.',
  'vi-on': 'Vi ativada! Mensagens novas recebidas neste número poderão receber respostas automáticas do menu de testes.',
  'vi-off': 'Vi pausada para este número. Nenhuma nova resposta automática será enviada.',
  'vi-error': 'Não foi possível alterar a automação. Confirme suas permissões e tente novamente.',
  'vi-token-missing': 'Antes de ativar a Vi, conclua a autorização do número na Meta para salvar uma credencial de envio segura.',
};

export default async function ChannelsPage({ searchParams }: Props) {
  const user = await getIdentity();
  const access = await accessToken();
  if (!user || !access) redirect('/login?status=signin');
  if (await isPlatformAdmin(user.id, access)) redirect('/admin');
  const memberships = await myMemberships(access);
  if (!memberships.length) redirect('/entry');
  const ids = memberships.map(m => m.organization_id);
  const [orgRes, unitRes, channelRes] = await Promise.all([
    tenantApi('viante_organizations?select=id,name&id=in.(' + ids.join(',') + ')', 'GET', undefined, access),
    tenantApi('viante_units?select=id,organization_id,name&organization_id=in.(' + ids.join(',') + ')&order=name.asc', 'GET', undefined, access),
    tenantApi('viante_whatsapp_channels?select=id,organization_id,unit_id,waba_id,phone_number_id,display_phone_number,verified_name,status,vi_enabled,vi_token_ready&organization_id=in.(' + ids.join(',') + ')&order=created_at.desc', 'GET', undefined, access),
  ]);
  const organizations = orgRes.ok && Array.isArray(orgRes.data) ? orgRes.data as Organization[] : [];
  const allUnits = unitRes.ok && Array.isArray(unitRes.data) ? unitRes.data as Unit[] : [];
  const channels = channelRes.ok && Array.isArray(channelRes.data) ? channelRes.data as Channel[] : [];
  const { org, status } = await searchParams;
  const company = organizations.find(o => o.id === org) ?? organizations[0];
  const membership = memberships.find(m => m.organization_id === company?.id);
  const canManage = membership?.role === 'owner' || membership?.role === 'admin';
  const mfa = tokenAal(access) === 'aal2';
  const ready = Boolean(process.env.META_APP_SECRET && process.env.META_WEBHOOK_VERIFY_TOKEN
    && process.env.VIANTE_INGEST_SECRET);
  const units = allUnits.filter(u => u.organization_id === company?.id);
  const companyChannels = channels.filter(c => c.organization_id === company?.id);

  return <main style={{ maxWidth: 1180, padding: 'clamp(20px, 4vw, 48px)', margin: '0 auto', minHeight: '100dvh' }}>
    <Link href={company ? '/app?org=' + company.id : '/app'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><ArrowLeft size={16}/> Minha empresa</Link>
    <header style={{ margin: '26px 0 30px' }}>
      <span className="eyebrow">VIANTE · CANAIS DE ATENDIMENTO</span>
      <h1 style={{ fontSize: 32, marginTop: 8 }}>WhatsApp por unidade</h1>
      <p style={{ color: 'var(--muted)', marginTop: 9 }}>Conecte um número empresarial autorizado na Meta a cada unidade, sem misturar conversas.</p>
    </header>
    {company && <p style={{ marginBottom: 20, color: 'var(--muted)' }}>Empresa selecionada: <strong style={{ color: 'var(--text)' }}>{company.name}</strong></p>}
    {status && responses[status] && <p role="status" style={{ padding: 16, marginBottom: 18, background: 'var(--elevated)', borderRadius: 10 }}>{responses[status]}</p>}
    {canManage && mfa && company && units.length > 0
      ? <MetaCoexistence
          units={units} organizationId={company.id}
          metaAppId={process.env.META_APP_ID ?? null}
          configId={process.env.META_EMBEDDED_SIGNUP_CONFIG_ID ?? null}
          enabled={ready}
          graphVersion={process.env.META_GRAPH_API_VERSION || 'v24.0'}
        />
      : <section style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 20, background: 'var(--panel)' }}>
          <h2>Conectar o WhatsApp Business existente</h2>
          <p style={{ marginTop: 10, color: 'var(--muted)', lineHeight: 1.7 }}>Para iniciar a autorização da Meta, faça login como proprietário com MFA ativo e cadastre pelo menos uma unidade da empresa.</p>
          <Link href={canManage && !mfa ? '/mfa' : '/app'} className="button" style={{ marginTop: 15 }}>
            {canManage && !mfa ? 'Configurar autenticação MFA' : 'Voltar à minha empresa'}
          </Link>
        </section>}
    <QrLab/>
    <h2 style={{ margin: '27px 0 16px', fontSize: 20 }}>Conexão técnica · Cloud API (avançado)</h2>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,370px),1fr))', gap: 20 }}>
      <article style={{ padding: 24, border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: 14 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 20 }}><Cable size={20}/> Conectar número com credenciais da Meta</h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginTop: 12 }}>
          Esta opção é destinada a administradores técnicos que já possuem WABA ID, Phone Number ID e token da Meta. Para conectar um WhatsApp Business existente, prefira o fluxo oficial acima.
        </p>
        {!ready && <div style={{ marginTop: 16, padding: 15, borderRadius: 9, background: 'var(--elevated)', border: '1px solid var(--border)' }} role="status">
          <strong>Configuração Meta pendente</strong>
          <p style={{ color: 'var(--muted)', marginTop: 7 }}>O administrador geral precisa configurar o segredo do aplicativo Meta e validar os webhooks na plataforma de desenvolvedores. O cadastro fica bloqueado até lá.</p>
        </div>}
        {ready && !canManage && <p style={{ marginTop: 16 }}>Somente proprietários ou administradores desta empresa podem conectar números.</p>}
        {ready && canManage && !mfa && <p style={{ marginTop: 16 }}><Link href="/mfa">Confirme o MFA para conectar o WhatsApp</Link></p>}
        {ready && canManage && mfa && (units.length ? <form method="post" action="/app/channels/connect" style={{ display: 'grid', gap: 14, marginTop: 20 }}>
          <input type="hidden" name="organization_id" value={company.id}/>
          <label style={{ display: 'grid', gap: 7 }}>Unidade que receberá as mensagens
            <select name="unit_id" required>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          </label>
          <label style={{ display: 'grid', gap: 7 }}>WhatsApp Business Account ID (WABA)
            <input name="waba_id" inputMode="numeric" pattern="[0-9]{5,30}" required placeholder="ID da conta WABA" maxLength={30}/>
          </label>
          <label style={{ display: 'grid', gap: 7 }}>Phone Number ID (Meta)
            <input name="phone_number_id" inputMode="numeric" pattern="[0-9]{5,30}" required placeholder="ID do número na Meta" maxLength={30}/>
          </label>
          <label style={{ display: 'grid', gap: 7 }}>Token de acesso temporário da Meta
            <input name="access_token" type="password" required minLength={40} maxLength={4096} autoComplete="off" placeholder="Colado apenas no formulário seguro"/>
          </label>
          <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
            O token é enviado somente ao servidor para validar a WABA e assinar os webhooks; não é gravado no banco.
            Configure o webhook da aplicação na Meta antes de conectar.
          </p>
          <button type="submit" className="button primary">Validar e conectar pela Meta</button>
        </form> : <p style={{ marginTop: 20 }}>Cadastre a primeira unidade em <Link href="/app">Minha empresa</Link> antes de conectar o número.</p>)}
      </article>
      <article style={{ padding: 24, border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: 14 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 20 }}><MessageCircle size={20}/> Números vinculados</h2>
        {companyChannels.length === 0
          ? <p style={{ color: 'var(--muted)', marginTop: 18 }}>Nenhum número WhatsApp conectado até o momento.</p>
          : <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>{companyChannels.map(c =>
            <div key={c.id} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 10 }}>
              <strong>{c.display_phone_number}</strong>
              <p style={{ color: 'var(--muted)', marginTop: 6 }}>{units.find(u => u.id === c.unit_id)?.name || 'Unidade'}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{c.status === 'connected' ? 'Conectado à Meta — aguarda mensagens' : 'Desativado — revisar assinatura'}</p>
              <p style={{ fontSize: 12, color: c.vi_enabled ? 'var(--accent)' : 'var(--muted)', marginTop: 9, fontWeight: 600 }}>
                Vi · {c.vi_enabled ? 'Automação ativa' : 'Automação desligada'}
              </p>
              {canManage && mfa && c.status === 'connected' && <form method="post" action="/app/channels/vi-toggle"
                style={{ display: 'grid', gap: 10, marginTop: 13 }}>
                <input type="hidden" name="organization_id" value={company.id}/>
                <input type="hidden" name="channel_id" value={c.id}/>
                <input type="hidden" name="enabled" value={c.vi_enabled ? 'false' : 'true'}/>
                <button className={c.vi_enabled ? 'button' : 'button primary'} type="submit"
                  disabled={!c.vi_enabled && !(c.vi_token_ready ||
                    (process.env.META_TEST_PHONE_NUMBER_ID === c.phone_number_id &&
                     Boolean(process.env.META_TEST_WHATSAPP_TOKEN)))}>
                  {c.vi_enabled ? 'Pausar respostas da Vi' : 'Ativar respostas da Vi'}
                </button>
                {!c.vi_enabled && !c.vi_token_ready && <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Primeiro autorize o WhatsApp na Meta. A Vi só poderá enviar mensagens com uma credencial válida.
                </p>}
                <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                  Ao ativar, você autoriza a Vi a responder mensagens novas com o menu 1/2/3.
                  Solicitações de atendimento humano pausam a automação naquela conversa.
                </p>
              </form>}
            </div>
          )}</div>}
        <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
          <Link href="/app/inbox" className="button">Abrir mensagens recebidas</Link>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> Cada responsável vê somente as mensagens de suas unidades autorizadas.
          </p>
        </div>
      </article>
    </section>
    <section style={{ marginTop: 22, padding: 24, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14 }}>
      <h2>Preparação na Meta</h2>
      <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginTop: 11 }}>
        Configure o produto WhatsApp no Meta for Developers, autorize o número e assine o campo <code>messages</code> do webhook.
        Use a URL de callback abaixo e o Verify Token fornecido ao administrador geral no ambiente seguro da Vercel.
      </p>
      <p style={{ padding: 13, border: '1px solid var(--border)', borderRadius: 9, marginTop: 15, overflowWrap: 'anywhere' }}>
        <code>https://chatbox-cyan-five.vercel.app/api/webhooks/meta</code>
      </p>
      <p style={{ marginTop: 16 }}><a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">
        Abrir Meta for Developers <ExternalLink size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>
      </a></p>
    </section>
  </main>;
}
