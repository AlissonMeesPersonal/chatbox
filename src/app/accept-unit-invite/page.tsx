import Link from 'next/link';
import { redirect } from 'next/navigation';
import { accessToken, getIdentity, tokenAal } from '@/lib/auth';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Props = { searchParams: Promise<{ invite?: string; status?: string }> };

export default async function AcceptUnitInvite({ searchParams }: Props) {
  const { invite, status } = await searchParams;
  if (!invite || !UUID.test(invite)) redirect('/entry');
  const user = await getIdentity();
  const token = await accessToken();
  if (!user || !token) redirect('/login?status=signin');
  if (!user.email_confirmed_at) redirect('/login?status=unconfirmed');
  if (tokenAal(token) !== 'aal2') redirect('/mfa?next=' + encodeURIComponent('/accept-unit-invite?invite=' + invite));

  return <main style={{ maxWidth: 520, margin: '10vh auto', padding: 24, display: 'grid', gap: 20 }}>
    <span className="eyebrow">VIANTE · CONVITE DE UNIDADE</span>
    <h1>Ativar acesso à unidade</h1>
    <p style={{ lineHeight: 1.7 }}>
      Sua identidade <strong>{user.email}</strong> foi confirmada. Ao aceitar, você terá acesso
      às unidades específicas para as quais foi convidado, dentro da empresa já existente.
    </p>
    {status === 'error' && <p role="alert">Convite inválido, expirado ou vinculado a outro e-mail. Solicite ao proprietário um novo convite.</p>}
    <form method="post" action="/accept-unit-invite/action">
      <input type="hidden" name="invitation_id" value={invite}/>
      <button type="submit" className="button primary">Aceitar convite desta unidade</button>
    </form>
    <Link href="/entry">Voltar</Link>
  </main>;
}
