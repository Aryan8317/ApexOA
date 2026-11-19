// Pure function — no DB, no UI imports. Testable in isolation.

export const DOMAINS = ["DSA", "SYSTEM_DESIGN", "CS_CORE", "BEHAVIORAL"] as const;
export type Domain = typeof DOMAINS[number];

export const DOMAIN_LABELS: Record<Domain, string> = {
  DSA: "DSA / Coding",
  SYSTEM_DESIGN: "System Design",
  CS_CORE: "CS Core",
  BEHAVIORAL: "Behavioral",
};

export interface DomainStat {
  mean: number | null;  // null = no data
  count: number;
}

export interface AnswerWithDomain {
  rating: number;
  domain: string;
}

export function domainStats(answers: AnswerWithDomain[]): Record<Domain, DomainStat> {
  const result = {} as Record<Domain, DomainStat>;
  for (const d of DOMAINS) {
    const ratings = answers
      .filter(a => a.domain === d && Number.isInteger(a.rating) && a.rating >= 1 && a.rating <= 10)
      .map(a => a.rating);
    result[d] = ratings.length
      ? { mean: ratings.reduce((s, r) => s + r, 0) / ratings.length, count: ratings.length }
      : { mean: null, count: 0 };
  }
  return result;
}
