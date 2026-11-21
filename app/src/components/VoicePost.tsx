import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { VoiceDraft } from "../types/api";
import { useT } from "../i18n";
import { ApiError, postVoice } from "../services/api";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import {
  AUDIO_BITS_PER_SECOND,
  MAX_RECORD_MS,
  MIN_RECORD_MS,
  canRecord,
  fileNameFor,
  micPermission,
  pickAudioType,
} from "../lib/recorder";

// Voice option for Quick Post (A12). Press and hold the 🎤 button to record (up to 20 s, with a
// countdown ring), release to send. The transcript is shown and the form is prefilled; the donor
// still reviews everything and taps Post. Nothing is ever posted from here.

const EXPLAINED_KEY = "annapoorna.micExplained";

type Phase = "checking" | "off" | "denied" | "explain" | "idle" | "recording" | "sending";
type Problem = { message: string; resend: boolean };

function readExplained(): boolean {
  try {
    return localStorage.getItem(EXPLAINED_KEY) === "1";
  } catch {
    return false;
  }
}

const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;

export function VoicePost({ onDraft }: { onDraft: (draft: VoiceDraft) => void }) {
  const { t } = useT();
  const [phase, setPhase] = useState<Phase>("checking");
  const [elapsed, setElapsed] = useState(0);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [notice, setNotice] = useState<"tooShort" | "ready" | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  const explained = useRef(readExplained());
  const pressing = useRef(false);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const tick = useRef<number | null>(null);
  const autoStop = useRef<number | null>(null);
  const lastBlob = useRef<Blob | null>(null);
  const audioType = useRef<string>("audio/webm;codecs=opus");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!canRecord()) {
      setPhase("off");
      return;
    }
    void micPermission().then((state) => {
      if (!mounted.current) return;
      if (state === "granted") explained.current = true;
      setPhase(state === "denied" ? "denied" : "idle");
    });
    return () => {
      mounted.current = false;
      clearTimers();
      if (recorder.current?.state === "recording") recorder.current.stop();
      releaseMic();
    };
  }, []);

  function clearTimers() {
    if (tick.current !== null) window.clearInterval(tick.current);
    if (autoStop.current !== null) window.clearTimeout(autoStop.current);
    tick.current = null;
    autoStop.current = null;
  }

  function releaseMic() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }

  function isDenied(err: unknown): boolean {
    return err instanceof DOMException && ["NotAllowedError", "SecurityError"].includes(err.name);
  }

  /** "Allow microphone" on the explanation: ask the browser once, outside a press-and-hold. */
  async function allowMic() {
    try {
      localStorage.setItem(EXPLAINED_KEY, "1");
    } catch {
      // Storage unavailable: the explanation shows again next time.
    }
    explained.current = true;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((track) => track.stop());
      setPhase("idle");
      setNotice("ready");
    } catch (err) {
      setPhase(isDenied(err) ? "denied" : "idle");
    }
  }

  async function startRecording() {
    if (phase !== "idle") return;
    setProblem(null);
    setNotice(null);
    if (!explained.current) {
      setPhase("explain");
      return;
    }
    pressing.current = true;
    let s: MediaStream;
    try {
      s = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      pressing.current = false;
      if (isDenied(err)) setPhase("denied");
      else setProblem({ message: t("voice.error"), resend: false });
      return;
    }
    if (!pressing.current || !mounted.current) {
      // Released before the mic was ready: a tap, not a hold.
      s.getTracks().forEach((track) => track.stop());
      setNotice("tooShort");
      return;
    }
    stream.current = s;
    const type = pickAudioType() ?? "audio/webm;codecs=opus";
    audioType.current = type;
    const rec = new MediaRecorder(s, { mimeType: type, audioBitsPerSecond: AUDIO_BITS_PER_SECOND });
    chunks.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };
    rec.onstop = () => finishRecording();
    recorder.current = rec;
    rec.start(250);
    startedAt.current = Date.now();
    setElapsed(0);
    setPhase("recording");
    tick.current = window.setInterval(() => setElapsed(Date.now() - startedAt.current), 100);
    autoStop.current = window.setTimeout(stopRecording, MAX_RECORD_MS);
  }

  function stopRecording() {
    pressing.current = false;
    clearTimers();
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  function finishRecording() {
    releaseMic();
    if (!mounted.current) return;
    const duration = Date.now() - startedAt.current;
    // The recorder's own type may add details; the upload keeps the type we asked for.
    const blob = new Blob(chunks.current, { type: audioType.current });
    if (duration < MIN_RECORD_MS) {
      setPhase("idle");
      setNotice("tooShort");
      return;
    }
    void send(blob);
  }

  async function send(blob: Blob) {
    lastBlob.current = blob;
    setPhase("sending");
    setProblem(null);
    try {
      const result = await postVoice(blob, fileNameFor(audioType.current));
      if (!mounted.current) return;
      setTranscript(result.transcript);
      onDraft(result.draft);
    } catch (err) {
      if (!mounted.current) return;
      const api = err instanceof ApiError ? err : null;
      setProblem({
        message: api?.message ?? t("voice.error"),
        // Busy or offline: send the same recording again. Nothing heard: record again.
        resend: Boolean(api?.retryable) && api?.error_code !== "STT_EMPTY",
      });
    }
    if (mounted.current) setPhase("idle");
  }

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    try {
      // Keep the recording going if the finger slides off the button.
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // The pointer is already gone (a very quick tap); release handling still works.
    }
    void startRecording();
  };
  const onPointerUp = () => {
    if (pressing.current) stopRecording();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) {
      e.preventDefault();
      void startRecording();
    }
  };
  const onKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onPointerUp();
    }
  };

  if (phase === "checking" || phase === "off") return null;
  if (phase === "denied") {
    // Mic blocked: no button, the form works as usual.
    return <p className="rounded-2xl bg-cream p-3 text-sm text-ink/70">{t("voice.denied")}</p>;
  }

  const secondsLeft = Math.max(0, Math.ceil((MAX_RECORD_MS - elapsed) / 1000));
  const progress = Math.min(1, elapsed / MAX_RECORD_MS);
  const recording = phase === "recording";

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={RING_R}
              className="fill-none stroke-leaf-50"
              strokeWidth="6"
            />
            {recording && (
              <circle
                cx="50"
                cy="50"
                r={RING_R}
                className="fill-none stroke-chilli-600"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * progress}
              />
            )}
          </svg>
          <button
            type="button"
            aria-label={t("voice.button")}
            aria-describedby="voice-hint"
            aria-pressed={recording}
            disabled={phase === "sending" || phase === "explain"}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onContextMenu={(e) => e.preventDefault()}
            className={`absolute inset-2 flex touch-none select-none items-center justify-center rounded-full text-4xl shadow-card transition-transform disabled:opacity-50 ${
              recording ? "scale-95 bg-chilli-600" : "bg-turmeric-400 active:scale-95"
            }`}
          >
            <span aria-hidden="true">🎤</span>
          </button>
        </div>
        <div className="flex flex-col gap-1" role="status" aria-live="polite">
          <p className="font-bold text-ink">
            {recording
              ? t("voice.recording")
              : phase === "sending"
                ? t("voice.sending")
                : t("voice.button")}
          </p>
          <p id="voice-hint" className="text-sm text-ink/70">
            {recording ? t("voice.secondsLeft", { s: secondsLeft }) : t("voice.hint")}
          </p>
          {notice === "tooShort" && (
            <p className="text-sm text-chilli-700">{t("voice.tooShort")}</p>
          )}
          {notice === "ready" && <p className="text-sm text-leaf-800">{t("voice.ready")}</p>}
        </div>
      </div>

      {phase === "explain" && (
        <div className="flex flex-col gap-3 rounded-xl bg-cream p-3">
          <p className="font-bold text-ink">{t("voice.explain.title")}</p>
          <p className="text-sm text-ink/80">{t("voice.explain.body")}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setPhase("idle")}>
              {t("voice.explain.later")}
            </Button>
            <Button onClick={() => void allowMic()}>{t("voice.explain.allow")}</Button>
          </div>
        </div>
      )}

      {problem && (
        <div role="alert" className="flex flex-col gap-2 rounded-xl bg-chilli-50 p-3">
          <p className="font-medium text-chilli-700">{problem.message}</p>
          {problem.resend && lastBlob.current && (
            <Button
              variant="secondary"
              onClick={() => lastBlob.current && void send(lastBlob.current)}
              className="self-start"
            >
              {t("voice.retry")}
            </Button>
          )}
        </div>
      )}

      {transcript && !problem && (
        <div className="flex flex-col gap-1 rounded-xl bg-leaf-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-leaf-800">
            {t("voice.heard")}
          </p>
          <p className="text-ink">“{transcript}”</p>
          <p className="text-sm font-medium text-leaf-900">{t("voice.filled")}</p>
        </div>
      )}
    </Card>
  );
}
