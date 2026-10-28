"use client";

import { useSyncExternalStore } from "react";
import { regionFromTimeZone, timeOfDay, toLocale, type Locale, type TimeOfDay } from "./i18n";

// ---------- language: saved choice, else the browser's language ----------

const LOCALE_KEY = "monk-companion-locale";
const localeListeners = new Set<() => void>();

function readLocale(): Locale {
  try {
    const saved = window.localStorage.getItem(LOCALE_KEY);
    if (saved) return toLocale(saved);
  } catch {
    /* storage unavailable */
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const l = toLocale(tag);
    if (l !== "en" || tag.toLowerCase().startsWith("en")) return l;
  }
  return "en";
}

export function setLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    /* storage unavailable */
  }
  localeListeners.forEach((fn) => fn());
}

export function useLocale(): Locale {
  return useSyncExternalStore(
    (fn) => {
      localeListeners.add(fn);
      return () => localeListeners.delete(fn);
    },
    readLocale,
    () => "en",
  );
}

// ---------- greeting: from the visitor's own clock ----------

type GreetingMoment = { time: TimeOfDay; variant: number } | null;
let lastMoment: GreetingMoment = null;

function readMoment(): GreetingMoment {
  const now = new Date();
  const time = timeOfDay(now.getHours());
  // Same question all day long; a different one on different days.
  const day = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
  const variant = day % 3;
  if (!lastMoment || lastMoment.time !== time || lastMoment.variant !== variant) {
    lastMoment = { time, variant };
  }
  return lastMoment;
}

export function useGreetingMoment(): GreetingMoment {
  return useSyncExternalStore(
    (fn) => {
      const id = window.setInterval(fn, 60_000);
      return () => window.clearInterval(id);
    },
    readMoment,
    () => null,
  );
}

/** Country code for choosing a crisis line, from the browser's time zone. */
export function detectRegion(): string | null {
  try {
    return regionFromTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return null;
  }
}

// ---------- how replies are delivered ----------

export type ReplyMode = "text" | "voice" | "both";
const MODE_KEY = "monk-companion-reply-mode";
const HANDS_FREE_KEY = "monk-companion-hands-free";
const prefListeners = new Set<() => void>();
const subscribePrefs = (fn: () => void) => {
  prefListeners.add(fn);
  return () => prefListeners.delete(fn);
};

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
  prefListeners.forEach((fn) => fn());
}

export function getReplyMode(): ReplyMode {
  const v = typeof window === "undefined" ? null : readStored(MODE_KEY);
  return v === "text" || v === "voice" || v === "both" ? v : "both";
}

export function setReplyMode(mode: ReplyMode) {
  writeStored(MODE_KEY, mode);
}

export function useReplyMode(): ReplyMode {
  return useSyncExternalStore(subscribePrefs, getReplyMode, () => "both");
}

export function useHandsFree(): boolean {
  return useSyncExternalStore(subscribePrefs, () => readStored(HANDS_FREE_KEY) === "1", () => false);
}

export function setHandsFree(on: boolean) {
  writeStored(HANDS_FREE_KEY, on ? "1" : "0");
}
