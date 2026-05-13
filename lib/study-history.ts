import { supabase } from "@/lib/supabase";

export type StudyMode = "pas" | "vestibular";
export type AttemptResultStatus = "correct" | "partial" | "wrong" | "pending" | "no_official";

export type AttemptAnswerInput = {
  questionId: string;
  questionNumber: number;
  discipline: string;
  selectedCodes: string[];
  selectedSum: number;
  officialAnswer: number | null;
  isCorrect: boolean | null;
  resultStatus: AttemptResultStatus;
};

export type DisciplineResult = {
  discipline: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctCount: number;
  partialCount: number;
  wrongCount: number;
};

export type AttemptSummaryInput = {
  userId: string;
  exam: string;
  studyMode: StudyMode;
  totalQuestions: number;
  answeredQuestions: number;
  correctCount: number;
  partialCount: number;
  wrongCount: number;
  answers: AttemptAnswerInput[];
  disciplines: DisciplineResult[];
};

export type QuestionProgressInput = {
  userId: string;
  exam: string;
  studyMode: StudyMode;
  questionId: string;
  questionNumber: number;
  discipline: string;
  selectedCodes: string[];
  selectedSum: number;
  officialAnswer: number | null;
  resultStatus: Exclude<AttemptResultStatus, "pending">;
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
      partial_count: summary.partialCount,
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
        result_status: answer.resultStatus,
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
        partial_count: discipline.partialCount,
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
    partial_count: summary.partialCount,
    wrong_count: summary.wrongCount,
    total_count: summary.totalQuestions,
  });

  if (legacyError) throw legacyError;

  return attemptId;
}

export async function saveQuestionProgress(progress: QuestionProgressInput) {
  const { error } = await supabase.from("study_question_progress").upsert(
    {
      user_id: progress.userId,
      exam: progress.exam,
      study_mode: progress.studyMode,
      question_id: progress.questionId,
      question_number: progress.questionNumber,
      discipline: progress.discipline,
      selected_codes: progress.selectedCodes,
      selected_sum: progress.selectedSum,
      official_answer: progress.officialAnswer,
      result_status: progress.resultStatus,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,question_id" },
  );

  if (error) throw error;
}
