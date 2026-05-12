import { siteName, supportEmail } from "@/lib/site";

export default function PrivacyPage() {
  return (
    <section className="panel legal-copy">
      <p className="eyebrow">Política de privacidade</p>
      <h1>Como seus dados são tratados.</h1>
      <h2>1. Dados coletados</h2>
      <p>
        Podemos coletar nome, e-mail, dados de login, informações de assinatura e resultados de
        simulados para permitir acesso, suporte e acompanhamento de desempenho.
      </p>
      <h2>2. Uso dos dados</h2>
      <p>
        Os dados são usados para criar conta, validar acesso, exibir desempenho, liberar plano,
        prestar suporte e melhorar a experiência de estudo.
      </p>
      <h2>3. Pagamentos</h2>
      <p>
        Pagamentos são processados pelo Mercado Pago. Dados financeiros, como cartão ou dados
        bancários, não são armazenados diretamente pelo {siteName}.
      </p>
      <h2>4. Autenticação e banco de dados</h2>
      <p>
        A plataforma usa Supabase para login, autenticação e armazenamento de dados essenciais da
        conta. O acesso aos dados deve respeitar regras de segurança e permissão.
      </p>
      <h2>5. Compartilhamento</h2>
      <p>
        Não vendemos dados pessoais. Dados podem ser compartilhados apenas com serviços necessários
        para funcionamento da plataforma, como autenticação, hospedagem e pagamento.
      </p>
      <h2>6. Retenção e exclusão</h2>
      <p>
        Dados podem ser mantidos enquanto a conta existir ou enquanto forem necessários para
        suporte, segurança, histórico de acesso e obrigações legais. O usuário pode solicitar
        revisão ou exclusão de dados pelo e-mail <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>
      <h2>7. Segurança</h2>
      <p>
        Adotamos medidas técnicas para proteger contas e informações, mas nenhum sistema online é
        completamente imune a falhas. O usuário também deve proteger sua senha e seu e-mail.
      </p>
      <h2>8. Atualizações</h2>
      <p>
        Esta política pode ser atualizada para refletir mudanças na plataforma, em fornecedores ou
        em requisitos legais.
      </p>
    </section>
  );
}
