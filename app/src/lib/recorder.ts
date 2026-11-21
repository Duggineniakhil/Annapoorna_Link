// Voice recording helpers (A12).

/** Preferred first; the first one the browser can record is used (Safari only does mp4). */
export const AUDIO_TYPES = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4",
] as const;

export const MAX_RECORD_MS = 20_000;
/** Shorter than this is a tap, not a hold: nothing is sent. */
export const MIN_RECORD_MS = 600;
/** ~32 kbps keeps 20 s of speech near 80 KB, well under the server's 400 KB limit. */
export const AUDIO_BITS_PER_SECOND = 32_000;

export function pickAudioType(
  isSupported: (type: string) => boolean = (type) =>
    typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type),
): string | undefined {
  return AUDIO_TYPES.find((type) => isSupported(type));
}

/** File name for the upload, from the type ("audio/webm;codecs=opus" → "voice.webm"). */
export function fileNameFor(type: string): string {
  const sub = type.split(";")[0].split("/")[1] ?? "webm";
  return `voice.${sub === "mp4" ? "m4a" : sub}`;
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
