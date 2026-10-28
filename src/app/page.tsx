import Link from "next/link";
import { CrisisNote } from "@/components/crisis-note";
import { LotusMark } from "@/components/lotus-mark";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
        <LotusMark className="h-14 w-14 text-[var(--saffron)]" />
        <h1 className="mt-6 font-serif text-5xl leading-[1.05] text-[var(--maroon)] sm:text-6xl">
          Monk Companion
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">from Awaythroughfoundation</p>
        <p className="mt-8 max-w-xl text-lg leading-8 text-[var(--ink)]">
          An authentic companion grounded in Buddhist teachings. Speak or write.
          No subscription. No login to begin.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/chat"
            className="rounded-full bg-[var(--maroon)] px-6 py-3 text-[var(--paper)] transition-colors hover:bg-[var(--maroon-deep)]"
          >
            Open Monk Chat
          </Link>
          <a
            href="#how"
            className="rounded-full border border-[var(--line)] px-6 py-3 text-[var(--maroon)] transition-colors hover:border-[var(--maroon)]"
          >
            How it works
          </a>
        </div>
        <section
          id="how"
          className="mt-24 grid gap-x-12 gap-y-10 border-t border-[var(--line)] pt-12 sm:grid-cols-2"
        >
          <div>
            <h2 className="font-serif text-xl text-[var(--maroon)]">Guest conversation</h2>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              Talk immediately. Voice or text. Nothing is required except your
              presence in this browser session.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-xl text-[var(--maroon)]">Curated path</h2>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              Share a preferred name and email when you want the companion to
              recognize you and remember an intention.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-xl text-[var(--maroon)]">Teachings as the source</h2>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              Recorded talks, transcripts, and written text will be cited. The
              companion will not invent dharma when a talk is not yet loaded.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-xl text-[var(--maroon)]">Later, an app</h2>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              Phase II is a phone app using the same conversation. This website
              is the first door.
            </p>
          </div>
        </section>
      </main>
      <footer className="border-t border-[var(--line)] px-6 py-6 text-sm text-[var(--muted)]">
        <CrisisNote />
      </footer>
    </div>
  );
}
