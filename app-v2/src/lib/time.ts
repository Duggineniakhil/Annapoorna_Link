import { useEffect, useState } from "react";

// One shared ticking clock, so every countdown on screen moves together.
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function clock(iso: string, lang: "en" | "te"): string {
  return new Date(iso).toLocaleTimeString(lang === "te" ? "te-IN" : "en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function minutesLeft(iso: string, now: number): number {
  return Math.max(0, Math.round((Date.parse(iso) - now) / 60_000));
}

export function formatLeft(ms: number): string {
  if (ms <= 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}:${String(s).padStart(2, "0")}`;
}

export const mapsUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(5)},${lng.toFixed(5)}`;
