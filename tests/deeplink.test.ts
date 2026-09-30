import { describe, expect, it } from "vitest";
import { parseDeepLink } from "../src/lib/deeplink";
import type { Setup } from "../src/lib/session";

const base: Omit<Setup, "domains" | "amount" | "timed" | "minutes" | "explanationMode"> = {
  allowChanges: true,
  includeAnswered: true,
  shuffleOptions: true,
};

function setupFrom(search: string): Setup {
  const setup = parseDeepLink(search);
  if (!setup) throw new Error(`expected a setup for ${search}`);
  return setup;
}

describe("parseDeepLink", () => {
  it("parses a single domain and starts ten questions", () => {
    expect(setupFrom("?dominio=G1&n=10")).toEqual({
      ...base,
      domains: ["G1"],
      amount: 10,
      timed: false,
      minutes: 75,
      explanationMode: "inmediata",
    });
  });

  it("parses several domains in the given order", () => {
    expect(setupFrom("?dominio=G1,G2,G3,G4,G5,G6").domains).toEqual(["G1", "G2", "G3", "G4", "G5", "G6"]);
  });

  it("accepts lowercase domain ids and ignores duplicates", () => {
    expect(setupFrom("dominio=g1, tx2, g1").domains).toEqual(["G1", "TX2"]);
  });

  it("returns null when no valid domain is given", () => {
    expect(parseDeepLink("")).toBeNull();
    expect(parseDeepLink("?n=10")).toBeNull();
    expect(parseDeepLink("?dominio=ZZ")).toBeNull();
    expect(parseDeepLink("?dominio=no-existe,")).toBeNull();
  });

  it("defaults n to 10 and clamps it between 1 and 130", () => {
    expect(setupFrom("?dominio=G1").amount).toBe(10);
    expect(setupFrom("?dominio=G1&n=0").amount).toBe(1);
    expect(setupFrom("?dominio=G1&n=-4").amount).toBe(1);
    expect(setupFrom("?dominio=G1&n=999").amount).toBe(130);
    expect(setupFrom("?dominio=G1&n=abc").amount).toBe(10);
    expect(setupFrom("?dominio=G1&n=25").amount).toBe(25);
  });

  it("parses explanation mode and timer minutes", () => {
    expect(setupFrom("?dominio=G1").explanationMode).toBe("inmediata");
    expect(setupFrom("?dominio=G1&exp=al_final").explanationMode).toBe("al_final");
    expect(setupFrom("?dominio=G1&exp=NUNCA").explanationMode).toBe("nunca");
    expect(setupFrom("?dominio=G1&exp=despues").explanationMode).toBe("inmediata");

    expect(setupFrom("?dominio=G1&tiempo=20")).toMatchObject({ timed: true, minutes: 20 });
    expect(setupFrom("?dominio=G1&tiempo=0")).toMatchObject({ timed: false, minutes: 75 });
    expect(setupFrom("?dominio=G1&tiempo=-5")).toMatchObject({ timed: false, minutes: 75 });
    expect(setupFrom("?dominio=TX1")).toMatchObject({ timed: false, minutes: 75 });
  });
});
