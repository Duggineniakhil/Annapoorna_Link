import type { VoicePostResult } from "../types/api";

// POST /api/voice-post mock (A12). There is no speech-to-text in the browser mock: any real
// recording is "heard" as the demo sentence from the spec, "150 plates veg biryani and dal, cooked
// at 9:30, kept hot", with the time set to 30 minutes ago so the food is still postable.
// A recording too short to hold speech comes back as STT_EMPTY, like the real service.

const MINUTE_MS = 60_000;
/** Below this many bytes there is no speech in the clip (a tap, not a hold). */
export const MIN_AUDIO_BYTES = 2_000;
/** Roughly how long speech-to-text takes, so the "working" state shows in the demo. */
export const VOICE_DELAY_MS = 900;

export const STT_EMPTY = {
  error_code: "STT_EMPTY",
  message: "We could not hear anything. Hold the button and speak clearly.",
  message_te: "మాకు ఏమీ వినిపించలేదు. బటన్‌ను నొక్కి పట్టుకుని స్పష్టంగా మాట్లాడండి.",
};

/** The time the donor would say, like "9:30" (12-hour, no AM/PM, as people say it). */
function spokenTime(d: Date): string {
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function voiceDraft(lang: "en" | "te", nowMs = Date.now()): VoicePostResult {
  const cooked = new Date(nowMs - 30 * MINUTE_MS);
  cooked.setMinutes(cooked.getMinutes() - (cooked.getMinutes() % 15), 0, 0);
  const time = spokenTime(cooked);
  return {
    transcript:
      lang === "te"
        ? `150 ప్లేట్ల వెజ్ బిర్యానీ, పప్పు, ${time}కి వండినది, వేడిగా ఉంచాం`
        : `150 plates veg biryani and dal, cooked at ${time}, kept hot`,
    draft: {
      // Same split as the hero listing: 150 plates of biryani with dal.
      items: [
        { name: "Veg biryani", category: "rice_dish", qty_meals: 100 },
        { name: "Dal", category: "curry", qty_meals: 50 },
      ],
      veg: true,
      allergens: [],
      storage: "hot",
      cooked_at: cooked.toISOString(),
    },
  };
}
