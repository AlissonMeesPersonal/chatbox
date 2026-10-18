import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalSection, LegalShell } from '@/components/legal/legal-shell';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Viante',
  description: 'Como o Viante trata dados pessoais em sua plataforma de atendimento, gestão empresarial e integrações autorizadas.',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <LegalShell title="Política de Privacidade" eyebrow="VIANTE · PRIVACIDADE E DADOS"
    intro="Explicamos quais informações são tratadas na plataforma Viante, por quais motivos, com quem podem ser compartilhadas e como você pode exercer seus direitos.">
    <LegalSection title="1. Quem somos e a quem esta política se aplica">
      <p>O Viante é uma plataforma de atendimento e gestão de comunicações empresariais, acessível pelo endereço chatbox-cyan-five.vercel.app. Para dúvidas sobre esta política e solicitações relativas a dados, escreva para <a href="mailto:alissonmeespersonal@gmail.com" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>alissonmeespersonal@gmail.com</a>.</p>
      <p>Esta política abrange visitantes, usuários das empresas cadastradas e contatos cujas mensagens possam ser processadas quando uma empresa conecta, de forma autorizada, um canal de comunicação.</p>
      <p>Em regra, a empresa cliente define as finalidades e bases legais relacionadas aos seus próprios consumidores e atua como controladora desses dados; o Viante atua como operador, seguindo as instruções e autorizações contratuais aplicáveis. Para dados relativos ao cadastro, à segurança e à administração da própria plataforma, o responsável pelo Viante pode atuar como controlador.</p>
    </LegalSection>
    <LegalSection title="2. Quais dados podemos tratar">
      <p><strong>Cadastro e administração:</strong> nome, e-mail, dados da empresa e de suas unidades, perfil de acesso, convites, permissões e registros de segurança relacionados à autenticação.</p>
      <p><strong>Comunicações:</strong> quando integrações oficiais estiverem habilitadas e autorizadas, identificadores de contatos e números de telefone, mensagens recebidas ou enviadas, data e horário, informações de roteamento, eventos de atendimento e status de entrega. Recursos de histórico e mídia dependem das funções efetivamente ativadas.</p>
      <p><strong>Dados técnicos:</strong> informações necessárias ao funcionamento e proteção do serviço, como sessões, endereços IP em logs operacionais, eventos de erro e registros de auditoria, conforme os recursos e provedores utilizados.</p>
      <p>Não solicitamos senhas, códigos de autenticação do WhatsApp ou dados financeiros dos consumidores por meio dos fluxos de atendimento de demonstração.</p>
    </LegalSection>
    <LegalSection title="3. Para quais finalidades">
      <p>Operar contas empresariais e suas unidades; autenticar usuários; controlar permissões; disponibilizar canais de atendimento autorizados; receber, exibir ou enviar comunicações quando o recurso estiver ativo; executar automações configuradas pela empresa; prestar suporte; prevenir abuso e acessos indevidos; e cumprir obrigações legais.</p>
      <p>As bases legais dependem da finalidade e do papel de cada parte, podendo incluir execução contratual, cumprimento de obrigação legal, legítimo interesse sujeito à avaliação aplicável e consentimento quando necessário. O cliente empresarial deve garantir a legitimidade do tratamento relativo aos seus contatos.</p>
    </LegalSection>
    <LegalSection title="4. Integração com WhatsApp e Meta">
      <p>A conexão de um número comercial exige autorização expressa da empresa através dos mecanismos oficiais da Meta, conforme disponibilidade e elegibilidade. Se essa integração for habilitada, informações necessárias ao atendimento serão compartilhadas ou recebidas por meio da Plataforma WhatsApp Business e APIs da Meta, de acordo com suas políticas.</p>
      <p>O Viante não acessa automaticamente o histórico integral de conversas do aparelho. Qualquer sincronização de histórico depende do recurso suportado, das autorizações e de implementação específica. Respostas automáticas somente devem operar quando autorizadas pela empresa.</p>
      <p>Consulte também a <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Política de Privacidade do WhatsApp</a>.</p>
    </LegalSection>
    <LegalSection title="5. Operadores, infraestrutura e transferências">
      <p>A plataforma utiliza serviços técnicos que podem tratar dados necessários à prestação do serviço, incluindo Supabase (autenticação, banco de dados e armazenamento associado) e Vercel (hospedagem e execução da aplicação). A Meta pode atuar no processamento de comunicações quando a integração WhatsApp estiver ativa.</p>
      <p>Dependendo da localização dos serviços e das configurações contratadas, poderá haver tratamento ou transferência internacional de dados, observados os mecanismos e requisitos legais aplicáveis. Não vendemos bases de contatos ou conversas a anunciantes.</p>
    </LegalSection>
    <LegalSection title="6. Armazenamento, proteção e retenção">
      <p>Adotamos mecanismos como autenticação, controle de acesso por empresa e unidade, permissões no banco de dados e proteção de credenciais para reduzir riscos de acesso indevido. Nenhum serviço conectado à internet pode garantir segurança absoluta.</p>
      <p>Os dados são conservados pelo período necessário às finalidades informadas, à prestação do serviço, à segurança e às obrigações legais. Os prazos variam conforme o tipo de registro, o contrato da empresa e a legislação aplicável. Solicitações de exclusão são avaliadas considerando deveres legais de retenção e possíveis direitos de terceiros.</p>
    </LegalSection>
    <LegalSection title="7. Cookies e sessões">
      <p>Podemos utilizar cookies e informações de sessão essenciais à autenticação, à proteção contra acessos indevidos e às preferências de interface, como o tema claro ou escuro. Integrações externas podem ter seus próprios mecanismos, conforme suas políticas e a autorização do usuário.</p>
    </LegalSection>
    <LegalSection title="8. Direitos dos titulares e solicitações">
      <p>Nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD), você pode solicitar, conforme aplicável, confirmação e acesso, correção, anonimização ou exclusão, informações sobre compartilhamento, portabilidade e revisão de decisões quando couber.</p>
      <p>Envie a solicitação para <a href="mailto:alissonmeespersonal@gmail.com?subject=Viante%20-%20Privacidade%20e%20dados" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>alissonmeespersonal@gmail.com</a>, sem encaminhar senhas ou códigos de acesso. Poderemos solicitar meios razoáveis de confirmação de identidade. Se a empresa cliente for a controladora dos dados, encaminharemos ou orientaremos o contato com a empresa responsável, conforme aplicável.</p>
      <p>Para mais orientações, consulte nossa página de <Link href="/exclusao-de-dados" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>exclusão de dados</Link>.</p>
    </LegalSection>
    <LegalSection title="9. Alterações desta política">
      <p>Esta política poderá ser atualizada conforme a evolução das funcionalidades, obrigações legais e fornecedores. A data da última atualização será indicada nesta página. Alterações relevantes poderão ser comunicadas pelos canais apropriados.</p>
    </LegalSection>
  </LegalShell>;
}
