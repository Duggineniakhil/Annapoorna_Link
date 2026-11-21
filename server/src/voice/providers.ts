import { spawn } from "node:child_process";
import { SYSTEM_PROMPT } from "./draft.js";

export type SpeechLang = "en-IN" | "te-IN";

export interface Transcriber {
  transcribe(audio: Buffer, filename: string, mime: string, lang: SpeechLang): Promise<string>;
}
export interface Extractor {
  /** Returns the model's raw text reply. */
  extract(transcript: string, nowIst: string): Promise<string>;
}

/** An upstream or conversion problem: the caller shows "busy" and nothing is logged beyond the code. */
export class VoiceUpstreamError extends Error {}
/** The uploaded audio can't be used as sent. */
export class VoiceAudioError extends Error {}

const STT_URL = "https://api.vachana.ai/stt/v3";
const AI_URL = "https://api.anthropic.com/v1/messages";
const STT_TIMEOUT_MS = 8_000; // Gnani gives up after 5 s itself
const AI_TIMEOUT_MS = 10_000;

// Gnani REST transcription (docs.gnani.ai/api/STT/speech-to-text): clips up to 30 s,
// WAV, MP3, OGG, FLAC, AAC or M4A. The key goes in a header and is never logged.
export class GnaniTranscriber implements Transcriber {
  constructor(private readonly apiKey: string, private readonly fetchFn: typeof fetch = fetch) {}

  async transcribe(audio: Buffer, filename: string, mime: string, lang: SpeechLang): Promise<string> {
    const form = new FormData();
    form.set("audio_file", new Blob([new Uint8Array(audio)], { type: mime }), filename);
    form.set("model", "prisma-v3.0");
    form.set("language_code", lang);
    form.set("format", "transcribe");
    let res: Response;
    try {
      res = await this.fetchFn(STT_URL, {
        method: "POST", headers: { "X-API-Key-ID": this.apiKey }, body: form, signal: AbortSignal.timeout(STT_TIMEOUT_MS),
      });
    } catch {
      throw new VoiceUpstreamError("stt unreachable");
    }
    if (res.status === 400) {
      const body = (await res.json().catch(() => ({}))) as { error?: { type?: string } };
      if (body.error?.type === "EMPTY_AUDIO") return "";
      throw new VoiceAudioError(body.error?.type ?? "bad audio");
    }
    if (!res.ok) throw new VoiceUpstreamError(`stt status ${res.status}`);
    const json = (await res.json().catch(() => null)) as { transcript?: unknown } | null;
    return typeof json?.transcript === "string" ? json.transcript.trim() : "";
  }
}

// Messages API. The model and key come from env; the endpoint is fixed so the key can't be redirected.
export class AnthropicExtractor implements Extractor {
  constructor(private readonly apiKey: string, private readonly model: string, private readonly fetchFn: typeof fetch = fetch) {}

  async extract(transcript: string, nowIst: string): Promise<string> {
    let res: Response;
    try {
      res = await this.fetchFn(AI_URL, {
        method: "POST",
        headers: { "x-api-key": this.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Current time in India: ${nowIst}\nTranscript:\n"""${transcript}"""` }],
        }),
        signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      });
    } catch {
      throw new VoiceUpstreamError("model unreachable");
    }
    if (!res.ok) throw new VoiceUpstreamError(`model status ${res.status}`);
    const json = (await res.json().catch(() => null)) as { content?: { type: string; text?: string }[] } | null;
    const text = json?.content?.find((c) => c.type === "text")?.text;
    if (typeof text !== "string") throw new VoiceUpstreamError("model empty reply");
    return text;
  }
}

// Formats Gnani accepts as-is. Browsers often record WebM, which it does not, so that is
// converted to WAV with ffmpeg when the server has it. ponytail: the client can also record WAV/M4A.
const DIRECT: Record<string, string> = {
  "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav", "audio/mpeg": "mp3", "audio/mp3": "mp3",
  "audio/ogg": "ogg", "audio/flac": "flac", "audio/aac": "aac", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/m4a": "m4a",
};

export interface PreparedAudio { audio: Buffer; filename: string; mime: string }

export async function prepareAudio(audio: Buffer, mimetype: string): Promise<PreparedAudio> {
  const mime = mimetype.split(";")[0].trim().toLowerCase();
  const ext = DIRECT[mime];
  if (ext) return { audio, filename: `clip.${ext}`, mime };
  if (mime === "audio/webm" || mime === "video/webm") {
    return { audio: await webmToWav(audio), filename: "clip.wav", mime: "audio/wav" };
  }
  throw new VoiceAudioError("unsupported type");
}

function webmToWav(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-v", "error", "-i", "pipe:0", "-ac", "1", "-ar", "16000", "-f", "wav", "pipe:1"], { stdio: ["pipe", "pipe", "ignore"] });
    const out: Buffer[] = [];
    const timer = setTimeout(() => ff.kill("SIGKILL"), 10_000);
    ff.stdout.on("data", (c: Buffer) => out.push(c));
    ff.on("error", () => {
      clearTimeout(timer);
      reject(new VoiceAudioError("ffmpeg not available"));
    });
    ff.on("close", (code) => {
      clearTimeout(timer);
      const wav = Buffer.concat(out);
      if (code === 0 && wav.length > 44) resolve(wav);
      else reject(new VoiceAudioError("could not convert audio"));
    });
    ff.stdin.on("error", () => undefined); // ffmpeg may exit before reading everything
    ff.stdin.end(input);
  });
}
