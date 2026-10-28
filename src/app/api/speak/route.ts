import { NextResponse } from "next/server";

// Calm voice for spoken replies via ElevenLabs, with the time each character
// is spoken, so the page can show words as they are said.
// Turned on by setting ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in Vercel.
// When they are missing this returns 501 and the browser's own voice is used.

export const maxDuration = 30;

// 0.7 (slowest) to 1.2. Measured with the current voice: 0.8 ≈ 130, 0.85 ≈ 138,
// 0.9 ≈ 148, 1.0 ≈ 160–170 words per minute. 0.9 is calm but conversational.
const SPEED = Number(process.env.ELEVENLABS_SPEED ?? 0.9);

const MAX_CHARS = 1500; // a full reply is usually 600–1,200 characters
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 40;
const hits = new Map<string, number[]>(); // best-effort, per server instance

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voice) {
    return NextResponse.json({ error: "voice not configured" }, { status: 501 });
  }

  let text = "";
  let speed = SPEED;
  let testSettings: Record<string, number | boolean> = {};
  try {
    const body = (await request.json()) as {
      text?: unknown;
      speed?: unknown;
      settings?: Record<string, number | boolean>;
    };
    text = typeof body?.text === "string" ? body.text : "";
    // Local testing only: try other speeds without redeploying.
    if (process.env.NODE_ENV === "development" && typeof body?.speed === "number") {
      speed = Math.min(1.2, Math.max(0.7, body.speed));
    }
    if (process.env.NODE_ENV === "development" && body?.settings) testSettings = body.settings;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  text = text.replace(/\s*\[\d+(?:,\s*\d+)*\]/g, "").trim().slice(0, MAX_CHARS);
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.75, // steady, unhurried delivery
          similarity_boost: 0.6, // a little smoother than the voice's raw texture
          style: 0,
          use_speaker_boost: false, // boost adds edge to bright voices
          speed,
          ...testSettings, // local testing only
        },
      }),
    },
  );

  if (!res.ok) {
    console.error("[speak] ElevenLabs error", res.status, (await res.text()).slice(0, 300));
    return NextResponse.json({ error: "voice unavailable" }, { status: 502 });
  }

  const data = (await res.json()) as {
    audio_base64?: string;
    alignment?: { character_start_times_seconds?: number[] } | null;
  };
  if (!data.audio_base64) {
    return NextResponse.json({ error: "voice unavailable" }, { status: 502 });
  }
  return NextResponse.json(
    {
      text, // exactly what was spoken; the timings line up with it
      audio: data.audio_base64,
      starts: data.alignment?.character_start_times_seconds ?? [],
      speed,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
