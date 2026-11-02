"use client";

import { useEffect } from "react";
import { LOCALE_NAMES, LOCALES, UI, toLocale } from "@/lib/i18n";
import { setLocale, useLocale } from "@/lib/use-prefs";

/**
 * Compact language menu for the header: shows the short code (EN, ES…) and
 * opens the full list of languages. Sets the screen and microphone language.
 */
export function LanguageSelect() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <label className="relative inline-flex items-center rounded-full border border-[var(--line)] px-2.5 py-1 text-[var(--maroon)] transition-colors focus-within:border-[var(--saffron)] hover:border-[var(--maroon)]">
      <span aria-hidden="true" className="text-xs font-medium tracking-wide">
        {locale.toUpperCase()}
      </span>
      <svg aria-hidden="true" viewBox="0 0 10 6" className="ml-1 h-1.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M1 1l4 4 4-4" />
      </svg>
      <select
        aria-label={UI[locale].language}
        value={locale}
        onChange={(e) => setLocale(toLocale(e.target.value))}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
