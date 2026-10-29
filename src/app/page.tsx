import { LotusMark } from "@/components/lotus-mark";
import { OpenChatLink } from "@/components/open-chat-link";
import { SiteFooter } from "@/components/site-footer";
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
        <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--ink)]">
          An authentic companion grounded in Buddhist teachings.
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Speak or write. No subscription. No login to begin.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="#how"
            className="rounded-full border border-[var(--line)] px-6 py-3 text-[var(--maroon)] transition-colors hover:border-[var(--maroon)]"
          >
            How it works
          </a>
          <OpenChatLink
            className="rounded-full bg-[var(--maroon)] px-6 py-3 text-[var(--paper)] transition-colors hover:bg-[var(--maroon-deep)]"
          >
            Begin a conversation
          </OpenChatLink>
        </div>
        <section
          id="how"
          className="mt-24 grid gap-x-10 gap-y-10 border-t border-[var(--line)] pt-12 sm:grid-cols-3"
        >
          <div>
            <h2 className="font-serif text-xl text-[var(--maroon)]">Guest conversation</h2>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              Talk right away by voice, text, or both. Nothing is needed but your
              presence.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-xl text-[var(--maroon)]">Personal path</h2>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              Share the name you&apos;d like to be called, and an intention if you
              wish. The companion will greet you by name and keep your intention
              in mind.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-xl text-[var(--maroon)]">Teachings as the source</h2>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              Every answer comes from recorded talks by Buddhist teachers, with a
              link to the source. When no teaching speaks to your question, the
              companion says so instead of guessing.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
