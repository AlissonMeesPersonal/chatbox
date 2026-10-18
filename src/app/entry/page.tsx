import Link from 'next/link';
import { redirect } from 'next/navigation';
import { accessToken, getIdentity, isPlatformAdmin } from '@/lib/auth';
import { myMemberships, tenantApi } from '@/lib/tenant-api';

type PendingInvitation = {
  invitation_id: string;
  organization_name: string;
  unit_name: string | null;
  invitation_type: 'owner' | 'unit';
  expires_at: string;
};

export default async function Entry() {
  const identity = await getIdentity();
  const token = await accessToken();
  if (!identity || !token) redirect('/login?status=signin');
  if (!identity.email_confirmed_at) redirect('/login?status=unconfirmed');
  if (await isPlatformAdmin(identity.id, token)) redirect('/admin');
  // Bootstrap always rechecks privileged identity and MFA on /admin server-side.
  if (identity.email?.toLowerCase() === 'alissonmeespersonal@gmail.com') redirect('/admin');
  const memberships = await myMemberships(token);
  const invites = await tenantApi('rpc/viante_my_pending_invitations', 'POST', {}, token);
  const pending: PendingInvitation[] = invites.ok && Array.isArray(invites.data)
    ? invites.data as PendingInvitation[] : [];
  if (memberships.length && !pending.length) redirect('/app');

  return <main style={{ maxWidth: 560, margin: '10vh auto', padding: 24, display: 'grid', gap: 20 }}>
    <span className="eyebrow">VIANTE · ACESSO EMPRESARIAL</span>
    <h1>Bem-vindo ao Viante</h1>
    <p style={{ color: 'var(--muted)' }}>Conta confirmada: {identity.email}</p>
    {pending.length > 0 ? <>
      <p>Encontramos convites para seu e-mail. É possível ativar seu acesso aqui, mesmo que o primeiro link de confirmação tenha falhado.</p>
      <div style={{ display: 'grid', gap: 12 }}>
        {pending.map(i => <section key={i.invitation_id} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, display: 'grid', gap: 12 }}>
          <div><strong>{i.organization_name}</strong>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 5 }}>
              {i.invitation_type === 'owner' ? 'Convite para proprietário' : 'Convite para unidade: ' + i.unit_name}
            </p>
          </div>
          <Link className="button primary" href={(i.invitation_type === 'unit' ? '/accept-unit-invite?invite=' : '/accept-invite?invite=') + encodeURIComponent(i.invitation_id)}>
            Ativar acesso {i.invitation_type === 'owner' ? 'empresarial' : 'à unidade'}
          </Link>
        </section>)}
      </div>
    </> : memberships.length === 0 ? <p>Sua conta está confirmada, mas não há convites pendentes para ela. Peça ao administrador para enviar um novo convite.</p> : <p>Seu ambiente empresarial já está disponível.</p>}
    {memberships.length > 0 && <Link className="button" href="/app">Abrir minha empresa</Link>}
    <form method="post" action="/auth/action"><input name="intent" type="hidden" value="logout"/><button className="button" type="submit">Sair da conta</button></form>
  </main>;
}
