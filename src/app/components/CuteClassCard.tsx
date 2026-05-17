"use client";

import { ArrowRight, BookOpen, GraduationCap, Users } from "lucide-react";
import type React from "react";
import { formatClassDisplayName } from "../utils/api";

const CLASS_THEMES = [
  { top: "#CAF0F8", topDeep: "#90E0EF", accent: "#0077B6", text: "#023E8A", soft: "#E8F4FD" },
  { top: "#D1FAE5", topDeep: "#6EE7B7", accent: "#059669", text: "#064E3B", soft: "#ECFDF5" },
  { top: "#FEF9C3", topDeep: "#FDE68A", accent: "#D97706", text: "#78350F", soft: "#FFFBEB" },
  { top: "#FEE2E2", topDeep: "#FCA5A5", accent: "#DC2626", text: "#7F1D1D", soft: "#FEF2F2" },
  { top: "#EDE9FE", topDeep: "#C4B5FD", accent: "#7C3AED", text: "#3B0764", soft: "#F5F3FF" },
  { top: "#E0F2FE", topDeep: "#7DD3FC", accent: "#0284C7", text: "#0C4A6E", soft: "#EFF6FF" },
];

type CuteClassCardProps = {
  kelas: any;
  index?: number;
  onClick?: () => void;
  actionSlot?: React.ReactNode;
  footerLabel?: string;
  className?: string;
};

export function CuteClassCard({
  kelas,
  index = 0,
  onClick,
  actionSlot,
  footerLabel = "Buka Kelas",
  className = "",
}: CuteClassCardProps) {
  const theme = CLASS_THEMES[index % CLASS_THEMES.length];
  const title = kelas.displayName || formatClassDisplayName(kelas);

  return (
    <article
      onClick={onClick}
      className={`group relative h-full cursor-pointer overflow-hidden rounded-[20px] bg-white shadow-[0_18px_44px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_58px_rgba(15,23,42,0.14)] ${className}`}
    >
      <div
        className="relative flex h-40 items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${theme.top} 0%, ${theme.topDeep} 100%)` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_18%,rgba(255,255,255,0.68),transparent_42%)]" />
        <div className="absolute left-4 top-4 z-20 rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[11px] font-bold backdrop-blur" style={{ color: theme.accent }}>
          {kelas.grade || "Kelas"}
        </div>

        <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
          {actionSlot}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/80 text-slate-700 backdrop-blur transition-colors">
            <ArrowRight className="h-4 w-4" style={{ color: theme.accent }} />
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-1 transition-transform duration-300 group-hover:scale-105">
          <span
            className="text-5xl font-black leading-none drop-shadow-sm"
            style={{ color: theme.accent, textShadow: `0 10px 28px ${theme.accent}35` }}
          >
            {kelas.grade || "-"}
          </span>
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: theme.accent }}>
            Kelas
          </span>
        </div>
      </div>

      <div className="relative bg-white px-5 pb-5 pt-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[17px] font-black leading-tight" style={{ color: theme.text }}>
              {title}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs font-semibold" style={{ color: theme.accent }}>
              {kelas.subject || "Mata pelajaran"}
            </p>
          </div>
        </div>

        <p className="line-clamp-1 text-xs text-slate-500">
          <GraduationCap className="mr-1.5 inline h-3.5 w-3.5 align-[-2px] text-slate-400" />
          {kelas.teacherName || kelas.teacher_name || "Belum ada guru utama"}
        </p>

        <div className="my-4 h-px" style={{ background: `${theme.accent}22` }} />

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold" style={{ background: theme.soft, color: theme.accent, borderColor: `${theme.accent}26` }}>
            <Users className="h-3.5 w-3.5" />
            {kelas.studentCount || 0} Siswa
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold" style={{ background: theme.soft, color: theme.accent, borderColor: `${theme.accent}26` }}>
            <BookOpen className="h-3.5 w-3.5" />
            {kelas.materialCount || 0} Materi
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-black" style={{ color: theme.accent }}>
            {footerLabel}
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl transition-colors group-hover:text-white" style={{ background: `${theme.accent}16`, color: theme.accent }}>
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
