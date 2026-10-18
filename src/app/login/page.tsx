import Link from 'next/link';
import { ArrowRight, Check, MessageSquare, Route, Sparkles, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const statusMessages: Record<string, string> = {
  'check-email': 'Se o endereço estiver apto, você receberá um e-mail com as instruções de confirmação.',
  invalid: 'Verifique as credenciais ou confirme seu e-mail antes de entrar.',
  weak: 'Use uma senha com pelo menos 12 caracteres.',
  'invite-only': 'Novas contas são criadas apenas por convite. O primeiro CEO pode ativar a conta abaixo.',
  limited: 'Muitas tentativas. Aguarde alguns minutos.',
  unavailable: 'Não foi possível acessar o serviço de autenticação. Tente novamente.',
  expired: 'Sua sessão expirou. Entre novamente.',
  signedout: 'Você saiu da plataforma com segurança.',
  'invalid-link': 'O link expirou ou é inválido. Solicite um novo.',
  signin: 'Entre com sua conta para acessar o Viante.',
  unconfirmed: 'Confirme seu e-mail antes de continuar. Consulte sua caixa de entrada.',
};
type Props = { searchParams: Promise<{ mode?: string; status?: string }> };
export default async function Login({ searchParams }: Props) {
  const { mode = 'sign-in', status = '' } = await searchParams;
  const intent = mode === 'recover' ? 'recover' : mode === 'sign-up' ? 'sign-up' : 'sign-in';
  const modeTitle = intent === 'recover' ? 'Recuperar acesso' : intent === 'sign-up' ? 'Ativar conta CEO' : 'Entre na sua conta';
  return <main className="login">
    <section className="login-story">
      <Link className="wordmark" href="/login"><span className="brand-symbol">v</span>viante<span className="wordmark-dot">.</span></Link>
      <div className="story-content">
        <span className="eyebrow">CONEXÕES QUE MOVEM NEGÓCIOS</span>
        <h1>Toda conversa<br/>no lugar <em>certo.</em></h1>
        <p>Mais proximidade com seus clientes.<br/>Mais clareza para sua equipe.</p>
        <div className="story-demo">
          <div className="story-demo-top"><span className="avatar mint">CM</span><div><strong>Uma nova conexão</strong><small>O início de uma boa conversa</small></div><span className="live-dot"/></div>
          <div className="mini-bubble">Olá! Quero saber mais sobre vocês.</div>
          <div className="route-line"><Sparkles size={15}/> Vi identifica e direciona <ArrowRight size={14}/></div>
          <div className="route-card"><Route size={18}/><span>Comercial · Matriz</span><Check size={17}/></div>
        </div>
      </div>
      <footer>Feito para conectar pessoas, equipes e possibilidades.</footer>
    </section>
    <section className="login-form">
      <div className="login-theme"><ThemeToggle/></div>
      <div className="welcome">
        <span className="badge"><ShieldCheck size={13}/> LOGIN SEGURO · SUPABASE AUTH</span>
        <h2>{modeTitle}</h2>
        <p>Gerencie suas empresas e sua equipe com sessões protegidas.</p>
        {statusMessages[status] && <p role="status" style={{ padding: '13px 16px', borderRadius: 9, background: 'var(--elevated)', marginTop: 18 }}>{statusMessages[status]}</p>}
        <form method="post" action="/auth/action" style={{ display: 'grid', gap: 14, marginTop: 24 }}>
          <input type="hidden" name="intent" value={intent}/>
          <label htmlFor="email" style={{ display: 'grid', gap: 7 }}>E-mail
            <input id="email" type="email" name="email" required autoComplete="email" maxLength={254} defaultValue={intent === 'sign-up' ? 'alissonmeespersonal@gmail.com' : undefined} placeholder="seu@email.com"/>
          </label>
          {intent !== 'recover' && <label htmlFor="password" style={{ display: 'grid', gap: 7 }}>Senha
            <input id="password" type="password" name="password" required minLength={intent === 'sign-up' ? 12 : 1} maxLength={128} autoComplete={intent === 'sign-up' ? 'new-password' : 'current-password'} placeholder="Digite sua senha"/>
          </label>}
          <button className="button primary login-cta" type="submit">
            {intent === 'recover' ? 'Enviar recuperação' : intent === 'sign-up' ? 'Criar conta e confirmar e-mail' : 'Entrar no Viante'} <ArrowRight size={18}/>
          </button>
        </form>
        <div style={{ marginTop: 22, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
          {intent !== 'sign-in' && <Link href="/login">Já tenho conta</Link>}
          {intent !== 'recover' && <Link href="/login?mode=recover">Esqueci minha senha</Link>}
          {intent !== 'sign-up' && <Link href="/login?mode=sign-up">Primeira ativação CEO</Link>}
        </div>
        <div className="phase-note" style={{ marginTop: 24 }}>
          <span className="tiny-label">ÁREA ADMINISTRATIVA</span>
          <p>O acesso CEO requer e-mail confirmado e autenticação de dois fatores. Outros usuários serão convidados pela empresa.</p>
        </div>
      </div>
      <footer>Viante · Toda conversa no lugar certo.</footer>
    </section>
  </main>;
}
