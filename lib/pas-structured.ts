type Statement = { code: string; text: string };

export type StructuredQuestion = {
  id: string;
  exam: string;
  discipline: string;
  number: number;
  prompt: string;
  statements: Statement[];
  officialAnswer: number | null;
  officialAnswerSource?: string | null;
  officialStatus?: string | null;
  supportText?: string | null;
  supportTitle?: string | null;
  supportRange?: string | null;
  pdfUrl?: string | null;
  sourceUrl?: string | null;
};

export type StructuredBank = {
  disciplines: string[];
  exams: string[];
  questions: StructuredQuestion[];
};

type AnswerMap = Record<string, Record<number, number | null>>;

const disciplineLabelMap: Record<string, string> = {
  Artes: "Artes",
  Biologia: "Biologia",
  "Ciencias da Natureza": "Ciências da Natureza",
  "Educacao Fisica": "Educação Física",
  Espanhol: "Espanhol",
  Filosofia: "Filosofia",
  Fisica: "Física",
  Frances: "Francês",
  Geografia: "Geografia",
  Historia: "História",
  Ingles: "Inglês",
  Interdisciplinar: "Interdisciplinar",
  Linguagens: "Linguagens",
  Literatura: "Literatura",
  Matematica: "Matemática",
  PAS: "Interdisciplinar",
  Quimica: "Química",
  Sociologia: "Sociologia",
};

const examLabelMap: Record<string, string> = {
  "Vestibular UEM 2014 Verao": "Vestibular UEM 2014 Verão",
  "Vestibular UEM 2015 Verao": "Vestibular UEM 2015 Verão",
  "Vestibular UEM 2016 Verao": "Vestibular UEM 2016 Verão",
  "Vestibular UEM 2017 Verao": "Vestibular UEM 2017 Verão",
  "Vestibular UEM 2018 Verao": "Vestibular UEM 2018 Verão",
  "Vestibular UEM 2019 Verao": "Vestibular UEM 2019 Verão",
  "Vestibular UEM 2020 Verao": "Vestibular UEM 2020 Verão",
  "Vestibular UEM 2021 Verao": "Vestibular UEM 2021 Verão",
  "Vestibular UEM 2022 Verao": "Vestibular UEM 2022 Verão",
  "Vestibular UEM 2023 Verao": "Vestibular UEM 2023 Verão",
  "Vestibular UEM 2024 Verao": "Vestibular UEM 2024 Verão",
  "Vestibular UEM 2025 Verao": "Vestibular UEM 2025 Verão",
  "Vestibular UEM 2025 Versao": "Vestibular UEM 2025 Verão",
};

function removeAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function toSearchText(value?: string | null) {
  return removeAccents(String(value || "")).toLowerCase();
}

function countMatches(text: string, keywords: string[]) {
  return keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0);
}

export function normalizeDisciplineLabel(value?: string | null) {
  if (!value) return "Interdisciplinar";
  return disciplineLabelMap[value] || value;
}

export function normalizeExamLabel(value?: string | null) {
  if (!value) return "";
  return examLabelMap[value] || value;
}

