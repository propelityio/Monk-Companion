import Link from "next/link";
import { ChatNavLink } from "./chat-nav-link";
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
        <ChatNavLink />
      </nav>
    </header>
  );
}
