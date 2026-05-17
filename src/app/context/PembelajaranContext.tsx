import React, { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "../utils/supabase";

interface Quiz {
  id: string;
  pertanyaan: string;
  pilihan: { label: string; text: string }[];
  jawabanBenar: string;
  bantuan: string;
}

interface StepContent {
  bacaMateri?: string;
  initialCode?: string;
  taskInstructions?: string;
  taskExample?: string;
  quiz?: {
    aktif: boolean;
    nilaiMinimal: number;
    soalList: Quiz[];
  };
}

interface Step {
  id: string;
  number: number;
  judul: string;
  deskripsi: string;
  content: StepContent;
  status: string;
}

interface Pembelajaran {
  id: string;
  classId: string;
  judul: string;
  deskripsi: string;
  icon?: string;
  color?: string;
  imageUrl?: string;
  status?: "draft" | "published";
  enableReflection?: boolean;
  reflectionTemplate?: string;
  pertanyaanKendala?: string;
  pertanyaanKesan?: string;
  steps: Step[];
  createdAt: string;
}

interface PembelajaranContextType {
  pembelajaranList: Pembelajaran[];
  loading: boolean;
  addPembelajaran: (pembelajaran: Omit<Pembelajaran, "id" | "createdAt" | "steps">, userId?: string) => Promise<string>;
  getPembelajaranById: (id: string) => Pembelajaran | undefined;
  getPembelajaranByKelasId: (kelasId: string) => Promise<Pembelajaran[]>;
  addStep: (pembelajaranId: string, step: Omit<Step, "id" | "number">) => Promise<void>;
  updateStepContent: (pembelajaranId: string, stepId: string, content: StepContent) => Promise<void>;
  getStepById: (pembelajaranId: string, stepId: string) => Step | undefined;
  refreshData: (classId?: string) => Promise<void>;
}

const PembelajaranContext = createContext<PembelajaranContextType | undefined>(undefined);

// Helper to retry operations that fail due to Supabase auth lock stealing errors
// Uses exponential backoff to avoid thundering-herd lock contention
const executeWithRetry = async <T,>(operation: () => Promise<T>, maxRetries = 3, timeoutMs = 5000): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Add a timeout to the operation to prevent indefinite hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Operation timed out")), timeoutMs);
      });
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error: any) {
      const isLockError = error?.message && (error.message.includes("lock") || error.message.includes("Lock") || error.message.includes("stole") || error.message.includes("timed out") || error.message.includes("fetch"));
      if (isLockError && i < maxRetries - 1) {
        const delay = 300 + Math.random() * 200; // Fixed short delay instead of long exponential backoff
        console.warn(`[Supabase] Lock/Timeout error caught, retrying in ${Math.round(delay)}ms... (${i + 1}/${maxRetries})`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Operation failed after retries");
};

// Map raw DB row to Pembelajaran
const mapRow = (row: any): Pembelajaran => ({
  id: row.id,
  classId: row.class_id,
  judul: row.judul || row.title || "",
  deskripsi: row.deskripsi || row.description || "",
  icon: row.icon,
  color: row.color,
  imageUrl: row.image_url || undefined,
  status: (row.status || "draft") as "draft" | "published",
  enableReflection: row.enable_reflection || false,
  reflectionTemplate: row.reflection_template || "Standar",
  pertanyaanKendala: row.pertanyaan_kendala || "Apa kendala yang kamu alami?",
  pertanyaanKesan: row.pertanyaan_kesan || "Bagaimana pendapatmu tentang pembelajaran hari ini?",
  steps: Array.isArray(row.steps) ? row.steps : [],
  createdAt: row.created_at,
});

export function PembelajaranProvider({ children }: { children: React.ReactNode }) {
  const [pembelajaranList, setPembelajaranList] = useState<Pembelajaran[]>([]);
  const [loading, setLoading] = useState(false);

  const getPembelajaranByKelasId = useCallback(async (kelasId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pembelajaran")
        .select("*")
        .eq("class_id", kelasId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      const mapped = (data || []).map(mapRow);
      setPembelajaranList(prev => {
        const others = prev.filter(p => p.classId !== kelasId);
        return [...others, ...mapped];
      });
      return mapped;
    } catch (error) {
      console.error("Error fetching pembelajaran:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async (classId?: string) => {
    if (classId) {
      await getPembelajaranByKelasId(classId);
    }
  }, [getPembelajaranByKelasId]);

  const addPembelajaran = async (pembelajaran: Omit<Pembelajaran, "id" | "createdAt" | "steps">, userId?: string) => {
    return await executeWithRetry(async () => {
      let actualUserId = userId;
      
      if (!actualUserId) {
        // Coba dapatkan dari session dulu karena lebih cepat dan sinkron
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.id) {
          actualUserId = sessionData.session.user.id;
        } else {
          // Fallback ke getUser jika session tidak ada
          const { data: userData, error: userErr } = await supabase.auth.getUser();
          if (userErr || !userData?.user?.id) throw new Error("Unauthorized: " + (userErr?.message || "No authenticated user found"));
          actualUserId = userData.user.id;
        }
      }

      const payload = {
        class_id: pembelajaran.classId,
        judul: pembelajaran.judul,
        deskripsi: pembelajaran.deskripsi,
        title: pembelajaran.judul, // backward compat
        description: pembelajaran.deskripsi,
        icon: pembelajaran.icon || "BookOpen",
        color: pembelajaran.color || "#56B6C6",
        image_url: pembelajaran.imageUrl || null,
        status: pembelajaran.status || "draft",
        enable_reflection: pembelajaran.enableReflection || false,
        reflection_template: pembelajaran.reflectionTemplate || "Standar",
        pertanyaan_kendala: pembelajaran.pertanyaanKendala || "Apa kendala yang kamu alami?",
        pertanyaan_kesan: pembelajaran.pertanyaanKesan || "Bagaimana pendapatmu tentang pembelajaran hari ini?",
        steps: [],
        created_by: actualUserId,
      };

      const { data, error } = await supabase
        .from("pembelajaran")
        .insert([payload])
        .select()
        .single();

      if (error) throw new Error(error.message);
      const mapped = mapRow(data);
      setPembelajaranList(prev => [...prev, mapped]);
      return mapped.id;
    });
  };

  const getPembelajaranById = (id: string) =>
    pembelajaranList.find(p => p.id === id);

  const addStep = async (pembelajaranId: string, step: Omit<Step, "id" | "number">) => {
    return await executeWithRetry(async () => {
      const p = getPembelajaranById(pembelajaranId);
      if (!p) throw new Error("Pembelajaran not found");

      const newStep: Step = {
        ...step,
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        number: p.steps.length + 1,
      };

      const newSteps = [...p.steps, newStep];

      const { error } = await supabase
        .from("pembelajaran")
        .update({ steps: newSteps })
        .eq("id", pembelajaranId);

      if (error) throw new Error(error.message);

      setPembelajaranList(prev =>
        prev.map(item => item.id === pembelajaranId ? { ...item, steps: newSteps } : item)
      );
    });
  };

  const updateStepContent = async (pembelajaranId: string, stepId: string, content: StepContent) => {
    const p = getPembelajaranById(pembelajaranId);
    if (!p) throw new Error("Pembelajaran not found");

    const newSteps = p.steps.map(s =>
      s.id === stepId ? { ...s, content: { ...s.content, ...content } } : s
    );

    const { error } = await supabase
      .from("pembelajaran")
      .update({ steps: newSteps })
      .eq("id", pembelajaranId);

    if (error) throw new Error(error.message);

    setPembelajaranList(prev =>
      prev.map(item => item.id === pembelajaranId ? { ...item, steps: newSteps } : item)
    );
  };

  const getStepById = (pembelajaranId: string, stepId: string) => {
    const p = getPembelajaranById(pembelajaranId);
    return p?.steps.find(s => s.id === stepId);
  };

  return (
    <PembelajaranContext.Provider value={{
      pembelajaranList,
      loading,
      addPembelajaran,
      getPembelajaranById,
      getPembelajaranByKelasId,
      addStep,
      updateStepContent,
      getStepById,
      refreshData,
    }}>
      {children}
    </PembelajaranContext.Provider>
  );
}

export function usePembelajaran() {
  const context = useContext(PembelajaranContext);
  if (!context) throw new Error("usePembelajaran must be used within PembelajaranProvider");
  return context;
}
