"use client";

import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";

const THEMES = [
  { sheetA: "#fca5a5", sheetABorder: "#dc2626", sheetB: "#93c5fd", sheetBBorder: "#0369a1", sheetC: "#b9f8cf", sheetCBorder: "#008236", accent: "#56B6C6", title: "#0077B6" },
  { sheetA: "#FDE68A", sheetABorder: "#D97706", sheetB: "#A7F3D0", sheetBBorder: "#059669", sheetC: "#BAE6FD", sheetCBorder: "#0284C7", accent: "#059669", title: "#064E3B" },
  { sheetA: "#C4B5FD", sheetABorder: "#7C3AED", sheetB: "#FBCFE8", sheetBBorder: "#DB2777", sheetC: "#CAF0F8", sheetCBorder: "#0077B6", accent: "#7C3AED", title: "#3B0764" },
  { sheetA: "#FCA5A5", sheetABorder: "#DC2626", sheetB: "#FDE68A", sheetBBorder: "#D97706", sheetC: "#D1FAE5", sheetCBorder: "#059669", accent: "#DC2626", title: "#7F1D1D" },
  { sheetA: "#FEF9C3", sheetABorder: "#D97706", sheetB: "#CAF0F8", sheetBBorder: "#0077B6", sheetC: "#EDE9FE", sheetCBorder: "#7C3AED", accent: "#D97706", title: "#78350F" },
  { sheetA: "#E0F2FE", sheetABorder: "#0284C7", sheetB: "#D1FAE5", sheetBBorder: "#059669", sheetC: "#FEE2E2", sheetCBorder: "#DC2626", accent: "#0284C7", title: "#0C4A6E" },
];

export type MacFolderVisualProps = {
  title: string;
  badge: string;
  secondaryBadge?: string;
  status?: "published" | "draft";
  themeIndex?: number;
  showTitleOnFolder?: boolean;
  folderSubtitle?: string;
  imageUrl?: string;           // custom image uploaded by guru
  progressValue?: number;      // 0–100 for the progress bar (optional)
  progressLabel?: string;      // label teks di sebelah badge (opsional, default "Complete")
  children?: ReactNode;
  className?: string;
};

