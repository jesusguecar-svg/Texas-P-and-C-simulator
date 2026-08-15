import g1 from "../../question-bank/G1.json";
import g2 from "../../question-bank/G2.json";
import g3 from "../../question-bank/G3.json";
import g4 from "../../question-bank/G4.json";
import g5 from "../../question-bank/G5.json";
import g6 from "../../question-bank/G6.json";
import tx1 from "../../question-bank/TX1.json";
import tx2 from "../../question-bank/TX2.json";

export const DOMAIN_IDS = ["G1", "G2", "G3", "G4", "G5", "G6", "TX1", "TX2"] as const;
export type DomainId = (typeof DOMAIN_IDS)[number];
export type OptionId = "A" | "B" | "C" | "D";

export interface QuestionOption {
  id: OptionId;
  text: string;
  rationale: string;
}

export interface Question {
  id: string;
  domain: DomainId;
  subtopic: string;
  difficulty: "basica" | "intermedia" | "avanzada";
  stem: string;
  options: QuestionOption[];
  correctOption: OptionId;
  explanation: string;
  keyTerms: { es: string; en: string }[];
  source: { file: string; section: string };
  reviewStatus: "pending_expert_review";
}

export const DOMAIN_META: Record<DomainId, { name: string; short: string; examCount: number }> = {
  G1: { name: "Pólizas de propiedad", short: "Propiedad", examCount: 22 },
  G2: { name: "Términos y conceptos de propiedad", short: "Conceptos de propiedad", examCount: 15 },
  G3: { name: "Disposiciones de propiedad y contratos", short: "Contratos", examCount: 13 },
  G4: { name: "Pólizas de accidentes, fianzas y términos", short: "Pólizas de accidentes", examCount: 23 },
  G5: { name: "Conceptos relacionados con accidentes", short: "Conceptos de accidentes", examCount: 15 },
  G6: { name: "Disposiciones de pólizas de accidentes", short: "Disposiciones", examCount: 12 },
  TX1: { name: "Reglas de Texas comunes a P&C", short: "Reglas comunes TX", examCount: 18 },
  TX2: { name: "Reglas de Texas específicas de P&C", short: "Reglas P&C TX", examCount: 12 },
};

export const QUESTIONS = [...g1, ...g2, ...g3, ...g4, ...g5, ...g6, ...tx1, ...tx2] as Question[];

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function selectQuestions(
  domains: DomainId[],
  amount: number,
  excludedIds: Set<string>,
  includeAnswered: boolean,
): Question[] {
  let pool = QUESTIONS.filter((question) => domains.includes(question.domain));
  if (!includeAnswered) pool = pool.filter((question) => !excludedIds.has(question.id));
  return shuffle(pool).slice(0, Math.min(amount, pool.length));
}
