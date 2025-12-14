import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/providers/QueryProvider";
import { Toaster, Logo } from "@/components";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { FeatureProtectedRoute } from "@/components/common/FeatureProtectedRoute";
import { SessionExpiredModal } from "@/components/common/SessionExpiredModal";
import { useSessionManager } from "@/hooks/useSessionManager";
import { cleanInvalidTokens } from "@/utils/tokenValidation";
import { useThemeStore } from "@/stores/themeStore";
import { ConfigProvider } from "@/contexts/ConfigContext";
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  IdeasListPage,
  IdeaDetailPage,
  IdeaFormPage,
  ProfilePage,
  CalendarPage,
  TimelinePage,
  EditProfilePage,
  ConfigPage,
} from "@/pages";
import {
  RetroListPage,
  RetroDetailPage,
  RetroFormPage,
  RetroTemplatesPage,
  RetroTemplateFormPage,
  RetroMetricsPage,
} from "@/pages/Retro";

/**
 * Componente que gerencia a sessão do usuário
 * Verifica expiração de token, tenta refresh automático, e sincroniza entre abas
 */
function SessionManager() {
  useSessionManager();
  return null;
}

function App() {
  // Limpar tokens inválidos na inicialização
  useEffect(() => {
    cleanInvalidTokens();
  }, []);

  // Garantir que o tema seja aplicado ao montar
  useEffect(() => {
    const { theme } = useThemeStore.getState();

    // Forçar aplicação do tema
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.add("light");
      html.classList.remove("dark");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ideas"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="chapter">
                  <IdeasListPage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ideas/new"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="chapter">
                  <IdeaFormPage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ideas/:id"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="chapter">
                  <IdeaDetailPage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ideas/:id/edit"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="chapter">
                  <IdeaFormPage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="chapter">
                  <CalendarPage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/timeline"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="chapter">
                  <TimelinePage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* Retro Routes */}
          <Route
            path="/retros"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="retro">
                  <RetroListPage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/retros/new"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="retro">
                  <RetroFormPage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/retros/templates"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="retro">
                  <RetroTemplatesPage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/retros/templates/new"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="retro">
                  <RetroTemplateFormPage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/retros/templates/:id/edit"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="retro">
                  <RetroTemplateFormPage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/retros/metrics"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="retro">
                  <RetroMetricsPage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/retros/:id"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="retro">
                  <RetroDetailPage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/retros/:id/edit"
            element={
              <ProtectedRoute>
                <FeatureProtectedRoute feature="retro">
                  <RetroFormPage />
                </FeatureProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/config"
            element={
              <ProtectedRoute>
                <ConfigPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard or login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="text-center">
                  <div className="mb-8">
                    <Logo variant="icon" size="xl" className="mx-auto mb-4" />
                  </div>
                  <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    404
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                    Página não encontrada
                  </p>
                  <a
                    href="/dashboard"
                    className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
                  >
                    Voltar ao Dashboard
                  </a>
                </div>
              </div>
            }
          />
        </Routes>

        {/* Gerenciador de sessão - dentro do Router para ter acesso ao location */}
        <SessionManager />

        {/* Session expired modal */}
        <SessionExpiredModal />
      </BrowserRouter>

      {/* Toast notifications */}
      <Toaster />

      {/* React Query Devtools (only in dev) */}
      <ReactQueryDevtools initialIsOpen={false} />
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
