"use client";

import { variantToBarClass, type StepAttemptMeta } from "../utils/learningProgress";

export type StepSegment = StepAttemptMeta & { stepTitle: string; stepId?: string };

interface Props {
  segments: StepSegment[];
  className?: string;
}

/**
 * Batang horizontal: satu segmen per step, tooltip ringkas.
 */
export function LearningStepProgressBar({ segments, className = "" }: Props) {
  if (!segments.length) {
    return (
      <div className={`h-2 rounded-full bg-slate-100 ${className}`} title="Belum ada step" />
    );
  }

  const n = segments.length;
  const gap = 3;
  const pct = (100 - (n - 1) * gap) / n;

  return (
    <div
      className={`flex h-2.5 w-full min-w-[120px] items-stretch gap-[3px] rounded-full overflow-visible bg-slate-100 p-px ${className}`}
      role="img"
      aria-label="Progress per step pembelajaran"
    >
      {segments.map((seg, i) => (
        <span
          key={seg.stepId || i}
          className={`group relative h-full min-w-[4px] rounded-sm transition-colors ${variantToBarClass(seg.variant)} ${
            seg.needsAttention ? "animate-pulse" : ""
          }`}
          style={{ width: `${pct}%`, flex: `1 1 ${pct}%` }}
        >
          <span
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] leading-snug text-slate-700 shadow-lg group-hover:block"
          >
            <span className="block font-semibold text-slate-900">{seg.stepTitle}</span>
            {!seg.stepTitle.toUpperCase().includes("POST TEST") && (
              <span className="mt-1 block text-slate-600">Percobaan: {seg.attempts}</span>
            )}
            <span className="block text-slate-600">Status: {seg.statusLabel}</span>
            {seg.completedAt && (
              <span className="block text-slate-500 font-semibold mt-1">🕒 {seg.completedAt}</span>
            )}
            {seg.needsAttention ? (
              <span className="mt-1 block font-medium text-red-600">Butuh perhatian guru</span>
            ) : null}
          </span>
        </span>
      ))}
    </div>
  );
}
