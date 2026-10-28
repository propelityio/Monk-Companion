import { ChatNavLink } from "./chat-nav-link";
import { HomeLink } from "./home-link";
import { LotusMark } from "./lotus-mark";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
      <HomeLink className="flex items-center gap-3">
        <LotusMark className="h-8 w-8 text-[var(--saffron)]" />
        <span className="flex flex-col leading-tight">
          <span className="font-serif text-lg text-[var(--maroon)]">Monk Companion</span>
          <span className="text-xs text-[var(--muted)]">A Way Through Foundation</span>
        </span>
      </HomeLink>
      <nav className="flex items-center gap-4 text-sm">
        <ChatNavLink />
      </nav>
    </header>
  );
}
