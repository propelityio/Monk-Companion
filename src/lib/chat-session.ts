"use client";

import { useSyncExternalStore } from "react";
import { nextGreeting } from "./use-prefs";

// A counter for "start a fresh conversation". The chat is keyed on it, so
// bumping it clears the conversation even if the chat page is being kept
// alive in the background for quick navigation.
let session = 0;
const listeners = new Set<() => void>();

export function startFreshConversation() {
  session++;
  nextGreeting();
  listeners.forEach((fn) => fn());
}

export function useConversationSession(): number {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => session,
    () => 0,
  );
}
