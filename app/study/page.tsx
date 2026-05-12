"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { canAccessPaidContent, getAccessRole, type AccessRole } from "@/lib/access";
import {
  StructuredBank,
  StructuredQuestion,
  normalizeDisciplineLabel,
  normalizeExamLabel,
  normalizePasStructuredBank,
} from "@/lib/pas-structured";
import {
  saveStudyAttempt,
  type AttemptAnswerInput,
  type DisciplineResult,
  type StudyMode,
} from "@/lib/study-history";

const answerCodes = [16, 8, 4, 2, 1];
const mojibakePattern =
  /ÃƒÆ’|Ãƒâ€š|ÃƒÂ¢Ã¢â€šÂ¬|ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢|ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ|ÃƒÂ¢Ã¢â€šÂ¬\x9d|ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“|ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â/;

type AttemptSummary = {
  exam: string;
  totalQuestions: number;
  answeredQuestions: number;
  unansweredQuestions: number;
  questionsWithoutOfficial: number;
  correctCount: number;
  wrongCount: number;
  disciplines: DisciplineResult[];
  answers: AttemptAnswerInput[];
  attemptId?: string;
};

type ReviewFilter = "all" | "correct" | "wrong" | "pending" | "noOfficial";

function splitOfficialAnswer(value?: number | null) {
  if (value === null || value === undefined || value < 0) return [] as string[];
  if (value === 0) return ["00"];

  let remaining = value;
  const selected: string[] = [];

  for (const code of answerCodes) {
    if (remaining >= code) {
      selected.push(String(code).padStart(2, "0"));
      remaining -= code;
    }
  }

  return selected.reverse();
}

function sumSelectedCodes(codes: string[]) {
  return codes.reduce((total, code) => total + Number.parseInt(code, 10), 0);
}

function fixMojibake(value: string) {
  if (!value || !mojibakePattern.test(value)) return value;

  try {
    const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0)));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return value;
  }
}

function cleanText(value?: string | null) {
  if (!value) return "";

  return fixMojibake(value)
    .replace(/- - - - - - -/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s([,.;:!?])/g, "$1")
    .trim();
}

function normalizeBank(bank: StructuredBank): StructuredBank {
  return {
    disciplines: bank.disciplines.map((discipline) => normalizeDisciplineLabel(cleanText(discipline))),
    exams: bank.exams.map((exam) => normalizeExamLabel(cleanText(exam))),
    questions: bank.questions.map((question) => ({
      ...question,
      exam: normalizeExamLabel(cleanText(question.exam)),
      discipline: normalizeDisciplineLabel(cleanText(question.discipline)),
      prompt: cleanText(question.prompt),
      officialAnswerSource: question.officialAnswerSource
        ? cleanText(question.officialAnswerSource)
        : question.officialAnswerSource,
      officialStatus: question.officialStatus ? cleanText(question.officialStatus) : question.officialStatus,
      supportText: question.supportText ? cleanText(question.supportText) : question.supportText,
      supportTitle: question.supportTitle ? cleanText(question.supportTitle) : question.supportTitle,
      supportRange: question.supportRange ? cleanText(question.supportRange) : question.supportRange,
      pdfUrl: question.pdfUrl ? cleanText(question.pdfUrl) : question.pdfUrl,
      sourceUrl: question.sourceUrl ? cleanText(question.sourceUrl) : question.sourceUrl,
      statements: question.statements.map((statement) => ({
        code: cleanText(statement.code),
        text: cleanText(statement.text),
      })),
    })),
  };
}

function isImplicitZeroAnswer(question: StructuredQuestion, selectedCodes: string[]) {
  return question.officialAnswer === 0 && selectedCodes.length === 0;
}

