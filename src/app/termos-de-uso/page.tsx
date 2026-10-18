import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalSection, LegalShell } from '@/components/legal/legal-shell';

export const metadata: Metadata = {
  title: 'Termos de Uso | Viante',
  description: 'Condições de utilização da plataforma Viante de gestão de atendimento empresarial.',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <LegalShell title="Termos de Uso" eyebrow="VIANTE · CONDIÇÕES DE UTILIZAÇÃO"
    intro="Estas condições estabelecem regras gerais de acesso e utilização da plataforma Viante, especialmente durante a fase de disponibilização e testes de suas funcionalidades.">
    <LegalSection title="1. A plataforma">
      <p>O Viante disponibiliza recursos de gestão empresarial e de atendimento, alguns ainda em desenvolvimento ou fase de testes. O acesso a recursos específicos depende da contratação, das permissões concedidas e da disponibilidade técnica.</p>
    </LegalSection>
    <LegalSection title="2. Cadastro, contas e permissões">
      <p>O usuário deve utilizar informações corretas, manter suas credenciais protegidas, utilizar autenticação multifator quando exigida e observar as permissões de acesso atribuídas à sua empresa ou unidade.</p>
      <p>O proprietário ou responsável da empresa deve assegurar que convites a funcionários e integrações de canais sejam concedidos apenas a pessoas autorizadas.</p>
    </LegalSection>
    <LegalSection title="3. Integrações e WhatsApp Business">
      <p>A conexão de serviços de terceiros depende da aprovação e das regras dos respectivos provedores. O Viante não assegura elegibilidade à API da Meta, importação integral de histórico ou funcionamento ininterrupto de recursos sujeitos à plataforma WhatsApp Business.</p>
      <p>O cliente empresarial é responsável pelo conteúdo de suas comunicações, pelas bases legais aplicáveis ao tratamento de dados, pela observância das políticas de mensagens e pela obtenção de consentimentos quando exigidos.</p>
    </LegalSection>
    <LegalSection title="4. Uso permitido e segurança">
      <p>Não são permitidas tentativas de acesso não autorizado, distribuição de mensagens abusivas, fraude, violação de direitos de terceiros ou uso da plataforma para fins ilícitos. Poderão ser adotadas medidas proporcionais de proteção e suspensão em caso de risco.</p>
    </LegalSection>
    <LegalSection title="5. Disponibilidade e alterações">
      <p>Funcionalidades em teste podem ser alteradas, pausadas ou descontinuadas. Condições comerciais, níveis de serviço e responsabilidades específicas deverão constar de contratação própria quando disponíveis.</p>
    </LegalSection>
    <LegalSection title="6. Privacidade e contato">
      <p>O tratamento de dados pessoais é descrito na <Link href="/politica-de-privacidade" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Política de Privacidade</Link>. Para dúvidas sobre estes termos, escreva para <a href="mailto:alissonmeespersonal@gmail.com" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>alissonmeespersonal@gmail.com</a>.</p>
    </LegalSection>
  </LegalShell>;
}
