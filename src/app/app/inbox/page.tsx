import { redirect } from 'next/navigation';
import { accessToken, getIdentity, isPlatformAdmin } from '@/lib/auth';
export default async function InboxPage() {
 const user = await getIdentity();
 const token = await accessToken();
 if (!user || !token) redirect('/login?status=signin');
 if (await isPlatformAdmin(user.id,token)) redirect('/admin');
 return <main style={{maxWidth:720,margin:'12vh auto',padding:24}}><h1>Atendimento Viante</h1><p style={{marginTop:16}}>Sua sessão está autenticada. O acesso às conversas reais será liberado após o cadastro da sua empresa e autorização da equipe.</p><p style={{marginTop:20}}><a href="/demo">Abrir demonstração com dados fictícios</a></p></main>;
}