const pasAnswerSourceByExam: Record<string, string> = {
  "PAS-UEM 2016 Etapa 1": "https://www.vestibular.uem.br/provas/pas16/GabDef1.pdf",
  "PAS-UEM 2016 Etapa 2": "https://www.vestibular.uem.br/provas/pas16/GabDef2.pdf",
  "PAS-UEM 2016 Etapa 3": "https://www.vestibular.uem.br/provas/pas16/GabDef3.pdf",
  "PAS-UEM 2017 Etapa 1": "https://www.vestibular.uem.br/provas/pas17/GabDef1.pdf",
  "PAS-UEM 2017 Etapa 2": "https://www.vestibular.uem.br/provas/pas17/GabDef2.pdf",
  "PAS-UEM 2017 Etapa 3": "https://www.vestibular.uem.br/provas/pas17/GabDef3.pdf",
  "PAS-UEM 2018 Etapa 1": "https://www.vestibular.uem.br/provas/pas18/gabdef.pdf",
  "PAS-UEM 2018 Etapa 2": "https://www.vestibular.uem.br/provas/pas18/gabdef.pdf",
  "PAS-UEM 2018 Etapa 3": "https://www.vestibular.uem.br/provas/pas18/gabdef.pdf",
  "PAS-UEM 2019 Etapa 1": "https://www.vestibular.uem.br/provas/pas19/gabdef.pdf",
  "PAS-UEM 2019 Etapa 2": "https://www.vestibular.uem.br/provas/pas19/gabdef.pdf",
  "PAS-UEM 2019 Etapa 3": "https://www.vestibular.uem.br/provas/pas19/gabdef.pdf",
  "PAS-UEM 2020 Etapa 1": "https://www.vestibular.uem.br/provas/pas20/pasdef.pdf",
  "PAS-UEM 2020 Etapa 2": "https://www.vestibular.uem.br/provas/pas20/pasdef.pdf",
  "PAS-UEM 2020 Etapa 3": "https://www.vestibular.uem.br/provas/pas20/pasdef.pdf",
  "PAS-UEM 2021 Etapa 1": "https://www.vestibular.uem.br/provas/pas21/pasdef.pdf",
  "PAS-UEM 2021 Etapa 2": "https://www.vestibular.uem.br/provas/pas21/pasdef.pdf",
  "PAS-UEM 2021 Etapa 3": "https://www.vestibular.uem.br/provas/pas21/pasdef.pdf",
  "PAS-UEM 2022 Etapa 1": "https://www.vestibular.uem.br/provas/pas22/pasdef.pdf",
  "PAS-UEM 2022 Etapa 2": "https://www.vestibular.uem.br/provas/pas22/pasdef.pdf",
  "PAS-UEM 2022 Etapa 3": "https://www.vestibular.uem.br/provas/pas22/pasdef.pdf",
  "PAS-UEM 2023 Etapa 1": "https://www.vestibular.uem.br/provas/pas23/pasdef.pdf",
  "PAS-UEM 2023 Etapa 2": "https://www.vestibular.uem.br/provas/pas23/pasdef.pdf",
  "PAS-UEM 2023 Etapa 3": "https://www.vestibular.uem.br/provas/pas23/pasdef.pdf",
  "PAS-UEM 2024 Etapa 1": "https://www.vestibular.uem.br/provas/pas24/gabdef.pdf",
  "PAS-UEM 2024 Etapa 2": "https://www.vestibular.uem.br/provas/pas24/gabdef.pdf",
  "PAS-UEM 2024 Etapa 3": "https://www.vestibular.uem.br/provas/pas24/gabdef.pdf",
  "PAS-UEM 2025 Etapa 1": "https://www.vestibular.uem.br/provas/pas25/gabdef.pdf",
  "PAS-UEM 2025 Etapa 2": "https://www.vestibular.uem.br/provas/pas25/gabdef.pdf",
  "PAS-UEM 2025 Etapa 3": "https://www.vestibular.uem.br/provas/pas25/gabdef.pdf",
};

