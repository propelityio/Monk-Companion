"use client";

import { useLocale } from "@/lib/use-prefs";
import { CrisisNote } from "./crisis-note";

/** The crisis note in the visitor's chosen chat language. */
export function LocalizedCrisisNote() {
  return <CrisisNote locale={useLocale()} />;
}
