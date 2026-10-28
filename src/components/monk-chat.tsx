"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { ChatCitation, ChatMessage } from "@/lib/chat";
import { LOCALE_NAMES, LOCALES, SPEECH_LANG, UI, toLocale, type Locale } from "@/lib/i18n";
import { clearProfile, loadProfile, saveProfile, type GuestProfile } from "@/lib/profile";
import { detectRegion, setLocale, useGreetingMoment, useLocale } from "@/lib/use-prefs";

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
  const [speakReplies, setSpeakReplies] = useState(true);
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [form, setForm] = useState<GuestProfile>({ name: "", email: "", intention: "" });
  const recRef = useRef<SpeechRec | null>(null);
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

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;

    const nextMessages: DisplayMessage[] = [...messages, { role: "user", content }];
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
      setMessages([...nextMessages, reply]);
      if (speakReplies) void speak(reply.content, locale);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: t.connectionDropped },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  function toggleListen() {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setInput((prev) => prev || t.voiceUnavailable);
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = SPEECH_LANG[locale];
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) void send(transcript);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
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
          <label className="flex items-center gap-2 text-[var(--muted)]">
            <input
              type="checkbox"
              className="accent-[var(--maroon)]"
              checked={speakReplies}
              onChange={(e) => {
                if (!e.target.checked) stopSpeaking();
                setSpeakReplies(e.target.checked);
              }}
            />
            {t.speakReplies}
          </label>
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
          {moment ? (
            <p className="leading-7">
              <span className="font-serif text-lg text-[var(--maroon)]">
                {withName(t.greetings[moment.time].hello, profile?.name)}
              </span>{" "}
              {t.greetings[moment.time].questions[moment.variant]}
            </p>
          ) : (
            <p className="leading-7 text-[var(--muted)]">…</p>
          )}
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{t.invitation}</p>
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
            <p className="whitespace-pre-wrap leading-7">{message.content}</p>
            {message.citations && message.citations.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {message.citations.map((c, i) => {
                  const label =
                    c.sourceType === "foundation" ? c.title : `[${i + 1}] ${c.title}`;
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
            onClick={toggleListen}
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

let premiumVoice: boolean | null = null; // unknown until the first try
let currentAudio: HTMLAudioElement | null = null;

function stopSpeaking() {
  currentAudio?.pause();
  currentAudio = null;
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

async function speak(text: string, locale: Locale) {
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
        const url = URL.createObjectURL(await res.blob());
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        currentAudio = audio;
        await audio.play();
        return;
      }
    } catch {
      /* fall back to the browser voice */
    }
  }
  browserSpeak(clean, locale);
}

function browserSpeak(text: string, locale: Locale) {
  if (!window.speechSynthesis) return;
  const lang = SPEECH_LANG[locale];
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.82; // unhurried
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
  window.speechSynthesis.speak(utterance);
}
