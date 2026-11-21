import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createLogger } from "../src/logger.js";
import { signToken } from "../src/middleware/auth.js";
import { AppError } from "../src/errors.js";
import { VoicePostResponseSchema } from "../src/schemas.js";
import { extractJson, fixCookedAt, parseDraft } from "../src/voice/draft.js";
import { AnthropicExtractor, GnaniTranscriber, prepareAudio, VoiceAudioError, VoiceUpstreamError, type Extractor, type Transcriber } from "../src/voice/providers.js";
import { VoiceService } from "../src/voice/service.js";

const SECRET = "test-secret-with-more-than-16-chars";
const base = { ALLOWED_ORIGIN: "http://localhost:5173", JWT_SECRET: SECRET, NODE_ENV: "test" };
const NOW = new Date("2026-11-20T22:00:00+05:30"); // 10 PM in Hyderabad
const bearer = (role: "donor" | "volunteer") =>
  `Bearer ${signToken(role === "donor" ? { userId: "demo-donor-sri-sai", role, orgId: "org-caterer-1" } : { userId: "demo-volunteer-ravi", role, orgId: null }, SECRET)}`;

const GOOD = JSON.stringify({
  items: [
    { name: "Veg biryani", category: "rice_dish", qty_meals: 150 },
    { name: "Dal", category: "curry", qty_kg: 20 },
  ],
  veg: true, allergens: [], storage: "hot", cooked_at: "2026-11-20T09:30:00+05:30",
});

class FakeStt implements Transcriber {
  calls: { lang: string; mime: string; filename: string }[] = [];
  constructor(private readonly text = "150 plates veg biryani and dal, cooked at 9:30, kept hot") {}
  async transcribe(_a: Buffer, filename: string, mime: string, lang: string): Promise<string> {
    this.calls.push({ lang, mime, filename });
    return this.text;
  }
}
class FakeModel implements Extractor {
  calls = 0;
  constructor(private readonly replies: (string | Error)[]) {}
  async extract(): Promise<string> {
    const r = this.replies[Math.min(this.calls++, this.replies.length - 1)];
    if (r instanceof Error) throw r;
    return r;
  }
}
const limits = { perDonorPerDay: 30, globalPerDay: 500 };
const service = (stt: Transcriber, model: Extractor, l = limits) => new VoiceService(stt, model, l, () => NOW);
const wav = Buffer.from("RIFF....WAVE");

describe("draft rules", () => {
  it("builds the spoken example: kg becomes meals, 9:30 said at night is 9:30 PM", () => {
    const d = parseDraft(extractJson(`Sure!\n\`\`\`json\n${GOOD}\n\`\`\``), NOW);
    expect(d.items[0]).toMatchObject({ name: "Veg biryani", qty_meals: 150 });
    expect(d.items[1]).toMatchObject({ qty_kg: 20, qty_meals: 50 }); // 20 kg / 0.4
    expect(d.cooked_at).toBe(new Date("2026-11-20T21:30:00+05:30").toISOString());
    expect(d).toMatchObject({ veg: true, storage: "hot", allergens: [] });
  });

  it("moves a future cooked_at back and rejects stale or malformed ones", () => {
    expect(fixCookedAt("2026-11-20T23:30:00+05:30", NOW)).toBe(new Date("2026-11-20T11:30:00+05:30").toISOString());
    expect(() => fixCookedAt("2026-11-10T09:30:00+05:30", NOW)).toThrow();
    expect(() => fixCookedAt("nonsense", NOW)).toThrow();
  });

  it("rejects unknown categories, missing quantities and bad storage", () => {
    const bad = (patch: object) => () => parseDraft({ ...JSON.parse(GOOD), ...patch }, NOW);
    expect(bad({ storage: "frozen" })).toThrow();
    expect(bad({ items: [{ name: "x", category: "pizza", qty_meals: 2 }] })).toThrow();
    expect(bad({ items: [{ name: "x", category: "curry" }] })).toThrow();
    expect(bad({ items: [] })).toThrow();
  });
});

