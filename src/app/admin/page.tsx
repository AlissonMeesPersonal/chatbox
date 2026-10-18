import Link from 'next/link';
import { redirect } from 'next/navigation';
import { accessToken, getIdentity, isPlatformAdmin, tokenAal } from '@/lib/auth';
import { Building2, ShieldCheck, Users, MessageSquare, Plus, Mail } from 'lucide-react';
import { tenantApi } from '@/lib/tenant-api';

type Organization = { id: string; name: string; slug: string; created_at: string };
type Props = { searchParams: Promise<{ status?: string }> };
type Invite = { id: string; organization_id: string; email: string; status: string; expires_at: string }; 
async function invitations(token: string): Promise<Invite[]> {
  const response = await tenantApi('rpc/viante_ceo_invitations', 'POST', {}, token);
  return response.ok && Array.isArray(response.data) ? response.data as Invite[] : [];
}

async function organizations(token: string): Promise<Organization[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  const response = await fetch(url + '/rest/v1/rpc/viante_ceo_orgs', {
    method: 'POST',
    headers: { apikey: key, authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: '{}',
    cache: 'no-store',
  });
  if (!response.ok) return [];
  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data as Organization[] : [];
}

export default async function AdminPage({ searchParams }: Props) {
  const identity = await getIdentity();
  const access = await accessToken();
  if (!identity || !access) redirect('/login?status=signin');
  if (!identity.email_confirmed_at) redirect('/login?status=unconfirmed');
  if (tokenAal(access) !== 'aal2') redirect('/mfa');

  const allowed = await isPlatformAdmin(identity.id, access);
  const { status } = await searchParams;
  if (!allowed) {
    return <main style={{ maxWidth: 520, margin: '10vh auto', padding: 24, display: 'grid', gap: 18 }}>
      <h1>Ativação administrativa</h1>
      <p>Seu e-mail foi confirmado e seu segundo fator está ativo. Apenas a identidade CEO previamente autorizada pode concluir esta etapa.</p>
      {status === 'denied' && <p role="alert">Esta conta não está autorizada como CEO.</p>}
      <form action="/auth/claim" method="post"><button className="button primary" type="submit">Validar e ativar acesso CEO</button></form>
      <form action="/auth/action" method="post"><input type="hidden" name="intent" value="logout"/><button className="button" type="submit">Sair</button></form>
    </main>;
  }

  const [companies, invites] = await Promise.all([organizations(access), invitations(access)]);
  return <main style={{ minHeight: '100dvh', padding: 'clamp(20px, 4vw, 52px)', maxWidth: 1440, margin: '0 auto' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 32 }}>
      <div><span className="eyebrow">VIANTE • CONTROLE DA PLATAFORMA</span><h1 style={{ fontSize: 32, marginTop: 8 }}>Painel CEO</h1><p style={{ color: 'var(--muted)', marginTop: 7 }}>Administração geral, separada das equipes de atendimento.</p></div>
      <form action="/auth/action" method="post"><input type="hidden" name="intent" value="logout"/><button className="button" type="submit">Sair com segurança</button></form>
    </header>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
      <article style={{ padding: 22, borderRadius: 14, background: 'var(--panel)', border: '1px solid var(--border)' }}><Building2 size={24}/><p style={{ marginTop: 15, color: 'var(--muted)' }}>Empresas cadastradas</p><h2 style={{ fontSize: 34 }}>{companies.length}</h2></article>
      <article style={{ padding: 22, borderRadius: 14, background: 'var(--panel)', border: '1px solid var(--border)' }}><ShieldCheck size={24}/><p style={{ marginTop: 15, color: 'var(--muted)' }}>Segurança</p><h2 style={{ marginTop: 8 }}>MFA ativo</h2></article>
      <article style={{ padding: 22, borderRadius: 14, background: 'var(--panel)', border: '1px solid var(--border)' }}><Mail size={24}/><p style={{ marginTop: 15, color: 'var(--muted)' }}>Convites de proprietários</p><h2 style={{ fontSize: 34, marginTop: 8 }}>{invites.filter(i => i.status === 'pending').length}</h2></article>
    </section>
    {status === 'created' && <p role="status" style={{ padding: 14, background: 'var(--accent-soft)', marginBottom: 16 }}>Empresa cadastrada com sucesso.</p>}
    {status === 'invite-revoked' && <p role="status" style={{ padding: 14, background: 'var(--accent-soft)', marginBottom: 16 }}>Convite revogado. O antigo link não poderá mais ativar acesso empresarial.</p>}
    {status === 'invite-sent' && <p role="status" style={{ padding: 14, background: 'var(--accent-soft)', marginBottom: 16 }}>Convite solicitado ao Supabase Auth. Peça ao responsável para verificar o e-mail e concluir o cadastro.</p>}
    {status === 'invite-delivery-failed' && <p role="alert" style={{ padding: 14, background: 'var(--elevated)', marginBottom: 16 }}>O convite ficou registrado, mas o Supabase Auth não confirmou o envio. Tente reenviar depois de revisar as configurações de e-mail.</p>}
    {status === 'invite-invalid' && <p role="alert" style={{ padding: 14, background: 'var(--elevated)', marginBottom: 16 }}>Informe um e-mail válido e selecione uma empresa existente.</p>}
    {status === 'invite-error' && <p role="alert" style={{ padding: 14, background: 'var(--elevated)', marginBottom: 16 }}>Não foi possível gerar o convite. Ele pode já ter sido aceito.</p>}
    {status === 'error' && <p role="alert" style={{ padding: 14, background: 'var(--elevated)', marginBottom: 16 }}>Não foi possível cadastrar. Verifique o nome e o identificador.</p>}
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 24 }}>
      <article style={{ padding: 24, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14 }}>
        <h2 style={{ fontSize: 20 }}>Cadastrar empresa</h2><p style={{ color: 'var(--muted)', margin: '12px 0 24px' }}>Crie o primeiro ambiente empresarial do Viante.</p>
        <form action="/admin/organizations" method="post" style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6 }}>Nome da empresa<input name="name" maxLength={160} minLength={2} required placeholder="Ex.: Minha Empresa"/></label>
          <label style={{ display: 'grid', gap: 6 }}>Identificador único<input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} required placeholder="ex.: minha-empresa"/></label>
          <button className="button primary" type="submit"><Plus size={17}/> Criar empresa</button>
        </form>
      </article>
      <article style={{ padding: 24, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14 }}>
        <h2 style={{ fontSize: 20 }}>Empresas</h2>
        <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
          {companies.length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhuma empresa cadastrada. Comece pelo formulário ao lado.</p>}
          {companies.map(company => <div key={company.id} style={{ padding: 15, border: '1px solid var(--border)', borderRadius: 9 }}>
            <strong>{company.name}</strong><p style={{ color: 'var(--muted)', marginTop: 5 }}>{company.slug}</p>
            <form method="post" action="/admin/invitations" style={{ display: 'grid', gap: 8, marginTop: 15 }}>
              <input type="hidden" name="organization_id" value={company.id}/>
              <label style={{ display: 'grid', gap: 6, fontSize: 12 }}>E-mail do proprietário
                <input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="proprietario@empresa.com"/>
              </label>
              <button className="button" type="submit"><Mail size={16}/> Enviar convite ao proprietário</button>
            </form>
            {invites.filter(i => i.organization_id === company.id).map(i =>
              <div key={i.id} style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
                <strong>{i.email}</strong> · {i.status === 'accepted' ? 'Ativo' : i.status === 'pending' ? (new Date(i.expires_at).getTime() < Date.now() ? 'Expirado — reenviar' : 'Convite pendente') : 'Revogado'}
                {i.status === 'pending' && <form action="/admin/invitations/revoke" method="post" style={{ marginTop: 7 }}>
                  <input type="hidden" name="invitation_id" value={i.id}/>
                  <button type="submit" style={{ color: 'var(--muted)', textDecoration: 'underline', padding: 0, border: 0, background: 'none', fontSize: 12 }}>Revogar convite</button>
                </form>}
              </div>
            )}
          </div>)}
        </div>
      </article>
    </section>
    <p style={{ marginTop: 30, color: 'var(--muted)' }}><MessageSquare size={15} style={{ display: 'inline', verticalAlign: 'middle' }}/> <Link href="/demo">Explorar Inbox demonstrativa</Link> — dados fictícios, sem envio externo.</p>
  </main>;
}
