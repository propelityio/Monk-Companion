import Link from "next/link";
import { CrisisNote } from "./crisis-note";
import { PoweredBy } from "./powered-by";

const LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/about", label: "About" },
];

/** Footer: crisis note, then the site links and the Propelity credit, centred. */
export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] px-6 py-6 text-sm text-[var(--muted)]">
      <p>
        <CrisisNote />
      </p>
      <nav aria-label="Site" className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-[var(--maroon)] underline-offset-2 hover:underline"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <PoweredBy className="mt-3 text-center" />
    </footer>
  );
}