describe("VoiceService", () => {
  it("returns a draft and the transcript, using the donor's language", async () => {
    const stt = new FakeStt();
    const r = await service(stt, new FakeModel([GOOD])).draft("u1", wav, "audio/wav", "te-IN");
    expect(r.transcript).toContain("150 plates");
    expect(r.draft.items).toHaveLength(2);
    expect(stt.calls[0]).toMatchObject({ lang: "te-IN", mime: "audio/wav" });
  });

  it("retries once on invalid JSON, then succeeds", async () => {
    const model = new FakeModel(["not json at all", GOOD]);
    expect((await service(new FakeStt(), model).draft("u1", wav, "audio/wav", "en-IN")).draft.veg).toBe(true);
    expect(model.calls).toBe(2);
  });

  it("gives SERVER_BUSY after two invalid replies and when the model is down", async () => {
    const twice = new FakeModel(["{}", "{}"]);
    await expect(service(new FakeStt(), twice).draft("u1", wav, "audio/wav", "en-IN")).rejects.toMatchObject({ errorCode: "SERVER_BUSY" });
    expect(twice.calls).toBe(2);
    const down = new FakeModel([new VoiceUpstreamError("x")]);
    await expect(service(new FakeStt(), down).draft("u1", wav, "audio/wav", "en-IN")).rejects.toMatchObject({ errorCode: "SERVER_BUSY" });
  });

  it("gives STT_EMPTY for an empty transcript without calling the model", async () => {
    const model = new FakeModel([GOOD]);
    await expect(service(new FakeStt("  "), model).draft("u1", wav, "audio/wav", "en-IN")).rejects.toMatchObject({ errorCode: "STT_EMPTY" });
    expect(model.calls).toBe(0);
  });

  it("enforces the per-donor and global daily caps", async () => {
    const s = service(new FakeStt(), new FakeModel([GOOD]), { perDonorPerDay: 2, globalPerDay: 3 });
    await s.draft("a", wav, "audio/wav", "en-IN");
    await s.draft("a", wav, "audio/wav", "en-IN");
    await expect(s.draft("a", wav, "audio/wav", "en-IN")).rejects.toMatchObject({ errorCode: "RATE_LIMITED" });
    await s.draft("b", wav, "audio/wav", "en-IN"); // third request overall
    await expect(s.draft("c", wav, "audio/wav", "en-IN")).rejects.toBeInstanceOf(AppError); // global cap
  });

  it("resets the caps on a new India day", async () => {
    let now = NOW;
    const nextDay = GOOD.replace("2026-11-20T09:30", "2026-11-21T21:30"); // a plausible cooked_at on day two
    const s = new VoiceService(new FakeStt(), new FakeModel([GOOD, nextDay]), { perDonorPerDay: 1, globalPerDay: 10 }, () => now);
    await s.draft("a", wav, "audio/wav", "en-IN");
    await expect(s.draft("a", wav, "audio/wav", "en-IN")).rejects.toBeInstanceOf(AppError);
    now = new Date(NOW.getTime() + 24 * 3_600_000);
    await expect(s.draft("a", wav, "audio/wav", "en-IN")).resolves.toBeDefined();
  });

  it("maps unsupported audio to VALIDATION_FAILED", async () => {
    await expect(service(new FakeStt(), new FakeModel([GOOD])).draft("u1", wav, "text/plain", "en-IN")).rejects.toMatchObject({ errorCode: "VALIDATION_FAILED" });
  });
});

