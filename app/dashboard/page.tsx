"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { canAccessPaidContent, getAccessRole, getDisplayName, type AccessRole } from "@/lib/access";

type Profile = { name: string | null; email: string | null; role?: string | null };
type Subscription = { plan_name: string | null; status: string | null; ends_at: string | null };
type StudyAttempt = {
  id: string;
  exam: string;
  study_mode: "pas" | "vestibular";
  total_questions: number;
  answered_questions: number;
  correct_count: number;
  wrong_count: number;
  finished_at: string;
};
type DisciplineHistory = {
  discipline: string;
  total_questions: number;
  answered_questions: number;
  correct_count: number;
  wrong_count: number;
};

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [role, setRole] = useState<AccessRole>("student");
  const [attempts, setAttempts] = useState<StudyAttempt[]>([]);
  const [disciplineHistory, setDisciplineHistory] = useState<DisciplineHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setLoading(false);
        return;
      }

      setEmail(user.email || "");
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name,email,role")
        .eq("id", user.id)
        .maybeSingle();

      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("plan_name,status,ends_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: attemptsData } = await supabase
        .from("study_attempts")
        .select("id,exam,study_mode,total_questions,answered_questions,correct_count,wrong_count,finished_at")
        .eq("user_id", user.id)
        .order("finished_at", { ascending: false })
        .limit(10);

      const { data: disciplineData } = await supabase
        .from("study_attempt_disciplines")
        .select("discipline,total_questions,answered_questions,correct_count,wrong_count")
        .eq("user_id", user.id);

      setProfile(profileData);
      setSubscription(subscriptionData);
      setAttempts((attemptsData || []) as StudyAttempt[]);
      setDisciplineHistory((disciplineData || []) as DisciplineHistory[]);
      setRole(getAccessRole(user.email, profileData?.role));
      setLoading(false);
    }

    load();
  }, []);

  const aggregateDisciplinePerformance = useMemo(() => {
    const byDiscipline = new Map<string, DisciplineHistory>();

    for (const row of disciplineHistory) {
      const current = byDiscipline.get(row.discipline) || {
        discipline: row.discipline,
        total_questions: 0,
        answered_questions: 0,
        correct_count: 0,
        wrong_count: 0,
      };

      current.total_questions += row.total_questions;
      current.answered_questions += row.answered_questions;
      current.correct_count += row.correct_count;
      current.wrong_count += row.wrong_count;

      byDiscipline.set(row.discipline, current);
    }

    return [...byDiscipline.values()]
      .map((discipline) => ({
        ...discipline,
        rate:
          discipline.total_questions > 0
            ? Math.round((discipline.correct_count / discipline.total_questions) * 100)
            : 0,
      }))
      .sort((left, right) => right.rate - left.rate);
  }, [disciplineHistory]);

  const latestAttempt = attempts[0] || null;
  const totalResolved = attempts.reduce((total, attempt) => total + attempt.answered_questions, 0);

  if (loading) {
    return (
      <section className="panel">
        <p>Carregando sua conta...</p>
      </section>
    );
  }

  if (!email) {
    return (
      <section className="panel">
        <p className="eyebrow">Área do aluno</p>
        <h1>Entre para ver sua assinatura.</h1>
        <Link className="button" href="/login">
          Entrar
        </Link>
      </section>
    );
  }

  const active = canAccessPaidContent(role, subscription);
  const isAdmin = role === "admin";
  const bestDiscipline = aggregateDisciplinePerformance[0] || null;

  return (
    <section className="screen-stack">
      <section className="panel dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Área do aluno</p>
          <h1>{getDisplayName(email, profile?.name, profile?.role)}</h1>
          <p className="section-copy">Conta: {profile?.email || email}</p>
          <div className="actions">
            {active ? (
              <Link className="button" href="/study">
                Continuar estudando
              </Link>
            ) : (
              <Link className="button" href="/pricing">
                Ativar plano
              </Link>
            )}
            <Link className="button secondary" href="/terms">
              Ver termos
            </Link>
          </div>
        </div>

        <div className="dashboard-hero-side">
          <article className="hero-card hero-card-strong">
            <p className="eyebrow">Situação atual</p>
            <div className="hero-metrics">
              <div>
                <strong>{isAdmin ? "Admin" : subscription?.plan_name || "Sem plano"}</strong>
                <span>plano</span>
              </div>
              <div>
                <strong>{active ? "Liberado" : "Inativo"}</strong>
                <span>status</span>
              </div>
              <div>
                <strong>
                  {isAdmin
                    ? "Interno"
                    : subscription?.ends_at
                      ? new Date(subscription.ends_at).toLocaleDateString("pt-BR")
                      : "-"}
                </strong>
                <span>validade</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="cards-grid cards-grid-3">
        <article className="panel stat">
          <span>Simulados salvos</span>
          <strong>{attempts.length}</strong>
        </article>
        <article className="panel stat">
          <span>Questões resolvidas</span>
          <strong>{totalResolved}</strong>
        </article>
        <article className="panel stat">
          <span>Melhor disciplina</span>
          <strong>{bestDiscipline ? bestDiscipline.discipline : "Sem dados"}</strong>
        </article>
      </section>

      <section className="cards-grid cards-grid-3">
        <article className="panel quick-panel">
          <p className="eyebrow">Próximo passo</p>
          <h2>Continue o treino</h2>
          <p className="section-copy">
            Volte para os simulados e mantenha o histórico crescendo com novas tentativas.
          </p>
          <Link className="button" href="/study">
            Abrir biblioteca
          </Link>
        </article>

        <article className="panel quick-panel">
          <p className="eyebrow">Última tentativa</p>
          <h2>{latestAttempt ? latestAttempt.exam : "Nenhuma tentativa ainda"}</h2>
          <p className="section-copy">
            {latestAttempt
              ? `${latestAttempt.correct_count} acertos em ${latestAttempt.total_questions} questões com gabarito.`
              : "Finalize um simulado para começar a construir seu histórico."}
          </p>
        </article>

        <article className="panel quick-panel">
          <p className="eyebrow">Foco sugerido</p>
          <h2>{bestDiscipline ? bestDiscipline.discipline : "Monte sua base"}</h2>
          <p className="section-copy">
            {bestDiscipline
              ? `${bestDiscipline.rate}% de aproveitamento acumulado.`
              : "Quanto mais tentativas você salvar, mais clara fica sua evolução por disciplina."}
          </p>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Histórico</p>
        <h2>Últimas tentativas</h2>
        {!attempts.length ? (
          <p className="section-copy">Você ainda não salvou nenhum simulado.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Prova</th>
                  <th>Modo</th>
                  <th>Respondidas</th>
                  <th>Acertos</th>
                  <th>Erros</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>{attempt.exam}</td>
                    <td>{attempt.study_mode === "pas" ? "PAS" : "Vestibular"}</td>
                    <td>
                      {attempt.answered_questions}/{attempt.total_questions}
                    </td>
                    <td>{attempt.correct_count}</td>
                    <td>{attempt.wrong_count}</td>
                    <td>{new Date(attempt.finished_at).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Desempenho</p>
        <h2>Por disciplina</h2>
        {!aggregateDisciplinePerformance.length ? (
          <p className="section-copy">
            Finalize um simulado para começar a ver seu desempenho por disciplina.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Disciplina</th>
                  <th>Respondidas</th>
                  <th>Acertos</th>
                  <th>Erros</th>
                  <th>Aproveitamento</th>
                </tr>
              </thead>
              <tbody>
                {aggregateDisciplinePerformance.map((discipline) => (
                  <tr key={discipline.discipline}>
                    <td>{discipline.discipline}</td>
                    <td>
                      {discipline.answered_questions}/{discipline.total_questions}
                    </td>
                    <td>{discipline.correct_count}</td>
                    <td>{discipline.wrong_count}</td>
                    <td>{discipline.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
