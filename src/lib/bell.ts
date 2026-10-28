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
 * A recorded bell, if one has been added at public/sounds/bell.mp3 (it must be
 * a recording you have the rights to use). Without it, the synthesised bowl plays.
 */
const BELL_FILE = "/sounds/bell.mp3";
let fileMissing = false;

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
    const audio = new Audio(BELL_FILE);
    audio.volume = Math.min(1, volume * 3);
    audio.onended = () => finishBell();
    audio.onerror = fallBack;
    void audio.play().catch(fallBack);
  } catch {
    fallBack();
  }
}

function unlockAudio(): void {
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
