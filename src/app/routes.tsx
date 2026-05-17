import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Lazy load all pages
const LandingPage = lazy(() => import("./pages/LandingPage").then(m => ({ default: m.default })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.default })));
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.default })));
const Pembelajaran = lazy(() => import("./pages/Pembelajaran").then(m => ({ default: m.default })));
const ProgressiveLearning = lazy(() => import("./pages/ProgressiveLearning").then(m => ({ default: m.default })));
const BacaMateri = lazy(() => import("./pages/BacaMateri").then(m => ({ default: m.default })));
const MengerjakanLatihan = lazy(() => import("./pages/MengerjakanLatihan").then(m => ({ default: m.default })));
const PembagianKelompok = lazy(() => import("./pages/PembagianKelompok").then(m => ({ default: m.default })));
const OrientasiPadaMasalah = lazy(() => import("./pages/OrientasiPadaMasalah").then(m => ({ default: m.default })));
const Schedule = lazy(() => import("./pages/Schedule").then(m => ({ default: m.default })));
const ForumDiskusi = lazy(() => import("./pages/ForumDiskusi").then(m => ({ default: m.default })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.default })));
const DashboardAdmin = lazy(() => import("./pages/DashboardAdmin").then(m => ({ default: m.default })));
const KelolaKelas = lazy(() => import("./pages/KelolaKelas").then(m => ({ default: m.default })));
const DetailKelasAdmin = lazy(() => import("./pages/DetailKelasAdmin").then(m => ({ default: m.default })));
const KelolaGuru = lazy(() => import("./pages/KelolaGuru").then(m => ({ default: m.default })));
const KelolaSiswa = lazy(() => import("./pages/KelolaSiswa").then(m => ({ default: m.default })));
const AdminSettings = lazy(() => import("./pages/AdminSettings").then(m => ({ default: m.default })));
const ForumDiskusiAdmin = lazy(() => import("./pages/ForumDiskusiAdmin").then(m => ({ default: m.default })));
const DashboardGuru = lazy(() => import("./pages/DashboardGuru").then(m => ({ default: m.default })));
const KelasGuru = lazy(() => import("./pages/KelasGuru").then(m => ({ default: m.default })));
const DetailKelasGuru = lazy(() => import("./pages/DetailKelasGuru").then(m => ({ default: m.default })));
const DetailMateriGuru = lazy(() => import("./pages/DetailMateriGuru").then(m => ({ default: m.default })));
const HasilRefleksiGuru = lazy(() => import("./pages/HasilRefleksiGuru").then(m => ({ default: m.default })));
const BuatMateriGuru = lazy(() => import("./pages/BuatMateriGuru").then(m => ({ default: m.default })));
const EditMateriGuru = lazy(() => import("./pages/EditMateriGuru").then(m => ({ default: m.default })));
const BuatStepMateriGuru = lazy(() => import("./pages/BuatStepMateriGuru").then(m => ({ default: m.default })));
const BacaMateriGuru = lazy(() => import("./pages/BacaMateriGuru").then(m => ({ default: m.default })));
const QuizGuru = lazy(() => import("./pages/QuizGuru").then(m => ({ default: m.default })));
const CodeEditorGuru = lazy(() => import("./pages/CodeEditorGuru").then(m => ({ default: m.default })));
const DataSiswaGuru = lazy(() => import("./pages/DataSiswaGuru").then(m => ({ default: m.default })));
const ForumDiskusiGuru = lazy(() => import("./pages/ForumDiskusiGuru").then(m => ({ default: m.default })));
const SettingsGuru = lazy(() => import("./pages/SettingsGuru").then(m => ({ default: m.default })));
const MonitoringAdmin = lazy(() => import("./pages/MonitoringAdmin").then(m => ({ default: m.default })));
const MonitoringDetailAdmin = lazy(() => import("./pages/MonitoringDetailAdmin").then(m => ({ default: m.default })));
const CodeEditorSiswa = lazy(() => import("./pages/CodeEditorSiswa").then(m => ({ default: m.default })));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

const AdminPage = ({ children }: { children: ReactNode }) => (
  <div className="admin-flow">
    {children}
  </div>
);

const GuruPage = ({ children }: { children: ReactNode }) => (
  <div className="guru-flow">
    {children}
  </div>
);

