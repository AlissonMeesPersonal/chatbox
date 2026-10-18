import { redirect } from 'next/navigation';
import { getIdentity } from '@/lib/auth';
type Props = { searchParams: Promise<{ status?: string }> };
export default async function ResetPassword({ searchParams }: Props) {
  if (!(await getIdentity())) redirect('/login?status=signin');
  const { status } = await searchParams;
  return <main style={{ maxWidth: 440, margin: '12vh auto', padding: 24 }}>
    <h1>Definir nova senha</h1>
    <p style={{ margin: '20px 0' }}>Use pelo menos 12 caracteres. A nova senha será salva no Supabase Auth.</p>
    {status && <p role="status">Não foi possível alterar a senha. Tente novamente.</p>}
    <form method="post" action="/auth/action" style={{ display: 'grid', gap: 14 }}>
      <input type="hidden" name="intent" value="update-password"/>
      <input type="password" name="password" minLength={12} maxLength={128} required autoComplete="new-password" aria-label="Nova senha"/>
      <button className="button primary" type="submit">Salvar nova senha</button>
    </form>
  </main>;
}
