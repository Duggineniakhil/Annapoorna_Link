import { formatLeft, useNow } from "../lib/time";

interface Props {
  /** When the window opened (cooked_at, offer start). */
  from: string;
  /** When it closes (pickup_by, offer expiry). */
  until: string;
  size?: number;
  caption: string;
  expiredText: string;
}

// The signature element: a ring that drains as the food's window closes,
// green while there is time, marigold when it is getting close, kumkum near the end.
export function TimeRing({ from, until, size = 104, caption, expiredText }: Props) {
  const now = useNow();
  const total = Math.max(1, Date.parse(until) - Date.parse(from));
  const left = Date.parse(until) - now;
  const frac = Math.min(1, Math.max(0, left / total));
  const tone = frac > 0.5 ? "rgb(var(--leaf))" : frac > 0.2 ? "rgb(var(--marigold))" : "rgb(var(--kumkum))";
  const stroke = size >= 96 ? 9 : 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const label = left > 0 ? formatLeft(left) : expiredText;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="timer" aria-label={`${label} ${left > 0 ? caption : ""}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--sunken))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.6s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden="true">
        <span className={`font-display font-bold leading-none ${size >= 96 ? "text-title" : "text-body"}`}>{label}</span>
        {left > 0 && size >= 80 && <span className="mt-1 text-caption text-muted">{caption}</span>}
      </div>
    </div>
  );
}
