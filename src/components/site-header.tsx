import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
      <Link href="/" className="flex flex-col leading-tight">
        <span className="font-serif text-lg tracking-tight">Monk Companion</span>
        <span className="text-xs text-[var(--muted)]">Awaythroughfoundation</span>
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/chat" className="underline-offset-4 hover:underline">
          Monk Chat
        </Link>
      </nav>
    </header>
  );
}