const curatedPasAnswers: AnswerMap = {
  "PAS-UEM 2021 Etapa 1": {
    1: 27, 2: 28, 3: 15, 4: 17, 5: 21, 6: 13, 7: 28, 8: 13, 9: 13, 10: 2,
    11: 28, 12: 28, 13: 6, 14: 1, 15: 10, 16: 13, 17: 10, 18: 25, 19: 21, 20: 19,
    21: 15, 22: 3, 23: 20, 24: 3, 25: 5, 26: 25, 27: 30, 28: 8, 29: 11, 30: 20,
    31: 18, 32: 5, 33: 14, 34: 22, 35: 25, 36: 15, 37: 19, 38: 8, 39: 13, 40: 23,
  },
  "PAS-UEM 2021 Etapa 2": {
    1: 13, 2: 25, 3: 10, 4: 19, 5: 21, 6: 22, 7: 5, 8: 13, 9: 22, 10: 20,
    11: 20, 12: 11, 13: 1, 14: 26, 15: 15, 16: 6, 17: 22, 18: 19, 19: 6, 20: 28,
    21: 19, 22: 30, 23: 5, 24: 30, 25: 9, 26: 9, 27: 24, 28: 3, 29: 10, 30: 24,
    31: 31, 32: 15, 33: 14, 34: 5, 35: 20, 36: 22, 37: 11, 38: 24, 39: 20, 40: 19,
  },
  "PAS-UEM 2021 Etapa 3": {
    1: 29, 2: 11, 3: 12, 4: 24, 5: 9, 6: 19, 7: 25, 8: 12, 9: 10, 10: 10,
    11: 5, 12: 18, 13: 5, 14: 8, 15: 18, 16: 27, 17: 18, 18: 25, 19: 6, 20: 30,
    21: 21, 22: 18, 23: 3, 24: 15, 25: 21, 26: 9, 27: 5, 28: 29, 29: 18, 30: 21,
    31: 3, 32: 28, 33: 3, 34: 24, 35: 5,
  },
  "PAS-UEM 2022 Etapa 1": {
    1: 5, 2: 14, 3: 22, 4: 13, 5: 11, 6: 24, 7: 28, 8: 28, 9: 22, 10: 26,
    11: 7, 12: 28, 13: 5, 14: 28, 15: 12, 16: 25, 17: 21, 18: 19, 19: 29, 20: 7,
    21: 25, 22: 1, 23: 26, 24: 25, 25: 28, 26: 23, 27: 17, 28: 20, 29: 19, 30: 10,
    31: 14, 32: 23, 33: 23, 34: 21, 35: 24, 36: 22, 37: 24, 38: 12, 39: 7, 40: 21,
  },
  "PAS-UEM 2022 Etapa 2": {
    1: 21, 2: 7, 3: 15, 4: 19, 5: 3, 6: 26, 7: 19, 8: 13, 9: 9, 10: 4,
    11: 9, 12: 3, 13: 28, 14: 6, 15: 19, 16: 3, 17: 13, 18: 25, 19: 25, 20: 19,
    21: 23, 22: 22, 23: 29, 24: 12, 25: 17, 26: 10, 27: 24, 28: 11, 29: 7, 30: 15,
    31: 25, 32: 15, 33: 15, 34: 14, 35: 24, 36: 20, 37: 20, 38: 8, 39: 25, 40: 4,
  },
  "PAS-UEM 2022 Etapa 3": {
    1: 20, 2: 11, 3: 9, 4: 27, 5: 6, 6: 11, 7: 31, 8: 30, 9: 3, 10: 9,
    11: 22, 12: 3, 13: 3, 14: null, 15: 30, 16: 25, 17: 5, 18: 7, 19: 12, 20: 25,
    21: 5, 22: 17, 23: 8, 24: 9, 25: 13, 26: 5, 27: 13, 28: 27, 29: 24, 30: 15,
    31: 30, 32: 7, 33: 8, 34: 19, 35: 5,
  },
  "PAS-UEM 2023 Etapa 1": {
    1: 13, 2: 5, 3: 22, 4: 5, 5: 21, 6: 5, 7: 27, 8: 29, 9: 19, 10: 20,
    11: 21, 12: 29, 13: 24, 14: 22, 15: 14, 16: 15, 17: 15, 18: 22, 19: 7, 20: 1,
    21: 13, 22: 28, 23: 28, 24: 12, 25: 30, 26: 7, 27: 5, 28: 19, 29: 7, 30: 23,
    31: 15, 32: 30, 33: 14, 34: 26, 35: 17, 36: 29, 37: 19, 38: 25, 39: 23, 40: 26,
  },
  "PAS-UEM 2023 Etapa 2": {
    1: 11, 2: 5, 3: 23, 4: 9, 5: 25, 6: 20, 7: 3, 8: 15, 9: 14, 10: 15,
    11: 4, 12: 7, 13: 6, 14: 23, 15: 1, 16: 7, 17: 21, 18: 27, 19: 11, 20: 10,
    21: 7, 22: 29, 23: 29, 24: 28, 25: 18, 26: 10, 27: 17, 28: 29, 29: 19, 30: 23,
    31: 7, 32: 20, 33: 17, 34: 18, 35: 6, 36: 22, 37: 29, 38: 6, 39: 19, 40: 7,
  },
  "PAS-UEM 2023 Etapa 3": {
    1: 30, 2: 14, 3: 17, 4: 15, 5: 14, 6: 25, 7: 15, 8: 3, 9: 16, 10: 19,
    11: 6, 12: 13, 13: 14, 14: 3, 15: 10, 16: 14, 17: 26, 18: 27, 19: 21, 20: 9,
    21: 13, 22: 27, 23: 13, 24: 19, 25: 18, 26: 11, 27: 7, 28: 11, 29: 25, 30: 15,
    31: 3, 32: 14, 33: 15, 34: 5, 35: 29,
  },
  "PAS-UEM 2024 Etapa 1": {
    1: 27, 2: 19, 3: 23, 4: 9, 5: 14, 6: 17, 7: 19, 8: 11, 9: 27, 10: 20,
    11: 27, 12: 25, 13: 14, 14: 22, 15: 25, 16: 21, 17: 9, 18: 18, 19: 14, 20: 7,
    21: 13, 22: 11, 23: 10, 24: 25, 25: 26, 26: 23, 27: 13, 28: 19, 29: 14, 30: 3,
    31: 14, 32: 11, 33: 18, 34: 12, 35: 24, 36: 9, 37: 4, 38: 22, 39: 17, 40: 7,
  },
  "PAS-UEM 2024 Etapa 2": {
    1: 23, 2: null, 3: 15, 4: 15, 5: 13, 6: 22, 7: 24, 8: 23, 9: 19, 10: 17,
    11: 10, 12: 25, 13: 23, 14: 21, 15: 28, 16: 25, 17: 18, 18: 22, 19: 19, 20: 21,
    21: 6, 22: 22, 23: 19, 24: 21, 25: 14, 26: 11, 27: 12, 28: 22, 29: 3, 30: 8,
    31: 1, 32: 25, 33: 25, 34: 12, 35: 19, 36: 24, 37: 30, 38: 28, 39: 13, 40: 4,
  },
  "PAS-UEM 2024 Etapa 3": {
    1: 7, 2: 15, 3: 19, 4: 22, 5: 3, 6: 19, 7: 25, 8: 11, 9: 21, 10: 11,
    11: 29, 12: 7, 13: 11, 14: 11, 15: 22, 16: 9, 17: 27, 18: 23, 19: 20, 20: 2,
    21: 3, 22: 15, 23: 16, 24: 20, 25: 9, 26: 6, 27: 11, 28: 14, 29: 25, 30: 22,
    31: 11, 32: 14, 33: 7, 34: 25, 35: 4,
  },
  "PAS-UEM 2025 Etapa 1": {
    1: 14, 2: 15, 3: 7, 4: 29, 5: 27, 6: 15, 7: 9, 8: 5, 9: 10, 10: 24,
    11: 5, 12: 17, 13: 15, 14: 12, 15: 25, 16: 27, 17: 14, 18: 11, 19: 21, 20: 14,
    21: 26, 22: 7, 23: 15, 24: 23, 25: 6, 26: 14, 27: 20, 28: 26, 29: 23, 30: null,
    31: 25, 32: 3, 33: 22, 34: 5, 35: 17, 36: 12, 37: 18, 38: 25, 39: 14, 40: 18,
  },
  "PAS-UEM 2025 Etapa 2": {
    1: 9, 2: 23, 3: 13, 4: 15, 5: 3, 6: 17, 7: 3, 8: 10, 9: 19, 10: 13,
    11: 30, 12: 17, 13: 23, 14: 24, 15: 29, 16: 31, 17: 14, 18: 5, 19: 13, 20: 23,
    21: 15, 22: 10, 23: 13, 24: 23, 25: 10, 26: 6, 27: 3, 28: 19, 29: 29, 30: 14,
    31: 21, 32: 0, 33: 3, 34: 28, 35: 21, 36: 15, 37: 27, 38: 19, 39: 13, 40: 5,
  },
  "PAS-UEM 2025 Etapa 3": {
    1: 11, 2: 8, 3: 12, 4: 7, 5: 31, 6: 21, 7: 27, 8: 18, 9: 7, 10: 26,
    11: 19, 12: 22, 13: 23, 14: 20, 15: 31, 16: 27, 17: 9, 18: 21, 19: 27, 20: 15,
    21: 21, 22: 21, 23: 27, 24: 29, 25: 26, 26: 13, 27: 18, 28: 6, 29: 14, 30: 26,
    31: 3, 32: 28, 33: 5, 34: 10, 35: 23, 36: 15, 37: 12, 38: 17, 39: 14, 40: 15,
  },
};

