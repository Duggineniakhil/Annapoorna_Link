// Device settings (A13): notification sound and text size. Language lives in i18n.

export type TextSize = "normal" | "large" | "larger";
export const TEXT_SIZES: TextSize[] = ["normal", "large", "larger"];

export interface Settings {
  sound: boolean;
  textSize: TextSize;
}

const KEY = "annapoorna.settings";
export const DEFAULT_SETTINGS: Settings = { sound: true, textSize: "normal" };

/** Root font size per step; every rem-based size in the app scales with it. */
export const TEXT_SCALE: Record<TextSize, string> = {
  normal: "100%",
  large: "112.5%",
  larger: "125%",
};

export function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
    return {
      sound: typeof parsed.sound === "boolean" ? parsed.sound : DEFAULT_SETTINGS.sound,
      textSize: TEXT_SIZES.includes(parsed.textSize as TextSize)
        ? (parsed.textSize as TextSize)
        : DEFAULT_SETTINGS.textSize,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable: the setting lasts for this visit.
  }
}

export function applyTextSize(size: TextSize): void {
  document.documentElement.style.fontSize = TEXT_SCALE[size];
  // Lets CSS make room on small phones at the largest size (see index.css).
  document.documentElement.dataset.textSize = size;
}

let audio: AudioContext | null = null;

/** A short, soft two-note chime for live notifications. Silent if audio is not allowed yet. */
export function playChime(): void {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    const ctx = audio;
    void ctx.resume();
    const start = ctx.currentTime;
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      const t0 = start + i * 0.14;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.32);
    });
  } catch {
    // Audio blocked or unavailable: the toast still shows.
  }
}
