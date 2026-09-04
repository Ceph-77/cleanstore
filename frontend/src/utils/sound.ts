// Small synthesised chimes for important in-app moments — no audio files, works
// offline. Browsers need a prior user gesture before audio plays; if it's still
// locked the call fails silently.

const MUTE_KEY = "cleanstore_sound_muted";

export function isSoundMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
}

type ChimeKind = "success" | "streak" | "milestone" | "notify";

const PATTERNS: Record<ChimeKind, { notes: number[]; type: OscillatorType }> = {
  success: { notes: [523.25, 659.25, 783.99], type: "triangle" }, // C5 E5 G5
  streak: { notes: [587.33, 880.0], type: "sine" }, // D5 A5
  milestone: { notes: [523.25, 659.25, 783.99, 1046.5], type: "triangle" }, // + C6
  notify: { notes: [880.0, 1174.66], type: "sine" }, // A5 D6
};

let ctx: AudioContext | null = null;

export function playChime(kind: ChimeKind = "success") {
  if (isSoundMuted()) return;
  try {
    ctx =
      ctx ??
      new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();

    const { notes, type } = PATTERNS[kind];
    const now = ctx.currentTime;
    const step = 0.11;

    notes.forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const t0 = now + i * step;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t0);
      osc.stop(t0 + 0.34);
    });
  } catch {
    /* audio unavailable */
  }
}
