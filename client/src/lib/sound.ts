// Tiny Web Audio API utility for quiz feedback sounds.
// No audio files — tones are synthesised on the fly. Zero bundle/network cost.

let ctx: AudioContext | null = null;
const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  // Resume if browser auto-suspended after first gesture
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
};

const isMuted = (): boolean => {
  try {
    return localStorage.getItem("ht.sound.muted") === "1";
  } catch {
    return false;
  }
};

interface ToneSpec {
  freq: number;
  duration: number; // seconds
  delay?: number;   // seconds from start
  type?: OscillatorType;
  volume?: number;  // 0..1
  slideTo?: number; // frequency to glide to over duration
}

const playTones = (tones: ToneSpec[]) => {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;

  const now = c.currentTime;
  const master = c.createGain();
  master.gain.value = 0.18; // global headroom — gentle by default
  master.connect(c.destination);

  for (const t of tones) {
    const start = now + (t.delay ?? 0);
    const end = start + t.duration;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = t.type ?? "sine";
    osc.frequency.setValueAtTime(t.freq, start);
    if (t.slideTo != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, t.slideTo), end);
    }
    // ADSR-ish envelope to avoid clicks
    const peak = (t.volume ?? 1) * 0.9;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(end + 0.02);
  }
};

// Pleasant ascending two-tone chime — C5 → G5
export const playCorrect = () =>
  playTones([
    { freq: 523.25, duration: 0.12, type: "sine", volume: 0.9 },
    { freq: 783.99, duration: 0.22, delay: 0.10, type: "sine", volume: 1 },
  ]);

// Short low buzz — quick descending square wave
export const playWrong = () =>
  playTones([
    { freq: 220, slideTo: 110, duration: 0.30, type: "square", volume: 0.5 },
  ]);

// Triumphant rising arpeggio — C5 E5 G5 C6
export const playPassed = () =>
  playTones([
    { freq: 523.25, duration: 0.14, delay: 0.00, type: "triangle", volume: 0.9 },
    { freq: 659.25, duration: 0.14, delay: 0.12, type: "triangle", volume: 0.9 },
    { freq: 783.99, duration: 0.16, delay: 0.24, type: "triangle", volume: 0.95 },
    { freq: 1046.5, duration: 0.32, delay: 0.38, type: "triangle", volume: 1 },
  ]);

// Sad descending — A4 → F4 → D4
export const playFailed = () =>
  playTones([
    { freq: 440, duration: 0.18, delay: 0.00, type: "sine", volume: 0.8 },
    { freq: 349.23, duration: 0.20, delay: 0.16, type: "sine", volume: 0.8 },
    { freq: 293.66, duration: 0.40, delay: 0.34, type: "sine", volume: 0.9 },
  ]);

// Subtle click — used for "submission acknowledged"
export const playClick = () =>
  playTones([
    { freq: 880, duration: 0.06, type: "sine", volume: 0.5 },
  ]);
