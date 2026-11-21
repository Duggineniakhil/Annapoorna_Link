// What the voice card does with each POST /api/voice-post error (server doc 12, B12).

export interface VoiceProblemPlan {
  /** Our own message instead of the server's (an i18n key), or null to show the server's. */
  messageKey: "voice.notHeard" | "voice.badAudio" | "voice.limit" | null;
  /** Offer "Try again" with the same recording (busy or offline). */
  resend: boolean;
  /** Add "you can fill the form below". */
  useForm: boolean;
}

export function voiceProblem(code: string | undefined, retryable: boolean): VoiceProblemPlan {
  switch (code) {
    case "STT_EMPTY": // 422: nothing clear in the clip → record again.
      return { messageKey: "voice.notHeard", resend: false, useForm: false };
    case "VALIDATION_FAILED": // 400: unusable audio or format → record again.
      return { messageKey: "voice.badAudio", resend: false, useForm: false };
    case "RATE_LIMITED": // 429: today's voice limit is used up → the form only.
      return { messageKey: "voice.limit", resend: false, useForm: false };
    case "SERVER_BUSY": // 503: speech service down or not set up → retry, or use the form.
    case "NETWORK_ERROR":
      return { messageKey: null, resend: true, useForm: true };
    default:
      return { messageKey: null, resend: retryable, useForm: true };
  }
}
