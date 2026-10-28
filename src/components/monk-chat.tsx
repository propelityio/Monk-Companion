"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { ChatCitation, ChatMessage } from "@/lib/chat";
import { LOCALE_NAMES, LOCALES, SPEECH_LANG, UI, toLocale, type Locale } from "@/lib/i18n";
import { clearProfile, loadProfile, saveProfile, type GuestProfile } from "@/lib/profile";
import { clearBell, justRangBell, whenBellDone } from "@/lib/bell";
import {
  detectRegion,
  getReplyMode,
  setHandsFree,
  setLocale,
  setReplyMode,
  useGreetingMoment,
  useHandsFree,
  useLocale,
  useReplyMode,
  type ReplyMode,
} from "@/lib/use-prefs";
import { CrisisNote } from "./crisis-note";
import { RevealText } from "./reveal-text";

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  }
}

type DisplayMessage = ChatMessage & { citations?: ChatCitation[] };

export function MonkChat() {
  const locale = useLocale();
  const t = UI[locale];
  const moment = useGreetingMoment();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const mode = useReplyMode();
  const handsFree = useHandsFree();
  const [shownText, setShownText] = useState<Set<number>>(() => new Set());
  // Arriving by the bell in a voice mode, the greeting stays hidden until the
  // Monk starts saying it. (Arriving directly, there's no bell and no wait.)
  const [greetingPending, setGreetingPending] = useState(
    () => typeof window !== "undefined" && justRangBell() && getReplyMode() !== "text",
  );
  const showGreeting = !greetingPending || mode === "text";
  // Which text is being spoken right now, and how many characters have been said.
  const [reveal, setReveal] = useState<{ key: string; chars: number } | null>(null);
  const spokenFor = (key: string) => (reveal && reveal.key === key ? reveal.chars : undefined);
  /** Speech hooks that reveal `key`'s text as it is spoken. */
  function revealing(key: string, then?: () => void) {
    let started = false;
    // If the voice never starts, show the words anyway.
    const safety = window.setTimeout(() => {
      if (!started) setReveal((r) => (r?.key === key ? null : r));
    }, 8000);
    return {
      onStart: () => {
        started = true;
        window.clearTimeout(safety);
        setReveal({ key, chars: 0 });
      },
      onProgress: (chars: number) =>
        setReveal((r) => (r?.key === key ? { key, chars } : r)),
      onEnd: () => {
        window.clearTimeout(safety);
        setReveal((r) => (r?.key === key ? null : r));
        then?.();
      },
    };
  }
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [form, setForm] = useState<GuestProfile>({ name: "", email: "", intention: "" });
  const recRef = useRef<SpeechRec | null>(null);
  const sendingRef = useRef(false);
  const greetingText = moment
    ? `${withName(t.greetings[moment.time].hello, profile?.name)} ${t.greetings[moment.time].questions[moment.variant]}`
    : null;
  // Voice callbacks fire later (when speech ends or the mic hears something),
  // so they read the latest conversation and settings through this ref.
  const latest = useRef({
    messages,
    send: (text: string): unknown => text,
    startListening: () => {},
    handsFree,
    greetingText,
    locale,
    revealKey: null as string | null,
  });
  useEffect(() => {
    latest.current = {
      messages,
      send,
      startListening,
      handsFree,
      greetingText,
      locale,
      revealKey: reveal?.key ?? null,
    };
  });

  // Arriving by the bell: wait until it has finished ringing, then the Monk
  // greets aloud after a short pause.
  useEffect(() => {
    if (!justRangBell() || getReplyMode() === "text") return;
    let cancelled = false;
    let timer = 0;
    let safety = 0;
    void whenBellDone().then(() => {
      if (cancelled) return;
      timer = window.setTimeout(() => {
        if (cancelled) return;
        clearBell();
        const { greetingText: g, locale: l } = latest.current;
        // If the voice can't start for any reason, show the words anyway.
        safety = window.setTimeout(() => setGreetingPending(false), 4000);
        if (g) {
          const hooks = revealing("greeting", afterSpeaking);
          void speak(g, l, {
            ...hooks,
            onStart: () => {
              setGreetingPending(false);
              hooks.onStart();
            },
          });
        }
        else setGreetingPending(false);
      }, 400);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(safety);
    };
  }, []);

  function afterSpeaking() {
    if (latest.current.handsFree && getReplyMode() !== "text") latest.current.startListening();
  }
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = loadProfile();
    if (stored) {
      // localStorage is only readable after hydration, so this must run in an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(stored);
      setForm(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // While the Monk speaks, keep the word being said in view.
  useEffect(() => {
    if (!reveal) return;
    const words = listRef.current?.querySelectorAll(".word-in");
    words?.[words.length - 1]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [reveal]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // A reply that is about to be spoken: show where it begins, then the
    // effect above follows the voice. Otherwise go to the newest message.
    if (latest.current.revealKey === `m${messages.length - 1}`) {
      const articles = list.querySelectorAll("article");
      articles[articles.length - 1]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    // A ref, not state: two quick clicks happen before state updates.
    if (!content || sendingRef.current) return;
    sendingRef.current = true;

    const nextMessages: DisplayMessage[] = [...latest.current.messages, { role: "user", content }];
    setReveal(null);
    setMessages(nextMessages);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The Monk's opening question is part of the conversation, so the
          // reply to "How are you feeling?" is understood as an answer to it.
          messages: [
            ...(moment
              ? [
                  {
                    role: "assistant" as const,
                    content: `${withName(t.greetings[moment.time].hello, profile?.name)} ${t.greetings[moment.time].questions[moment.variant]}`,
                  },
                ]
              : []),
            ...nextMessages.map(({ role, content }) => ({ role, content })),
          ],
          profile,
          locale,
          region: detectRegion(),
        }),
      });
      const data = (await res.json()) as {
        content?: string;
        citations?: ChatCitation[];
      };
      const reply: DisplayMessage = {
        role: "assistant",
        content: data.content ?? t.replyFailed,
        citations: data.citations,
      };
      const key = `m${nextMessages.length}`;
      const replyMode = getReplyMode();
      if (replyMode === "both") setReveal({ key, chars: 0 }); // words wait for the voice
      setMessages([...nextMessages, reply]);
      if (replyMode !== "text") {
        void speak(reply.content, locale, revealing(key, afterSpeaking));
      }
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: t.connectionDropped },
      ]);
    } finally {
      sendingRef.current = false;
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  function startListening() {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setInput((prev) => prev || t.voiceUnavailable);
      return;
    }
    if (recRef.current) return;
    stopSpeaking();
    try {
      const rec = new Ctor();
      rec.lang = SPEECH_LANG[locale];
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        if (transcript) latest.current.send(transcript);
      };
      rec.onend = () => {
        recRef.current = null;
        setListening(false);
      };
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      // Some browsers only allow the mic after a tap; the Speak button still works.
      recRef.current = null;
      setListening(false);
    }
  }

  function stopListening() {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }

  function chooseMode(next: ReplyMode) {
    if (next === "text") stopSpeaking();
    setReveal(null);
    setReplyMode(next);
  }

  function onSaveProfile(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    const next = {
      name: form.name.trim(),
      email: form.email.trim(),
      intention: form.intention.trim(),
    };
    saveProfile(next);
    setProfile(next);
    setShowProfile(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-3 text-sm">
        <div>
          <p className="font-serif text-base text-[var(--maroon)]">{t.chatTitle}</p>
          <p className="text-[var(--muted)]">
            {profile ? t.curatedFor(profile.name) : t.guest}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <label className="flex items-center gap-2 text-[var(--muted)]">
            <span className="sr-only">{t.language}</span>
            <select
              aria-label={t.language}
              value={locale}
              onChange={(e) => {
                stopSpeaking();
                setLocale(toLocale(e.target.value));
              }}
              className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2 py-1 text-[var(--ink)]"
            >
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_NAMES[l]}
                </option>
              ))}
            </select>
          </label>
          <div
            role="radiogroup"
            aria-label={t.replies}
            className="flex rounded-full border border-[var(--line)] p-0.5"
          >
            {(["text", "voice", "both"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => chooseMode(m)}
                className={`rounded-full px-2.5 py-0.5 transition-colors ${
                  mode === m
                    ? "bg-[var(--maroon)] text-[var(--paper)]"
                    : "text-[var(--maroon)] hover:bg-[var(--maroon-soft)]"
                }`}
              >
                {m === "text" ? t.modeText : m === "voice" ? t.modeVoice : t.modeBoth}
              </button>
            ))}
          </div>
          {mode !== "text" ? (
            <>
              <span
                className="rounded-full border border-[var(--saffron)] px-1.5 py-px text-[10px] leading-4 text-[var(--maroon)]"
                title={t.aiVoiceNote}
              >
                {t.aiVoice}
                <span className="sr-only"> {t.aiVoiceNote}</span>
              </span>
              <label className="flex items-center gap-2 text-[var(--muted)]" title={t.handsFreeNote}>
                <input
                  type="checkbox"
                  className="accent-[var(--maroon)]"
                  checked={handsFree}
                  onChange={(e) => setHandsFree(e.target.checked)}
                />
                {t.handsFree}
                <span className="sr-only"> {t.handsFreeNote}</span>
              </label>
            </>
          ) : null}
          <button
            type="button"
            className="rounded-full border border-[var(--line)] px-3 py-1 text-[var(--maroon)] transition-colors hover:border-[var(--maroon)]"
            onClick={() => setShowProfile((v) => !v)}
          >
            {profile ? t.path : t.curatedPath}
          </button>
        </div>
      </div>

      {showProfile ? (
        <form
          onSubmit={onSaveProfile}
          className="border-b border-[var(--line)] bg-[var(--paper-strong)] px-5 py-4"
        >
          <p className="mb-3 max-w-xl text-sm text-[var(--muted)]">
            {t.profileIntro}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              {t.name}
              <input
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="text-sm">
              {t.email}
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label className="text-sm sm:col-span-2">
              {t.intention}
              <input
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2"
                value={form.intention}
                onChange={(e) => setForm({ ...form, intention: e.target.value })}
                placeholder={t.intentionPlaceholder}
              />
            </label>
          </div>
          <div className="mt-3 flex gap-3">
            <button
              type="submit"
              className="rounded-full bg-[var(--maroon)] px-4 py-2 text-sm text-[var(--paper)] transition-colors hover:bg-[var(--maroon-deep)]"
            >
              {t.save}
            </button>
            {profile ? (
              <button
                type="button"
                className="text-sm text-[var(--muted)] underline"
                onClick={() => {
                  clearProfile();
                  setProfile(null);
                  setForm({ name: "", email: "", intention: "" });
                }}
              >
                {t.forget}
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-6">
        <article className="mr-8 border-l-2 border-[var(--saffron-soft)] pl-4 sm:mr-24">
          <p className="mb-1 font-serif text-sm text-[var(--maroon)]">{t.companion}</p>
          {!showGreeting ? (
            <p className="flex h-7 items-center pl-1" role="status" aria-label={t.thinking}>
              <span className="breath inline-block h-2 w-2 rounded-full bg-[var(--saffron)]" aria-hidden="true" />
            </p>
          ) : moment ? (
            <p className="leading-7">
              <span className="font-serif text-lg text-[var(--maroon)]">
                <RevealText
                  text={withName(t.greetings[moment.time].hello, profile?.name)}
                  spoken={spokenFor("greeting")}
                />
              </span>{" "}
              <RevealText
                text={t.greetings[moment.time].questions[moment.variant]}
                spoken={spokenFor("greeting")}
                offset={withName(t.greetings[moment.time].hello, profile?.name).length + 1}
              />
            </p>
          ) : (
            <p className="leading-7 text-[var(--muted)]">…</p>
          )}
          {showGreeting ? (
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{t.invitation}</p>
          ) : null}
        </article>
        {messages.map((message, i) => (
          <article
            key={`${message.role}-${i}`}
            className={
              message.role === "user"
                ? "ml-10 rounded-2xl rounded-br-md bg-[var(--maroon-soft)] px-4 py-3 sm:ml-28"
                : "mr-8 border-l-2 border-[var(--saffron-soft)] pl-4 sm:mr-24"
            }
          >
            <p
              className={
                message.role === "user"
                  ? "mb-1 text-xs text-[var(--muted)]"
                  : "mb-1 font-serif text-sm text-[var(--maroon)]"
              }
            >
              {message.role === "user" ? t.you : t.companion}
            </p>
            {message.role === "assistant" && mode === "voice" && !shownText.has(i) ? (
              <button
                type="button"
                onClick={() => setShownText((prev) => new Set(prev).add(i))}
                className="flex items-center gap-2 text-sm text-[var(--muted)] underline-offset-2 hover:underline"
              >
                <span aria-hidden="true">🔊</span> {t.spokenReply} · {t.showText}
              </button>
            ) : (
              <p className="whitespace-pre-wrap leading-7">
                <RevealText
                  text={message.content}
                  spoken={message.role === "assistant" && mode === "both" ? spokenFor(`m${i}`) : undefined}
                />
              </p>
            )}
            {message.role === "assistant" && mode === "voice" && shownText.has(i) ? (
              <button
                type="button"
                onClick={() =>
                  setShownText((prev) => {
                    const next = new Set(prev);
                    next.delete(i);
                    return next;
                  })
                }
                className="mt-1 text-xs text-[var(--muted)] underline-offset-2 hover:underline"
              >
                {t.hideText}
              </button>
            ) : null}
            {message.citations &&
            message.citations.length > 0 &&
            spokenFor(`m${i}`) === undefined &&
            !(message.role === "assistant" && mode === "voice" && !shownText.has(i)) ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {message.citations.map((c) => {
                  const label = c.title;
                  return (
                    <li
                      key={c.id}
                      className="rounded-full bg-[var(--saffron-soft)] px-2.5 py-0.5 text-xs text-[var(--maroon)]"
                    >
                      {c.url ? (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline-offset-2 hover:underline"
                        >
                          {label} ↗
                        </a>
                      ) : (
                        label
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </article>
        ))}
        {busy ? (
          <p className="flex items-center gap-3 pl-4 text-sm text-[var(--muted)]" role="status">
            <span className="breath inline-block h-2 w-2 rounded-full bg-[var(--saffron)]" aria-hidden="true" />
            {t.thinking}
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="border-t border-[var(--line)] px-5 py-4">
        <div className="flex items-end gap-2">
          <textarea
            className="min-h-[52px] flex-1 resize-none rounded-2xl border border-[var(--line)] bg-white/60 px-4 py-3 transition-colors focus:border-[var(--saffron)] focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder={t.placeholder}
            rows={2}
          />
          <button
            type="button"
            onClick={() => (listening ? stopListening() : startListening())}
            className={`h-[52px] rounded-full border px-4 text-sm ${
              listening
                ? "border-[var(--saffron)] bg-[var(--saffron-soft)] text-[var(--maroon)]"
                : "border-[var(--line)] text-[var(--maroon)] hover:border-[var(--maroon)]"
            }`}
          >
            {listening ? t.stop : t.speak}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="h-[52px] rounded-full bg-[var(--maroon)] px-5 text-sm text-[var(--paper)] transition-colors hover:bg-[var(--maroon-deep)] disabled:opacity-50"
          >
            {t.send}
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          <CrisisNote locale={locale} />
        </p>
      </form>
    </div>
  );
}

/** "Good morning." -> "Good morning, Ana." (keeps the language's full stop). */
function withName(hello: string, name?: string): string {
  if (!name) return hello;
  const stop = hello.endsWith("。") ? "。" : ".";
  return `${hello.replace(/[.。]$/, "")}${stop === "。" ? "、" : ", "}${name}${stop}`;
}

// ---------- spoken replies ----------
// Uses the calm ElevenLabs voice when the site has it configured; otherwise a
// slower, lower version of the browser's own voice in the chosen language.

type SpeakHooks = {
  onStart?: () => void;
  onEnd?: () => void;
  /** How many characters of the text have been spoken so far. */
  onProgress?: (chars: number) => void;
};

let premiumVoice: boolean | null = null; // unknown until the first try
let currentAudio: HTMLAudioElement | null = null;
let progressFrame = 0;
let estimateTimer = 0;

function stopSpeaking() {
  if (typeof window === "undefined") return;
  window.cancelAnimationFrame(progressFrame);
  window.clearInterval(estimateTimer);
  currentAudio?.pause();
  currentAudio = null;
  window.speechSynthesis?.cancel();
}

/** Index of the first start time after `t` (= characters already begun). */
function spokenCount(starts: number[], t: number): number {
  let lo = 0;
  let hi = starts.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

async function speak(text: string, locale: Locale, hooks: SpeakHooks = {}) {
  const clean = text.replace(/\s*\[\d+(?:,\s*\d+)*\]/g, "").trim();
  if (!clean || typeof window === "undefined") return;
  stopSpeaking();

  if (premiumVoice !== false) {
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean }),
      });
      if (res.status === 501) premiumVoice = false; // not set up: stop asking
      if (res.ok) {
        premiumVoice = true;
        const data = (await res.json()) as { audio: string; starts: number[] };
        const bytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
        const audio = new Audio(url);
        const starts = data.starts ?? [];
        // Timings are per character of what was spoken; map them onto the text.
        const scale = starts.length ? clean.length / starts.length : 1;
        let last = -1;
        // Updated on every frame for smoothness, and on the player's own
        // progress events too (frames pause when the page isn't in front).
        const update = () => {
          if (currentAudio !== audio) return;
          const t = audio.currentTime + 0.05;
          const chars = starts.length
            ? Math.round(spokenCount(starts, t) * scale)
            : audio.duration
              ? Math.round((t / audio.duration) * clean.length)
              : 0;
          if (chars !== last) {
            last = chars;
            hooks.onProgress?.(chars);
          }
        };
        const tick = () => {
          update();
          if (currentAudio === audio && !audio.paused && !audio.ended) {
            progressFrame = window.requestAnimationFrame(tick);
          }
        };
        audio.ontimeupdate = update;
        audio.onplay = () => {
          hooks.onStart?.();
          progressFrame = window.requestAnimationFrame(tick);
        };
        audio.onended = () => {
          URL.revokeObjectURL(url);
          hooks.onProgress?.(clean.length);
          hooks.onEnd?.();
        };
        currentAudio = audio;
        await audio.play();
        return;
      }
    } catch {
      /* fall back to the browser voice */
    }
  }
  browserSpeak(clean, locale, hooks);
}

function browserSpeak(text: string, locale: Locale, hooks: SpeakHooks) {
  if (!window.speechSynthesis) {
    hooks.onStart?.();
    hooks.onProgress?.(text.length);
    return;
  }
  const lang = SPEECH_LANG[locale];
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9; // calm but conversational
  utterance.pitch = 0.85; // a little lower and softer
  const voices = window.speechSynthesis.getVoices().filter((v) =>
    v.lang.toLowerCase().startsWith(locale),
  );
  // Prefer higher-quality voices when the device has them.
  utterance.voice =
    voices.find((v) => /natural|neural|premium|enhanced|google/i.test(v.name)) ??
    voices.find((v) => v.lang === lang) ??
    voices[0] ??
    null;

  // Most voices report each word as they reach it; if one doesn't, follow an
  // estimated speaking pace instead.
  let reported = false;
  utterance.onboundary = (e) => {
    reported = true;
    hooks.onProgress?.(e.charIndex + (e.charLength || 1));
  };
  utterance.onstart = () => {
    hooks.onStart?.();
    const began = Date.now();
    estimateTimer = window.setInterval(() => {
      if (!reported) hooks.onProgress?.(Math.round(((Date.now() - began) / 1000) * 12));
    }, 120);
  };
  utterance.onend = () => {
    window.clearInterval(estimateTimer);
    hooks.onProgress?.(text.length);
    hooks.onEnd?.();
  };
  window.speechSynthesis.speak(utterance);
}
