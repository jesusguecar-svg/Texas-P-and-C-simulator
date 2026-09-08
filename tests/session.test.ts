import { describe, expect, it } from "vitest";
import { DOMAIN_IDS, QUESTIONS, selectQuestions } from "../src/lib/questions";
import {
  createSession,
  optionsInSessionOrder,
  parseStoredHistory,
  parseStoredSession,
  scoreSession,
  type Setup,
} from "../src/lib/session";

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

  it("keeps original option order when shuffle is off", () => {
    const selected = QUESTIONS.slice(0, 5);
    const session = createSession(selected, { ...setup, shuffleOptions: false });
    for (const question of selected) {
      expect(session.optionOrders[question.id]).toEqual(question.options.map((option) => option.id));
    }
  });

  it("skips missing question ids when scoring", () => {
    const selected = QUESTIONS.slice(0, 3);
    const session = createSession(selected, setup);
    session.questionIds.push("GONE-Q001");
    session.answers[selected[0].id] = selected[0].correctOption;
    session.answers["GONE-Q001"] = "A";
    const score = scoreSession(session, QUESTIONS);
    expect(score).toMatchObject({ total: 3, correct: 1, incorrect: 0, unanswered: 2, percentage: 33 });
  });
});

describe("stored session restore", () => {
  it("clears corrupt history to an empty list", () => {
    expect(parseStoredHistory("{not-json")).toEqual({ ids: [], valid: false });
    expect(parseStoredHistory("[1,2]")).toEqual({ ids: [], valid: false });
    expect(parseStoredHistory(null)).toEqual({ ids: [], valid: true });
    expect(parseStoredHistory('["G1-Q001"]')).toEqual({ ids: ["G1-Q001"], valid: true });
  });

  it("rejects sessions with the wrong version or stale question ids", () => {
    const known = new Set(QUESTIONS.map((question) => question.id));
    const valid = createSession(QUESTIONS.slice(0, 2), setup);
    const payload = JSON.parse(JSON.stringify(valid)) as Record<string, unknown>;
    expect(parseStoredSession(JSON.stringify(valid), known)?.questionIds).toEqual(valid.questionIds);
    expect(parseStoredSession(JSON.stringify({ ...payload, version: 2 }), known)).toBeNull();
    expect(parseStoredSession(JSON.stringify({ ...payload, questionIds: ["GONE-Q001"] }), known)).toBeNull();
    expect(parseStoredSession("not-json", known)).toBeNull();
  });

  it("orders review options with the stored shuffle", () => {
    const question = QUESTIONS[0];
    const order = [...question.options.map((option) => option.id)].reverse() as Array<"A" | "B" | "C" | "D">;
    expect(optionsInSessionOrder(question, order).map((option) => option.id)).toEqual(order);
  });
});
