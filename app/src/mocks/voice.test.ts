// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { VoicePostResult } from "../types/api";
import { handleMockRequest } from "./handlers";
import { voiceDraft } from "./voice";
import { AUDIO_TYPES, fileNameFor, pickAudioType } from "../lib/recorder";

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
  it("prefers webm/opus, then ogg/opus, then mp4", () => {
    expect(pickAudioType(() => true)).toBe(AUDIO_TYPES[0]);
    expect(pickAudioType((t) => t.startsWith("audio/ogg"))).toBe("audio/ogg;codecs=opus");
    expect(pickAudioType((t) => t === "audio/mp4")).toBe("audio/mp4");
    expect(pickAudioType(() => false)).toBeUndefined();
  });

  it("names the upload after its type", () => {
    expect(fileNameFor("audio/webm;codecs=opus")).toBe("voice.webm");
    expect(fileNameFor("audio/ogg;codecs=opus")).toBe("voice.ogg");
    expect(fileNameFor("audio/mp4")).toBe("voice.m4a");
  });
});
