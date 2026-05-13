"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAccessRole, type AccessRole } from "@/lib/access";
import {
  StructuredBank,
  StructuredQuestion,
  normalizeDisciplineLabel,
  normalizeExamLabel,
  normalizePasStructuredBank,
} from "@/lib/pas-structured";
import {
  saveQuestionProgress,
  saveStudyAttempt,
  type AttemptAnswerInput,
  type AttemptResultStatus,
  type DisciplineResult,
  type StudyMode,
} from "@/lib/study-history";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const answerCodes = [16, 8, 4, 2, 1];
const LOCAL_PROGRESS_KEY = "cards-app-progress-v1";
const mojibakePattern =
  /ÃƒÆ’Ã†â€™|ÃƒÆ’Ã¢â‚¬Å¡|ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬|ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢|ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“|ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬\x9d|ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ|ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â/;

type StoredQuestionProgress = {
  questionId: string;
  exam: string;
  studyMode: StudyMode;
  status: Exclude<AttemptResultStatus, "pending">;
  selectedCodes: string[];
  selectedSum: number;
  officialAnswer: number | null;
  updatedAt: string;
};

type ProgressStore = Record<string, StoredQuestionProgress>;

type ExamProgress = {
  exam: string;
  totalQuestions: number;
  studiedCount: number;
  correctCount: number;
  partialCount: number;
  wrongCount: number;
  hasProgress: boolean;
};

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

function getQuestionResultStatus(question: StructuredQuestion, selectedCodes: string[]): AttemptResultStatus {
  if (question.officialAnswer === null || question.officialAnswer === undefined) {
    return selectedCodes.length ? "no_official" : "pending";
  }

  if (question.officialAnswer === 0 && selectedCodes.length === 0) {
    return "correct";
  }

  if (!selectedCodes.length) {
    return "pending";
  }

  const selectedSum = sumSelectedCodes(selectedCodes);
  if (selectedSum === question.officialAnswer) {
    return "correct";
  }

  const officialCodes = splitOfficialAnswer(question.officialAnswer);
  const allSelectedAreOfficial = selectedCodes.every((code) => officialCodes.includes(code));

  if (allSelectedAreOfficial) {
    return "partial";
  }

  return "wrong";
}

function loadProgressStore(): ProgressStore {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LOCAL_PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProgressStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveProgressStore(store: ProgressStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(store));
}

