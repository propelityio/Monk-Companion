"use client";

import { useSyncExternalStore } from "react";

// A singing-bowl style bell, synthesised in the browser (no audio file).
// Partials at inharmonic ratios, each paired with a slightly detuned twin so
// the tone shimmers as it fades, like a struck Tibetan bowl.

let ctx: AudioContext | null = null;
let bellRangAt = 0;
let bellDone: Promise<void> = Promise.resolve();
let finishBell: () => void = () => {};

const PARTIALS: { ratio: number; gain: number; decay: number }[] = [
  { ratio: 1, gain: 1, decay: 3 },
  { ratio: 2.71, gain: 0.42, decay: 2.4 },
  { ratio: 5.15, gain: 0.18, decay: 1.6 },
  { ratio: 8.43, gain: 0.07, decay: 1 },
];

/**
 * Recorded bells in public/sounds (recordings the foundation has the rights to).
 * Each visit uses the next one in turn, and keeps it for the whole visit.
 * If a file can't be played, the synthesised bowl rings instead.
 */
export const BELLS = [
  "/sounds/bell-tibetan-bell.mp3",
  "/sounds/bell-small-bowl.mp3",
  "/sounds/bell-singing-bowl.mp3",
];
const NEXT_KEY = "monk-companion-next-bell"; // across visits (localStorage)
const VISIT_KEY = "monk-companion-visit-bell"; // this visit (sessionStorage)
let fileMissing = false;

/** The bell for this visit: the same all visit, the next one on the next visit. */
export function bellForThisVisit(): string {
  try {
    const current = window.sessionStorage.getItem(VISIT_KEY);
    if (current !== null && BELLS[Number(current)]) return BELLS[Number(current)];
    const next = Number(window.localStorage.getItem(NEXT_KEY) ?? 0) % BELLS.length || 0;
    window.sessionStorage.setItem(VISIT_KEY, String(next));
    window.localStorage.setItem(NEXT_KEY, String((next + 1) % BELLS.length));
    return BELLS[next];
  } catch {
    // Storage blocked (e.g. private mode): pick one at random instead.
    return BELLS[Math.floor(Math.random() * BELLS.length)];
  }
}

export function playBell(volume = 0.22): void {
  if (typeof window === "undefined") return;
  stopClosingBell();
  bellRangAt = Date.now();
  bellDone = new Promise<void>((resolve) => {
    finishBell = resolve;
  });
  // Safety net: never hold the greeting back for more than 15 seconds.
  window.setTimeout(() => finishBell(), 15000);
  // Wake the audio engine now, inside the click, so a fallback can still sound.
  unlockAudio();
  if (fileMissing) return synthBell(volume);
  let fellBack = false;
  const fallBack = () => {
    if (fellBack) return;
    fellBack = true;
    fileMissing = true;
    synthBell(volume);
  };
  try {
    const audio = new Audio(bellForThisVisit());
    audio.volume = Math.min(1, volume * 3);
    audio.onended = () => finishBell();
    audio.onerror = fallBack;
    void audio.play().catch(fallBack);
  } catch {
    fallBack();
  }
}

export function unlockAudio(): void {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    void ctx.resume();
  } catch {
    /* no Web Audio */
  }
}

function synthBell(volume: number, fundamental = 262, onDone: () => void = finishBell): void {
  const longest = Math.max(...PARTIALS.map((p) => p.decay));
  window.setTimeout(() => onDone(), longest * 1000);
  try {
    unlockAudio();
    if (!ctx) return onDone();
    const now = ctx.currentTime + 0.02;

    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);

    for (const p of PARTIALS) {
      for (const detune of [0, 1.3]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = fundamental * p.ratio + detune;
        const g = ctx.createGain();
        const peak = (p.gain / 2) * (detune ? 0.8 : 1);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(peak, now + 0.008); // the strike
        g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay); // the long fade
        osc.connect(g).connect(master);
        osc.start(now);
        osc.stop(now + p.decay + 0.1);
      }
    }
  } catch {
    /* sound is a nicety; never block navigation */
  }
}

// ---------- the closing bell ----------
// The same bell as the visit's opening one, rung once when a conversation
// ends. Kept separate from the arrival bell so it never triggers a greeting.

let closingRinging = false;

/**
 * Ring the closing bell. Resolves when it has finished (at most 15 seconds).
 *
 * It plays through the Monk's own voice player: phones (and Safari) only let
 * a page play sound on an element that was started by a tap, and that player
 * was warmed up by the visitor's taps and has just spoken the farewell. A
 * brand-new player at this point would be silently blocked.
 */
