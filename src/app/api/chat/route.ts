import { NextResponse } from "next/server";
import { answer, type ChatMessage } from "@/lib/chat";
import { toLocale } from "@/lib/i18n";

// Two model calls plus a database search; allow time for both.
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, locale, region } = (body ?? {}) as {
    messages?: ChatMessage[];
    locale?: string;
    region?: string;
  };
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  const safe = messages
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    .slice(-20);

  return NextResponse.json(
    await answer(safe, {
      locale: toLocale(locale),
      region: typeof region === "string" && /^[A-Za-z]{2}$/.test(region) ? region.toUpperCase() : null,
    }),
  );
}