function getStatusMessage(status: AttemptResultStatus, question: StructuredQuestion) {
  if (status === "correct") {
    return "Acerto completo. Sua soma bateu com o gabarito oficial desta questão.";
  }

  if (status === "partial") {
    return "Acerto parcial. Você marcou apenas parte das assertivas corretas e ainda pode retomar depois.";
  }

  if (status === "wrong") {
    return `Resposta incorreta. A soma oficial desta questão é ${question.officialAnswer}.`;
  }

  if (status === "no_official") {
    return "Esta questão ainda não tem gabarito oficial ligado ao banco.";
  }

  return "Marque pelo menos uma assertiva antes de corrigir esta questão.";
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
  const [progressByQuestion, setProgressByQuestion] = useState<Record<string, StoredQuestionProgress>>({});
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const questionViewerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setProgressByQuestion(loadProgressStore());
  }, []);

  const questions = useMemo(
    () => bank.questions.filter((question) => question.exam === selectedExam),
    [bank.questions, selectedExam],
  );

  const selectedQuestion = questions.find((question) => question.id === selectedQuestionId) || questions[0];
  const selectedCodes = selectedQuestion ? answersByQuestion[selectedQuestion.id] || [] : [];
  const selectedSum = sumSelectedCodes(selectedCodes);
  const officialCodes = selectedQuestion ? splitOfficialAnswer(selectedQuestion.officialAnswer) : [];
  const currentStatus = selectedQuestion ? getQuestionResultStatus(selectedQuestion, selectedCodes) : "pending";
  const selectedProgress = selectedQuestion ? progressByQuestion[selectedQuestion.id] : undefined;
  const isRevealed = selectedQuestion ? Boolean(revealedByQuestion[selectedQuestion.id]) : false;
  const isLastQuestion = selectedQuestion
    ? questions.findIndex((question) => question.id === selectedQuestion.id) === questions.length - 1
    : true;

  const examProgressList = useMemo<ExamProgress[]>(() => {
    return bank.exams.map((exam) => {
      const examQuestions = bank.questions.filter((question) => question.exam === exam);
      const progressEntries = examQuestions
        .map((question) => progressByQuestion[question.id])
        .filter((entry): entry is StoredQuestionProgress => Boolean(entry));

      return {
        exam,
        totalQuestions: examQuestions.length,
        studiedCount: progressEntries.length,
        correctCount: progressEntries.filter((entry) => entry.status === "correct").length,
        partialCount: progressEntries.filter((entry) => entry.status === "partial").length,
        wrongCount: progressEntries.filter((entry) => entry.status === "wrong").length,
        hasProgress: progressEntries.length > 0,
      };
    });
  }, [bank.exams, bank.questions, progressByQuestion]);

  const activeExamProgress = examProgressList.find((entry) => entry.exam === selectedExam);

  useEffect(() => {
    if (!questions.length) return;

    if (!questions.some((question) => question.id === selectedQuestionId)) {
      onSelectQuestionId(questions[0].id);
    }
  }, [onSelectQuestionId, questions, selectedQuestionId]);

  function persistLocalProgress(entry: StoredQuestionProgress) {
    setProgressByQuestion((current) => {
      const next = { ...current, [entry.questionId]: entry };
      const mergedStore = { ...loadProgressStore(), [entry.questionId]: entry };
      saveProgressStore(mergedStore);
      return next;
    });
  }

  async function revealAnswer() {
    if (!selectedQuestion) return;

    const status = getQuestionResultStatus(selectedQuestion, selectedCodes);
    setSaveMessage("");
    setRevealedByQuestion((current) => ({
      ...current,
      [selectedQuestion.id]: true,
    }));

    if (status === "pending") {
      return;
    }

    const entry: StoredQuestionProgress = {
      questionId: selectedQuestion.id,
      exam: selectedQuestion.exam,
      studyMode,
      status,
      selectedCodes,
      selectedSum,
      officialAnswer: selectedQuestion.officialAnswer,
      updatedAt: new Date().toISOString(),
    };

    persistLocalProgress(entry);

    if (userId && isSupabaseConfigured) {
      try {
        await saveQuestionProgress({
          userId,
          exam: selectedQuestion.exam,
          studyMode,
          questionId: selectedQuestion.id,
          questionNumber: selectedQuestion.number,
          discipline: selectedQuestion.discipline,
          selectedCodes,
          selectedSum,
          officialAnswer: selectedQuestion.officialAnswer,
          resultStatus: status,
        });
        setSaveMessage("Progresso desta questão sincronizado no seu perfil.");
      } catch {
        setSaveMessage("O progresso ficou salvo neste aparelho, mas não foi possível sincronizar agora.");
      }
    }
  }

  function toggleStatement(code: string) {
    if (!selectedQuestion) return;

    setSaveMessage("");
    setAnswersByQuestion((current) => {
      const existing = current[selectedQuestion.id] || [];
      const next = existing.includes(code)
        ? existing.filter((value) => value !== code)
        : [...existing, code].sort((left, right) => Number.parseInt(left, 10) - Number.parseInt(right, 10));

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

  function clearSelection() {
    if (!selectedQuestion) return;

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
      const resultStatus = getQuestionResultStatus(question, selected);
      const isCorrect = resultStatus === "correct" ? true : question.officialAnswer === null ? null : false;

      return {
        questionId: question.id,
        questionNumber: question.number,
        discipline: question.discipline,
        selectedCodes: selected,
        selectedSum: selectedTotal,
        officialAnswer: question.officialAnswer,
        isCorrect,
        resultStatus,
      };
    });

    const answerableRows = answerRows.filter((row) => row.officialAnswer !== null);
    const answeredRows = answerableRows.filter(
      (row) => row.selectedCodes.length > 0 || row.officialAnswer === 0,
    );

    const byDiscipline = new Map<string, DisciplineResult>();
    for (const row of answerRows) {
      if (row.officialAnswer === null) continue;

      const current = byDiscipline.get(row.discipline) || {
        discipline: row.discipline,
        totalQuestions: 0,
        answeredQuestions: 0,
        correctCount: 0,
        partialCount: 0,
        wrongCount: 0,
      };

      const wasAnswered = row.selectedCodes.length > 0 || row.officialAnswer === 0;
      current.totalQuestions += 1;
      if (wasAnswered) current.answeredQuestions += 1;
      if (row.resultStatus === "correct") current.correctCount += 1;
      if (row.resultStatus === "partial") current.partialCount += 1;
      if (row.resultStatus === "wrong") current.wrongCount += 1;
      byDiscipline.set(row.discipline, current);
    }

    return {
      totalQuestions: answerableRows.length,
      answeredQuestions: answeredRows.length,
      correctCount: answeredRows.filter((row) => row.resultStatus === "correct").length,
      partialCount: answeredRows.filter((row) => row.resultStatus === "partial").length,
      wrongCount: answeredRows.filter((row) => row.resultStatus === "wrong").length,
      answers: answerRows,
      disciplines: [...byDiscipline.values()].sort((left, right) =>
        left.discipline.localeCompare(right.discipline, "pt-BR"),
      ),
    };
  }

  async function finalizeAttempt() {
    const data = buildAttemptData();

    if (!userId || !isSupabaseConfigured) {
      setSaveMessage("Seu progresso já ficou salvo neste aparelho. Entre na conta para sincronizar o perfil.");
      return;
    }

    setSavingAttempt(true);
    setSaveMessage("");

    try {
      await saveStudyAttempt({
        userId,
        exam: selectedExam,
        studyMode,
        totalQuestions: data.totalQuestions,
        answeredQuestions: data.answeredQuestions,
        correctCount: data.correctCount,
        partialCount: data.partialCount,
        wrongCount: data.wrongCount,
        answers: data.answers,
        disciplines: data.disciplines,
      });

      setSaveMessage("Tentativa salva no seu perfil com acertos, parciais e erros.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Não foi possível salvar seu perfil agora.");
    } finally {
      setSavingAttempt(false);
    }
  }

  return (
    <section className="screen-stack">
      <section className="panel">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="section-copy">{description}</p>
        <div className="actions">
          <label className="wide-field">
            Prova
            <select value={selectedExam} onChange={(event) => onSelectExam(event.target.value)}>
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
            <strong>{activeExamProgress?.studiedCount || 0}</strong>
            <span>questões já revisitadas</span>
          </div>
          <div className="library-stat">
            <strong>{activeExamProgress?.correctCount || 0}</strong>
            <span>acertos completos</span>
          </div>
        </div>

        <div className="exam-progress-grid">
          {examProgressList.map((entry) => {
            const cardClassName = [
              "exam-progress-card",
              selectedExam === entry.exam ? "active" : "",
              entry.hasProgress ? "studied" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={entry.exam}
                type="button"
                className={cardClassName}
                onClick={() => onSelectExam(entry.exam)}
              >
                <strong>{entry.exam}</strong>
                <span>{entry.hasProgress ? `${entry.studiedCount} questão(ões) já estudadas` : "Ainda não iniciada"}</span>
              </button>
            );
          })}
        </div>
      </section>

      {selectedQuestion ? (
        <section className="question-browser">
          <aside className="panel question-list-panel">
            <p className="eyebrow">Questões</p>
            <div className="question-pills">
              {questions.map((question) => {
                const storedProgress = progressByQuestion[question.id];
                const pillClassName = [
                  "question-pill",
                  selectedQuestionId === question.id ? "active" : "",
                  storedProgress ? "answered" : "",
                  storedProgress?.status === "correct" ? "correct" : "",
                  storedProgress?.status === "partial" ? "partial" : "",
                  storedProgress?.status === "wrong" ? "wrong" : "",
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
            <div className="study-status-legend">
              <span className="legend-chip legend-green">Verde: acerto completo</span>
              <span className="legend-chip legend-orange">Laranja: acerto parcial</span>
              <span className="legend-chip legend-red">Vermelho: retomar</span>
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
                {selectedQuestion.supportRange && <p className="support-range">Faixa: {selectedQuestion.supportRange}</p>}
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
                  {selectedProgress && (
                    <span className={`answer-chip progress-chip progress-${selectedProgress.status}`}>
                      Último resultado:{" "}
                      {selectedProgress.status === "correct"
                        ? "completo"
                        : selectedProgress.status === "partial"
                          ? "parcial"
                          : selectedProgress.status === "wrong"
                            ? "erro"
                            : "sem gabarito"}
                    </span>
                  )}
                </div>

                <div className="actions compact-actions">
                  <button type="button" className="button" onClick={revealAnswer}>
                    Corrigir questão
                  </button>
                  <button type="button" className="button secondary" onClick={clearSelection}>
                    Limpar marcação
                  </button>
                  <button type="button" className="button secondary" onClick={goToNextQuestion} disabled={isLastQuestion}>
                    Próxima questão
                  </button>
                  <button type="button" className="button secondary" onClick={finalizeAttempt} disabled={savingAttempt}>
                    {savingAttempt ? "Salvando..." : "Salvar no perfil"}
                  </button>
                </div>

                {saveMessage && <p className="notice">{saveMessage}</p>}
                {isRevealed && (
                  <p
                    className={
                      currentStatus === "correct"
                        ? "notice success-notice"
                        : currentStatus === "partial"
                          ? "notice partial-notice"
                          : "notice error-notice"
                    }
                  >
                    {getStatusMessage(currentStatus, selectedQuestion)}
                  </p>
                )}
              </section>
            </section>

            <section className="answer-block">
              <p className="eyebrow">Gabarito oficial</p>
              {!isRevealed ? (
                <p className="notice">Corrija a questão para liberar o gabarito oficial.</p>
              ) : selectedQuestion.officialAnswer !== null ? (
                <>
                  <div className="answer-chips">
                    <span className="answer-chip">
                      {selectedQuestion.officialAnswer === 0 ? "Questão com soma zero" : `Soma: ${selectedQuestion.officialAnswer}`}
                    </span>
                    {splitOfficialAnswer(selectedQuestion.officialAnswer).map((code) => (
                      <span className="answer-chip" key={`${selectedQuestion.id}-${code}`}>
                        {code}
                      </span>
                    ))}
                  </div>
                  {selectedQuestion.officialAnswer === 0 && (
                    <p className="notice">Nesta questão, deixar todos os itens desmarcados conta como resposta correta.</p>
                  )}
                  {isAdmin && selectedQuestion.officialAnswerSource && (
                    <a className="button secondary" href={selectedQuestion.officialAnswerSource} target="_blank" rel="noreferrer noopener">
                      Fonte do gabarito
                    </a>
                  )}
                </>
              ) : (
                <p className="notice">Gabarito oficial ainda pendente nesta questão.</p>
              )}

              {isAdmin && selectedQuestion.pdfUrl && (
                <div className="actions compact-actions">
                  <a className="button secondary" href={selectedQuestion.pdfUrl} target="_blank" rel="noreferrer noopener">
                    Abrir PDF desta prova
                  </a>
                  {selectedQuestion.sourceUrl && (
                    <a className="button secondary" href={selectedQuestion.sourceUrl} target="_blank" rel="noreferrer noopener">
                      Fonte oficial
                    </a>
                  )}
                </div>
              )}
            </section>
          </article>
        </section>
      ) : null}
    </section>
  );
}

export default function StudyPage() {
  const [role, setRole] = useState<AccessRole>("student");
  const [userId, setUserId] = useState("");
  const [mode, setMode] = useState<StudyMode>("vestibular");

  const [legacyBank, setLegacyBank] = useState<StructuredBank | null>(null);
  const [legacyError, setLegacyError] = useState("");
  const [selectedLegacyExam, setSelectedLegacyExam] = useState("Vestibular UEM 2025 Verão");
  const [selectedLegacyQuestionId, setSelectedLegacyQuestionId] = useState("");

  const [pasStructuredBank, setPasStructuredBank] = useState<StructuredBank | null>(null);
  const [pasStructuredError, setPasStructuredError] = useState("");
  const [selectedPasExam, setSelectedPasExam] = useState("PAS-UEM 2025 Etapa 1");
  const [selectedPasQuestionId, setSelectedPasQuestionId] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function loadUser() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      setUserId(user.id);
      const { data: profileData } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      setRole(getAccessRole(user.email, profileData?.role));
    }

    loadUser();
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
          : data.exams[data.exams.length - 1] || data.exams[0] || "";
        setSelectedLegacyExam(preferredExam);
        const firstQuestion = data.questions.find((question) => question.exam === preferredExam);
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
          : data.exams[data.exams.length - 1] || data.exams[0] || "";
        setSelectedPasExam(preferredExam);
        const firstQuestion = data.questions.find((question) => question.exam === preferredExam);
        setSelectedPasQuestionId(firstQuestion?.id || "");
      } catch (error) {
        setPasStructuredError(
          error instanceof Error ? error.message : "Erro ao carregar o banco estruturado do PAS.",
        );
      }
    }

    loadPasStructuredBank();
  }, [mode, pasStructuredBank]);

  return (
    <section className="screen-stack">
      <section className="panel">
        <p className="eyebrow">Estudo livre</p>
        <h1>Abra o link e já comece a estudar.</h1>
        <p className="section-copy">
          Agora o aluno já pode entrar direto na biblioteca. Sem login, o progresso fica salvo neste aparelho.
          Com login, o perfil também sincroniza no Supabase.
        </p>
        <div className="actions">
          <button className={mode === "vestibular" ? "button" : "button secondary"} onClick={() => setMode("vestibular")}>
            Vestibulares antigos
          </button>
          <button className={mode === "pas" ? "button" : "button secondary"} onClick={() => setMode("pas")}>
            PAS
          </button>
          <Link className="button secondary" href="/login">
            Entrar para salvar perfil
          </Link>
        </div>
        <div className="study-status-legend study-entry-legend">
          <span className="legend-chip legend-green">Verde: acerto completo</span>
          <span className="legend-chip legend-orange">Laranja: acerto parcial</span>
          <span className="legend-chip legend-red">Vermelho: revisar depois</span>
        </div>
        {userId ? (
          <p className="notice">Seu perfil está conectado. O progresso pode ser sincronizado questão por questão.</p>
        ) : (
          <p className="notice">Você já pode estudar sem conta. Se fizer login, o histórico também ficará salvo no seu perfil.</p>
        )}
      </section>

      {mode === "pas" && (
        <>
          {pasStructuredError && (
            <section className="panel">
              <p className="notice">{pasStructuredError}</p>
            </section>
          )}
          {pasStructuredBank && (
            <StructuredQuestionBrowser
              bank={pasStructuredBank}
              selectedExam={selectedPasExam}
              onSelectExam={setSelectedPasExam}
              selectedQuestionId={selectedPasQuestionId}
              onSelectQuestionId={setSelectedPasQuestionId}
              eyebrow="Banco PAS"
              title="Questões estruturadas do PAS"
              description="Escolha uma prova, resolva as assertivas e deixe o próprio sistema marcar seu progresso para retomada futura."
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
              description="O vestibular fica aberto desde o primeiro acesso. O que você acertar completo fica verde, parcial fica laranja e erro fica vermelho para retomar."
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
