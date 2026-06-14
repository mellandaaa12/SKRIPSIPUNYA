/** Warna segmen progress berdasarkan aturan percobaan quiz/latihan */

export type StepProgressVariant = "empty" | "green" | "orange" | "red";

export interface StepAttemptMeta {
  variant: StepProgressVariant;
  attempts: number;
  statusLabel: string;
  needsAttention: boolean;
  completedAt?: string;
}

export function formatIndonesianDate(isoString: string | null | undefined): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    
    const day = d.getDate();
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  } catch (e) {
    return "";
  }
}

/**
 * Satu baris `progress` untuk satu step.
 * - 1 percobaan & selesai (lulus) → hijau
 * - 2 percobaan → oranye
 * - ≥3 percobaan atau needs_help → merah + perhatian
 * - Materi baca selesai tanpa quiz: attempts 0 & completed → hijau
 */
export function segmentMetaFromProgressRow(
  row: { completed?: boolean; answers?: any; score?: number; created_at?: string; updated_at?: string } | null | undefined,
  stepTitle: string,
  stepId?: string
): StepAttemptMeta & { stepTitle: string } {
  const title = stepTitle || "Step";
  if (!row) {
    return {
      variant: "empty",
      attempts: 0,
      statusLabel: "Belum dimulai",
      needsAttention: false,
      stepTitle: title,
    };
  }
  const attempts = Number(row.answers?.attempts ?? 0);
  const needsHelp = row.answers?.needs_help === true;
  const quizDone = row.answers?.quiz_done === true;
  const completed = row.completed === true;
  const lowScore = typeof row.score === 'number' && row.score < 60;

  const completedAt = (stepId === "step_1779276674419_zvtaa5ys1" || stepId === "step_1780125298485_al27x8awp" || stepId === "step_1780125325850_yzei7ggss" || stepId === "step_1780125351851_y4aa16fu3")
    ? formatIndonesianDate(row.updated_at || row.created_at)
    : undefined;

  const isPostTest = title.toUpperCase().includes("POST TEST");
  if (isPostTest) {
    return {
      variant: "green",
      attempts,
      statusLabel: "Selesai",
      needsAttention: false,
      stepTitle: title,
      completedAt,
    };
  }

  if (attempts >= 3 || needsHelp || lowScore) {
    return {
      variant: "red",
      attempts,
      statusLabel: lowScore ? "Nilai rendah" : "Butuh perhatian",
      needsAttention: true,
      stepTitle: title,
      completedAt,
    };
  }
  if (attempts === 2) {
    return {
      variant: "orange",
      attempts,
      statusLabel: completed ? "Selesai (2 percobaan)" : "Percobaan ke-2",
      needsAttention: false,
      stepTitle: title,
      completedAt,
    };
  }
  if (attempts === 1) {
    if (completed) {
      return {
        variant: "green",
        attempts: 1,
        statusLabel: "Langsung berhasil",
        needsAttention: false,
        stepTitle: title,
        completedAt,
      };
    }
    return {
      variant: "orange",
      attempts: 1,
      statusLabel: "Belum lulus (1 percobaan)",
      needsAttention: false,
      stepTitle: title,
      completedAt,
    };
  }

  if (completed && !quizDone) {
    return {
      variant: "green",
      attempts: 0,
      statusLabel: "Materi selesai",
      needsAttention: false,
      stepTitle: title,
      completedAt,
    };
  }
  if (completed && quizDone) {
    return {
      variant: "green",
      attempts: 0,
      statusLabel: "Selesai",
      needsAttention: false,
      stepTitle: title,
      completedAt,
    };
  }

  return {
    variant: "empty",
    attempts: 0,
    statusLabel: "Belum selesai",
    needsAttention: false,
    stepTitle: title,
    completedAt,
  };
}

export function variantToBarClass(v: StepProgressVariant): string {
  switch (v) {
    case "green":
      return "bg-emerald-500";
    case "orange":
      return "bg-orange-400";
    case "red":
      return "bg-red-500 ring-2 ring-red-300 ring-inset";
    default:
      return "bg-slate-200";
  }
}

/** Gabungkan metadata step + baris progress untuk UI batang */
export function buildSegmentsForPembelajaran(
  steps: Array<{ id: string; judul?: string; title?: string }>,
  progressRows: Array<{ step_id: string; completed?: boolean; answers?: any }>,
  pembelajaranLabel?: string
): Array<StepAttemptMeta & { stepTitle: string; stepId: string }> {
  const byStep = new Map(progressRows.map((r) => [r.step_id, r]));
  return steps.map((s) => {
    const row = byStep.get(s.id);
    const label = [pembelajaranLabel, s.judul || s.title || `Step`].filter(Boolean).join(" · ");
    const meta = segmentMetaFromProgressRow(row, label, s.id);
    return { ...meta, stepId: s.id };
  });
}

/** Semua step di semua pembelajaran kelas untuk satu siswa */
export function buildSegmentsForStudentClass(
  studentId: string,
  pembelajaranList: Array<{ id: string; judul?: string; title?: string; steps?: any[] }>,
  allProgressRows: Array<{ user_id: string; pembelajaran_id: string; step_id: string; completed?: boolean; answers?: any }>
): Array<StepAttemptMeta & { stepTitle: string; stepId: string }> {
  const rows = allProgressRows.filter((r) => r.user_id === studentId);
  const segments: Array<StepAttemptMeta & { stepTitle: string; stepId: string }> = [];
  for (const m of pembelajaranList) {
    const steps = m.steps || [];
    const forModul = rows.filter((r) => r.pembelajaran_id === m.id);
    for (const s of steps) {
      const row = forModul.find((r) => r.step_id === s.id);
      const label = `${m.judul || m.title || "Modul"} · ${s.judul || s.title || "Step"}`;
      const meta = segmentMetaFromProgressRow(row, label, s.id);
      segments.push({ ...meta, stepId: s.id });
    }
  }
  return segments;
}
