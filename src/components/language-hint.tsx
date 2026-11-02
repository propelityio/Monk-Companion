"use client";

import { useState, useSyncExternalStore } from "react";
import { deviceLanguageUnsupported } from "@/lib/use-prefs";

const DISMISS_KEY = "monk-companion-language-hint-seen";

function shouldShow(): boolean {
  try {
    return !window.localStorage.getItem(DISMISS_KEY) && deviceLanguageUnsupported();
  } catch {
    return false;
  }
}

/**
 * Shown once, when the device's language isn't one of the screen languages:
 * the Monk still understands it, and the menu sets the screen and microphone.
 */
export function LanguageHint() {
  const needed = useSyncExternalStore(
    () => () => {},
    shouldShow,
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);
  if (!needed || dismissed) return null;
  return (
    <div className="flex items-center justify-center gap-3 border-b border-[var(--line)] bg-[var(--saffron-soft)]/50 px-5 py-2 text-center text-xs leading-5 text-[var(--ink)]">
      <p>
        Monk Companion understands any language. Choose the closest one in the menu above for the
        screen and the microphone.
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            window.localStorage.setItem(DISMISS_KEY, "1");
          } catch {
            /* storage unavailable */
          }
          setDismissed(true);
        }}
        className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-0.5 text-[var(--maroon)]"
      >
        OK
      </button>
    </div>
  );
}