// ─── Card Component ───────────────────────────────────────────────────────────
export function MacFolderVisual({
  title,
  badge,
  status,
  themeIndex = 0,
  folderSubtitle,
  progressValue,
  progressLabel = "Complete",
  children,
  className = "",
}: MacFolderVisualProps) {
  const th = THEMES[themeIndex % THEMES.length];

  // Tentukan warna progress bar & teks progress
  const hasProgress = progressValue !== undefined && progressValue !== null;
  const pv = hasProgress ? progressValue! : 0;
  const progressColor =
    pv === 100 ? "#10B981" : pv >= 50 ? "#F59E0B" : "#EF4444";
  const progressTextClass =
    pv === 100
      ? "text-[#10B981]"
      : pv >= 50
      ? "text-[#F59E0B]"
      : "text-[#EF4444]";

  return (
    <div className={`group flex flex-col items-center cursor-pointer ${className}`}>
      {/* Folder Stack Visual Container */}
      <div className="relative w-56 h-48 flex items-end justify-center transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-105">

        {/* Sheet 1 – Left tilt */}
        <div
          className="absolute top-2 left-3 w-40 h-32 rounded-2xl border shadow-sm -rotate-12 transition-transform duration-300 group-hover:-rotate-[16deg] group-hover:-translate-x-1 overflow-hidden p-2.5 flex flex-col justify-between"
          style={{ backgroundColor: th.sheetA, borderColor: `${th.sheetABorder}33` }}
        >
          <div className="w-1/3 h-1.5 bg-white/40 rounded-full" />
          <div className="space-y-1.5">
            <div className="w-full h-1 bg-white/20 rounded-full" />
            <div className="w-4/5 h-1 bg-white/20 rounded-full" />
            <div className="w-full h-1 bg-white/20 rounded-full" />
          </div>
          <div className="w-full h-8 bg-white/10 rounded-lg" />
        </div>

        {/* Sheet 2 – Right tilt */}
        <div
          className="absolute top-2 right-3 w-40 h-32 rounded-2xl border shadow-sm rotate-12 transition-transform duration-300 group-hover:rotate-[16deg] group-hover:translate-x-1 overflow-hidden p-2.5 flex flex-col justify-between"
          style={{ backgroundColor: th.sheetB, borderColor: `${th.sheetBBorder}33` }}
        >
          <div className="w-1/3 h-1.5 bg-white/40 rounded-full ml-auto" />
          <div className="space-y-1.5">
            <div className="w-full h-1 bg-white/20 rounded-full" />
            <div className="w-3/4 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="w-full h-8 bg-white/10 rounded-lg" />
        </div>

        {/* Sheet 3 – Center straight */}
        <div
          className="absolute top-0 w-40 h-36 rounded-2xl border shadow-sm transition-transform duration-300 group-hover:-translate-y-1 overflow-hidden p-3 flex flex-col gap-2"
          style={{ backgroundColor: th.sheetC, borderColor: `${th.sheetCBorder}33` }}
        >
          <div className="w-1/2 h-2 bg-white/40 rounded-full" />
          <div className="space-y-2 mt-1">
            <div className="w-full h-1.5 bg-white/20 rounded-full" />
            <div className="w-full h-1.5 bg-white/20 rounded-full" />
            <div className="w-4/5 h-1.5 bg-white/20 rounded-full" />
          </div>
          <div className="w-full flex-1 bg-white/10 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white/60" />
          </div>
        </div>

        {/* Main Frosted Folder Body */}
        <div className="relative w-52 h-36 z-10">
          {/* Folder Back Tab (Top Left) */}
          <div className="absolute -top-3 left-0 w-20 h-6 bg-white/80 backdrop-blur-md rounded-t-xl border-t border-l border-white/90 shadow-sm" />

          {/* Folder Front Cover */}
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl border border-white shadow-[0_12px_30px_-8px_rgba(0,0,0,0.12)] p-3.5 flex flex-col justify-between overflow-hidden">
            {/* Glass reflection highlight */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white/60 to-transparent" />

            {/* Accessory Stamps / Stickers */}
            <div className="flex items-start justify-between relative z-10">
              {/* Stamp Accent */}
              <div className="w-8 h-8 rounded-lg bg-white shadow-xs border border-gray-100 p-1 flex items-center justify-center rotate-[-4deg]">
                <div className="w-3.5 h-3.5 bg-red-500 rounded-full shadow-2xs" />
              </div>

              {/* Decorative Sticker */}
              <div
                className="px-2 py-1 bg-[#F1F5F9]/80 backdrop-blur-xs rounded-md border border-white text-[10px] font-bold rotate-[6deg]"
                style={{ color: th.accent }}
              >
                Materi
              </div>
            </div>

            {/* Dummy Debossed Lines */}
            <div className="relative z-10 flex flex-col gap-1 items-center mb-0.5">
              <div className="w-16 h-0.5 bg-white/40 rounded-full" />
              <div className="w-10 h-0.5 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-lg font-extrabold text-center mt-4 px-2 line-clamp-1 group-hover:text-[#56B6C6] transition-colors"
        style={{ color: th.title }}
      >
        {title}
      </h3>

      {/* Subtitle / Pill Badge + Progress */}
      <div className="mt-1.5 flex flex-col items-center gap-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100/80 border border-gray-200/50">
          <span className="text-xs font-bold text-gray-600 whitespace-nowrap">{badge}</span>
          {folderSubtitle && (
            <>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-bold text-gray-500 line-clamp-1">{folderSubtitle}</span>
            </>
          )}
          {hasProgress && (
            <>
              <span className="text-xs text-gray-400">•</span>
              <span className={`text-xs font-extrabold ${progressTextClass}`}>
                {pv}% {progressLabel}
              </span>
            </>
          )}
        </div>

        {/* Tiny animated progress bar (hanya tampil jika progressValue diberikan) */}
        {hasProgress && (
          <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden mt-1">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pv}%`, background: progressColor }}
            />
          </div>
        )}

        {/* Children slot (tombol Publish / Unpublish / aksi lainnya) */}
        {children}
      </div>
    </div>
  );
}
