"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { ChatCitation, ChatMessage } from "@/lib/chat";
import { clearProfile, loadProfile, saveProfile, type GuestProfile } from "@/lib/profile";

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

const OPENING: DisplayMessage = {
  role: "assistant",
  content:
    "You may speak or write. No login is needed. If you want a path that remembers you, share a name and email when you are ready.",
};

export function MonkChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([OPENING]);
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
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          profile,
        }),
      });
      const data = (await res.json()) as {
        content?: string;
        citations?: ChatCitation[];
      };
      const reply: DisplayMessage = {
        role: "assistant",
        content: data.content ?? "I could not answer just then. Try again in a moment.",
        citations: data.citations,
      };
      setMessages([...nextMessages, reply]);
      if (speakReplies) speak(reply.content);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "The connection dropped. Please try again." },
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
      setInput((prev) => prev || "Voice input is not available in this browser. You can still type.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
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
          <p className="font-medium">Monk Chat</p>
          <p className="text-[var(--muted)]">
            {profile
              ? `Curated for ${profile.name}`
              : "Guest conversation · no account required"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[var(--muted)]">
            <input
              type="checkbox"
              checked={speakReplies}
              onChange={(e) => setSpeakReplies(e.target.checked)}
            />
            Speak replies
          </label>
          <button
            type="button"
            className="rounded-full border border-[var(--line)] px-3 py-1 hover:bg-[var(--paper-strong)]"
            onClick={() => setShowProfile((v) => !v)}
          >
            {profile ? "Path" : "Curated path"}
          </button>
        </div>
      </div>

      {showProfile ? (
        <form
          onSubmit={onSaveProfile}
          className="border-b border-[var(--line)] bg-[var(--paper-strong)] px-5 py-4"
        >
          <p className="mb-3 max-w-xl text-sm text-[var(--muted)]">
            Optional. Name and email are enough for us to recognize you. Stored in this
            browser until a real identity service is added.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Preferred name
              <input
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="text-sm">
              Email
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Intention (optional)
              <input
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2"
                value={form.intention}
                onChange={(e) => setForm({ ...form, intention: e.target.value })}
                placeholder="What are you hoping to tend?"
              />
            </label>
          </div>
          <div className="mt-3 flex gap-3">
            <button
              type="submit"
              className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm text-[var(--paper)]"
            >
              Save
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
                Forget this browser
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-6">
        {messages.map((message, i) => (
          <article
            key={`${message.role}-${i}`}
            className={message.role === "user" ? "ml-8 sm:ml-24" : "mr-8 sm:mr-24"}
          >
            <p className="mb-1 text-xs uppercase tracking-wide text-[var(--muted)]">
              {message.role === "user" ? "You" : "Companion"}
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
                      className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--muted)]"
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
        {busy ? <p className="text-sm text-[var(--muted)]">Listening inwardly…</p> : null}
      </div>

      <form onSubmit={onSubmit} className="border-t border-[var(--line)] px-5 py-4">
        <div className="flex items-end gap-2">
          <textarea
            className="min-h-[52px] flex-1 resize-none rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-3"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Speak or type what is present…"
            rows={2}
          />
          <button
            type="button"
            onClick={toggleListen}
            className={`h-[52px] rounded-full border px-4 text-sm ${
              listening
                ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                : "border-[var(--line)]"
            }`}
          >
            {listening ? "Stop" : "Speak"}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="h-[52px] rounded-full bg-[var(--ink)] px-5 text-sm text-[var(--paper)] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/\s*\[\d+(?:,\s*\d+)*\]/g, ""));
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
