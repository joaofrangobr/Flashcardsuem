import { Suspense } from "react";
import Link from "next/link";
import { PricingCheckoutButton } from "@/components/pricing-checkout-button";
import { supportEmail } from "@/lib/site";

export default function PricingPage() {
  return (
    <section className="screen-stack">
      <section className="section-head">
        <p className="eyebrow">Plano</p>
        <h1>Plano Aluno</h1>
        <p className="section-copy">
          Acesso individual aos simulados, área do aluno e acompanhamento de desempenho.
        </p>
      </section>
      <section className="pricing-single">
        <article className="panel price-card">
          <span className="eyebrow">Aluno</span>
          <strong>R$ 19,90/mês</strong>
          <p>Ideal para estudar com provas e simulados em uma conta individual.</p>
          <Suspense fallback={<button className="button" disabled>Abrindo checkout...</button>}>
            <PricingCheckoutButton />
          </Suspense>
        </article>
      </section>
      <section className="panel">
        <h2>Depois do pagamento</h2>
        <p className="section-copy">
          Depois que o Mercado Pago confirmar a operação, o acesso é liberado automaticamente no
          seu login. Dúvidas podem ser enviadas para{" "}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
        </p>
        <div className="actions">
          <Link className="button secondary" href="/terms">
            Termos de uso
          </Link>
          <Link className="button secondary" href="/privacy">
            Política de privacidade
          </Link>
        </div>
      </section>
    </section>
  );
}
