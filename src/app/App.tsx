import { RouterProvider } from "react-router";
import { router } from "./routes.tsx";
import { SettingsProvider } from "./context/SettingsContext";
import { PembelajaranProvider } from "./context/PembelajaranContext";
import { ProjectProvider } from "./context/ProjectContext";
import { AuthProvider } from "./context/AuthContext";
import { PopupProvider } from "./context/PopupContext";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <AuthProvider>
      <PopupProvider>
        <SettingsProvider>
          <PembelajaranProvider>
            <ProjectProvider>
              <RouterProvider router={router} />
              <Toaster position="top-center" richColors />
            </ProjectProvider>
          </PembelajaranProvider>
        </SettingsProvider>
      </PopupProvider>
    </AuthProvider>
  );
}

export default App;