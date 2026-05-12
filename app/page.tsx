import Link from "next/link";

const highlights = [
  "PAS e vestibulares antigos no mesmo acervo",
  "Histórico salvo na conta",
  "Resultado final com revisão por disciplina",
];

const steps = [
  { title: "Entre", copy: "Crie sua conta e ative o plano para estudar no seu ritmo." },
  { title: "Resolva", copy: "Marque as assertivas, confira o gabarito e avance com fluidez." },
  { title: "Revise", copy: "Volte aos erros, veja o texto de apoio e acompanhe sua evolução." },
];

export default function HomePage() {
  return (
    <section className="screen-stack">
      <section className="home-hero home-hero-refined">
        <div className="hero-copy">
          <p className="eyebrow">UEM Estudos</p>
          <h1>Estudo organizado, correção rápida e histórico real de desempenho.</h1>
          <p className="section-copy">
            Uma plataforma feita para treinar com questões da UEM, revisar com clareza e acompanhar
            sua evolução sem se perder em PDF solto ou planilha improvisada.
          </p>
          <div className="actions">
            <Link className="button" href="/login">
              Criar conta
            </Link>
            <Link className="button secondary" href="/pricing">
              Ver plano aluno
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
            <p className="eyebrow">Hoje na plataforma</p>
            <div className="hero-metrics">
              <div>
                <strong>PAS</strong>
                <span>por ano e etapa</span>
              </div>
              <div>
                <strong>Vestibular</strong>
                <span>acervo estruturado</span>
              </div>
              <div>
                <strong>Histórico</strong>
                <span>salvo na conta</span>
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
