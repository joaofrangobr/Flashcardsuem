import { siteName, supportEmail } from "@/lib/site";

export default function TermsPage() {
  return (
    <section className="panel legal-copy">
      <p className="eyebrow">Termos de uso</p>
      <h1>Regras para usar o {siteName}.</h1>
      <h2>1. Uso da plataforma</h2>
      <p>
        O {siteName} oferece simulados, questões e ferramentas de acompanhamento para fins de
        estudo e revisão. O acesso é individual e não deve ser compartilhado com terceiros.
      </p>
      <h2>2. Conta e segurança</h2>
      <p>
        O usuário é responsável por manter seus dados de login protegidos. Atividades suspeitas,
        compartilhamento indevido de conta ou tentativa de burlar controles de acesso podem
        resultar em bloqueio.
      </p>
      <h2>3. Pagamento e acesso</h2>
      <p>
        O plano Aluno libera acesso individual ao conteúdo disponível na plataforma. Nesta fase,
        pagamentos realizados pelo Mercado Pago podem exigir liberação manual após confirmação.
      </p>
      <h2>4. Conteúdo educacional</h2>
      <p>
        Questões, textos de apoio, enunciados e gabaritos são organizados para estudo. O material
        pode conter referências a provas antigas, fontes públicas ou instituições responsáveis por
        sua elaboração original.
      </p>
      <h2>5. Sem vínculo oficial</h2>
      <p>
        O {siteName} é uma ferramenta independente de estudo. Salvo indicação expressa, não possui
        vínculo oficial com universidades, vestibulares, bancas ou instituições citadas.
      </p>
      <h2>6. Correções e disponibilidade</h2>
      <p>
        Podem ocorrer ajustes em questões, gabaritos, textos, funcionalidades e disponibilidade da
        plataforma. Erros identificados podem ser corrigidos a qualquer momento.
      </p>
      <h2>7. Cancelamento e suporte</h2>
      <p>
        Dúvidas sobre acesso, pagamento, cancelamento ou remoção de conteúdo devem ser enviadas
        para <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>
    </section>
  );
}