export function playClosingBell(volume = 0.22): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  stopClosingBell();
  return new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      closingRinging = false;
      try {
        voicePlayer().volume = 1; // the Monk's voice plays at full volume
      } catch {
        /* no player */
      }
      resolve();
    };
    window.setTimeout(done, 15000);
    unlockAudio();
    if (fileMissing) return synthBell(volume, 262, done);
    let fellBack = false;
    const fallBack = (missing: boolean) => {
      if (fellBack) return;
      fellBack = true;
      if (missing) fileMissing = true;
      synthBell(volume, 262, done);
    };
    try {
      const el = voicePlayer();
      el.onplay = el.ontimeupdate = null;
      el.onended = done;
      el.onpause = () => {
        if (!el.ended) done(); // stopped early (e.g. a new conversation began)
      };
      el.onerror = () => {
        el.onerror = null;
        fallBack(true);
      };
      el.muted = false;
      el.volume = Math.min(1, volume * 3);
      el.src = bellForThisVisit();
      closingRinging = true;
      // Blocked anyway: the audio engine is usually already running after the
      // conversation, so the synthesised bowl can still sound.
      void el.play().catch(() => fallBack(false));
    } catch {
      fallBack(true);
    }
  });
}

/** Silence the closing bell if it is still ringing. */
export function stopClosingBell(): void {
  if (!closingRinging) return;
  closingRinging = false;
  try {
    const el = voicePlayer();
    el.pause();
    el.onerror = null;
    el.volume = 1;
  } catch {
    /* nothing to stop */
  }
}

/** Resolves when the bell has finished ringing. */
export function whenBellDone(): Promise<void> {
  return bellDone;
}

/** Did the bell ring in the last few seconds (i.e. on the way into the chat)? */
export function justRangBell(withinMs = 4000): boolean {
  return bellRangAt > 0 && Date.now() - bellRangAt < withinMs;
}

/** Mark the arrival as handled so the greeting is spoken only once. */
export function clearBell(): void {
  bellRangAt = 0;
}

/** The shared audio engine, but only if the browser has let it start. */
export function runningAudioContext(): AudioContext | null {
  return ctx && ctx.state === "running" ? ctx : null;
}

// ---------- arriving at the chat by a click (with or without the bell) ----------

let arrivedAt = 0;
// True from the tap until the greeting starts to appear (spoken or faded in).
// A shared signal, not component state, because the chat page may be reused
// from the background rather than created fresh.
let arrivalPending = false;
let arrivalSafety = 0;
const arrivalListeners = new Set<() => void>();
const notifyArrival = () => arrivalListeners.forEach((fn) => fn());

/** Note that the visitor is on their way into the chat by clicking a link. */
export function markArrival(): void {
  arrivedAt = Date.now();
  arrivalPending = true;
  notifyArrival();
  // Never leave the greeting hidden if something goes wrong. (Restarted on
  // each arrival, so an earlier visit's timer can't reveal this one early.)
  window.clearTimeout(arrivalSafety);
  arrivalSafety = window.setTimeout(settleArrival, 20000);
}

/** The greeting has started to appear (or won't be shown with a delay). */
export function settleArrival(): void {
  if (!arrivalPending) return;
  arrivalPending = false;
  notifyArrival();
}

export function useArrivalPending(): boolean {
  return useSyncExternalStore(
    (fn) => {
      arrivalListeners.add(fn);
      return () => arrivalListeners.delete(fn);
    },
    () => arrivalPending,
    () => false,
  );
}

/** Did the visitor just click their way into the chat? */
export function arrivedRecently(withinMs = 4000): boolean {
  return arrivedAt > 0 && Date.now() - arrivedAt < withinMs;
}

// ---------- the Monk's voice player ----------
// Phones only let a page play sound in direct response to a tap. One player is
// "warmed up" during the visitor's taps (Begin a conversation, Send, Speak),
// so it is allowed to speak later, e.g. after the bell has finished.

let voiceEl: HTMLAudioElement | null = null;
let voicePrimed = false;
const SILENCE = "/sounds/silence.mp3";

export function voicePlayer(): HTMLAudioElement {
  if (!voiceEl) {
    voiceEl = new Audio();
    voiceEl.preload = "auto";
    voiceEl.setAttribute("playsinline", "");
  }
  return voiceEl;
}

/** Call inside a tap or click handler. */
export function primeVoice(): void {
  if (typeof window === "undefined") return;
  unlockAudio();
  const el = voicePlayer();
  if (voicePrimed || !el.paused) return;
  el.muted = true;
  el.src = SILENCE;
  el.play()
    .then(() => {
      if (el.src.endsWith(SILENCE)) el.pause();
      voicePrimed = true;
    })
    .catch(() => {})
    .finally(() => {
      el.muted = false;
    });
}

/** Phones and tablets (touch screens) skip the EQ: it can silence the voice there. */
export function isTouchDevice(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}
