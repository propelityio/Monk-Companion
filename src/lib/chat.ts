import { isCrisis, retrieve, type KnowledgeChunk } from "./knowledge";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatCitation = {
  id: string;
  title: string;
  sourceType: KnowledgeChunk["sourceType"];
};

export type ChatReply = {
  content: string;
  citations: ChatCitation[];
  crisis: boolean;
};

const CRISIS_REPLY =
  "Please reach a human who can help right now. If you are in the United States, call or text 988. If you are elsewhere, contact local emergency services. I am a companion for teachings, not a crisis counselor.";

export function replyTo(messages: ChatMessage[]): ChatReply {
  const last = [...messages].reverse().find((m) => m.role === "user");
  const query = last?.content?.trim() ?? "";

  if (!query) {
    return {
      content:
        "Sit for a moment and say what is here. You may type or speak. No account is needed.",
      citations: [],
      crisis: false,
    };
  }

  if (isCrisis(query)) {
    return { content: CRISIS_REPLY, citations: [], crisis: true };
  }

  const chunks = retrieve(query);
  if (chunks.length === 0) {
    return {
      content:
        "I do not yet have a recorded teaching from Kalden that answers this. When the talks and transcripts are loaded, I will cite them instead of inventing a reply.",
      citations: [],
      crisis: false,
    };
  }

  const body = chunks.map((chunk) => chunk.text).join(" ");
  const citations = chunks.map((chunk) => ({
    id: chunk.id,
    title: chunk.title,
    sourceType: chunk.sourceType,
  }));

  return { content: body, citations, crisis: false };
}
