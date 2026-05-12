export type PasExam = {
  year: number;
  stage: 1 | 2 | 3;
  label: string;
  href: string;
  sourceUrl: string;
};

export const pasExams: PasExam[] = [
  { year: 2016, stage: 1, label: "PAS-UEM 2016 - Etapa 1", href: "/pas/2016/etapa-1.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas16/E1G1.pdf" },
  { year: 2016, stage: 2, label: "PAS-UEM 2016 - Etapa 2", href: "/pas/2016/etapa-2.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas16/E2G1.pdf" },
  { year: 2016, stage: 3, label: "PAS-UEM 2016 - Etapa 3", href: "/pas/2016/etapa-3.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas16/E3G1.pdf" },
  { year: 2017, stage: 1, label: "PAS-UEM 2017 - Etapa 1", href: "/pas/2017/etapa-1.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas17/E1G1.pdf" },
  { year: 2017, stage: 2, label: "PAS-UEM 2017 - Etapa 2", href: "/pas/2017/etapa-2.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas17/E2G1.pdf" },
  { year: 2017, stage: 3, label: "PAS-UEM 2017 - Etapa 3", href: "/pas/2017/etapa-3.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas17/E3G1.pdf" },
  { year: 2018, stage: 1, label: "PAS-UEM 2018 - Etapa 1", href: "/pas/2018/etapa-1.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas18/E1G1.pdf" },
  { year: 2018, stage: 2, label: "PAS-UEM 2018 - Etapa 2", href: "/pas/2018/etapa-2.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas18/E2G1.pdf" },
  { year: 2018, stage: 3, label: "PAS-UEM 2018 - Etapa 3", href: "/pas/2018/etapa-3.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas18/E3G1.pdf" },
  { year: 2019, stage: 1, label: "PAS-UEM 2019 - Etapa 1", href: "/pas/2019/etapa-1.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas19/E1G1.pdf" },
  { year: 2019, stage: 2, label: "PAS-UEM 2019 - Etapa 2", href: "/pas/2019/etapa-2.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas19/E2G1.pdf" },
  { year: 2019, stage: 3, label: "PAS-UEM 2019 - Etapa 3", href: "/pas/2019/etapa-3.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas19/E3G1.pdf" },
  { year: 2020, stage: 1, label: "PAS-UEM 2020 - Etapa 1", href: "/pas/2020/etapa-1.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas20/e1.pdf" },
  { year: 2020, stage: 2, label: "PAS-UEM 2020 - Etapa 2", href: "/pas/2020/etapa-2.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas20/e2.pdf" },
  { year: 2020, stage: 3, label: "PAS-UEM 2020 - Etapa 3", href: "/pas/2020/etapa-3.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas20/e3.pdf" },
  { year: 2021, stage: 1, label: "PAS-UEM 2021 - Etapa 1", href: "/pas/2021/etapa-1.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas21/E1.pdf" },
  { year: 2021, stage: 2, label: "PAS-UEM 2021 - Etapa 2", href: "/pas/2021/etapa-2.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas21/E2.pdf" },
  { year: 2021, stage: 3, label: "PAS-UEM 2021 - Etapa 3", href: "/pas/2021/etapa-3.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas21/E3.pdf" },
  { year: 2022, stage: 1, label: "PAS-UEM 2022 - Etapa 1", href: "/pas/2022/etapa-1.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas22/E1.pdf" },
  { year: 2022, stage: 2, label: "PAS-UEM 2022 - Etapa 2", href: "/pas/2022/etapa-2.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas22/E2.pdf" },
  { year: 2022, stage: 3, label: "PAS-UEM 2022 - Etapa 3", href: "/pas/2022/etapa-3.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas22/E3.pdf" },
  { year: 2023, stage: 1, label: "PAS-UEM 2023 - Etapa 1", href: "/pas/2023/etapa-1.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas23/E1.pdf" },
  { year: 2023, stage: 2, label: "PAS-UEM 2023 - Etapa 2", href: "/pas/2023/etapa-2.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas23/E2.pdf" },
  { year: 2023, stage: 3, label: "PAS-UEM 2023 - Etapa 3", href: "/pas/2023/etapa-3.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas23/E3.pdf" },
  { year: 2024, stage: 1, label: "PAS-UEM 2024 - Etapa 1", href: "/pas/2024/etapa-1.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas24/E1.pdf" },
  { year: 2024, stage: 2, label: "PAS-UEM 2024 - Etapa 2", href: "/pas/2024/etapa-2.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas24/E2.pdf" },
  { year: 2024, stage: 3, label: "PAS-UEM 2024 - Etapa 3", href: "/pas/2024/etapa-3.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas24/E3.pdf" },
  { year: 2025, stage: 1, label: "PAS-UEM 2025 - Etapa 1", href: "/pas/2025/etapa-1.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas25/E1.pdf" },
  { year: 2025, stage: 2, label: "PAS-UEM 2025 - Etapa 2", href: "/pas/2025/etapa-2.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas25/E2.pdf" },
  { year: 2025, stage: 3, label: "PAS-UEM 2025 - Etapa 3", href: "/pas/2025/etapa-3.pdf", sourceUrl: "https://www.vestibular.uem.br/provas/pas25/E3.pdf" },
];
