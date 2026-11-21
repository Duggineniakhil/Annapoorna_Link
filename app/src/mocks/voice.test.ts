// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { VoicePostResult } from "../types/api";
import { handleMockRequest } from "./handlers";
import { voiceDraft } from "./voice";
import {
  AUDIO_TYPES,
  MAX_RECORD_MS,
  MAX_WAV_RECORD_MS,
  WAV_SAMPLE_RATE,
  encodeWav,
  fileNameFor,
  maxRecordMsFor,
  needsWav,
  pickAudioType,
} from "../lib/recorder";
import { voiceProblem } from "../lib/voiceErrors";

const tokenFor = (sub: string) => "mock." + btoa(JSON.stringify({ sub })) + ".mock";
const DONOR = tokenFor("user-sri-sai");

function form(bytes: number, lang = "en"): FormData {
  const f = new FormData();
  f.append(
    "audio",
    new Blob([new Uint8Array(bytes)], { type: "audio/webm;codecs=opus" }),
    "voice.webm",
  );
  f.append("lang", lang);
  return f;
}

describe("POST /api/voice-post (mock)", () => {
  it("returns the spec draft: 150 plates veg biryani and dal, kept hot", async () => {
    const res = await handleMockRequest("POST", "/api/voice-post", form(8000), DONOR);
    expect(res.status).toBe(200);
    const { draft, transcript } = res.body as VoicePostResult;
    expect(transcript).toMatch(
      /^150 plates veg biryani and dal, cooked at \d{1,2}:\d{2}, kept hot$/,
    );
    expect(draft.items.reduce((sum, i) => sum + i.qty_meals, 0)).toBe(150);
    expect(draft.items.map((i) => i.name)).toEqual(["Veg biryani", "Dal"]);
    expect(draft).toMatchObject({ veg: true, allergens: [], storage: "hot" });
    expect(Date.parse(draft.cooked_at)).toBeLessThan(Date.now());
  });

  it("answers in Telugu when asked", async () => {
    const res = await handleMockRequest("POST", "/api/voice-post", form(8000, "te"), DONOR);
    expect((res.body as VoicePostResult).transcript).toContain("బిర్యానీ");
  });

  it("a tap with no speech is STT_EMPTY with EN and TE messages", async () => {
    const res = await handleMockRequest("POST", "/api/voice-post", form(100), DONOR);
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ error_code: "STT_EMPTY" });
    expect((res.body as { message_te: string }).message_te.length).toBeGreaterThan(0);
  });

  it("needs audio, and is for donors only", async () => {
    expect((await handleMockRequest("POST", "/api/voice-post", new FormData(), DONOR)).status).toBe(
      400,
    );
    const receiver = tokenFor("user-annadanam");
    expect((await handleMockRequest("POST", "/api/voice-post", form(8000), receiver)).status).toBe(
      403,
    );
  });

  it("the spoken time matches cooked_at", () => {
    const now = new Date(2026, 10, 21, 22, 5).getTime();
    const { transcript, draft } = voiceDraft("en", now);
    expect(transcript).toContain("cooked at 9:30");
    expect(new Date(draft.cooked_at).getHours()).toBe(21);
  });
});

describe("recorder type fallback", () => {
  it("prefers AAC in mp4, then ogg/opus, then plain mp4, and records webm only as a last resort", () => {
    expect(pickAudioType(() => true)).toBe("audio/mp4;codecs=mp4a.40.2");
    expect(pickAudioType((t) => !t.includes("mp4a"))).toBe("audio/ogg;codecs=opus");
    expect(pickAudioType((t) => t === "audio/mp4" || t.startsWith("audio/webm"))).toBe("audio/mp4");
    expect(pickAudioType((t) => t.startsWith("audio/webm"))).toBe("audio/webm;codecs=opus");
    expect(pickAudioType(() => false)).toBeUndefined();
    expect(AUDIO_TYPES[AUDIO_TYPES.length - 1]).toBe("audio/webm;codecs=opus");
  });

  it("converts only webm to wav, with a shorter limit to stay under 400 KB", () => {
    expect(needsWav("audio/webm;codecs=opus")).toBe(true);
    expect(needsWav("audio/mp4")).toBe(false);
    expect(needsWav("audio/ogg;codecs=opus")).toBe(false);
    expect(maxRecordMsFor("audio/mp4")).toBe(MAX_RECORD_MS);
    expect(maxRecordMsFor("audio/webm;codecs=opus")).toBe(MAX_WAV_RECORD_MS);
    // 16-bit 16 kHz mono = 32 000 bytes a second, plus a 44-byte header.
    expect(44 + (MAX_WAV_RECORD_MS / 1000) * WAV_SAMPLE_RATE * 2).toBeLessThan(400 * 1024);
  });

  it("names the upload after its type", () => {
    expect(fileNameFor("audio/ogg;codecs=opus")).toBe("voice.ogg");
    expect(fileNameFor("audio/mp4")).toBe("voice.m4a");
    expect(fileNameFor("audio/mp4;codecs=mp4a.40.2")).toBe("voice.m4a");
    expect(fileNameFor("audio/wav")).toBe("voice.wav");
  });

  it("writes a 16 kHz mono 16-bit wav file", async () => {
    const samples = new Float32Array([0, 1, -1, 0.5, 2]);
    const wav = encodeWav(samples);
    expect(wav.type).toBe("audio/wav");
    expect(wav.size).toBe(44 + samples.length * 2);
    const view = new DataView(await wav.arrayBuffer());
    const tag = (o: number) =>
      String.fromCharCode(...[0, 1, 2, 3].map((i) => view.getUint8(o + i)));
    expect(tag(0)).toBe("RIFF");
    expect(tag(8)).toBe("WAVE");
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getInt16(44 + 2, true)).toBe(0x7fff);
    expect(view.getInt16(44 + 4, true)).toBe(-0x8000);
    expect(view.getInt16(44 + 8, true)).toBe(0x7fff); // clipped
  });
});

describe("voice error handling", () => {
  it("asks to record again when nothing was heard or the audio was unusable", () => {
    expect(voiceProblem("STT_EMPTY", false)).toMatchObject({
      messageKey: "voice.notHeard",
      resend: false,
    });
    expect(voiceProblem("VALIDATION_FAILED", false)).toMatchObject({
      messageKey: "voice.badAudio",
      resend: false,
    });
  });

  it("does not retry after the daily limit", () => {
    expect(voiceProblem("RATE_LIMITED", true)).toMatchObject({
      messageKey: "voice.limit",
      resend: false,
    });
  });

  it("offers a retry and the form when the service is busy or offline", () => {
    expect(voiceProblem("SERVER_BUSY", true)).toEqual({
      messageKey: null,
      resend: true,
      useForm: true,
    });
    expect(voiceProblem("NETWORK_ERROR", true).resend).toBe(true);
  });
});
