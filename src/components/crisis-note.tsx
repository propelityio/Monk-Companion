"use client";

import { useSyncExternalStore } from "react";
import { CRISIS_COUNTRY, crisisLine } from "@/lib/i18n";
import { detectRegion } from "@/lib/use-prefs";

// Shows the crisis line for the visitor's country, worked out from their
// device's time zone (no location lookup). Unknown countries, and the first
// render before the browser has loaded, get a version that is right anywhere.

export function CrisisNote() {
  const region = useSyncExternalStore(
    () => () => {},
    detectRegion,
    () => null,
  );
  const line = crisisLine(region);
  const country = region ? CRISIS_COUNTRY[region] : null;

  return (
    <>
      Not therapy or medical advice.{" "}
      {line && country ? (
        <>
          If you are in crisis in {country}, {line === "988" ? "call or text" : "call"} {line}, or
          contact your local emergency number.
        </>
      ) : (
        <>
          If you are in crisis, contact your local emergency number or find a free helpline in
          your country at{" "}
          <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" className="underline">
            findahelpline.com
          </a>
          .
        </>
      )}
    </>
  );
}
