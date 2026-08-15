import type { DomainId, OptionId, Question } from "./questions";

export type ExplanationMode = "inmediata" | "al_final" | "nunca";

export interface Setup {
  domains: DomainId[];
  amount: number;
  timed: boolean;
  minutes: number;
  explanationMode: ExplanationMode;
  allowChanges: boolean;
  includeAnswered: boolean;
  shuffleOptions: boolean;
}

export interface SessionState {
  version: 1;
  status: "active" | "submitted";
  setup: Setup;
  questionIds: string[];
  optionOrders: Record<string, OptionId[]>;
  answers: Record<string, OptionId>;
  flagged: string[];
  strikeouts: Record<string, OptionId[]>;
  highlights: Record<string, string[]>;
  current: number;
  startedAt: number;
  expiresAt: number | null;
  submittedAt: number | null;
}

export const SESSION_KEY = "alleanza-texas-pc-session-v1";
export const HISTORY_KEY = "alleanza-texas-pc-history-v1";
export const THEME_KEY = "alleanza-texas-pc-theme";

export function createSession(questions: Question[], setup: Setup): SessionState {
  const startedAt = Date.now();
  const optionOrders = Object.fromEntries(
    questions.map((question) => [
      question.id,
      setup.shuffleOptions
        ? [...question.options].sort(() => Math.random() - 0.5).map((option) => option.id)
        : question.options.map((option) => option.id),
    ]),
  );
  return {
    version: 1,
    status: "active",
    setup,
    questionIds: questions.map((question) => question.id),
    optionOrders,
    answers: {},
    flagged: [],
    strikeouts: {},
    highlights: {},
    current: 0,
    startedAt,
    expiresAt: setup.timed ? startedAt + setup.minutes * 60_000 : null,
    submittedAt: null,
  };
}

export function scoreSession(session: SessionState, questions: Question[]) {
  const selected = session.questionIds.map((id) => questions.find((question) => question.id === id)!);
  const correct = selected.filter((question) => session.answers[question.id] === question.correctOption).length;
  const answered = Object.keys(session.answers).length;
  const byDomain = selected.reduce<Record<string, { total: number; correct: number }>>((result, question) => {
    result[question.domain] ??= { total: 0, correct: 0 };
    result[question.domain].total += 1;
    if (session.answers[question.id] === question.correctOption) result[question.domain].correct += 1;
    return result;
  }, {});
  return {
    total: selected.length,
    correct,
    incorrect: answered - correct,
    unanswered: selected.length - answered,
    percentage: selected.length ? Math.round((correct / selected.length) * 100) : 0,
    byDomain,
  };
}
