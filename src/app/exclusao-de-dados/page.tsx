import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalSection, LegalShell } from '@/components/legal/legal-shell';

export const metadata: Metadata = {
  title: 'Exclusão de Dados | Viante',
  description: 'Como solicitar acesso, correção ou exclusão de dados pessoais tratados pela plataforma Viante.',
  robots: { index: true, follow: true },
};

export default function DataDeletionPage() {
  return <LegalShell title="Exclusão de dados" eyebrow="VIANTE · DIREITOS DO TITULAR"
    intro="Você pode solicitar a avaliação de exclusão ou correção de seus dados pessoais, respeitando as obrigações legais e o papel de cada empresa responsável.">
    <LegalSection title="Como solicitar">
      <p>Envie um e-mail para <a href="mailto:alissonmeespersonal@gmail.com?subject=Viante%20-%20Solicita%C3%A7%C3%A3o%20de%20exclus%C3%A3o%20de%20dados" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>alissonmeespersonal@gmail.com</a>, com o assunto <strong>Solicitação de exclusão de dados — Viante</strong>.</p>
      <p>Descreva se sua solicitação refere-se à conta de acesso, a uma empresa ou a uma conversa recebida de um número empresarial. Informe apenas os elementos mínimos para localizar o registro. Não envie senha, código de acesso, PIN do WhatsApp ou dados sensíveis por e-mail.</p>
    </LegalSection>
    <LegalSection title="O que acontece depois">
      <p>Confirmaremos o recebimento da solicitação e poderemos pedir uma verificação proporcional da identidade para proteger os dados de terceiros.</p>
      <p>Após a análise, removeremos, anonimizaremos ou restringiremos os dados quando cabível, levando em conta obrigações de retenção e interesses legítimos previstos em lei. Se os dados forem controlados por uma empresa cliente, poderemos encaminhar a solicitação ao responsável ou indicar como contatá-lo.</p>
      <p>Você receberá uma resposta com o encaminhamento adotado e, quando houver impedimento legal, a justificativa aplicável. Dados sob controle direto da Meta ou do WhatsApp também devem ser tratados pelos respectivos canais de privacidade.</p>
    </LegalSection>
    <LegalSection title="Mais informações">
      <p>Consulte a <Link href="/politica-de-privacidade" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Política de Privacidade do Viante</Link> para saber quais categorias de dados podem ser tratadas e quais são os direitos dos titulares.</p>
    </LegalSection>
  </LegalShell>;
}
