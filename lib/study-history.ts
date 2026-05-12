import { supabase } from "@/lib/supabase";

export type StudyMode = "pas" | "vestibular";

export type AttemptAnswerInput = {
  questionId: string;
  questionNumber: number;
  discipline: string;
  selectedCodes: string[];
  selectedSum: number;
  officialAnswer: number | null;
  isCorrect: boolean | null;
};

export type DisciplineResult = {
  discipline: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctCount: number;
  wrongCount: number;
};

export type AttemptSummaryInput = {
  userId: string;
  exam: string;
  studyMode: StudyMode;
  totalQuestions: number;
  answeredQuestions: number;
  correctCount: number;
  wrongCount: number;
  answers: AttemptAnswerInput[];
  disciplines: DisciplineResult[];
};

export async function saveStudyAttempt(summary: AttemptSummaryInput) {
  const { data: attempt, error: attemptError } = await supabase
    .from("study_attempts")
    .insert({
      user_id: summary.userId,
      exam: summary.exam,
      study_mode: summary.studyMode,
      total_questions: summary.totalQuestions,
      answered_questions: summary.answeredQuestions,
      correct_count: summary.correctCount,
      wrong_count: summary.wrongCount,
      finished_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (attemptError) throw attemptError;

  const attemptId = attempt.id;

  if (summary.answers.length) {
    const { error: answersError } = await supabase.from("study_attempt_answers").insert(
      summary.answers.map((answer) => ({
        attempt_id: attemptId,
        user_id: summary.userId,
        exam: summary.exam,
        question_id: answer.questionId,
        question_number: answer.questionNumber,
        discipline: answer.discipline,
        selected_codes: answer.selectedCodes,
        selected_sum: answer.selectedSum,
        official_answer: answer.officialAnswer,
        is_correct: answer.isCorrect,
      })),
    );

    if (answersError) throw answersError;
  }

  if (summary.disciplines.length) {
    const { error: disciplineError } = await supabase.from("study_attempt_disciplines").insert(
      summary.disciplines.map((discipline) => ({
        attempt_id: attemptId,
        user_id: summary.userId,
        exam: summary.exam,
        discipline: discipline.discipline,
        total_questions: discipline.totalQuestions,
        answered_questions: discipline.answeredQuestions,
        correct_count: discipline.correctCount,
        wrong_count: discipline.wrongCount,
      })),
    );

    if (disciplineError) throw disciplineError;
  }

  const { error: legacyError } = await supabase.from("study_results").insert({
    user_id: summary.userId,
    exam: summary.exam,
    discipline: "Geral",
    correct_count: summary.correctCount,
    wrong_count: summary.wrongCount,
    total_count: summary.totalQuestions,
  });

  if (legacyError) throw legacyError;

  return attemptId;
}
