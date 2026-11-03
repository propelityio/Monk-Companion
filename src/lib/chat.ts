import { claude, MODELS } from "./anthropic";
import { crisisReply, SERVER_TEXT, type Locale } from "./i18n";
import { isCrisis, retrieve, type KnowledgeChunk } from "./knowledge";
import {
  citedNumbers,
  knowledgeBaseConfigured,
  parseSearchTerms,
  logUnanswered,
  searchListening,
  searchTeachings,
  type Listening,
  type Passage,
  type SearchTerms,
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
  /** The conversation has come to a close (goodbye, or the guest limit). */
  ended?: boolean;
  /** Internal: a nearby teaching was offered instead of an answer. */
  offered?: boolean;
};

export type ChatContext = {
  locale: Locale;
  /** Country code used only to show the right crisis line. */
  region?: string | null;
  /** What the visitor chose to share on their personal path. */
  person?: { name?: string; intention?: string } | null;
  /** This is the last reply of the conversation (e.g. a guest's sixth question). */
  closing?: boolean;
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
    const { intent, passages, terms } = await findPassages(messages);
    // Ending the conversation, or asking how to: no teaching needed.
    if (intent === "how_to_end") return { content: text.howToEnd, citations: [], crisis: false };
    if (intent === "farewell") return await farewellReply(messages, ctx);
    // A podcast to suggest, if one fits this conversation.
    const listening = terms ? await searchListening(terms, ctx.locale) : [];
    if (passages.length > 0 && intent !== "smalltalk") {
      const grounded = await groundedAnswer(messages, passages, ctx.person, listening[0], ctx.closing);
      if (grounded?.offered) {
        if (intent === "question") await logUnanswered(query, ctx.locale, "offered_nearby", terms?.en);
        const { offered: _offered, ...reply } = grounded;
        void _offered;
        return { ...reply, ended: ctx.closing || undefined };
      }
      if (grounded) return { ...grounded, ended: ctx.closing || undefined };
    }
    if (isAboutTheSite(query)) return siteNote(messages, ctx);
    // Someone sharing how they are (or saying hello) gets listened to, not refused.
    if (intent !== "question") {
      if (ctx.closing) return await farewellReply(messages, ctx);
      const listening = await listeningReply(messages, ctx.person);
      if (listening) return listening;
    } else {
      // A question nothing in the teachings is close to: note it for the
      // foundation, then answer personally and honestly.
      await logUnanswered(query, ctx.locale, "no_teaching", terms?.en);
      const notYet = await personalNotYet(messages, ctx);
      if (notYet) return notYet;
    }
  } catch (err) {
    console.error("[chat] knowledge base error:", err);
    // Questions about the site itself can still be answered without the AI.
    if (isAboutTheSite(query)) return replyTo(messages, ctx);
    return { content: text.error, citations: [], crisis: false };
  }

  // A question that nothing in the teachings answers: say so honestly.
  return { content: text.noTeaching, citations: [], crisis: false, ended: ctx.closing || undefined };
}

/**
 * No teaching speaks to this question: respond to their specific question in
 * the companion's own words, honestly, and invite them to explore what's behind it.
 */
