import { AppError } from "../errors.js";
import { istNow, extractJson, parseDraft, type VoiceDraft } from "./draft.js";
import { prepareAudio, VoiceAudioError, VoiceUpstreamError, type Extractor, type SpeechLang, type Transcriber } from "./providers.js";

export interface VoiceLimits {
  perDonorPerDay: number;
  globalPerDay: number;
}

export interface VoiceResult {
  draft: VoiceDraft;
  transcript: string;
}

// Speech to draft: transcribe, extract JSON with a model (one retry on invalid output), validate.
// Never posts anything, never stores audio, never logs the transcript.
export class VoiceService {
  private day = "";
  private perUser = new Map<string, number>();
  private total = 0;

  constructor(
    private readonly stt: Transcriber,
    private readonly extractor: Extractor,
    private readonly limits: VoiceLimits,
    private readonly now: () => Date = () => new Date(),
  ) {}

  // Counted per attempt, because every attempt spends speech and model credit. Resets each India day.
  // ponytail: in memory, so a restart resets the counts; move to the database if credit abuse matters.
  private spend(userId: string): void {
    const today = istNow(this.now()).slice(0, 10);
    if (today !== this.day) {
      this.day = today;
      this.perUser = new Map();
      this.total = 0;
    }
    const mine = this.perUser.get(userId) ?? 0;
    if (mine >= this.limits.perDonorPerDay || this.total >= this.limits.globalPerDay) throw new AppError("RATE_LIMITED");
    this.perUser.set(userId, mine + 1);
    this.total += 1;
  }

  async draft(userId: string, audio: Buffer, mimetype: string, lang: SpeechLang): Promise<VoiceResult> {
    this.spend(userId);
    let transcript: string;
    try {
      const prepared = await prepareAudio(audio, mimetype);
      transcript = await this.stt.transcribe(prepared.audio, prepared.filename, prepared.mime, lang);
    } catch (err) {
      if (err instanceof VoiceAudioError) throw new AppError("VALIDATION_FAILED");
      throw new AppError("SERVER_BUSY");
    }
    transcript = transcript.trim();
    if (!transcript) throw new AppError("STT_EMPTY");

    const now = this.now();
    for (let attempt = 0; attempt < 2; attempt++) {
      let reply: string;
      try {
        reply = await this.extractor.extract(transcript, istNow(now));
      } catch (err) {
        if (err instanceof VoiceUpstreamError) throw new AppError("SERVER_BUSY");
        throw err;
      }
      try {
        return { draft: parseDraft(extractJson(reply), now), transcript };
      } catch {
        // invalid JSON or schema: ask once more
      }
    }
    throw new AppError("SERVER_BUSY");
  }
}
