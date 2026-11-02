"use client";

import { UI } from "@/lib/i18n";
import { useLocale } from "@/lib/use-prefs";
import { LotusMark } from "./lotus-mark";
import { OpenChatLink } from "./open-chat-link";

/** The home page, in the visitor's chosen language. */
export function LandingContent() {
  const t = UI[useLocale()];
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <LotusMark className="h-14 w-14 text-[var(--saffron)]" />
      <h1 className="mt-6 font-serif text-5xl leading-[1.05] text-[var(--maroon)] sm:text-6xl">
        Monk Companion
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--ink)]">{t.tagline}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{t.taglineSub}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href="#how"
          className="rounded-full border border-[var(--line)] px-6 py-3 text-[var(--maroon)] transition-colors hover:border-[var(--maroon)]"
        >
          {t.howItWorks}
        </a>
        <OpenChatLink className="rounded-full bg-[var(--maroon)] px-6 py-3 text-[var(--paper)] transition-colors hover:bg-[var(--maroon-deep)]">
          {t.beginConversation}
        </OpenChatLink>
      </div>
      <section
        id="how"
        className="mt-24 grid gap-x-10 gap-y-10 border-t border-[var(--line)] pt-12 sm:grid-cols-3"
      >
        {[
          [t.guestTitle, t.guestText],
          [t.personalTitle, t.personalText],
          [t.sourceTitle, t.sourceText],
        ].map(([title, text]) => (
          <div key={title}>
            <h2 className="font-serif text-xl text-[var(--maroon)]">{title}</h2>
            <p className="mt-2 leading-7 text-[var(--muted)]">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
