"use client";

import { useSyncExternalStore } from "react";
import { CRISIS_COUNTRY, CRISIS_TEXT_OK, crisisLine, UI, type Locale } from "@/lib/i18n";
import { detectRegion } from "@/lib/use-prefs";

// Shows the crisis line for the visitor's country, worked out from their
// device's time zone (no location lookup). Unknown countries, and the first
// render before the browser has loaded, get a version that is right anywhere.

function countryName(region: string, locale: Locale): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "region" }).of(region);
    if (name) return locale === "en" ? (CRISIS_COUNTRY[region] ?? name) : name;
  } catch {
    /* fall back to English */
  }
  return CRISIS_COUNTRY[region] ?? region;
}

export function CrisisNote({ locale = "en" }: { locale?: Locale }) {
  const region = useSyncExternalStore(
    () => () => {},
    detectRegion,
    () => null,
  );
  const t = UI[locale];
  const line = crisisLine(region);

  return (
    <span lang={locale}>
      {t.notAdvice}
      {locale === "zh" || locale === "ja" ? "" : " "}
      {region && line ? (
        t.crisisIn(countryName(region, locale), line, CRISIS_TEXT_OK.has(region))
      ) : (
        <>
          {t.crisisAnywhere}{" "}
          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            findahelpline.com
          </a>
          {locale === "zh" || locale === "ja" ? "" : "."}
        </>
      )}
    </span>
  );
}
