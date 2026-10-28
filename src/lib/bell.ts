"use client";

// A singing-bowl style bell, synthesised in the browser (no audio file).
// Partials at inharmonic ratios, each paired with a slightly detuned twin so
// the tone shimmers as it fades, like a struck Tibetan bowl.

let ctx: AudioContext | null = null;
let bellRangAt = 0;

const PARTIALS: { ratio: number; gain: number; decay: number }[] = [
  { ratio: 1, gain: 1, decay: 7 },
  { ratio: 2.71, gain: 0.42, decay: 5 },
  { ratio: 5.15, gain: 0.18, decay: 3.2 },
  { ratio: 8.43, gain: 0.07, decay: 2 },
];

export function playBell(volume = 0.22, fundamental = 262): void {
  if (typeof window === "undefined") return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    void ctx.resume();
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
    bellRangAt = Date.now();
  } catch {
    /* sound is a nicety; never block navigation */
  }
}

/** Did the bell ring in the last few seconds (i.e. on the way into the chat)? */
export function justRangBell(withinMs = 4000): boolean {
  return bellRangAt > 0 && Date.now() - bellRangAt < withinMs;
}

/** Mark the arrival as handled so the greeting is spoken only once. */
export function clearBell(): void {
  bellRangAt = 0;
}
