import { redirect } from 'next/navigation';
import { getIdentity } from '@/lib/auth';
import { MfaSetup } from './setup';

type Props = { searchParams: Promise<{ next?: string }> };
export default async function MfaPage({ searchParams }: Props) {
  const identity = await getIdentity();
  if (!identity) redirect('/login?status=signin');
  if (!identity.email_confirmed_at) redirect('/login?status=unconfirmed');
  const { next: nextPath } = await searchParams;
  const next = nextPath && /^\/accept-(?:unit-)?invite\?invite=[0-9a-f-]{36}$/i.test(nextPath) ? nextPath : '/entry';
  const factors = (identity as { factors?: Array<{ id: string; status: string; factor_type: string }> }).factors ?? [];
  const verifiedTotp = factors.find(f => f.factor_type === 'totp' && f.status === 'verified');
  return <main style={{ maxWidth: 470, margin: '8vh auto', padding: 24 }}>
    <h1>Verificação em duas etapas</h1>
    <p style={{ margin: '16px 0 26px', lineHeight: 1.6 }}>
      Proteja seu acesso ao Viante com um aplicativo autenticador. Nenhuma senha temporária é gerada.
    </p>
    <MfaSetup existingFactorId={verifiedTotp?.id ?? null} next={next}/>
  </main>;
}
