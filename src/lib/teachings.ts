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

/** Remove email addresses, phone numbers and links before keeping a question. */
export function redact(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")
    .replace(/https?:\/\/\S+|www\.\S+/gi, "[link]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[number]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

/**
 * Keep an unanswered question for the foundation's to-do list. Never blocks or
 * breaks a reply: if the table isn't set up yet, nothing happens.
 */
export async function logUnanswered(
  question: string,
  language: string,
  outcome: "offered_nearby" | "no_teaching",
  topics = "",
): Promise<void> {
  const base = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const clean = redact(question);
  if (!base || !key || clean.length < 3) return;
  try {
    await fetch(`${base}/rest/v1/unanswered_questions`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ question: clean, language, outcome, topics: topics.slice(0, 300) }),
      cache: "no-store",
    });
  } catch {
    /* the to-do list is a nicety; never affect the conversation */
  }
}