function getPasStage(exam: string) {
  const match = exam.match(/Etapa\s+(\d)/i);
  return match ? Number(match[1]) : null;
}

function getPasYear(exam: string) {
  const match = exam.match(/PAS-UEM\s+(\d{4})/i);
  return match ? Number(match[1]) : null;
}

function isEnglishPrompt(prompt: string) {
  const text = toSearchText(prompt);
  return text.includes("according to the text") || text.includes("mark the correct");
}

function isSpanishPrompt(prompt: string) {
  const text = toSearchText(prompt);
  return text.includes("segun") || text.includes("senala") || text.includes("tras la lectura") || text.includes("despues");
}

function isFrenchPrompt(prompt: string) {
  const text = toSearchText(prompt);
  return text.includes("d apres") || text.includes("cochez") || text.includes("quel") || text.includes("du point de vue grammatical");
}

function inferPasTrack(question: StructuredQuestion) {
  const text = toSearchText(`${question.prompt} ${question.supportText || ""}`);
  if (isEnglishPrompt(question.prompt)) return "english";
  if (isSpanishPrompt(question.prompt)) return "spanish";
  if (isFrenchPrompt(question.prompt)) return "french";

  if (text.includes("ecologia") || text.includes("genetica") || text.includes("seres vivos") || text.includes("biogeoquimicos") || text.includes("dna") || text.includes("engenharia genetica") || text.includes("doenca genetica")) return "biology";
  if (text.includes("tropicalismo") || text.includes("bale") || text.includes("teatro") || text.includes("danca") || text.includes("arquitetura") || text.includes("musica ocidental") || text.includes("arte ")) return "arts";
  if (text.includes("futebol") || text.includes("esporte") || text.includes("atletismo") || text.includes("ginastica") || text.includes("lutas") || text.includes("praticas corporais") || text.includes("desporto")) return "physical-education";
  if (text.includes("descartes") || text.includes("metafisica") || text.includes("mente e corpo") || text.includes("estetica") || text.includes("filosofia") || text.includes("conhecimento")) return "philosophy";
  if (text.includes("eletr") || text.includes("onda") || text.includes("circuito") || text.includes("luz") || text.includes("capacitor") || text.includes("eletrostatica")) return "physics";
  if (text.includes("urbanizacao") || text.includes("globalizacao") || text.includes("saneamento") || text.includes("geopolitica") || text.includes("demografia") || text.includes("migrat")) return "geography";
  if (text.includes("constituicao") || text.includes("mst") || text.includes("ditadura") || text.includes("america latina") || text.includes("movimentos sociais") || text.includes("historia")) return "history";
  if (text.includes("polin") || text.includes("trigonom") || text.includes("sequencia") || text.includes("numeros complexos") || text.includes("funcao") || text.includes("piramide")) return "mathematics";

  return "common";
}

