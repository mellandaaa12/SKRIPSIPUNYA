import React, { createContext, useContext, useState, useEffect } from "react";

interface Kelompok {
  id: string;
  nama: string;
  anggotaList: string[]; // List nama siswa
}

interface Sintaks {
  id: string;
  number: number;
  nama: string; // Nama sintaks (Orientasi Pada Masalah, Menyusun Rencana, dll)
  judulTugas: string;
  deskripsiTugas: string;
  instruksiList: string[];
  deliverableList: string[];
  status: string;
}

interface Project {
  id: string;
  judul: string;
  deskripsi: string;
  kelasId: string;
  deadline: string; // ISO date string
  kelompokList: Kelompok[];
  sintaksList: Sintaks[];
  createdAt: string;
}

interface ProjectContextType {
  projectList: Project[];
  addProject: (project: Omit<Project, "id" | "createdAt" | "kelompokList" | "sintaksList">) => string;
  getProjectById: (id: string) => Project | undefined;
  getProjectByKelasId: (kelasId: string) => Project[];
  addKelompok: (projectId: string, kelompok: Omit<Kelompok, "id">) => void;
  updateKelompok: (projectId: string, kelompokId: string, kelompok: Partial<Kelompok>) => void;
  deleteKelompok: (projectId: string, kelompokId: string) => void;
  addSintaks: (projectId: string, sintaks: Omit<Sintaks, "id">) => void;
  updateSintaks: (projectId: string, sintaksId: string, sintaks: Partial<Sintaks>) => void;
  getSintaksById: (projectId: string, sintaksId: string) => Sintaks | undefined;
  isProjectComplete: (projectId: string) => boolean;
  hasKelompok: (projectId: string) => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projectList, setProjectList] = useState<Project[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("project_data");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration: Add kelompokList and deadline for old data
        return parsed.map((p: any) => ({
          ...p,
          kelompokList: Array.isArray(p.kelompokList) ? p.kelompokList : [],
          sintaksList: Array.isArray(p.sintaksList) ? p.sintaksList : [],
          deadline: p.deadline || new Date().toISOString(),
        }));
      }
      return [];
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("project_data", JSON.stringify(projectList));
    }
  }, [projectList]);

  const addProject = (project: Omit<Project, "id" | "createdAt" | "kelompokList" | "sintaksList">) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      kelompokList: [],
      sintaksList: [],
    };
    setProjectList((prev) => [...prev, newProject]);
    return newProject.id;
  };

  const getProjectById = (id: string) => {
    return projectList.find((p) => p.id === id);
  };

  const getProjectByKelasId = (kelasId: string) => {
    return projectList.filter((p) => p.kelasId === kelasId);
  };

  const addKelompok = (projectId: string, kelompok: Omit<Kelompok, "id">) => {
    setProjectList((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const newKelompok: Kelompok = {
            ...kelompok,
            id: Date.now().toString(),
          };
          return {
            ...p,
            kelompokList: [...p.kelompokList, newKelompok],
          };
        }
        return p;
      })
    );
  };

  const updateKelompok = (projectId: string, kelompokId: string, kelompok: Partial<Kelompok>) => {
    setProjectList((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            kelompokList: p.kelompokList.map((k) => {
              if (k.id === kelompokId) {
                return { ...k, ...kelompok };
              }
              return k;
            }),
          };
        }
        return p;
      })
    );
  };

  const deleteKelompok = (projectId: string, kelompokId: string) => {
    setProjectList((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            kelompokList: p.kelompokList.filter((k) => k.id !== kelompokId),
          };
        }
        return p;
      })
    );
  };

  const addSintaks = (projectId: string, sintaks: Omit<Sintaks, "id">) => {
    setProjectList((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const newSintaks: Sintaks = {
            ...sintaks,
            id: Date.now().toString(),
          };
          return {
            ...p,
            sintaksList: [...p.sintaksList, newSintaks],
          };
        }
        return p;
      })
    );
  };

  const updateSintaks = (projectId: string, sintaksId: string, sintaks: Partial<Sintaks>) => {
    setProjectList((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            sintaksList: p.sintaksList.map((s) => {
              if (s.id === sintaksId) {
                return { ...s, ...sintaks };
              }
              return s;
            }),
          };
        }
        return p;
      })
    );
  };

  const getSintaksById = (projectId: string, sintaksId: string) => {
    const project = getProjectById(projectId);
    return project?.sintaksList.find((s) => s.id === sintaksId);
  };

  const isProjectComplete = (projectId: string) => {
    const project = getProjectById(projectId);
    if (!project) return false;
    const hasSintaks = project.sintaksList && project.sintaksList.length === 8;
    const hasKelompokList = project.kelompokList && project.kelompokList.length > 0;
    return hasSintaks && hasKelompokList;
  };

  const hasKelompok = (projectId: string) => {
    const project = getProjectById(projectId);
    return project && project.kelompokList ? project.kelompokList.length > 0 : false;
  };

  return (
    <ProjectContext.Provider
      value={{
        projectList,
        addProject,
        getProjectById,
        getProjectByKelasId,
        addKelompok,
        updateKelompok,
        deleteKelompok,
        addSintaks,
        updateSintaks,
        getSintaksById,
        isProjectComplete,
        hasKelompok,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider");
  }
  return context;
}