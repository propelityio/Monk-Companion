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
    const { intent, passages } = await findPassages(messages);
    if (passages.length > 0 && intent !== "smalltalk") {
      const grounded = await groundedAnswer(messages, passages);
      if (grounded) return grounded;
    }
    if (isAboutTheSite(query)) return siteNote(messages, ctx);
    // Someone sharing how they are (or saying hello) gets listened to, not refused.
    if (intent !== "question") {
      const listening = await listeningReply(messages);
      if (listening) return listening;
    }
  } catch (err) {
    console.error("[chat] knowledge base error:", err);
    // Questions about the site itself can still be answered without the AI.
    if (isAboutTheSite(query)) return replyTo(messages, ctx);
    return { content: text.error, citations: [], crisis: false };
  }

  // A question that nothing in the teachings answers: say so honestly.
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

/** Recent turns as plain text, so the models see the Monk's own questions too. */
function transcript(messages: ChatMessage[], turns = 8): string {
  return messages
    .slice(-turns)
    .map((m) => `${m.role === "user" ? "Person" : "Companion"}: ${m.content.replace(/\s*\[\d+(?:,\s*\d+)*\]/g, "")}`)
    .join("\n");
}

export type Intent = "question" | "share" | "smalltalk";

async function findPassages(
  messages: ChatMessage[],
): Promise<{ intent: Intent; passages: Passage[] }> {
  const latest = lastUserText(messages);
  const raw = await claude({
    model: MODELS.search,
    maxTokens: 200,
    system:
      "You help a Buddhist teaching companion find relevant passages in a database of teachings by Ven. Kalden (English, Spanish, Portuguese). " +
      "Read the conversation and focus on the person's LATEST message, using earlier turns only for context " +
      '(e.g. if the companion asked "How are you feeling?" and the person said "stressed about work", search for stress). ' +
      'Reply with JSON only, no prose: {"intent": "...", "en": "...", "es": "...", "pt": "..."}. ' +
      'intent is "question" (asks about a teaching or practice), "share" (tells how they feel or what is happening in their life), or "smalltalk" (greetings, thanks, "I\'m fine"). ' +
      'Each language value is 3 to 8 key words or short phrases joined by " or ", in that language: the underlying concerns plus close synonyms and related Buddhist terms ' +
      '(e.g. anger -> "anger or angry or hatred or patience or irritation"). No stop words, no quotes, no punctuation besides "or". For smalltalk use empty strings.',
    messages: [{ role: "user", content: transcript(messages, 6) }],
  });
  const intent = parseIntent(raw);
  if (intent === "smalltalk") return { intent, passages: [] };
  return { intent, passages: await searchTeachings(parseSearchTerms(raw, latest), 8) };
}

export function parseIntent(raw: string): Intent {
  const m = raw.match(/"intent"\s*:\s*"(question|share|smalltalk)"/);
  return (m?.[1] as Intent | undefined) ?? "question";
}

const COMPANION = "You are Monk Companion, offered by Awaythroughfoundation. You walk alongside people with the teachings of Ven. Kalden, a Buddhist monk. You are not Kalden and never speak as him.";

async function groundedAnswer(
  messages: ChatMessage[],
  passages: Passage[],
): Promise<ChatReply | null> {
  const numbered = passages
    .map((p, i) => `[${i + 1}] From "${p.title}" (language: ${p.language})\n${p.content}`)
    .join("\n\n---\n\n");

  const reply = await claude({
    model: MODELS.answer,
    maxTokens: 700,
    system: [
      COMPANION,
      "This is a two-way conversation, not a search engine. Respond to what the person just said, in the context of the conversation so far.",
      "RULES:",
      "1. Any teaching, idea, practice or advice you give must come ONLY from the numbered passages. Do not add Buddhist teachings, quotes, practices or facts from anywhere else, even if you know them.",
      "2. Cite each teaching point with its passage number in square brackets, like [2].",
      "3. You may, without a citation: briefly acknowledge what the person shared in their own terms (one short sentence), and end with ONE gentle, open follow-up question that invites them to reflect or say more. Never put new teaching into those uncited sentences.",
      `4. If the passages do not genuinely relate to what the person said, reply with exactly ${NO_ANSWER} and nothing else.`,
      '5. Lines starting with "Participant:" are students speaking, not Kalden. Never present them as his teaching.',
      "6. Reply in the language of the person's latest message, even if the passages are in another language. Keep Kalden's meaning; do not invent wording and present it as a quote.",
      "7. Be warm, plain and brief, like a kind monk speaking: 2 to 4 short paragraphs including the closing question.",
      "8. You are not a therapist or doctor. If the person seems in danger, tell them to contact emergency services or a crisis line (988 in the US).",
    ].join("\n"),
    messages: [
      {
        role: "user",
        content:
          `Conversation so far:\n${transcript(messages)}\n\n===\n\n` +
          `Passages from Ven. Kalden's recorded teachings:\n\n${numbered}\n\n===\n\n` +
          `Write the Companion's next reply to the person's latest message.`,
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

/**
 * When someone shares how they are and no teaching fits, listen instead of
 * refusing: acknowledge in a sentence and invite them to say more. No teaching,
 * advice or practice is allowed here, so nothing is presented as Kalden's.
 */
async function listeningReply(messages: ChatMessage[]): Promise<ChatReply | null> {
  const reply = await claude({
    model: MODELS.search,
    maxTokens: 150,
    system: [
      COMPANION,
      "Write the Companion's next reply in this conversation. You have NO teachings available for this turn.",
      "Write at most two short sentences: a warm, plain acknowledgement of what the person said, then ONE open question inviting them to share more or to say what they would like to explore.",
      "Do NOT give advice, teachings, practices, quotes, explanations or Buddhist ideas of any kind. Do not mention Kalden, the teachings, or that anything is missing.",
      "Reply in the language of the person's latest message. Output only the reply.",
    ].join("\n"),
    messages: [{ role: "user", content: `Conversation so far:\n${transcript(messages)}` }],
  });
  const clean = reply.replace(/^companion:\s*/i, "").trim();
  // Guard: listening replies are short; anything long is probably advice.
  if (!clean || clean.length > 320 || /\[\d+\]/.test(clean)) return null;
  return { content: clean, citations: [], crisis: false };
}