function inferPasDiscipline(question: StructuredQuestion) {
  const promptTrack = inferPasTrack(question);
  if (promptTrack === "english") return "Ingl\u00eas";
  if (promptTrack === "spanish") return "Espanhol";
  if (promptTrack === "french") return "Franc\u00eas";
  if (promptTrack === "biology") return "Biologia";
  if (promptTrack === "arts") return "Artes";
  if (promptTrack === "physical-education") return "Educa\u00e7\u00e3o F\u00edsica";
  if (promptTrack === "philosophy") return "Filosofia";
  if (promptTrack === "physics") return "F\u00edsica";
  if (promptTrack === "geography") return "Geografia";
  if (promptTrack === "history") return "Hist\u00f3ria";
  if (promptTrack === "mathematics") return "Matem\u00e1tica";

  const fullText = toSearchText([
    question.prompt,
    question.supportTitle,
    question.supportText,
    ...question.statements.map((statement) => statement.text),
  ].join(" "));

  const scores = {
    Artes: countMatches(fullText, ["arte", "art nouveau", "pintura", "escultura", "teatro", "cinema", "musica", "danca", "arquitetura", "artista"]),
    Biologia: countMatches(fullText, ["biologia", "celula", "ecologia", "genetica", "evolucao", "organismo", "embrio", "dna", "rna", "cromoss", "mitose", "meiose", "seres vivos", "biodiversidade", "tecido"]),
    "Educa\u00e7\u00e3o F\u00edsica": countMatches(fullText, ["esporte", "atividade fisica", "pratica corporal", "jogo", "ginastica", "futebol", "olimpi"]),
    Filosofia: countMatches(fullText, ["filosofia", "filosofico", "socrates", "platao", "aristoteles", "descartes", "kant", "nietzsche", "etica", "metafisica", "logica"]),
    "F\u00edsica": countMatches(fullText, ["fisica", "velocidade", "aceleracao", "forca", "energia", "movimento", "eletric", "onda", "pressao", "circuito", "optica", "calor", "newton"]),
    Geografia: countMatches(fullText, ["territorio", "clima", "relevo", "globalizacao", "migracao", "demografia", "urbanizacao", "hidrografia", "cartografia", "geopolitica", "fronteira"]),
    "Hist\u00f3ria": countMatches(fullText, ["historia", "imperio", "colonizacao", "grecia", "romano", "idade media", "ditadura", "revolucao", "escravidao", "guerra", "brasil colonia"]),
    Linguagens: countMatches(fullText, ["lingua", "linguagem", "texto", "genero textual", "sintaxe", "semantica", "coesao", "coerencia", "pronome", "verbo", "adjetivo", "pontuacao", "gramatical", "concordancia"]),
    Literatura: countMatches(fullText, ["poema", "poesia", "romance", "conto", "narrador", "personagem", "verso", "eu lirico", "obra", "autor"]),
    "Matem\u00e1tica": countMatches(fullText, ["matematica", "funcao", "equacao", "probabilidade", "geometr", "trigonom", "matriz", "determinante", "logaritmo", "volume", "area", "porcentagem", "progressao", "raiz", "angulo"]),
    "Qu\u00edmica": countMatches(fullText, ["quimica", "atomo", "molecula", "ligacao", "ph ", "solucao", "reacao", "estequiometria", "oxidacao", "equilibrio quimico", "composto", "hidrocarboneto"]),
    Sociologia: countMatches(fullText, ["sociologia", "durkheim", "weber", "marx", "fato social", "anomia", "socializacao", "classe social", "cultura"]),
  };

  const winner = Object.entries(scores).sort((left, right) => right[1] - left[1])[0];
  if (winner && winner[1] > 0) return winner[0];

  return "Interdisciplinar";
}

