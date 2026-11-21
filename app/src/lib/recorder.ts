// Voice recording helpers (A12).
//
// The speech service takes WAV, MP3, OGG, FLAC, AAC and M4A, but not WebM. So we record mp4 or
// ogg when the browser can, and only fall back to WebM (Chrome on desktop and Android), which is
// then turned into 16 kHz mono WAV in the browser before it is uploaded.

/**
 * Preferred first; the first one the browser can record is used. AAC in MP4 (M4A) is named
 * explicitly because Chrome's plain "audio/mp4" holds Opus, which the speech service may not
 * read. Plain "audio/mp4" stays for browsers that only answer to that (Safari records AAC).
 * WebM is the last resort.
 */
export const AUDIO_TYPES = [
  "audio/mp4;codecs=mp4a.40.2",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/webm;codecs=opus",
] as const;

/** Longest clip for mp4/ogg. */
export const MAX_RECORD_MS = 20_000;
/** Longest clip when it must become WAV: 16-bit 16 kHz mono is 32 KB a second, so 12 s ≈ 384 KB,
 * under the server's 400 KB limit. */
export const MAX_WAV_RECORD_MS = 12_000;
/** Shorter than this is a tap, not a hold: nothing is sent. */
export const MIN_RECORD_MS = 600;
/** ~32 kbps keeps 20 s of speech near 80 KB, well under the server's 400 KB limit. */
export const AUDIO_BITS_PER_SECOND = 32_000;
export const WAV_SAMPLE_RATE = 16_000;

export function pickAudioType(
  isSupported: (type: string) => boolean = (type) =>
    typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type),
): string | undefined {
  return AUDIO_TYPES.find((type) => isSupported(type));
}

/** True when a recording of this type must be converted to WAV before upload. */
export function needsWav(type: string): boolean {
  return type.startsWith("audio/webm");
}

/** The longest recording for this type. */
export function maxRecordMsFor(type: string): number {
  return needsWav(type) ? MAX_WAV_RECORD_MS : MAX_RECORD_MS;
}

/** File name for the upload, from the type ("audio/mp4" → "voice.m4a"). */
export function fileNameFor(type: string): string {
  const sub = type.split(";")[0].split("/")[1] ?? "wav";
  return `voice.${sub === "mp4" ? "m4a" : sub}`;
}

/** 16-bit PCM mono WAV file from samples in [-1, 1]. */
export function encodeWav(samples: Float32Array, sampleRate = WAV_SAMPLE_RATE): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/** Decode any recording the browser can play and resample it to 16 kHz mono WAV. */
export async function toWav(blob: Blob): Promise<Blob> {
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const length = Math.max(1, Math.ceil(decoded.duration * WAV_SAMPLE_RATE));
    const offline = new OfflineAudioContext(1, length, WAV_SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded; // Multi-channel input is mixed down to the one output channel.
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return encodeWav(rendered.getChannelData(0), WAV_SAMPLE_RATE);
  } finally {
    void ctx.close();
  }
}

/** True when this browser can record audio at all. */
export function canRecord(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    pickAudioType() !== undefined
  );
}

/** "denied" when the user has blocked the mic for this site; otherwise unknown/granted/prompt. */
export async function micPermission(): Promise<PermissionState | "unknown"> {
  try {
    const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
    return status.state;
  } catch {
    return "unknown"; // Firefox and older Safari cannot query the microphone permission.
  }
}
