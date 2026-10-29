import Link from "next/link";
import { CrisisNote } from "./crisis-note";
import { LocalizedCrisisNote } from "./localized-crisis-note";
import { PoweredBy } from "./powered-by";

const LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/about", label: "About" },
];

/**
 * Footer on every page: crisis note, then the site links and the Propelity
 * credit, centred. `compact` keeps it small on the chat page so the message
 * box stays in view on phones; `followLanguage` shows the crisis note in the
 * chat's chosen language.
 */
export function SiteFooter({
  compact = false,
  followLanguage = false,
  showCrisisNote = true,
}: {
  compact?: boolean;
  followLanguage?: boolean;
  /** The chat page shows the crisis note beside the message box instead. */
  showCrisisNote?: boolean;
}) {
  const pad = compact ? "px-5" : "px-6";
  return (
    <footer
      className={`border-t border-[var(--line)] text-[var(--muted)] ${
        compact ? "text-xs leading-5" : "text-sm"
      }`}
    >
      {showCrisisNote ? (
        // Like the chat page: the crisis note, then a dividing line, then the links.
        <p className={`${pad} ${compact ? "py-3" : "py-5"}`}>
          {followLanguage ? <LocalizedCrisisNote /> : <CrisisNote />}
        </p>
      ) : null}
      <div
        className={`${pad} ${compact ? "py-3" : "py-5"} ${
          showCrisisNote ? "border-t border-[var(--line)]" : ""
        }`}
      >
        <nav aria-label="Site" className="flex flex-wrap justify-center gap-x-6 gap-y-1">
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
        <PoweredBy className={`text-center ${compact ? "mt-1" : "mt-3"}`} />
      </div>
    </footer>
  );
}
