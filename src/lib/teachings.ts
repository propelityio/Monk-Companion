// Retrieval from the Supabase knowledge base (server-only).

export type Passage = {
  id: string;
  source_id: string;
  title: string;
  video_url: string | null;
  language: string;
  content: string;
  rank: number;
};

export type SearchTerms = { en: string; es: string; pt: string };

export function knowledgeBaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.ANTHROPIC_API_KEY,
  );
}

export async function searchTeachings(terms: SearchTerms, limit = 8): Promise<Passage[]> {
  const base = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const res = await fetch(`${base}/rest/v1/rpc/match_teachings`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q_en: terms.en,
      q_es: terms.es,
      q_pt: terms.pt,
      match_count: limit,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase search ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return (await res.json()) as Passage[];
}

/** Turn a model reply like `{"en":"a or b",...}` into search terms; fall back to the raw question. */
export function parseSearchTerms(raw: string, question: string): SearchTerms {
  const fallback = { en: question, es: question, pt: question };
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return fallback;
  try {
    const obj = JSON.parse(match[0]) as Partial<SearchTerms>;
    const clean = (v: unknown) =>
      typeof v === "string" && v.trim() ? v.replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim() : "";
    const terms = { en: clean(obj.en), es: clean(obj.es), pt: clean(obj.pt) };
    return terms.en || terms.es || terms.pt ? terms : fallback;
  } catch {
    return fallback;
  }
}

/** Numbers like [1], [2][3] or [1, 3] cited in an answer, limited to 1..max. */
export function citedNumbers(answer: string, max: number): number[] {
  const found = new Set<number>();
  for (const group of answer.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)) {
    for (const n of group[1].split(",").map((x) => Number(x.trim()))) {
      if (n >= 1 && n <= max) found.add(n);
    }
  }
  return [...found].sort((a, b) => a - b);
}

export type Listening = {
  id: string;
  kind: string;
  title: string;
  language: string;
  url: string;
  rank: number;
};

/**
 * Podcasts (and later videos) to suggest, matched on the same search terms and
 * preferring the visitor's language. Returns [] if the table isn't set up yet.
 */
export async function searchListening(
  terms: SearchTerms,
  language: string,
  limit = 2,
): Promise<Listening[]> {
  const base = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  try {
    const res = await fetch(`${base}/rest/v1/rpc/match_listening`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ q_en: terms.en, q_es: terms.es, q_pt: terms.pt, lang: language, match_count: limit }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as Listening[];
  } catch {
    return [];
  }
}
