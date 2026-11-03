"use client";

import Link from "next/link";
import { UI } from "@/lib/i18n";
import { useLocale } from "@/lib/use-prefs";

/** Header link to the Library, in the visitor's chosen language. */
export function LibraryNavLink() {
  const locale = useLocale();
  return (
    <Link
      href="/library"
      lang={locale}
      className="rounded-full px-1.5 py-1.5 text-[var(--maroon)] transition-colors hover:bg-[var(--maroon-soft)] sm:px-3"
    >
      {UI[locale].library}
    </Link>
  );
}
