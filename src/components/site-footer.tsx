import { LocalizedCrisisNote } from "./localized-crisis-note";
import { FooterLinks } from "./footer-links";

/**
 * Footer on every page: crisis note, then the site links and the Propelity
 * credit, centred. `compact` keeps it small on the chat page so the message
 * box stays in view on phones. The crisis note and links follow the visitor's chosen language.
 */
export function SiteFooter({
  compact = false,
  showCrisisNote = true,
}: {
  compact?: boolean;
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
          <LocalizedCrisisNote />
        </p>
      ) : null}
      <div
        className={`${pad} ${compact ? "py-3" : "py-5"} ${
          showCrisisNote ? "border-t border-[var(--line)]" : ""
        }`}
      >
        <FooterLinks compact={compact} />
      </div>
    </footer>
  );
}
