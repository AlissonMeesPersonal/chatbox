import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, Users, MapPin, Plus, ShieldCheck, MessageSquare } from 'lucide-react';
import { accessToken, getIdentity, isPlatformAdmin, tokenAal } from '@/lib/auth';
import { myMemberships, tenantApi } from '@/lib/tenant-api';

type Org = { id: string; name: string; slug: string };
type Unit = { id: string; organization_id: string; name: string };
type UnitInvitation = { id: string; organization_id: string; unit_id: string; email: string; status: string; expires_at: string };
type Props = { searchParams: Promise<{ org?: string; status?: string }> };

export default async function CompanyDashboard({ searchParams }: Props) {
  const identity = await getIdentity();
  const token = await accessToken();
  if (!identity || !token) redirect('/login?status=signin');
  if (!identity.email_confirmed_at) redirect('/login?status=unconfirmed');
  if (await isPlatformAdmin(identity.id, token)) redirect('/admin');
  const memberships = await myMemberships(token);
  if (memberships.length === 0) redirect('/entry');
  const orgIds = memberships.map(m => m.organization_id);
  const [orgResponse, unitResponse] = await Promise.all([
    tenantApi('viante_organizations?select=id,name,slug&id=in.(' + orgIds.join(',') + ')&order=name.asc', 'GET', undefined, token),
    tenantApi('viante_units?select=id,organization_id,name&organization_id=in.(' + orgIds.join(',') + ')&order=name.asc', 'GET', undefined, token),
  ]);
  const orgs = orgResponse.ok && Array.isArray(orgResponse.data) ? orgResponse.data as Org[] : [];
  const units = unitResponse.ok && Array.isArray(unitResponse.data) ? unitResponse.data as Unit[] : [];
  const { org: selectedId, status } = await searchParams;
  const currentOrg = orgs.find(o => o.id === selectedId) ?? orgs[0];
  const currentMembership = memberships.find(m => m.organization_id === currentOrg?.id);
  const canManage = currentMembership?.role === 'owner' || currentMembership?.role === 'admin';
  const secondFactor = tokenAal(token) === 'aal2';
  const inviteResponse = currentOrg && canManage && secondFactor
    ? await tenantApi('rpc/viante_owner_unit_invites', 'POST', { p_org: currentOrg.id }, token)
    : null;
  const unitInvites: UnitInvitation[] = inviteResponse?.ok && Array.isArray(inviteResponse.data)
    ? inviteResponse.data as UnitInvitation[] : [];

  return <main style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(20px, 4vw, 50px)', minHeight: '100dvh' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, marginBottom: 35 }}>
      <div><span className="eyebrow">VIANTE · AMBIENTE EMPRESARIAL</span><h1 style={{ fontSize: 30, marginTop: 9 }}>Minha empresa</h1><p style={{ marginTop: 6, color: 'var(--muted)' }}>{identity.email}</p></div>
      <form method="post" action="/auth/action"><input type="hidden" name="intent" value="logout"/><button className="button" type="submit">Sair da conta</button></form>
    </header>

    {orgs.length === 0 && <p role="alert">Você possui uma associação ativa, mas a empresa não pôde ser carregada. Contate o administrador.</p>}
    {currentOrg && <div style={{ display: 'grid', gap: 20 }}>
      <nav style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} aria-label="Minhas empresas">
        {orgs.map(o => <Link key={o.id} href={'/app?org=' + o.id} className="button" aria-current={currentOrg.id === o.id ? 'page' : undefined} style={{ background: currentOrg.id === o.id ? 'var(--accent-soft)' : 'var(--panel)' }}><Building2 size={16}/> {o.name}</Link>)}
      </nav>
      {status === 'unit-created' && <p role="status" style={{ padding: 14, background: 'var(--accent-soft)' }}>Unidade cadastrada com sucesso.</p>}
      {status === 'unit-invite-requested' && <p role="status" style={{ padding: 14, background: 'var(--accent-soft)' }}>Unidade cadastrada ou convite atualizado. A solicitação de e-mail foi aceita pelo Supabase; aguarde o responsável ativar a conta.</p>}
      {status === 'unit-invite-email-failed' && <p role="alert" style={{ padding: 14, background: 'var(--panel)' }}>A unidade/convite foi salvo, mas o serviço de e-mail não confirmou o envio. Você pode reenviar o convite pelo formulário da unidade.</p>}
      {status === 'unit-invite-revoked' && <p role="status" style={{ padding: 14, background: 'var(--accent-soft)' }}>Convite pendente revogado com sucesso.</p>}
      {status === 'unit-invite-error' && <p role="alert" style={{ padding: 14, background: 'var(--panel)' }}>Não foi possível criar ou atualizar o convite. Confira a unidade e o e-mail.</p>}
      {status === 'unit-error' && <p role="alert" style={{ padding: 14, background: 'var(--panel)' }}>Não foi possível cadastrar a unidade.</p>}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16 }}>
        <article style={{ border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: 14, padding: 23 }}><Building2 size={22}/><h2 style={{ marginTop: 14 }}>{currentOrg.name}</h2><p style={{ color: 'var(--muted)', marginTop: 5 }}>{currentOrg.slug}</p></article>
        <article style={{ border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: 14, padding: 23 }}><MapPin size={22}/><h2 style={{ marginTop: 14, fontSize: 25 }}>{units.filter(u => u.organization_id === currentOrg.id).length}</h2><p style={{ color: 'var(--muted)' }}>Unidades autorizadas</p></article>
        <article style={{ border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: 14, padding: 23 }}><Users size={22}/><h2 style={{ marginTop: 14 }}>{currentMembership?.role === 'owner' ? 'Proprietário' : currentMembership?.role}</h2><p style={{ color: 'var(--muted)' }}>Seu perfil na empresa</p></article>
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,330px),1fr))', gap: 20 }}>
        <article style={{ border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: 14, padding: 23 }}>
          <h2 style={{ fontSize: 20 }}>Unidades da empresa</h2>
          <div style={{ display: 'grid', gap: 12, marginTop: 19 }}>
            {units.filter(u => u.organization_id === currentOrg.id).map(u =>
              <div key={u.id} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 10 }}>
                <p><MapPin size={15} style={{ display: 'inline', verticalAlign: 'middle' }}/> <strong>{u.name}</strong></p>
                {canManage && secondFactor && <>
                  {unitInvites.filter(i => i.unit_id === u.id).map(i =>
                    <div key={i.id} style={{ marginTop: 11, paddingTop: 9, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)' }}>
                      <span>{i.email} · {i.status === 'accepted' ? 'Acesso ativado' : i.status === 'revoked' ? 'Revogado' : new Date(i.expires_at).getTime() < Date.now() ? 'Convite expirado' : 'Convite pendente'}</span>
                      {i.status === 'pending' && <form action="/app/unit-invitations/revoke" method="post" style={{ marginTop: 5 }}>
                        <input type="hidden" name="organization_id" value={currentOrg.id}/>
                        <input type="hidden" name="invitation_id" value={i.id}/>
                        <button type="submit" style={{ border: 0, padding: 0, background: 'none', textDecoration: 'underline', color: 'var(--muted)', fontSize: 12 }}>Revogar convite</button>
                      </form>}
                    </div>)}
                  <form action="/app/unit-invitations" method="post" style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                    <input type="hidden" name="organization_id" value={currentOrg.id}/>
                    <input type="hidden" name="unit_id" value={u.id}/>
                    <label style={{ display: 'grid', gap: 5, fontSize: 12 }}>E-mail de acesso desta unidade
                      <input name="email" type="email" required maxLength={254} placeholder="unidade@empresa.com"/>
                    </label>
                    <button className="button" type="submit">Convidar responsável</button>
                  </form>
                </>}
              </div>
            )}
            {units.filter(u => u.organization_id === currentOrg.id).length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhuma unidade cadastrada.</p>}
          </div>
        </article>
        <article style={{ border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: 14, padding: 23 }}>
          <h2 style={{ fontSize: 20 }}>Gerenciamento</h2>
          {canManage && secondFactor ? <form method="post" action="/app/units" style={{ display: 'grid', gap: 12, marginTop: 20 }}>
            <input type="hidden" name="organization_id" value={currentOrg.id}/>
            <label style={{ display: 'grid', gap: 8 }}>Nome da nova unidade
              <input name="name" minLength={2} maxLength={160} required placeholder="Ex.: Matriz"/>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>E-mail do responsável (opcional)
              <input name="email" type="email" maxLength={254} placeholder="unidade@empresa.com"/>
            </label>
            <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>Você poderá adicionar o e-mail depois. O responsável será convidado para esta unidade dentro da empresa atual.</p>
            <button className="button primary" type="submit"><Plus size={16}/> Cadastrar unidade</button>
          </form> : canManage ? <div style={{ marginTop: 20 }}><p>Confirme o segundo fator antes de gerenciar unidades.</p><Link className="button" href="/mfa">Verificar MFA</Link></div> : <p style={{ marginTop: 20, color: 'var(--muted)' }}>Somente proprietários ou gestores autorizados podem cadastrar unidades.</p>}
          <p style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}><ShieldCheck size={16}/> Seus dados são isolados por empresa.</p>
          <p style={{ marginTop: 18 }}><Link href="/reset-password">Definir ou alterar minha senha</Link></p>
        </article>
      </section>
      <section style={{ border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: 14, padding: 22 }}>
        <h2><MessageSquare size={18} style={{ display: 'inline', verticalAlign: 'middle' }}/> Atendimento</h2>
        <p style={{ color: 'var(--muted)', margin: '12px 0' }}>O canal empresarial será habilitado quando os operadores e canais forem configurados. A demonstração não acessa conversas reais.</p>
        <Link href="/demo">Ver Inbox com dados fictícios</Link>
      </section>
    </div>}
  </main>;
}
