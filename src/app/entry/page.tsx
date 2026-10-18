import { redirect } from 'next/navigation';
import { accessToken, getIdentity, isPlatformAdmin } from '@/lib/auth';
import { myMemberships } from '@/lib/tenant-api';

export default async function Entry() {
  const identity = await getIdentity();
  const token = await accessToken();
  if (!identity || !token) redirect('/login?status=signin');
  if (!identity.email_confirmed_at) redirect('/login?status=unconfirmed');
  if (await isPlatformAdmin(identity.id, token)) redirect('/admin');
  // CEO bootstrap does not grant access: the secure claim procedure still checks auth.users and MFA.
  if (identity.email?.toLowerCase() === 'alissonmeespersonal@gmail.com') redirect('/admin');
  const membership = await myMemberships(token);
  if (membership.length) redirect('/app');
  return <main style={{ maxWidth: 500, margin: '10vh auto', padding: 24, display: 'grid', gap: 20 }}>
    <h1>Bem-vindo ao Viante</h1>
    <p>Seu e-mail está confirmado. Para acessar uma empresa, abra o convite enviado pelo administrador da plataforma.</p>
    <p style={{ color: 'var(--muted)' }}>Conta: {identity.email}</p>
    <form method="post" action="/auth/action"><input name="intent" type="hidden" value="logout"/><button className="button" type="submit">Sair da conta</button></form>
  </main>;
}
