import { DOMAIN_IDS, type DomainId } from "./questions";
import type { ExplanationMode, Setup } from "./session";

const DOMAIN_SET = new Set<string>(DOMAIN_IDS);
const DEFAULT_AMOUNT = 10;
const DEFAULT_MINUTES = 75;

export function parseDeepLink(search: string): Setup | null {
  const params = new URLSearchParams(search);
  const domains = parseDomains(params.get("dominio"));
  if (!domains.length) return null;

  const tiempo = Number(params.get("tiempo"));
  const timed = Number.isFinite(tiempo) && tiempo > 0;

  return {
    domains,
    amount: parseAmount(params.get("n")),
    timed,
    minutes: timed ? tiempo : DEFAULT_MINUTES,
    explanationMode: parseExplanation(params.get("exp")),
    allowChanges: true,
    includeAnswered: true,
    shuffleOptions: true,
  };
}

function parseDomains(raw: string | null): DomainId[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const domains: DomainId[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim().toUpperCase();
    if (!DOMAIN_SET.has(id) || seen.has(id)) continue;
    seen.add(id);
    domains.push(id as DomainId);
  }
  return domains;
}

function parseAmount(raw: string | null): number {
  if (raw == null || raw.trim() === "") return DEFAULT_AMOUNT;
  const value = Math.trunc(Number(raw));
  if (!Number.isFinite(value)) return DEFAULT_AMOUNT;
  return Math.min(130, Math.max(1, value));
}

function parseExplanation(raw: string | null): ExplanationMode {
  const value = raw?.trim().toLowerCase();
  if (value === "inmediata" || value === "al_final" || value === "nunca") return value;
  return "inmediata";
}
