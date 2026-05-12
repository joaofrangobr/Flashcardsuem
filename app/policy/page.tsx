import Link from "next/link";
import { siteName, supportEmail } from "@/lib/site";

export default function PolicyPage() {
  return (
    <section className="panel legal-copy">
      <p className="eyebrow">Aviso de conteúdo</p>
      <h1>Origem das provas e responsabilidade.</h1>
      <p>
        Este aplicativo organiza questões de provas antigas para estudo, revisão e simulado.
        Provas, enunciados, textos de apoio e gabaritos podem pertencer aos seus respectivos
        autores, instituições organizadoras ou fontes originais.
      </p>
      <p>
        O {siteName} é uma ferramenta independente. Salvo indicação expressa, não possui vínculo
        oficial com universidades, vestibulares, bancas ou instituições citadas.
      </p>
      <p>
        O app não substitui materiais oficiais. Gabaritos, textos e classificações devem ser
        conferidos periodicamente com as fontes originais.
      </p>
      <p>
        Pedidos de correção, revisão ou remoção de conteúdo podem ser enviados para{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>
      <div className="actions">
        <Link className="button" href="/terms">
          Termos de uso
        </Link>
        <Link className="button secondary" href="/privacy">
          Política de privacidade
        </Link>
      </div>
    </section>
  );
}