function pickCanonicalQuestion(exam: string, number: number, variants: StructuredQuestion[]) {
  const year = getPasYear(exam);
  const stage = getPasStage(exam);
  const promptTracks = variants.map((question) => ({ question, track: inferPasTrack(question) }));

  if (stage === 3 && year && year >= 2021 && year <= 2024 && number >= 31 && number <= 35) {
    return promptTracks.find((entry) => entry.track === "biology")?.question || variants[0];
  }

  const isForeignLanguage =
    (((stage === 1 || stage === 2) && ((year === 2025 && number >= 9 && number <= 12) || (year !== 2025 && number >= 36 && number <= 40))) ||
      (stage === 3 && ((year === 2025 && number >= 9 && number <= 12) || (year !== 2025 && number >= 27 && number <= 30))));

  if (isForeignLanguage) {
    return promptTracks.find((entry) => entry.track === "english")?.question || variants[variants.length - 1];
  }

  return variants[0];
}

export function normalizePasStructuredBank(bank: StructuredBank): StructuredBank {
  const normalizedQuestions = bank.exams.flatMap((exam) => {
    const examQuestions = bank.questions
      .filter((question) => question.exam === exam)
      .sort((a, b) => a.number - b.number || a.prompt.localeCompare(b.prompt));

    const byNumber = new Map<number, StructuredQuestion[]>();
    for (const question of examQuestions) {
      const existing = byNumber.get(question.number) || [];
      existing.push(question);
      byNumber.set(question.number, existing);
    }

    return [...byNumber.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([number, variants]) => {
        const selected = pickCanonicalQuestion(exam, number, variants);
        const officialAnswer = curatedPasAnswers[exam]?.[number] ?? null;
        const baseDiscipline = normalizeDisciplineLabel(selected.discipline);
        const normalizedDiscipline =
          baseDiscipline === "Interdisciplinar" || baseDiscipline === "Ci?ncias da Natureza"
            ? inferPasDiscipline(selected)
            : baseDiscipline;

        return {
          ...selected,
          exam: normalizeExamLabel(selected.exam),
          discipline: normalizedDiscipline,
          officialAnswer,
          officialAnswerSource: pasAnswerSourceByExam[exam] || selected.officialAnswerSource || null,
          officialStatus: officialAnswer === null ? "pending-review" : "active",
        };
      });
  });

  return {
    disciplines: [...new Set(normalizedQuestions.map((question) => question.discipline))].sort(),
    exams: bank.exams.map(normalizeExamLabel),
    questions: normalizedQuestions,
  };
}
