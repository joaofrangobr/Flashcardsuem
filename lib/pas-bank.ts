import { pasExams } from "./pas-exams";

export type PasBankDocument = {
  id: string;
  exam: string;
  year: number;
  stage: 1 | 2 | 3;
  title: string;
  href: string;
  sourceUrl: string;
};

export const pasBank = {
  exams: [...new Set(pasExams.map((exam) => `PAS-UEM ${exam.year}`))],
  documents: pasExams.map<PasBankDocument>((exam) => ({
    id: `pas-${exam.year}-etapa-${exam.stage}`,
    exam: `PAS-UEM ${exam.year}`,
    year: exam.year,
    stage: exam.stage,
    title: exam.label,
    href: exam.href,
    sourceUrl: exam.sourceUrl,
  })),
};
