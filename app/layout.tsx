import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "UEM Estudos",
  description: "Treino de provas antigas da UEM com login, planos e desempenho."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        <main className="page-shell">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
