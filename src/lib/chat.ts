import { claude, MODELS } from "./anthropic";
import { crisisReply, SERVER_TEXT, type Locale } from "./i18n";
import { isCrisis, retrieve, type KnowledgeChunk } from "./knowledge";
import {
  citedNumbers,
  knowledgeBaseConfigured,
  parseSearchTerms,
  searchTeachings,
  type Passage,
} from "./teachings";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatCitation = {
  id: string;
  title: string;
  sourceType: KnowledgeChunk["sourceType"];
  url?: string;
};

export type ChatReply = {
  content: string;
  citations: ChatCitation[];
  crisis: boolean;
};

export type ChatContext = {
  locale: Locale;
  /** Country code used only to show the right crisis line. */
  region?: string | null;
};

const DEFAULT_CONTEXT: ChatContext = { locale: "en", region: null };

const NO_ANSWER = "NO_ANSWER";

/** Synchronous replies that never need the knowledge base. */
export function replyTo(messages: ChatMessage[], ctx: ChatContext = DEFAULT_CONTEXT): ChatReply {
  const text = SERVER_TEXT[ctx.locale];
  const query = lastUserText(messages);
  if (!query) return { content: text.empty, citations: [], crisis: false };
  if (isCrisis(query)) return { content: crisisReply(ctx.locale, ctx.region), citations: [], crisis: true };

  // Questions about the companion itself (login, privacy, therapy) are answered
  // from the small "about this site" notes, never presented as teachings.
  const chunks = retrieve(query);
  if (chunks.length === 0) {
    return { content: text.noTeaching, citations: [], crisis: false };
  }
  return {
    content: chunks.map((c) => c.text).join(" "),
    citations: chunks.map((c) => ({ id: c.id, title: c.title, sourceType: c.sourceType })),
    crisis: false,
  };
}

/** Full reply: crisis check, then the teachings database, then the site notes. */
export async function answer(
  messages: ChatMessage[],
  ctx: ChatContext = DEFAULT_CONTEXT,
): Promise<ChatReply> {
  const text = SERVER_TEXT[ctx.locale];
  const query = lastUserText(messages);
  if (!query) return { content: text.empty, citations: [], crisis: false };
  if (isCrisis(query)) return { content: crisisReply(ctx.locale, ctx.region), citations: [], crisis: true };
  if (!knowledgeBaseConfigured()) return replyTo(messages, ctx);

  try {
    const passages = await findPassages(query);
    if (passages.length > 0) {
      const grounded = await groundedAnswer(messages, passages);
      if (grounded) return grounded;
    }
  } catch (err) {
    console.error("[chat] knowledge base error:", err);
    // Questions about the site itself can still be answered without the AI.
    if (isAboutTheSite(query)) return replyTo(messages, ctx);
    return { content: text.error, citations: [], crisis: false };
  }

  // Nothing in the teachings answers this. Only fall back to the site notes for
  // questions about the companion itself; otherwise say so honestly.
  if (isAboutTheSite(query)) return siteNote(messages, ctx);
  return { content: text.noTeaching, citations: [], crisis: false };
}

/** Site notes are written in English; translate them for other languages. */
async function siteNote(messages: ChatMessage[], ctx: ChatContext): Promise<ChatReply> {
  let reply = replyTo(messages, ctx);
  if (reply.citations.length === 0) {
    // The notes are keyed by English words; for other languages use the general note.
    reply = replyTo([{ role: "user", content: "login account pay free" }], ctx);
  }
  if (ctx.locale === "en" || reply.citations.length === 0) return reply;
  try {
    const translated = await claude({
      model: MODELS.search,
      maxTokens: 500,
      temperature: 0,
      system:
        "Translate the user's text faithfully into the requested language. Output only the translation, nothing else.",
      messages: [{ role: "user", content: `Language: ${ctx.locale}\n\n${reply.content}` }],
    });
    return translated ? { ...reply, content: translated } : reply;
  } catch {
    return reply;
  }
}

function lastUserText(messages: ChatMessage[]): string {
  return [...messages].reverse().find((m) => m.role === "user")?.content?.trim() ?? "";
}

