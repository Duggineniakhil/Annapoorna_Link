import type { ReactNode } from "react";
import { photo, photoSet } from "../../lib/media";

/**
 * Detail pages (redesign): one column on phones; on wide screens the main content on the left
 * and a sticky side column (map, codes, timeline) on the right.
 */
export function DetailColumns({ main, side }: { main: ReactNode; side: ReactNode }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-8">
      <div className="flex min-w-0 flex-col gap-5">{main}</div>
      <div className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-24">{side}</div>
    </div>
  );
}

/** A wide photo header with a dark fade and text on top; the photo is decoration only. */
export function PhotoBanner({
  photoId,
  eyebrow,
  title,
  children,
  className = "h-44 sm:h-56",
}: {
  photoId: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Shown on the right, e.g. a meals badge. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-night-700 shadow-card ${className}`}>
      <img
        src={photo(photoId, 960, 400)}
        srcSet={photoSet(photoId, 960, 400)}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-night via-night/50 to-night/0" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-1 text-white">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-widest text-mint">{eyebrow}</p>
          )}
          <p className="font-display text-2xl font-black leading-tight sm:text-3xl">{title}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