async function personalNotYet(messages: ChatMessage[], ctx: ChatContext): Promise<ChatReply | null> {
  try {
    const reply = await claude({
      model: MODELS.search,
      maxTokens: 200,
      system: [
        COMPANION,
        "None of the recorded teachings speak to what the person just asked.",
        "Write at most three short sentences: warmly acknowledge their specific question in your own words (without answering it), say honestly that you don't have a teaching on it yet and would rather not guess, and gently ask what is drawing them to this question, or what is behind it.",
        "Do NOT answer the question. No Buddhist ideas, advice, practices or quotes. Never name any teacher. Reply in the language of the person's latest message. Output only the reply.",
      ].join("\n"),
      messages: [{ role: "user", content: `${aboutThePerson(ctx.person)}Conversation so far:\n${transcript(messages)}` }],
    });
    const clean = reply.replace(/^companion:\s*/i, "").trim();
    if (!clean || clean.length > 450 || /\[\d+\]/.test(clean)) return null;
    return {
      content: cleanForDisplay(await withoutTeacherNames(clean)),
      citations: [],
      crisis: false,
      ended: ctx.closing || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * A warm goodbye: recall what the person brought (without new teaching), wish
 * them well, and leave the door open.
 */
async function farewellReply(messages: ChatMessage[], ctx: ChatContext): Promise<ChatReply> {
  const fallback = { content: SERVER_TEXT[ctx.locale].farewell, citations: [], crisis: false, ended: true };
  try {
    const reply = await claude({
      model: MODELS.search,
      maxTokens: 200,
      system: [
        COMPANION,
        "The conversation is ending now. Write the Companion's warm goodbye in at most three short sentences:",
        "thank them for sitting together, gently recall in their own words what they brought today (if anything), and wish them well, saying they can come back any time.",
        "No new teaching, advice, practices or quotes. No question. Never name any teacher. Reply in the language of the person's messages. Output only the goodbye.",
      ].join("\n"),
      messages: [{ role: "user", content: `${aboutThePerson(ctx.person)}Conversation so far:\n${transcript(messages)}` }],
    });
    const clean = reply.replace(/^companion:\s*/i, "").trim();
    if (!clean || clean.length > 500 || /\[\d+\]/.test(clean)) return fallback;
    return { content: cleanForDisplay(await withoutTeacherNames(clean)), citations: [], crisis: false, ended: true };
  } catch {
    return fallback;
  }
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

export type Intent = "question" | "share" | "smalltalk" | "farewell" | "how_to_end";

async function findPassages(
  messages: ChatMessage[],
): Promise<{ intent: Intent; passages: Passage[]; terms?: SearchTerms }> {
  const latest = lastUserText(messages);
  const raw = await claude({
    model: MODELS.search,
    maxTokens: 200,
    system:
      "You help a Buddhist teaching companion find relevant passages in a database of teachings by Buddhist monks and teachers (English, Spanish, Portuguese). " +
      "Read the conversation and focus on the person's LATEST message, using earlier turns only for context " +
      '(e.g. if the companion asked "How are you feeling?" and the person said "stressed about work", search for stress). ' +
      'Reply with JSON only, no prose: {"intent": "...", "en": "...", "es": "...", "pt": "..."}. ' +
      'intent is "question" (asks about a teaching or practice), "share" (tells how they feel or what is happening in their life), "smalltalk" (greetings, thanks, "I\'m fine"), "farewell" (wants to stop or end the conversation, says goodbye, "I have to go", "that\'s all for today"), or "how_to_end" (asks HOW to end, leave or close the conversation). ' +
      'Each language value is 3 to 8 key words or short phrases joined by " or ", in that language. ' +
      "Look beneath the story for the main mental state at work (anger, sadness, loneliness, attachment, jealousy, pride, fear or worry, guilt) and include both that state AND its Buddhist remedy, plus how the mind creates it (interpretation, perception, habit) " +
      '(e.g. resentment at a brother -> "anger or resentment or patience or habit or perception"; envy of a friend -> "jealousy or envy or rejoicing or happiness of others"; can\'t let go -> "attachment or impermanence or letting go"). ' +
      'No stop words, no quotes, no punctuation besides "or". For smalltalk use empty strings. ' +
      'If the companion just offered to share a related teaching and the person accepts ("yes", "please", "sure"), the intent is "question" and the search terms are that offered theme.',
    messages: [{ role: "user", content: transcript(messages, 6) }],
  });
  const intent = parseIntent(raw);
  if (intent === "smalltalk" || intent === "farewell" || intent === "how_to_end") {
    return { intent, passages: [] };
  }
  const terms = parseSearchTerms(raw, latest);
  return { intent, passages: await searchTeachings(terms, 8), terms };
}

export function parseIntent(raw: string): Intent {
  const m = raw.match(/"intent"\s*:\s*"(question|share|smalltalk|farewell|how_to_end)"/);
  return (m?.[1] as Intent | undefined) ?? "question";
}

const COMPANION =
  "You are Monk Companion, offered by A Way Through Foundation. You walk alongside people with the recorded teachings of Buddhist monks and teachers. You are not a monk and never claim to be one.";

/**
 * How the companion speaks, modelled on the teaching style in the recorded talks.
 * Tone only: what is taught still comes only from the passages.
 */
const PERSONA = [
  "VOICE AND MANNER (style only, never a source of teaching):",
  "- Warm, friendly and informal, like a monk who is genuinely happy to be talking with this person. Plain words, short sentences, no jargon unless the passage uses it and you explain it simply.",
  "- Speak the way the recorded teacher speaks. Emotions are \"mental states\" (anger, pride, worry are mental states; we can cultivate positive mental states). The mind is \"habitual\": patterns repeat \"again and again\", and because they are habits, the mind can be trained. Everyone wants to be happy and doesn't want to suffer; that is common ground. Causes and \"conditions\" bring results. Self-centred thinking is \"me, me, me\", \"myself, myself\".",
  "- Natural spoken phrases are welcome, sparingly: \"you know\", \"kind of like\", \"a little bit\", \"for example\", \"very important\". Check in now and then: \"Does it make sense?\".",
  "- Light, gentle humour is welcome when the moment allows, often at the companion's own expense. Never joke about someone's pain.",
  "- Bring ideas down to earth with everyday situations, and only use an example if it comes from the passages.",
  "- Never preachy or absolute. Invite the person to check things for themselves in their own life rather than simply believe; there is no magic pill, only patient practice.",
  "- Kind about mistakes and difficulty: patience with oneself, no guilt.",
].join("\n");

/** How a companion who listens first decides whether to ask or to teach. */
const EXPLORE_OR_TEACH = [
  "THE PATH OF THE CONVERSATION:",
  "People often arrive with \"someone did something to me\". Gently, over a few turns, help them see how their own mind (how they interpreted and perceived the situation, and their habits) played a part, and that those habits can change. Never rush or force this; never blame them.",
  "",
  "PRIVATELY identify the main mental state at work: sadness, loneliness, anger, attachment, jealousy, pride, fear or worry, guilt, or another. NEVER tell the person \"you are feeling X\" or label them. Use it only to guide your questions and which teaching and remedy you offer.",
  "",
  "FIRST, DECIDE: EXPLORE or TEACH.",
  "EXPLORE until you understand three things:",
  "  (a) what happened,",
  "  (b) how it feels (which mental state is really there),",
  "  (c) what was going on in their mind: the thoughts, interpretation or expectation that fed it.",
  "TEACH when:",
  "  - you understand the situation well enough, or",
  "  - the person asks directly for advice, a teaching or what to do, or asks a question about Buddhism, or",
  "  - your last two replies were already exploring questions (don't keep questioning; offer something).",
  "",
  "If EXPLORE: start your reply with the line MODE: EXPLORE. Reflect back, in one short sentence and in their own terms, what you heard. Then ask ONE or TWO gentle, specific questions about (a), (b) or (c), whichever is least clear. No teaching, no advice, no Buddhist ideas, no citations. Under about 60 words.",
  "",
  "If TEACH: start your reply with the line MODE: TEACH, and, using ONLY what the passages offer:",
  "  1. One short sentence acknowledging them.",
  "  2. How the mind works here: how this mental state arises from the way we interpret or perceive, and from habit, and that habits can be changed. Gently, without blame.",
  "  3. One Buddhist tool to work with it: the remedy or practice the passages give, ideally as something simple to try today.",
  "  4. If it helps, invite them to go deeper with the talk this comes from (\"the talk below explores this\"). Suggest only talks, exercises, podcasts or videos that are in the passages; never invent any.",
  "  5. End with one gentle question.",
  "",
  "IMPORTANT: if the person describes being genuinely harmed (abuse, violence, threats, serious injustice), do NOT suggest their mind caused it or that they misperceived it. Acknowledge the harm, focus on caring for their own pain and peace of mind, and if they may be unsafe, encourage them to reach people who can help.",
].join("\n");

/** The visitor's own name and intention, as context for tone and focus only. */
function aboutThePerson(person?: ChatContext["person"]): string {
  const name = person?.name?.trim();
  const intention = person?.intention?.trim();
  if (!name && !intention) return "";
  return (
    "About the person (they chose to share this):\n" +
    (name ? `- Their name: ${name}. You may use it now and then, naturally, not in every reply.\n` : "") +
    (intention
      ? `- An intention they are working with: "${intention}". Keep it in mind when choosing what to emphasise; connect to it only when it genuinely fits. It is never a source of teaching.\n`
      : "") +
    "\n===\n\n"
  );
}

async function groundedAnswer(
  messages: ChatMessage[],
  passages: Passage[],
  person?: ChatContext["person"],
  listening?: Listening,
  closing?: boolean,
): Promise<ChatReply | null> {
  const numbered = passages
    .map((p, i) => `[${i + 1}] From "${p.title}" (language: ${p.language})\n${p.content}`)
    .join("\n\n---\n\n");

  const reply = await claude({
    model: MODELS.answer,
    maxTokens: 1200,
    system: [
      COMPANION,
      PERSONA,
      "This is a two-way conversation, not a search engine. Respond to what the person just said, in the context of the conversation so far.",
      EXPLORE_OR_TEACH,
      "",
      "TEACHING RULES:",
      "1. Any teaching, idea, practice or advice you give must come ONLY from the numbered passages. Do not add Buddhist teachings, quotes, practices or facts from anywhere else, even if you know them.",
      "2. Cite each teaching point with its passage number in square brackets, like [2].",
      "3. You may, without a citation: briefly acknowledge what the person shared in their own terms (one short sentence), and end with ONE gentle, open follow-up question that invites them to reflect or say more. Never put new teaching into those uncited sentences.",
      "4. If the passages don't answer what the person asked but are CLOSE to it (a related theme), don't stretch them to fit. Instead start your reply with the line MODE: OFFER and write, in under about 50 words: one gentle sentence saying you don't have a teaching on exactly that, then name in plain words the nearby theme these teachings do speak to, and ask whether they would like to hear about it. No teaching content yet, no citations.",
      `   If the passages are not even close, reply with exactly ${NO_ANSWER} and nothing else.`,
      '5. In the passages, "Teacher:" marks the teacher. Lines marked "Student:", "Participant:" or with any other name are students speaking. Never present their words as teaching.',
      "6. Reply in the language of the person's latest message, even if the passages are in another language. Keep the teaching's meaning; do not invent wording and present it as a quote.",
      "7. NEVER name any teacher, monk or speaker, even if a name appears in the passages.",
      "8. Introduce ideas naturally and vary how you do it; don't open every point with \"the teaching says\". For example: \"In Buddhism…\", \"Buddhist philosophy talks about…\", \"When we look at how the mind works…\", \"There's a lovely way of seeing this…\", or simply explain the idea in your own warm words (still citing it). Say \"the Buddha said\" or \"the Buddha taught\" ONLY when the passage itself attributes the words to the Buddha.",
      "9. Be warm, plain and brief: 3 to 5 short paragraphs and under about 200 words in total, always finishing with the closing question.",
      "10. You are not a therapist or doctor. If the person seems in danger, tell them to contact emergency services or a crisis line (988 in the US).",
    ].join("\n"),
    messages: [
      {
        role: "user",
        content:
          aboutThePerson(person) +
          `Conversation so far:\n${transcript(messages)}\n\n===\n\n` +
          `Passages from recorded Buddhist teachings:\n\n${numbered}\n\n===\n\n` +
          (listening
            ? `Recommended listening you MAY suggest when you TEACH, only if it genuinely fits: [P] the podcast "${listening.title}" (language: ${listening.language}). ` +
              "If you suggest it, mention it once, warmly and briefly, with the marker [P] (e.g. \"there is also a podcast below on this [P]\"). Do not describe what it says beyond its title. Never suggest it when exploring.\n\n===\n\n"
            : "") +
          (closing
            ? "THIS IS THE LAST REPLY OF THIS CONVERSATION. TEACH (do not explore), and instead of a closing question, end with one warm sentence closing the conversation and saying they are welcome to begin again any time.\n\n===\n\n"
            : "") +
          `Write the Companion's next reply to the person's latest message.`,
      },
    ],
  });

  if (!reply || reply.includes(NO_ANSWER)) return null;

  // Exploring: a reflection and a question or two, with no teaching in it.
  const mode = reply.match(/^\s*MODE:\s*(EXPLORE|TEACH|OFFER)\s*\n?/i);
  const body = mode ? reply.slice(mode[0].length).trim() : reply.trim();
  if (mode && mode[1].toUpperCase() === "OFFER") {
    // Offering a nearby teaching, with permission: short, nothing taught yet.
    if (!body || body.length > 450 || /\[\d+\]|\[P\]/.test(body)) return null;
    return {
      content: cleanForDisplay(await withoutTeacherNames(body)),
      citations: [],
      crisis: false,
      offered: true,
    };
  }
  if (mode && mode[1].toUpperCase() === "EXPLORE") {
    // Guard: an exploring reply is short and carries no cited teaching.
    if (!body || body.length > 600 || /\[\d+\]|\[P\]/.test(body)) return null;
    return {
      content: cleanForDisplay(await withoutTeacherNames(body)),
      citations: [],
      crisis: false,
    };
  }
  const cited = citedNumbers(body, passages.length);
  if (cited.length === 0) return null; // ungrounded answer: refuse rather than show it

  // One source link per cited transcript, in the order first cited.
  const seen = new Set<string>();
  const citations: ChatCitation[] = [];
  for (const n of cited) {
    const p = passages[n - 1];
    if (seen.has(p.source_id)) continue;
    seen.add(p.source_id);
    citations.push({
      id: p.source_id,
      title: p.title,
      sourceType: "transcript",
      url: p.video_url ?? undefined,
    });
  }

  // A suggested podcast becomes a "Go deeper" link too.
  if (listening && /\[P\]/.test(body)) {
    citations.push({
      id: `podcast-${listening.id}`,
      title: listening.title,
      sourceType: "podcast",
      url: listening.url,
    });
  }

  // The [n] markers were only for checking grounding; readers see clean text
  // with the sources listed underneath.
  const content = cleanForDisplay(await withoutTeacherNames(body));
  return { content, citations, crisis: false };
}

/**
 * When someone shares how they are and no teaching fits, listen instead of
 * refusing: acknowledge in a sentence and invite them to say more. No teaching,
 * advice or practice is allowed here, so nothing is presented as a teaching.
 */
async function listeningReply(
  messages: ChatMessage[],
  person?: ChatContext["person"],
): Promise<ChatReply | null> {
  const reply = await claude({
    model: MODELS.search,
    maxTokens: 150,
    system: [
      COMPANION,
      "Speak warmly and plainly, like a friendly monk who is glad to be talking with this person.",
      "Write the Companion's next reply in this conversation. You have NO teachings available for this turn.",
      "Write at most two short sentences: a warm, plain acknowledgement of what the person said, then ONE gentle question that helps you understand them better: what happened, how it feels (which emotion or mental state is there), or what was going through their mind. For small talk, simply ask what they would like to explore.",
      "Do NOT give advice, teachings, practices, quotes, explanations or Buddhist ideas of any kind. Do not mention any teacher, the teachings, or that anything is missing.",
      "Reply in the language of the person's latest message. Output only the reply.",
    ].join("\n"),
    messages: [
      { role: "user", content: `${aboutThePerson(person)}Conversation so far:\n${transcript(messages)}` },
    ],
  });
  const clean = reply.replace(/^companion:\s*/i, "").trim();
  // Guard: listening replies are short; anything long is probably advice.
  if (!clean || clean.length > 320 || /\[\d+\]/.test(clean)) return null;
  return { content: clean, citations: [], crisis: false };
}

// ---------- display clean-up ----------

/** Names of the teachers in the knowledge base, never shown to visitors. */
const TEACHER_NAMES = (process.env.TEACHER_NAMES ?? "Kalden,カルデン")
  .split(",")
  .map((n) => n.trim())
  .filter(Boolean);

export function mentionsTeacher(text: string): boolean {
  const lower = text.toLowerCase();
  return TEACHER_NAMES.some((n) => lower.includes(n.toLowerCase()));
}

/** Remove [n] citation markers and tidy the spacing they leave behind. */
export function cleanForDisplay(text: string): string {
  return text
    .replace(/\s*\[(?:\d+(?:\s*,\s*\d+)*|P)\]/g, "")
    .replace(/[ \t]+([.,;:!?。、])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Backstop for the "never name a teacher" rule: if a reply still names one,
 * have it rewritten without the name; if that fails, replace the name plainly.
 */
async function withoutTeacherNames(text: string): Promise<string> {
  if (!mentionsTeacher(text)) return text;
  try {
    const rewritten = await claude({
      model: MODELS.search,
      maxTokens: 900,
      system:
        "Rewrite the text so that it names no teacher, monk or speaker. Replace phrases like \"Ven. X teaches\" with natural wording such as \"In Buddhism\", \"Buddhist philosophy talks about\" or \"Buddhist teachers say\", in the same language. Change nothing else: keep wording, meaning and any [n] markers. Output only the rewritten text.",
      messages: [{ role: "user", content: text }],
    });
    if (rewritten && !mentionsTeacher(rewritten)) return rewritten;
  } catch {
    /* fall through */
  }
  let out = text;
  for (const name of TEACHER_NAMES) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const named = `(?:Ven(?:erable)?\\.?\\s+)?${escaped}`;
    out = out
      .replace(new RegExp(`${named}['’]s`, "gi"), "the teacher’s")
      .replace(new RegExp(named, "gi"), "the teacher");
  }
  return out.replace(/(^|[.!?]\s+)the teacher/g, (_, lead: string) => `${lead}The teacher`);
}