function StructuredQuestionBrowser({
  bank,
  selectedExam,
  onSelectExam,
  selectedQuestionId,
  onSelectQuestionId,
  title,
  eyebrow,
  description,
  isAdmin,
  studyMode,
  userId,
}: {
  bank: StructuredBank;
  selectedExam: string;
  onSelectExam: (value: string) => void;
  selectedQuestionId: string;
  onSelectQuestionId: (value: string) => void;
  title: string;
  eyebrow: string;
  description: string;
  isAdmin: boolean;
  studyMode: StudyMode;
  userId: string;
}) {
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, string[]>>({});
  const [revealedByQuestion, setRevealedByQuestion] = useState<Record<string, boolean>>({});
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [attemptSummary, setAttemptSummary] = useState<AttemptSummary | null>(null);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const questionViewerRef = useRef<HTMLElement | null>(null);

  const questions = useMemo(
    () => bank.questions.filter((question) => question.exam === selectedExam),
    [bank.questions, selectedExam],
  );

  const selectedQuestion =
    questions.find((question) => question.id === selectedQuestionId) || questions[0];

  const selectedCodes = selectedQuestion ? answersByQuestion[selectedQuestion.id] || [] : [];
  const selectedSum = sumSelectedCodes(selectedCodes);
  const officialCodes = selectedQuestion ? splitOfficialAnswer(selectedQuestion.officialAnswer) : [];
  const isRevealed = selectedQuestion ? Boolean(revealedByQuestion[selectedQuestion.id]) : false;
  const isLastQuestion = selectedQuestion
    ? questions.findIndex((question) => question.id === selectedQuestion.id) === questions.length - 1
    : true;

  const isCorrect =
    selectedQuestion?.officialAnswer !== null && selectedQuestion?.officialAnswer !== undefined
      ? selectedSum === selectedQuestion.officialAnswer
      : null;

  function toggleStatement(code: string) {
    if (!selectedQuestion) return;

    setAttemptSummary(null);
    setSaveMessage("");
    setAnswersByQuestion((current) => {
      const existing = current[selectedQuestion.id] || [];
      const next = existing.includes(code)
        ? existing.filter((value) => value !== code)
        : [...existing, code].sort(
            (left, right) => Number.parseInt(left, 10) - Number.parseInt(right, 10),
          );

      return {
        ...current,
        [selectedQuestion.id]: next,
      };
    });

    setRevealedByQuestion((current) => ({
      ...current,
      [selectedQuestion.id]: false,
    }));
  }

  function revealAnswer() {
    if (!selectedQuestion) return;

    setAttemptSummary(null);
    setSaveMessage("");
    setRevealedByQuestion((current) => ({
      ...current,
      [selectedQuestion.id]: true,
    }));
  }

  function clearSelection() {
    if (!selectedQuestion) return;

    setAttemptSummary(null);
    setSaveMessage("");
    setAnswersByQuestion((current) => ({
      ...current,
      [selectedQuestion.id]: [],
    }));

    setRevealedByQuestion((current) => ({
      ...current,
      [selectedQuestion.id]: false,
    }));
  }

  function resetAttempt() {
    setAnswersByQuestion({});
    setRevealedByQuestion({});
    setAttemptSummary(null);
    setSaveMessage("");
    setReviewFilter("all");
    if (questions[0]) {
      onSelectQuestionId(questions[0].id);
      window.requestAnimationFrame(() => {
        questionViewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function goToNextQuestion() {
    if (!selectedQuestion) return;

    const currentIndex = questions.findIndex((question) => question.id === selectedQuestion.id);
    const nextQuestion = questions[currentIndex + 1];

    if (nextQuestion) {
      onSelectQuestionId(nextQuestion.id);
      window.requestAnimationFrame(() => {
        questionViewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function buildAttemptData() {
    const answerRows: AttemptAnswerInput[] = questions.map((question) => {
      const selected = answersByQuestion[question.id] || [];
      const selectedTotal = sumSelectedCodes(selected);
      const official = question.officialAnswer;
      const hasOfficialAnswer = official !== null && official !== undefined;

      return {
        questionId: question.id,
        questionNumber: question.number,
        discipline: question.discipline,
        selectedCodes: selected,
        selectedSum: selectedTotal,
        officialAnswer: official,
        isCorrect: hasOfficialAnswer ? selectedTotal === official : null,
      };
    });

    const answerableRows = answerRows.filter((row) => row.officialAnswer !== null);
    const answeredRows = answerableRows.filter(
      (row) => row.selectedCodes.length > 0 || row.officialAnswer === 0,
    );
    const unansweredRows = answerableRows.filter(
      (row) => row.selectedCodes.length === 0 && row.officialAnswer !== 0,
    );
    const correctRows = answeredRows.filter((row) => row.isCorrect === true);
    const wrongRows = answeredRows.filter((row) => row.officialAnswer !== null && row.isCorrect === false);
    const rowsWithoutOfficial = answerRows.filter((row) => row.officialAnswer === null);

    const byDiscipline = new Map<string, DisciplineResult>();
    for (const row of answerRows) {
      if (row.officialAnswer === null) continue;

      const current = byDiscipline.get(row.discipline) || {
        discipline: row.discipline,
        totalQuestions: 0,
        answeredQuestions: 0,
        correctCount: 0,
        wrongCount: 0,
      };

      const wasAnswered = row.selectedCodes.length > 0 || row.officialAnswer === 0;

      current.totalQuestions += 1;
      if (wasAnswered) current.answeredQuestions += 1;
      if (row.isCorrect === true) current.correctCount += 1;
      if (wasAnswered && row.isCorrect === false) current.wrongCount += 1;

      byDiscipline.set(row.discipline, current);
    }

    return {
      totalQuestions: answerableRows.length,
      answeredQuestions: answeredRows.length,
      unansweredQuestions: unansweredRows.length,
      questionsWithoutOfficial: rowsWithoutOfficial.length,
      correctCount: correctRows.length,
      wrongCount: wrongRows.length,
      answers: answerRows,
      disciplines: [...byDiscipline.values()].sort((left, right) =>
        left.discipline.localeCompare(right.discipline, "pt-BR"),
      ),
    };
  }

  async function finalizeAttempt() {
    if (!userId) {
      setSaveMessage("Entre com sua conta para salvar o histórico deste simulado.");
      return;
    }

    const data = buildAttemptData();
    setSavingAttempt(true);
    setSaveMessage("");

    try {
      const attemptId = await saveStudyAttempt({
        userId,
        exam: selectedExam,
        studyMode,
        totalQuestions: data.totalQuestions,
        answeredQuestions: data.answeredQuestions,
        correctCount: data.correctCount,
        wrongCount: data.wrongCount,
        answers: data.answers,
        disciplines: data.disciplines,
      });

      setAttemptSummary({
        exam: selectedExam,
        totalQuestions: data.totalQuestions,
        answeredQuestions: data.answeredQuestions,
        unansweredQuestions: data.unansweredQuestions,
        questionsWithoutOfficial: data.questionsWithoutOfficial,
        correctCount: data.correctCount,
        wrongCount: data.wrongCount,
        disciplines: data.disciplines,
        answers: data.answers,
        attemptId,
      });
      setReviewFilter("all");

      setSaveMessage("Resultado salvo no histórico da conta.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Não foi possível salvar o histórico.");
    } finally {
      setSavingAttempt(false);
    }
  }

  useEffect(() => {
    if (!questions.length) return;

    if (!questions.some((question) => question.id === selectedQuestionId)) {
      onSelectQuestionId(questions[0].id);
    }
  }, [onSelectQuestionId, questions, selectedQuestionId]);

  const reviewQuestions = useMemo(() => {
    if (!attemptSummary) return [] as Array<{ question: StructuredQuestion; answer: AttemptAnswerInput }>;

    const answerById = new Map(attemptSummary.answers.map((answer) => [answer.questionId, answer]));

    return questions
      .map((question) => {
        const answer = answerById.get(question.id);
        return answer ? { question, answer } : null;
      })
      .filter((entry): entry is { question: StructuredQuestion; answer: AttemptAnswerInput } => Boolean(entry))
      .filter((entry) => {
        const wasAnswered = entry.answer.selectedCodes.length > 0 || entry.answer.officialAnswer === 0;

        if (reviewFilter === "all") return true;
        if (reviewFilter === "correct") return entry.answer.isCorrect === true;
        if (reviewFilter === "wrong") {
          return entry.answer.officialAnswer !== null && wasAnswered && entry.answer.isCorrect === false;
        }
        if (reviewFilter === "pending") {
          return entry.answer.officialAnswer !== null && !wasAnswered;
        }
        return entry.answer.officialAnswer === null;
      });
  }, [attemptSummary, questions, reviewFilter]);

  function openQuestionFromReview(questionId: string) {
    onSelectQuestionId(questionId);
    setAttemptSummary(null);
    setSaveMessage("");
    window.requestAnimationFrame(() => {
      questionViewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <>
      <section className="panel">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="section-copy">{description}</p>
        <div className="actions">
          <label className="wide-field">
            Prova
            <select
              value={selectedExam}
              onChange={(event) => {
                setAttemptSummary(null);
                setSaveMessage("");
                onSelectExam(event.target.value);
              }}
            >
              {bank.exams.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </label>
          <div className="library-stat">
            <strong>{questions.length}</strong>
            <span>questões nesta prova</span>
          </div>
          <div className="library-stat">
            <strong>{bank.questions.length}</strong>
            <span>questões no acervo</span>
          </div>
        </div>
      </section>

      {attemptSummary ? (
        <section className="screen-stack">
          <section className="panel result-hero">
            <p className="eyebrow">Resultado final</p>
            <h2>{attemptSummary.exam}</h2>
            <p className="section-copy">
              Seu simulado foi finalizado e salvo no histórico. Agora ficou mais claro revisar o
              que entrou bem, o que ficou pendente e o que ainda precisa de reforço.
            </p>
            <div className="cards-grid cards-grid-3">
              <article className="panel stat">
                <span>Aproveitamento</span>
                <strong>
                  {attemptSummary.totalQuestions > 0
                    ? Math.round((attemptSummary.correctCount / attemptSummary.totalQuestions) * 100)
                    : 0}
                  %
                </strong>
              </article>
              <article className="panel stat">
                <span>Acertos</span>
                <strong>{attemptSummary.correctCount}</strong>
              </article>
              <article className="panel stat">
                <span>Erros</span>
                <strong>{attemptSummary.wrongCount}</strong>
              </article>
            </div>
            <div className="cards-grid cards-grid-3">
              <article className="panel stat">
                <span>Questões com gabarito</span>
                <strong>{attemptSummary.totalQuestions}</strong>
              </article>
              <article className="panel stat">
                <span>Respondidas</span>
                <strong>{attemptSummary.answeredQuestions}</strong>
              </article>
              <article className="panel stat">
                <span>Pendentes</span>
                <strong>{attemptSummary.unansweredQuestions}</strong>
              </article>
            </div>
            {attemptSummary.questionsWithoutOfficial > 0 && (
              <p className="notice">
                {attemptSummary.questionsWithoutOfficial} questão(ões) desta prova ainda estão sem
                gabarito oficial ligado no banco e, por isso, não entram na nota.
              </p>
            )}
            <div className="actions">
              <button type="button" className="button" onClick={resetAttempt}>
                Refazer simulado
              </button>
              <Link className="button secondary" href="/dashboard">
                Ver histórico na área do aluno
              </Link>
            </div>
            {saveMessage && <p className="notice">{saveMessage}</p>}
          </section>

          <section className="panel">
            <p className="eyebrow">Desempenho</p>
            <h2>Por disciplina</h2>
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
                  {attemptSummary.disciplines.map((discipline) => {
                    const rate =
                      discipline.totalQuestions > 0
                        ? Math.round((discipline.correctCount / discipline.totalQuestions) * 100)
                        : 0;

                    return (
                      <tr key={`${attemptSummary.exam}-${discipline.discipline}`}>
                        <td>{discipline.discipline}</td>
                        <td>
                          {discipline.answeredQuestions}/{discipline.totalQuestions}
                        </td>
                        <td>{discipline.correctCount}</td>
                        <td>{discipline.wrongCount}</td>
                        <td>{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <p className="eyebrow">Revisão</p>
            <h2>Questão por questão</h2>
            <div className="actions review-filters">
              <button
                type="button"
                className={reviewFilter === "all" ? "button" : "button secondary"}
                onClick={() => setReviewFilter("all")}
              >
                Todas
              </button>
              <button
                type="button"
                className={reviewFilter === "correct" ? "button" : "button secondary"}
                onClick={() => setReviewFilter("correct")}
              >
                Acertos
              </button>
              <button
                type="button"
                className={reviewFilter === "wrong" ? "button" : "button secondary"}
                onClick={() => setReviewFilter("wrong")}
              >
                Erros
              </button>
              <button
                type="button"
                className={reviewFilter === "pending" ? "button" : "button secondary"}
                onClick={() => setReviewFilter("pending")}
              >
                Pendentes
              </button>
              <button
                type="button"
                className={reviewFilter === "noOfficial" ? "button" : "button secondary"}
                onClick={() => setReviewFilter("noOfficial")}
              >
                Sem gabarito
              </button>
            </div>
            <div className="result-review-list">
              {reviewQuestions
                .slice()
                .sort((left, right) => left.answer.questionNumber - right.answer.questionNumber)
                .map(({ question, answer }) => {
                  const officialAnswerCodes = splitOfficialAnswer(answer.officialAnswer);
                  const wasAnswered = answer.selectedCodes.length > 0 || answer.officialAnswer === 0;

                  const statusClass =
                    answer.officialAnswer === null
                      ? "review-card pending"
                      : !wasAnswered
                        ? "review-card pending"
                        : answer.isCorrect === true
                          ? "review-card correct"
                          : "review-card wrong";

                  const statusLabel =
                    answer.officialAnswer === null
                      ? "Sem gabarito"
                      : !wasAnswered
                        ? "Pendente"
                        : answer.isCorrect === true
                          ? "Acerto"
                          : "Erro";

                  const statusPillClass =
                    answer.officialAnswer === null
                      ? "review-status pending"
                      : !wasAnswered
                        ? "review-status pending"
                        : answer.isCorrect === true
                          ? "review-status correct"
                          : "review-status wrong";

                  return (
                    <article className={statusClass} key={`${attemptSummary.exam}-${answer.questionId}`}>
                      <div className="review-card-head">
                        <div className="review-card-title">
                          <strong>Questão {String(answer.questionNumber).padStart(2, "0")}</strong>
                          <span>{answer.discipline}</span>
                        </div>
                        <span className={statusPillClass}>{statusLabel}</span>
                      </div>
                      {question.supportText && (
                        <div className="review-support">
                          <p className="eyebrow">Texto de apoio</p>
                          {question.supportTitle && <strong>{question.supportTitle}</strong>}
                          <p>{question.supportText}</p>
                        </div>
                      )}
                      <div className="answer-chips">
                        <span className="answer-chip">
                          Sua soma: {wasAnswered ? answer.selectedSum : "não respondida"}
                        </span>
                        <span className="answer-chip">
                          Gabarito: {answer.officialAnswer ?? "pendente"}
                        </span>
                        {answer.selectedCodes.map((code) => (
                          <span className="answer-chip" key={`${answer.questionId}-selected-${code}`}>
                            {code}
                          </span>
                        ))}
                        {officialAnswerCodes.map((code) => (
                          <span className="answer-chip" key={`${answer.questionId}-official-${code}`}>
                            oficial {code}
                          </span>
                        ))}
                      </div>
                      <div className="actions compact-actions">
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => openQuestionFromReview(question.id)}
                        >
                          Abrir esta questão
                        </button>
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>
        </section>
      ) : selectedQuestion ? (
        <section className="question-browser">
          <aside className="panel question-list-panel">
            <p className="eyebrow">Questões</p>
            <div className="question-pills">
              {questions.map((question) => {
                const answeredCodes = answersByQuestion[question.id] || [];
                const wasRevealed = Boolean(revealedByQuestion[question.id]);
                const answeredSum = sumSelectedCodes(answeredCodes);
                const wasAnswered = answeredCodes.length > 0 || isImplicitZeroAnswer(question, answeredCodes);
                const answeredCorrectly =
                  wasRevealed &&
                  question.officialAnswer !== null &&
                  question.officialAnswer !== undefined &&
                  answeredSum === question.officialAnswer;

                const pillClassName = [
                  "question-pill",
                  selectedQuestionId === question.id ? "active" : "",
                  wasAnswered ? "answered" : "",
                  wasRevealed ? "revealed" : "",
                  answeredCorrectly ? "correct" : "",
                  wasRevealed && wasAnswered && !answeredCorrectly && question.officialAnswer !== null ? "wrong" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={question.id}
                    className={pillClassName}
                    onClick={() => onSelectQuestionId(question.id)}
                  >
                    {String(question.number).padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </aside>

          <article className="panel question-viewer" ref={questionViewerRef}>
            <div className="question-meta">
              <p className="eyebrow">{selectedQuestion.discipline}</p>
              <strong>Questão {String(selectedQuestion.number).padStart(2, "0")}</strong>
            </div>

            {selectedQuestion.supportText && (
              <section className="support-block">
                <p className="eyebrow">Texto de apoio</p>
                {selectedQuestion.supportTitle && <h3>{selectedQuestion.supportTitle}</h3>}
                {selectedQuestion.supportRange && (
                  <p className="support-range">Faixa: {selectedQuestion.supportRange}</p>
                )}
                <p>{selectedQuestion.supportText}</p>
              </section>
            )}

            <section className="question-block">
              <p>{selectedQuestion.prompt}</p>
              <div className="statement-list">
                {selectedQuestion.statements.map((statement) => {
                  const isSelected = selectedCodes.includes(statement.code);
                  const isOfficial = officialCodes.includes(statement.code);
                  const className = [
                    "statement-item",
                    isSelected ? "selected" : "",
                    isRevealed && isOfficial ? "revealed-correct" : "",
                    isRevealed && isSelected && !isOfficial ? "revealed-wrong" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      type="button"
                      className={className}
                      key={`${selectedQuestion.id}-${statement.code}`}
                      onClick={() => toggleStatement(statement.code)}
                    >
                      <strong className="statement-code">{statement.code}</strong>
                      <p>{statement.text}</p>
                    </button>
                  );
                })}
              </div>

              <section className="panel answer-play-panel">
                <p className="eyebrow">Sua resposta</p>
                <div className="answer-chips">
                  <span className="answer-chip">Soma marcada: {selectedSum}</span>
                  {selectedCodes.length > 0 ? (
                    selectedCodes.map((code) => (
                      <span className="answer-chip" key={`${selectedQuestion.id}-selected-${code}`}>
                        {code}
                      </span>
                    ))
                  ) : (
                    <span className="answer-chip muted-chip">Nenhum item marcado</span>
                  )}
                </div>
                <div className="actions compact-actions">
                  <button type="button" className="button" onClick={revealAnswer}>
                    Corrigir questão
                  </button>
                  <button type="button" className="button secondary" onClick={clearSelection}>
                    Limpar marcação
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={goToNextQuestion}
                    disabled={isLastQuestion}
                  >
                    Próxima questão
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={finalizeAttempt}
                    disabled={savingAttempt}
                  >
                    {savingAttempt ? "Salvando..." : "Finalizar simulado"}
                  </button>
                </div>
                {saveMessage && !attemptSummary && <p className="notice">{saveMessage}</p>}
                {isRevealed && (
                  <p className={isCorrect ? "notice success-notice" : "notice error-notice"}>
                    {isCorrect
                      ? "Boa. Sua soma bateu com o gabarito oficial desta questão."
                      : selectedQuestion.officialAnswer === null
                        ? "Esta questão ainda está sem gabarito oficial ligado no banco."
                        : `Ainda não foi desta vez. A soma oficial desta questão é ${selectedQuestion.officialAnswer}.`}
                  </p>
                )}
              </section>
            </section>

            <section className="answer-block">
              <p className="eyebrow">Gabarito oficial</p>
              {!isRevealed ? (
                <p className="notice">Finalize a questão para liberar o gabarito oficial.</p>
              ) : selectedQuestion.officialAnswer !== null ? (
                <>
                  <div className="answer-chips">
                    <span className="answer-chip">
                      {selectedQuestion.officialAnswer === 0
                        ? "Questão com soma zero"
                        : `Soma: ${selectedQuestion.officialAnswer}`}
                    </span>
                    {splitOfficialAnswer(selectedQuestion.officialAnswer).map((code) => (
                      <span className="answer-chip" key={`${selectedQuestion.id}-${code}`}>
                        {code}
                      </span>
                    ))}
                  </div>
                  {selectedQuestion.officialAnswer === 0 && (
                    <p className="notice">
                      Nesta questão, deixar todos os itens desmarcados conta como resposta correta.
                    </p>
                  )}
                  {isAdmin && selectedQuestion.officialAnswerSource && (
                    <a
                      className="button secondary"
                      href={selectedQuestion.officialAnswerSource}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Fonte do gabarito
                    </a>
                  )}
                </>
              ) : (
                <p className="notice">Gabarito oficial ainda pendente nesta questão.</p>
              )}

              {isAdmin && selectedQuestion.pdfUrl && (
                <div className="actions compact-actions">
                  <a
                    className="button secondary"
                    href={selectedQuestion.pdfUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Abrir PDF desta prova
                  </a>
                  {selectedQuestion.sourceUrl && (
                    <a
                      className="button secondary"
                      href={selectedQuestion.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Fonte oficial
                    </a>
                  )}
                </div>
              )}
            </section>
          </article>
        </section>
      ) : null}
    </>
  );
}

export default function StudyPage() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AccessRole>("student");
  const [userId, setUserId] = useState("");
  const [mode, setMode] = useState<StudyMode>("pas");

  const [legacyBank, setLegacyBank] = useState<StructuredBank | null>(null);
  const [legacyError, setLegacyError] = useState("");
  const [selectedLegacyExam, setSelectedLegacyExam] = useState("Vestibular UEM 2025 Verão");
  const [selectedLegacyQuestionId, setSelectedLegacyQuestionId] = useState("");

  const [pasStructuredBank, setPasStructuredBank] = useState<StructuredBank | null>(null);
  const [pasStructuredError, setPasStructuredError] = useState("");
  const [selectedPasExam, setSelectedPasExam] = useState("PAS-UEM 2025 Etapa 1");
  const [selectedPasQuestionId, setSelectedPasQuestionId] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const [{ data: subscriptionData }, { data: profileData }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("status,ends_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      ]);

      const nextRole = getAccessRole(user.email, profileData?.role);
      setRole(nextRole);
      setAllowed(canAccessPaidContent(nextRole, subscriptionData));
      setLoading(false);
    }

    load();
  }, []);

  useEffect(() => {
    if (mode !== "vestibular" || legacyBank) return;

    async function loadLegacyBank() {
      try {
        const response = await fetch("/data/legacy-vestibular-bank.json");
        if (!response.ok) throw new Error("Falha ao carregar o banco antigo.");

        const data = normalizeBank((await response.json()) as StructuredBank);
        setLegacyBank(data);

        const preferredExam = data.exams.includes("Vestibular UEM 2025 Verão")
          ? "Vestibular UEM 2025 Verão"
          : data.exams[data.exams.length - 1];
        const normalizedExam = preferredExam || data.exams[0] || "";

        setSelectedLegacyExam(normalizedExam);
        const firstQuestion = data.questions.find((question) => question.exam === normalizedExam);
        setSelectedLegacyQuestionId(firstQuestion?.id || "");
      } catch (error) {
        setLegacyError(error instanceof Error ? error.message : "Erro ao carregar o banco antigo.");
      }
    }

    loadLegacyBank();
  }, [legacyBank, mode]);

  useEffect(() => {
    if (mode !== "pas" || pasStructuredBank) return;

    async function loadPasStructuredBank() {
      try {
        const response = await fetch("/data/pas-structured-bank.json");
        if (!response.ok) throw new Error("Falha ao carregar o banco estruturado do PAS.");

        const data = normalizePasStructuredBank(normalizeBank((await response.json()) as StructuredBank));
        setPasStructuredBank(data);

        const preferredExam = data.exams.includes("PAS-UEM 2025 Etapa 1")
          ? "PAS-UEM 2025 Etapa 1"
          : data.exams[data.exams.length - 1];
        const normalizedExam = preferredExam || data.exams[0] || "";

        setSelectedPasExam(normalizedExam);
        const firstQuestion = data.questions.find((question) => question.exam === normalizedExam);
        setSelectedPasQuestionId(firstQuestion?.id || "");
      } catch (error) {
        setPasStructuredError(
          error instanceof Error ? error.message : "Erro ao carregar o banco estruturado do PAS.",
        );
      }
    }

    loadPasStructuredBank();
  }, [mode, pasStructuredBank]);

  if (loading) {
    return (
      <section className="panel">
        <p>Verificando assinatura...</p>
      </section>
    );
  }

  if (!allowed) {
    return (
      <section className="panel">
        <p className="eyebrow">Acesso protegido</p>
        <h1>Ative um plano para acessar o banco completo.</h1>
        <p className="section-copy">
          O banco de questões completo deve ficar no Supabase ou em uma API protegida, não em
          arquivo público.
        </p>
        <div className="actions">
          <Link className="button" href="/pricing">
            Ver planos
          </Link>
          <Link className="button secondary" href="/login">
            Entrar
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="screen-stack">
      <section className="panel">
        <p className="eyebrow">Simulados</p>
        <h1>Biblioteca de estudo UEM</h1>
        <p className="section-copy">
          Agora o cards-app junta dois acervos: vestibulares antigos já estruturados e PAS em
          formato estruturado. O site do aluno fica focado nas questões; os PDFs oficiais ficam
          restritos ao acesso admin para conferência.
        </p>
        <div className="mode-switch">
          <button className={mode === "pas" ? "button" : "button secondary"} onClick={() => setMode("pas")}>
            PAS
          </button>
          <button
            className={mode === "vestibular" ? "button" : "button secondary"}
            onClick={() => setMode("vestibular")}
          >
            Vestibulares antigos
          </button>
        </div>
      </section>

      {mode === "pas" && (
        <>
          <section className="panel">
            <p className="eyebrow">PAS-UEM</p>
            <h2>Questões estruturadas</h2>
            <p className="section-copy">
              O PAS aparece em uma trilha curada por prova, sem abrir PDF na área do aluno. Onde o
              gabarito oficial já foi importado, ele aparece questão por questão.
            </p>
            {role === "admin" && (
              <p className="notice">
                Modo admin ativo: os botões de PDF e da fonte oficial aparecem dentro da questão
                para conferência técnica.
              </p>
            )}
            {pasStructuredError && <p className="notice">{pasStructuredError}</p>}
          </section>

          {pasStructuredBank && (
            <StructuredQuestionBrowser
              bank={pasStructuredBank}
              selectedExam={selectedPasExam}
              onSelectExam={setSelectedPasExam}
              selectedQuestionId={selectedPasQuestionId}
              onSelectQuestionId={setSelectedPasQuestionId}
              eyebrow="Banco PAS"
              title="Questões estruturadas do PAS"
              description="A versão do aluno usa uma seleção técnica das variantes do PAS para manter a leitura limpa e consistente com o banco antigo de vestibulares."
              isAdmin={role === "admin"}
              studyMode="pas"
              userId={userId}
            />
          )}
        </>
      )}

      {mode === "vestibular" && (
        <>
          {legacyError && (
            <section className="panel">
              <p className="notice">{legacyError}</p>
            </section>
          )}
          {legacyBank && (
            <StructuredQuestionBrowser
              bank={legacyBank}
              selectedExam={selectedLegacyExam}
              onSelectExam={setSelectedLegacyExam}
              selectedQuestionId={selectedLegacyQuestionId}
              onSelectQuestionId={setSelectedLegacyQuestionId}
              eyebrow="Banco antigo"
              title="Questões estruturadas dos vestibulares"
              description="Acervo migrado do question-bank.js antigo, com enunciado, itens, gabarito oficial e texto de apoio quando existir."
              isAdmin={role === "admin"}
              studyMode="vestibular"
              userId={userId}
            />
          )}
        </>
      )}
    </section>
  );
}