describe("providers", () => {
  it("sends the documented Gnani request and reads the transcript", async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const fetchFn = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify({ success: true, transcript: " hello " }), { status: 200 });
    }) as unknown as typeof fetch;
    const text = await new GnaniTranscriber("KEY123", fetchFn).transcribe(wav, "clip.wav", "audio/wav", "te-IN");
    expect(text).toBe("hello");
    expect(seen?.url).toBe("https://api.vachana.ai/stt/v3");
    expect((seen?.init.headers as Record<string, string>)["X-API-Key-ID"]).toBe("KEY123");
    const form = seen?.init.body as FormData;
    expect(form.get("language_code")).toBe("te-IN");
    expect(form.get("model")).toBe("prisma-v3.0");
    expect(form.get("audio_file")).toBeInstanceOf(Blob);
  });

  it("maps Gnani errors: empty audio is an empty transcript, bad audio and outages are distinct", async () => {
    const reply = (status: number, body: object) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
    const t = (f: typeof fetch) => new GnaniTranscriber("k", f).transcribe(wav, "c.wav", "audio/wav", "en-IN");
    await expect(t(reply(400, { success: false, error: { type: "EMPTY_AUDIO" } }))).resolves.toBe("");
    await expect(t(reply(400, { success: false, error: { type: "UNSUPPORTED_AUDIO_FORMAT" } }))).rejects.toBeInstanceOf(VoiceAudioError);
    await expect(t(reply(500, {}))).rejects.toBeInstanceOf(VoiceUpstreamError);
    await expect(t((async () => { throw new Error("net"); }) as unknown as typeof fetch)).rejects.toBeInstanceOf(VoiceUpstreamError);
  });

  it("calls the model with the key in a header and returns its text", async () => {
    let seen: RequestInit | undefined;
    const fetchFn = (async (_u: string, init: RequestInit) => {
      seen = init;
      return new Response(JSON.stringify({ content: [{ type: "text", text: GOOD }] }), { status: 200 });
    }) as unknown as typeof fetch;
    const text = await new AnthropicExtractor("AIKEY", "some-model", fetchFn).extract("150 plates", "2026-11-20T22:00:00+05:30");
    expect(text).toBe(GOOD);
    expect((seen?.headers as Record<string, string>)["x-api-key"]).toBe("AIKEY");
    expect(JSON.parse(String(seen?.body)).model).toBe("some-model");
  });

  it("passes supported audio through and rejects other types", async () => {
    expect((await prepareAudio(wav, "audio/mp4")).filename).toBe("clip.m4a");
    expect((await prepareAudio(wav, "audio/ogg;codecs=opus")).filename).toBe("clip.ogg");
    await expect(prepareAudio(wav, "image/png")).rejects.toBeInstanceOf(VoiceAudioError);
  });
});

describe("POST /api/voice-post", () => {
  let app: ReturnType<typeof createApp>["app"];
  const limitsOff = { generalMax: 10_000, voiceMax: 10_000, windowMs: 60_000 };
  const build = (voice?: VoiceService) =>
    createApp({ config: loadConfig(base), logger: createLogger("test"), voice, now: () => NOW, rateLimits: limitsOff }).app;
  const send = (a: typeof app, auth: string, file = true, extra: Record<string, string> = {}) => {
    const r = request(a).post("/api/voice-post").set("Authorization", auth);
    for (const [k, v] of Object.entries(extra)) r.field(k, v);
    return file ? r.attach("audio", wav, { filename: "clip.wav", contentType: "audio/wav" }) : r.field("x", "y");
  };

  beforeEach(() => {
    app = build(service(new FakeStt(), new FakeModel([GOOD])));
  });

  it("returns a draft that matches the contract", async () => {
    const res = await send(app, bearer("donor"));
    expect(res.status).toBe(200);
    expect(VoicePostResponseSchema.parse(res.body).draft.items).toHaveLength(2);
  });

  it("is donor-only, needs a file, and caps the upload at 400 KB", async () => {
    expect((await send(app, bearer("volunteer"))).status).toBe(403);
    expect((await request(app).post("/api/voice-post")).status).toBe(401);
    expect((await send(app, bearer("donor"), false)).status).toBe(400);
    const big = await request(app).post("/api/voice-post").set("Authorization", bearer("donor"))
      .attach("audio", Buffer.alloc(401 * 1024), { filename: "big.wav", contentType: "audio/wav" });
    expect(big.status).toBe(400);
  });

  it("answers 503 when the speech or model key is not configured", async () => {
    const res = await send(build(undefined), bearer("donor"));
    expect(res.status).toBe(503);
    expect(res.body.error_code).toBe("SERVER_BUSY");
  });

  it("passes the requested language through and reports an empty transcript as 422", async () => {
    const stt = new FakeStt();
    await send(build(service(stt, new FakeModel([GOOD]))), bearer("donor"), true, { lang: "te" });
    expect(stt.calls[0].lang).toBe("te-IN");
    const empty = await send(build(service(new FakeStt(""), new FakeModel([GOOD]))), bearer("donor"));
    expect(empty.status).toBe(422);
    expect(empty.body.error_code).toBe("STT_EMPTY");
  });

  it("never echoes the audio or leaks keys in errors", async () => {
    const res = await send(build(service(new FakeStt(), new FakeModel([new VoiceUpstreamError("secret-ish")]))), bearer("donor"));
    expect(res.status).toBe(503);
    expect(JSON.stringify(res.body)).not.toMatch(/secret|key|RIFF/i);
  });
});
