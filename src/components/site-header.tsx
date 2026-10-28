import Link from "next/link";
import { LotusMark } from "./lotus-mark";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
      <Link href="/" className="flex items-center gap-3">
        <LotusMark className="h-8 w-8 text-[var(--saffron)]" />
        <span className="flex flex-col leading-tight">
          <span className="font-serif text-lg text-[var(--maroon)]">Monk Companion</span>
          <span className="text-xs text-[var(--muted)]">Awaythroughfoundation</span>
        </span>
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link
          href="/chat"
          className="rounded-full px-3 py-1.5 text-[var(--maroon)] transition-colors hover:bg-[var(--maroon-soft)]"
        >
          Monk Chat
        </Link>
      </nav>
    </header>
  );
}
