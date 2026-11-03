"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { COLLECTIONS, playlistEmbed, youtubeUrl, type Collection } from "@/lib/library";
import { COLLECTION_VIDEOS } from "@/lib/library-videos";
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
                  {open ? (
                    <CollectionPanel
                      collection={c}
                      startVideo={c.id === requestedCollection?.id ? requestedVideo : null}
                      onClose={() => setPlaying(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPlaying(c.id)}
                      className="mt-4 flex w-fit items-center gap-2 rounded-full bg-[var(--maroon)] px-4 py-2 text-sm text-[var(--paper)] transition-colors hover:bg-[var(--maroon-deep)]"
                    >
                      <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--saffron)]" />
                      {t.openCollection}
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

/**
 * An open collection: the player (when the owner allows playing on other
 * sites) and the list of its talks. Picking a talk plays it right here; for
 * collections that can only be watched on YouTube, it opens that talk there.
 */
function CollectionPanel({
  collection: c,
  startVideo,
  onClose,
}: {
  collection: Collection;
  startVideo: string | null;
  onClose: () => void;
}) {
  const t = UI[useLocale()];
  const videos = COLLECTION_VIDEOS[c.id] ?? [];
  const embeddable = c.embeddable !== false;
  const [current, setCurrent] = useState<string | null>(
    startVideo && videos.some(([id]) => id === startVideo) ? startVideo : (videos[0]?.[0] ?? null),
  );
  const [picked, setPicked] = useState(false); // autoplay only after a choice
  const listRef = useRef<HTMLOListElement | null>(null);
  useEffect(() => {
    // Show the current talk in the list (e.g. arriving from a chat link).
    const item = listRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    if (item && listRef.current) listRef.current.scrollTop = item.offsetTop - listRef.current.offsetTop - 8;
  }, []);

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[3fr_2fr] lg:items-start">
      {embeddable ? (
        <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9" }}>
          <iframe
            key={current ?? "list"}
            src={playlistEmbed(c.playlist, current) + (picked ? "&autoplay=1" : "")}
            title={videos.find(([id]) => id === current)?.[1] ?? c.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="text-xs leading-5 text-[var(--muted)] lg:col-span-2">{t.youtubeOnly}</p>
      )}
      <div className={embeddable ? "" : "lg:col-span-2"}>
        <p className="text-xs text-[var(--muted)]">
          {t.talksInCollection} · {videos.length}
        </p>
        <ol
          ref={listRef}
          className="mt-2 max-h-72 divide-y divide-[var(--line)] overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--paper)] lg:max-h-[22rem]"
        >
          {videos.map(([id, title], i) => {
            const isCurrent = id === current;
            const inner = (
              <>
                <span className="w-7 shrink-0 text-right text-xs tabular-nums text-[var(--muted)]">{i + 1}</span>
                <span className="flex-1" lang={c.language}>
                  {title}
                </span>
                {isCurrent && embeddable ? (
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--saffron)]">
                    <span aria-hidden="true" className="breath inline-block h-2 w-2 rounded-full bg-[var(--saffron)]" />
                    {t.nowPlaying}
                  </span>
                ) : null}
                {!embeddable ? <span aria-hidden="true" className="text-[var(--muted)]">↗</span> : null}
              </>
            );
            const cls = `flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
              isCurrent ? "bg-[var(--saffron-soft)]/60 text-[var(--maroon)]" : "text-[var(--ink)] hover:bg-[var(--maroon-soft)]"
            }`;
            return (
              <li key={`${id}-${i}`}>
                {embeddable ? (
                  <button
                    type="button"
                    aria-current={isCurrent ? "true" : undefined}
                    onClick={() => {
                      setPicked(true);
                      setCurrent(id);
                    }}
                    className={cls}
                  >
                    {inner}
                  </button>
                ) : (
                  <a
                    href={youtubeUrl(c.playlist, id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-current={isCurrent ? "true" : undefined}
                    className={cls}
                  >
                    {inner}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-sm text-[var(--maroon)] underline-offset-2 hover:underline"
        >
          {t.closePlayer}
        </button>
      </div>
    </div>
  );
}
