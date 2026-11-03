import { ChatNavLink } from "./chat-nav-link";
import { HomeLink } from "./home-link";
import { LanguageHint } from "./language-hint";
import { LanguageSelect } from "./language-select";
import { LibraryNavLink } from "./library-nav-link";
import { LotusMark } from "./lotus-mark";

export function SiteHeader() {
  return (
    <>
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[var(--line)] bg-[var(--paper)]/90 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
      <HomeLink className="flex shrink-0 items-center gap-2 sm:gap-3">
        <LotusMark className="h-7 w-7 text-[var(--saffron)] sm:h-8 sm:w-8" />
        <span className="flex flex-col leading-tight">
          <span className="whitespace-nowrap font-serif text-base text-[var(--maroon)] sm:text-lg">Monk Companion</span>
          <span className="whitespace-nowrap text-[11px] text-[var(--muted)] sm:text-xs">A Way Through Foundation</span>
        </span>
      </HomeLink>
      <nav className="ml-auto flex items-center gap-0.5 whitespace-nowrap text-[13px] sm:gap-2 sm:text-sm">
        <LanguageSelect />
        <LibraryNavLink />
        <ChatNavLink />
      </nav>
    </header>
    <LanguageHint />
    </>
  );
}
