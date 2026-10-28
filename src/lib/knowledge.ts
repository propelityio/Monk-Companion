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
    text: "Monk Companion is offered by Awaythroughfoundation. You may speak or type freely with no account. Answers rest on recorded and written Buddhist teachings from monks and teachers. When no teaching speaks to a question, the companion says so instead of inventing one.",
    tags: ["welcome", "about", "guest", "account"],
  },
  {
    id: "foundation-guest",
    title: "No login required",
    sourceType: "foundation",
    text: "A conversation does not require a subscription or a password. Guest sessions live only in this browser until you leave. For a curated path, you may share a preferred name and email so the companion can recognize you later.",
    tags: ["login", "log", "sign", "subscription", "pay", "free", "cost", "password", "account", "curated"],
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
    tags: ["therapy", "therapist", "crisis", "emergency", "988"],
  },
  {
    id: "foundation-knowledge",
    title: "Knowledge still arriving",
    sourceType: "foundation",
    text: "The knowledge base is made of recorded talks, their transcriptions, and written teachings from Buddhist monks and teachers, each linked to its source. More are added over time. When a question needs a teaching that is not yet here, the honest reply is to say so.",
    tags: ["youtube", "transcript", "teaching", "knowledge", "sources"],
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
  "about",
  "am",
  "are",
  "any",
  "does",
  "get",
  "have",
  "help",
  "need",
  "should",
  "tell",
  "teach",
  "want",
  "would",
  "your",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export function retrieve(query: string, limit = 3): KnowledgeChunk[] {
  const terms = words(query);

  if (terms.length === 0) {
    return [KNOWLEDGE_CHUNKS[0]];
  }

  // Whole-word matching so generic words ("teach", "need") don't pull in
  // unrelated chunks via substrings ("teachings", "needs").
  const scored = KNOWLEDGE_CHUNKS.map((chunk) => {
    const vocab = new Set(words(`${chunk.title} ${chunk.text} ${chunk.tags.join(" ")}`));
    const score = terms.reduce((sum, term) => sum + (vocab.has(term) ? 1 : 0), 0);
    return { chunk, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((row) => row.chunk);
}

const CRISIS_PHRASES = [
  // English
  "suicid", // suicide, suicidal; also matches suicidio, suicídio, suicidaire, suicidarmi
  "kill myself",
  "want to die",
  "end my life",
  "end it all",
  "hurt myself",
  "self harm",
  "self-harm",
  "no reason to live",
  "don't want to live",
  "dont want to live",
  "don't want to be alive",
  // Spanish
  "quiero morir",
  "matarme",
  "quitarme la vida",
  "no quiero vivir",
  "hacerme daño",
  "acabar con todo",
  // Portuguese
  "quero morrer",
  "me matar",
  "tirar minha vida",
  "tirar a minha vida",
  "não quero viver",
  "nao quero viver",
  "me machucar",
  // French
  "envie de mourir",
  "me tuer",
  "en finir",
  "mettre fin à ma vie",
  "me faire du mal",
  // German
  "suizid",
  "umbringen",
  "nicht mehr leben",
  "sterben will",
  "mir etwas antun",
  // Italian
  "voglio morire",
  "uccidermi",
  "farla finita",
  "togliermi la vita",
  // Chinese
  "自杀",
  "自殺",
  "想死",
  "不想活",
  "结束生命",
  // Japanese
  "死にたい",
  "消えたい",
  "自傷",
];

export function isCrisis(query: string): boolean {
  const q = query.toLowerCase().replace(/[\u2018\u2019]/g, "'");
  return CRISIS_PHRASES.some((phrase) => q.includes(phrase));
}
