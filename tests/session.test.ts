import { describe, expect, it } from "vitest";
import { DOMAIN_IDS, QUESTIONS, selectQuestions } from "../src/lib/questions";
import { createSession, scoreSession, type Setup } from "../src/lib/session";

const setup: Setup = {
  domains: [...DOMAIN_IDS],
  amount: 10,
  timed: true,
  minutes: 30,
  explanationMode: "al_final",
  allowChanges: true,
  includeAnswered: true,
  shuffleOptions: true,
};

describe("question bank", () => {
  it("loads exactly 300 unique questions", () => {
    expect(QUESTIONS).toHaveLength(300);
    expect(new Set(QUESTIONS.map((question) => question.id)).size).toBe(300);
  });

  it("filters domains and previously answered questions", () => {
    const history = new Set(QUESTIONS.filter((question) => question.domain === "G1").map((question) => question.id));
    const selected = selectQuestions(["G1", "G2"], 300, history, false);
    expect(selected.every((question) => question.domain === "G2")).toBe(true);
    expect(selected).toHaveLength(35);
  });
});

describe("session engine", () => {
  it("creates a stable session and scores unanswered questions", () => {
    const selected = QUESTIONS.slice(0, 10);
    const session = createSession(selected, setup);
    expect(session.questionIds).toEqual(selected.map((question) => question.id));
    expect(session.expiresAt).toBe(session.startedAt + 30 * 60_000);

    session.answers[selected[0].id] = selected[0].correctOption;
    session.answers[selected[1].id] = selected[1].options.find((option) => option.id !== selected[1].correctOption)!.id;
    const score = scoreSession(session, QUESTIONS);
    expect(score).toMatchObject({ total: 10, correct: 1, incorrect: 1, unanswered: 8, percentage: 10 });
  });

  it("stores each option order as a complete permutation", () => {
    const selected = QUESTIONS.slice(0, 20);
    const session = createSession(selected, setup);
    for (const question of selected) {
      expect([...session.optionOrders[question.id]].sort()).toEqual(["A", "B", "C", "D"]);
    }
  });
});
