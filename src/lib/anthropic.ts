// Minimal Anthropic Messages API client (server-only; no SDK dependency).

export const MODELS = {
  // Fast model: turns a question into search terms.
  search: process.env.ANTHROPIC_SEARCH_MODEL ?? "claude-haiku-5-5",
  // Main model: writes the grounded answer.
  answer: process.env.ANTHROPIC_ANSWER_MODEL ?? "claude-sonnet-5-5",
};

type Message = { role: "user" | "assistant"; content: string };

export async function claude(opts: {
  model: string;
  system: string;
  messages: Message[];
  maxTokens: number;
  temperature?: number;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      system: opts.system,
      messages: opts.messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 0.2,
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();
}
