"use client";

import Link from "next/link";
import { UI } from "@/lib/i18n";
import { useLocale } from "@/lib/use-prefs";
import { PoweredBy } from "./powered-by";

/** Footer links and the Propelity credit, in the visitor's chosen language. */
export function FooterLinks({ compact = false }: { compact?: boolean }) {
  const t = UI[useLocale()];
  const links = [
    { href: "/privacy", label: t.privacy },
    { href: "/terms", label: t.terms },
    { href: "/about", label: t.about },
  ];
  return (
    <>
      <nav aria-label="Site" className="flex flex-wrap justify-center gap-x-6 gap-y-1">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-[var(--maroon)] underline-offset-2 hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
      <PoweredBy label={t.poweredBy} className={`text-center ${compact ? "mt-1" : "mt-3"}`} />
    </>
  );
}
