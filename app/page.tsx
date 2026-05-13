import Link from "next/link";

const highlights = [
  "Abra o link e já comece a estudar",
  "Progresso salvo no próprio aparelho",
  "Login opcional para sincronizar o perfil",
];

const steps = [
  { title: "Entre e estude", copy: "A biblioteca já abre pronta para o aluno resolver questões sem depender de cadastro." },
  { title: "Corrija", copy: "Cada questão fica marcada por cor: verde no acerto completo, laranja no parcial e vermelho no erro." },
  { title: "Sincronize", copy: "Se o aluno entrar na conta, o mesmo progresso pode ficar salvo também no Supabase." },
];

export default function HomePage() {
  return (
    <section className="screen-stack">
      <section className="home-hero home-hero-refined">
        <div className="hero-copy">
          <p className="eyebrow">UEM Estudos</p>
          <h1>Estude primeiro. O login fica só para salvar o perfil.</h1>
          <p className="section-copy">
            A plataforma agora ficou mais direta: a pessoa abre o site e já pode começar o estudo.
            O histórico básico fica salvo no aparelho e o perfil completo pode ser sincronizado depois.
          </p>
          <div className="actions">
            <Link className="button" href="/study">
              Estudar agora
            </Link>
            <Link className="button secondary" href="/login">
              Entrar para salvar perfil
            </Link>
          </div>
          <div className="hero-badges">
            {highlights.map((item) => (
              <span className="hero-badge" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-side">
          <article className="hero-card hero-card-strong">
            <p className="eyebrow">Como funciona</p>
            <div className="hero-metrics">
              <div>
                <strong>Sem bloqueio</strong>
                <span>abriu o link, já estuda</span>
              </div>
              <div>
                <strong>Com cores</strong>
                <span>verde, laranja e vermelho</span>
              </div>
              <div>
                <strong>Com conta</strong>
                <span>perfil sincronizado</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="cards-grid cards-grid-3">
        {steps.map((step) => (
          <article className="panel feature-panel" key={step.title}>
            <p className="eyebrow">{step.title}</p>
            <p className="feature-copy">{step.copy}</p>
          </article>
        ))}
      </section>
    </section>
  );
}