function isAboutTheSite(q: string): boolean {
  return /\b(log ?in|sign ?(up|in)|account|password|pay|cost|free|subscription|email|curated|privacy|therapy|therapist|who are you|what are you|how does this work|cuenta|contraseña|pagar|gratis|iniciar sesión|correo|terapia|conta|senha|grátis|cadastro|compte|mot de passe|gratuit|payer|konto|passwort|kostenlos|anmelden|accesso|gratuito)\b/i.test(
    q,
  );
}

async function findPassages(question: string): Promise<Passage[]> {
  const raw = await claude({
    model: MODELS.search,
    maxTokens: 200,
    temperature: 0,
    system:
      "You turn a person's question into full-text search terms for a database of Buddhist teachings by Ven. Kalden, in English, Spanish and Portuguese. " +
      'Reply with JSON only, no prose: {"en": "...", "es": "...", "pt": "..."}. ' +
      'Each value is 3 to 8 key words or short phrases joined by " or ", in that language: the main concepts plus close synonyms and related Buddhist terms ' +
      '(e.g. anger -> "anger or angry or hatred or patience or irritation"). No stop words, no quotes, no punctuation besides "or".',
    messages: [{ role: "user", content: question }],
  });
  return searchTeachings(parseSearchTerms(raw, question), 8);
}

async function groundedAnswer(
  messages: ChatMessage[],
  passages: Passage[],
): Promise<ChatReply | null> {
  const numbered = passages
    .map((p, i) => `[${i + 1}] From "${p.title}" (language: ${p.language})\n${p.content}`)
    .join("\n\n---\n\n");

  const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
  const last = history.pop();
  if (!last || last.role !== "user") return null;
  // The API needs alternating roles starting with a user turn.
  while (history.length && history[0].role !== "user") history.shift();

  const reply = await claude({
    model: MODELS.answer,
    maxTokens: 700,
    temperature: 0.3,
    system: [
      "You are Monk Companion, offered by Awaythroughfoundation. You share the teachings of Ven. Kalden, a Buddhist monk. You are not Kalden and never speak as him.",
      "RULES:",
      "1. Use ONLY the numbered passages supplied with the person's message. Do not add Buddhist teachings, quotes, practices, or facts from anywhere else, even if you know them.",
      `2. If the passages do not genuinely address the question, reply with exactly ${NO_ANSWER} and nothing else.`,
      "3. Cite every point with the passage number in square brackets, like [2]. Every paragraph must contain at least one citation.",
      '4. Lines starting with "Participant:" are students speaking, not Kalden. Never present them as his teaching.',
      "5. Reply in the same language as the person's question, even if the passages are in another language. Keep Kalden's meaning; do not invent wording and present it as a quote.",
      "6. Be warm, plain and brief: 2 to 4 short paragraphs. You may suggest a reflection only if it comes from the passages.",
      "7. You are not a therapist or doctor. If the person seems in danger, tell them to contact emergency services or call or text 988 in the US.",
    ].join("\n"),
    messages: [
      ...history,
      {
        role: "user",
        content: `Passages from Ven. Kalden's recorded teachings:\n\n${numbered}\n\n===\n\nQuestion: ${last.content}`,
      },
    ],
  });

  if (!reply || reply.includes(NO_ANSWER)) return null;
  const cited = citedNumbers(reply, passages.length);
  if (cited.length === 0) return null; // ungrounded answer: refuse rather than show it

  // One chip per cited transcript; renumber [n] markers to match the chips.
  const chipFor = new Map<number, number>();
  const chipBySource = new Map<string, number>();
  const citations: ChatCitation[] = [];
  for (const n of cited) {
    const p = passages[n - 1];
    let chip = chipBySource.get(p.source_id);
    if (chip === undefined) {
      citations.push({
        id: p.source_id,
        title: p.title,
        sourceType: "transcript",
        url: p.video_url ?? undefined,
      });
      chip = citations.length;
      chipBySource.set(p.source_id, chip);
    }
    chipFor.set(n, chip);
  }
  const content = reply
    .replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (_, group: string) => {
      const chips = [
        ...new Set(
          group
            .split(",")
            .map((x) => chipFor.get(Number(x.trim())))
            .filter((x): x is number => x !== undefined),
        ),
      ];
      return chips.length ? `[${chips.join(", ")}]` : "";
    })
    .replace(/(\[\d+(?:, \d+)*\])(\s*\1)+/g, "$1")
    .trim();
  return { content, citations, crisis: false };
}
