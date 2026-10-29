import { LotusMark } from "./lotus-mark";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** A simple page for content that is still being written. */
export function PlaceholderPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
        <LotusMark className="h-10 w-10 text-[var(--saffron)]" />
        <h1 className="mt-5 font-serif text-4xl text-[var(--maroon)] sm:text-5xl">{title}</h1>
        <div className="mt-6 max-w-xl space-y-4 text-lg leading-8 text-[var(--ink)]">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
