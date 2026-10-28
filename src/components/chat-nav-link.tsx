"use client";

import Link from "next/link";
import { UI } from "@/lib/i18n";
import { useLocale } from "@/lib/use-prefs";

/** Header link to the chat, in the visitor's chosen language. */
export function ChatNavLink() {
  const locale = useLocale();
  return (
    <Link
      href="/chat"
      lang={locale}
      className="rounded-full px-3 py-1.5 text-[var(--maroon)] transition-colors hover:bg-[var(--maroon-soft)]"
    >
      {UI[locale].chatTitle}
    </Link>
  );
}
