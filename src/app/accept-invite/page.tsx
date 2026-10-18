import Link from 'next/link';
import { redirect } from 'next/navigation';
import { accessToken, getIdentity, tokenAal } from '@/lib/auth';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Props = { searchParams: Promise<{ invite?: string; status?: string }> };

export default async function AcceptInvite({ searchParams }: Props) {
  const { invite, status } = await searchParams;
  if (!invite || !UUID.test(invite)) redirect('/entry');
  const user = await getIdentity();
  const token = await accessToken();
  if (!user || !token) redirect('/login?status=signin');
  if (!user.email_confirmed_at) redirect('/login?status=unconfirmed');
  if (tokenAal(token) !== 'aal2') redirect('/mfa?next=' + encodeURIComponent('/accept-invite?invite=' + invite));
  return <main style={{ maxWidth: 540, margin: '10vh auto', padding: 24, display: 'grid', gap: 18 }}>
    <span className="eyebrow">VIANTE · ACESSO EMPRESARIAL</span>
    <h1>Seu convite está pronto</h1>
    <p style={{ lineHeight: 1.7 }}>Você confirmou o e-mail <strong>{user.email}</strong> e o segundo fator de segurança. Ao aceitar, seu acesso será ativado exclusivamente para a empresa que enviou o convite.</p>
    {status === 'error' && <p role="alert">Este convite expirou, já foi utilizado por outra conta ou não corresponde ao e-mail autenticado. Solicite outro convite ao administrador.</p>}
    <form method="post" action="/accept-invite/action">
      <input name="invitation_id" type="hidden" value={invite}/>
      <button className="button primary" type="submit">Aceitar convite e ativar meu acesso</button>
    </form>
    <Link href="/entry">Voltar à minha conta</Link>
  </main>;
}
