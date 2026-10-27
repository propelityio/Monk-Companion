export type KnowledgeChunk = {
  id: string;
  title: string;
  sourceType: "talk" | "transcript" | "text" | "foundation";
  url?: string;
  timestamp?: string;
  text: string;
  tags: string[];
};

/**
 * Placeholder corpus until official talks and transcripts are licensed and ingested.
 * Do not treat this as the monk's dharma. Real teachings belong in
 * `knowledge/sources/` and should replace these rows.
 */
export const KNOWLEDGE_CHUNKS: KnowledgeChunk[] = [
  {
    id: "foundation-welcome",
    title: "How this companion works",
    sourceType: "foundation",
    text: "Monk Companion is offered by Awaythroughfoundation. You may speak or type freely with no account. Answers are meant to rest on Kalden's recorded and written teachings. Until those sources are loaded, the companion will say when it does not yet have a talk to cite.",
    tags: ["welcome", "about", "guest", "account"],
  },
  {
    id: "foundation-guest",
    title: "No login required",
    sourceType: "foundation",
    text: "A conversation does not require a subscription or a password. Guest sessions live only in this browser until you leave. For a curated path, you may share a preferred name and email so the companion can recognize you later.",
    tags: ["login", "subscription", "identity", "email", "curated"],
  },
  {
    id: "foundation-curated",
    title: "Curated companion",
    sourceType: "foundation",
    text: "Minimum information for a curated experience is a preferred name and an email. That is used to remember your intention and suggest relevant talks, not to sell access.",
    tags: ["curated", "profile", "name", "email", "memory"],
  },
  {
    id: "foundation-not-therapy",
    title: "Not therapy",
    sourceType: "foundation",
    text: "This companion is not medical care, psychotherapy, or a replacement for a living sangha. If you are in immediate danger or thinking of harming yourself, contact local emergency services. In the United States you can call or text 988.",
    tags: ["therapy", "crisis", "suicide", "harm", "help", "988"],
  },
  {
    id: "foundation-knowledge",
    title: "Knowledge still arriving",
    sourceType: "foundation",
    text: "The lasting knowledge base will be Kalden's YouTube talks, their transcriptions, and written text, each cited by title and timestamp. Those sources are not in this first website yet. When a question needs a teaching that is not loaded, the honest reply is that the talk is not yet here.",
    tags: ["youtube", "transcript", "teaching", "knowledge", "kalden"],
  },
];

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "in",
  "for",
  "is",
  "it",
  "i",
  "you",
  "me",
  "my",
  "with",
  "on",
  "this",
  "that",
  "be",
  "as",
  "at",
  "do",
  "how",
  "what",
  "why",
  "can",
  "please",
]);

export function retrieve(query: string, limit = 3): KnowledgeChunk[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((t) => t.length > 1 && !STOP.has(t));

  if (terms.length === 0) {
    return [KNOWLEDGE_CHUNKS[0]];
  }

  const scored = KNOWLEDGE_CHUNKS.map((chunk) => {
    const hay = `${chunk.title} ${chunk.text} ${chunk.tags.join(" ")}`.toLowerCase();
    const score = terms.reduce((sum, term) => sum + (hay.includes(term) ? 1 : 0), 0);
    return { chunk, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((row) => row.chunk);
}

export function isCrisis(query: string): boolean {
  const q = query.toLowerCase();
  return (
    q.includes("suicide") ||
    q.includes("kill myself") ||
    q.includes("want to die") ||
    q.includes("end my life") ||
    q.includes("self harm") ||
    q.includes("self-harm")
  );
}
