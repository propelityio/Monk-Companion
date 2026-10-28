"use client";

// A singing-bowl style bell, synthesised in the browser (no audio file).
// Partials at inharmonic ratios, each paired with a slightly detuned twin so
// the tone shimmers as it fades, like a struck Tibetan bowl.

let ctx: AudioContext | null = null;
let bellRangAt = 0;
let bellDone: Promise<void> = Promise.resolve();
let finishBell: () => void = () => {};

const PARTIALS: { ratio: number; gain: number; decay: number }[] = [
  { ratio: 1, gain: 1, decay: 7 },
  { ratio: 2.71, gain: 0.42, decay: 5 },
  { ratio: 5.15, gain: 0.18, decay: 3.2 },
  { ratio: 8.43, gain: 0.07, decay: 2 },
];

/**
 * Recorded bells in public/sounds (recordings the foundation has the rights to).
 * Each visit uses the next one in turn, and keeps it for the whole visit.
 * If a file can't be played, the synthesised bowl rings instead.
 */
export const BELLS = [
  "/sounds/bell-tibetan-bell.mp3",
  "/sounds/bell-small-bowl.mp3",
  "/sounds/bell-silver-bells.mp3",
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

function synthBell(volume: number, fundamental = 262): void {
  const longest = Math.max(...PARTIALS.map((p) => p.decay));
  window.setTimeout(() => finishBell(), longest * 1000);
  try {
    unlockAudio();
    if (!ctx) return finishBell();
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
