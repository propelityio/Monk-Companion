"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { COLLECTIONS, playlistEmbed, youtubeUrl, type Collection } from "@/lib/library";
import { LOCALE_NAMES, UI, type Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/use-prefs";

type Tab = "talks" | "podcasts";

/** The Library: talks (and soon podcasts) played inside Monk Companion. */
export function LibraryView() {
  const locale = useLocale();
  const t = UI[locale];
  // A link from the chat can open a tab and a collection: /library?play=…&tab=…
  const params = useSearchParams();
  const requested = params.get("play");
  const requestedCollection = COLLECTIONS.find((c) => c.id === requested);
  const requestedVideo = params.get("video");
  const [tab, setTab] = useState<Tab>(params.get("tab") === "podcasts" ? "podcasts" : "talks");
  const languages = [...new Set(COLLECTIONS.map((c) => c.language))];
  // Start with the visitor's language when there are talks in it.
  const [language, setLanguage] = useState<string | null>(requestedCollection?.language ?? null);
  const shown = language ?? (languages.includes(locale as Collection["language"]) ? locale : "all");
  const [playing, setPlaying] = useState<string | null>(requestedCollection?.id ?? null);
  const openCard = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (requestedCollection) openCard.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [requestedCollection]);
  const kindLabel = { meditations: t.kindMeditations, classes: t.kindClasses, retreat: t.kindRetreat };
  const list = COLLECTIONS.filter((c) => shown === "all" || c.language === shown);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-4xl text-[var(--maroon)] sm:text-5xl">{t.library}</h1>
      <p className="mt-3 max-w-xl text-[var(--muted)]">{t.libraryIntro}</p>

      <div role="tablist" aria-label={t.library} className="mt-8 flex gap-6 border-b border-[var(--line)]">
        {(["talks", "podcasts"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 pb-2 font-serif text-lg transition-colors ${
              tab === k
                ? "border-[var(--saffron)] text-[var(--maroon)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--maroon)]"
            }`}
          >
            {k === "talks" ? t.talks : t.podcasts}
          </button>
        ))}
      </div>

      {tab === "podcasts" ? (
        <p className="mt-10 text-[var(--muted)]">{t.podcastsSoon}</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {["all", ...languages].map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={shown === l}
                onClick={() => setLanguage(l)}
                className={`rounded-full px-3 py-1 transition-colors ${
                  shown === l
                    ? "bg-[var(--maroon)] text-[var(--paper)]"
                    : "border border-[var(--line)] text-[var(--maroon)] hover:border-[var(--maroon)]"
                }`}
              >
                {l === "all" ? t.allLanguages : LOCALE_NAMES[l as Locale]}
              </button>
            ))}
          </div>

          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {list.map((c) => {
              const open = playing === c.id;
              return (
                <li
                  key={c.id}
                  ref={open ? openCard : undefined}
                  className={`scroll-mt-28 flex flex-col rounded-2xl border border-[var(--line)] bg-white/50 p-5 ${
                    open ? "sm:col-span-2" : ""
                  }`}
                >
                  <p className="text-xs text-[var(--muted)]">
                    {kindLabel[c.kind]} · {LOCALE_NAMES[c.language]}
                    {c.videos ? ` · ${t.videosCount(c.videos)}` : ""}
                  </p>
                  <h2 className="mt-1 font-serif text-xl leading-snug text-[var(--maroon)]" lang={c.language}>
                    {c.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">{c.about}</p>
                  {c.embeddable === false ? (
                    // The owner doesn't allow playing these on other sites.
                    <div className="mt-4">
                      <p className="text-xs leading-5 text-[var(--muted)]">{t.youtubeOnly}</p>
                      <a
                        href={youtubeUrl(c.playlist, c.id === requestedCollection?.id ? requestedVideo : null)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex w-fit items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--maroon)] transition-colors hover:border-[var(--maroon)]"
                      >
                        {t.watchOnYoutube} ↗
                      </a>
                    </div>
                  ) : open ? (
                    <div className="mt-4">
                      <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9" }}>
                        <iframe
                          src={playlistEmbed(c.playlist, c.id === requestedCollection?.id ? requestedVideo : null)}
                          title={c.title}
                          className="absolute inset-0 h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlaying(null)}
                        className="mt-3 text-sm text-[var(--maroon)] underline-offset-2 hover:underline"
                      >
                        {t.closePlayer}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPlaying(c.id)}
                      className="mt-4 flex w-fit items-center gap-2 rounded-full bg-[var(--maroon)] px-4 py-2 text-sm text-[var(--paper)] transition-colors hover:bg-[var(--maroon-deep)]"
                    >
                      <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--saffron)]" />
                      {t.watch}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
