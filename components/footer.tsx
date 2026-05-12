import Link from "next/link";
import { siteName, supportEmail } from "@/lib/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <strong>{siteName}</strong>
          <p>Treino organizado com provas antigas, revisão guiada e histórico real de desempenho.</p>
        </div>
        <div className="footer-links">
          <Link href="/pricing">Plano aluno</Link>
          <Link href="/terms">Termos</Link>
          <Link href="/privacy">Privacidade</Link>
          <Link href="/policy">Origem das provas</Link>
        </div>
        <div className="footer-contact">
          <span>Contato</span>
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
        </div>
      </div>
    </footer>
  );
}