export const router = createBrowserRouter([
  // Landing page - halaman awal yang muncul saat membuka web
  {
    path: "/",
    element: <Suspense fallback={<LoadingFallback />}><LandingPage /></Suspense>,
  },
  {
    path: "/login",
    element: <Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense>,
  },
  // Siswa Routes - dashboard siswa
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["siswa"]}>
        <Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/pembelajaran",
    element: (
      <ProtectedRoute allowedRoles={["siswa"]}>
        <Suspense fallback={<LoadingFallback />}><Pembelajaran /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/pembelajaran/:pembelajaranId",
    element: (
      <ProtectedRoute allowedRoles={["siswa"]}>
        <Suspense fallback={<LoadingFallback />}><ProgressiveLearning /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/pembelajaran/:pembelajaranId/materi/:stepId",
    element: (
      <ProtectedRoute allowedRoles={["siswa"]}>
        <Suspense fallback={<LoadingFallback />}><BacaMateri /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/pembelajaran/:pembelajaranId/code-editor/:stepId",
    element: (
      <ProtectedRoute allowedRoles={["siswa"]}>
        <Suspense fallback={<LoadingFallback />}><CodeEditorSiswa /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/pembelajaran/:pembelajaranId/quiz/:stepId",
    element: (
      <ProtectedRoute allowedRoles={["siswa"]}>
        <Suspense fallback={<LoadingFallback />}><MengerjakanLatihan /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/schedule",
    element: (
      <ProtectedRoute allowedRoles={["siswa"]}>
        <Suspense fallback={<LoadingFallback />}><Schedule /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/forum",
    element: (
      <ProtectedRoute allowedRoles={["siswa"]}>
        <Suspense fallback={<LoadingFallback />}><ForumDiskusi /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute allowedRoles={["siswa"]}>
        <Suspense fallback={<LoadingFallback />}><Settings /></Suspense>
      </ProtectedRoute>
    ),
  },
  // Admin Routes
  {
    path: "/dashboard-admin",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminPage><Suspense fallback={<LoadingFallback />}><DashboardAdmin /></Suspense></AdminPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-admin/kelola-kelas",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminPage><Suspense fallback={<LoadingFallback />}><KelolaKelas /></Suspense></AdminPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-admin/kelola-kelas/:kelasId",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminPage><Suspense fallback={<LoadingFallback />}><DetailKelasAdmin /></Suspense></AdminPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-admin/kelola-guru",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminPage><Suspense fallback={<LoadingFallback />}><KelolaGuru /></Suspense></AdminPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-admin/kelola-siswa",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminPage><Suspense fallback={<LoadingFallback />}><KelolaSiswa /></Suspense></AdminPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-admin/monitoring",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminPage><Suspense fallback={<LoadingFallback />}><MonitoringAdmin /></Suspense></AdminPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-admin/monitoring/:pembelajaranId",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminPage><Suspense fallback={<LoadingFallback />}><MonitoringDetailAdmin /></Suspense></AdminPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-admin/settings",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminPage><Suspense fallback={<LoadingFallback />}><AdminSettings /></Suspense></AdminPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-admin/forum",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminPage><Suspense fallback={<LoadingFallback />}><ForumDiskusiAdmin /></Suspense></AdminPage>
      </ProtectedRoute>
    ),
  },
  // Guru Routes
  {
    path: "/dashboard-guru",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><DashboardGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-guru/kelas",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><KelasGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-guru/kelas/:kelasId",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><DetailKelasGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-guru/kelas/:kelasId/materi/:materiId",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><DetailMateriGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-guru/kelas/:kelasId/materi/:materiId/refleksi",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><HasilRefleksiGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-guru/kelas/:kelasId/materi/buat",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><BuatMateriGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-guru/kelas/:kelasId/materi/:materiId/edit",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><EditMateriGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-guru/kelas/:kelasId/materi/:materiId/step/buat",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><BuatStepMateriGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-guru/kelas/:kelasId/materi/:materiId/step/:stepId/baca-materi",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><BacaMateriGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-guru/kelas/:kelasId/materi/:materiId/step/:stepId/code-editor",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><CodeEditorGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-guru/kelas/:kelasId/materi/:materiId/step/:stepId/quiz",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><QuizGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-guru/kelas/:kelasId/data-siswa",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><DataSiswaGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-guru/forum",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><ForumDiskusiGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard-guru/settings",
    element: (
      <ProtectedRoute allowedRoles={["guru"]}>
        <GuruPage><Suspense fallback={<LoadingFallback />}><SettingsGuru /></Suspense></GuruPage>
      </ProtectedRoute>
    ),
  },
]);
