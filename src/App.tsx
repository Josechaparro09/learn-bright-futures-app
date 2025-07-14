import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { lazy, Suspense } from "react";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Barriers = lazy(() => import("./pages/Barriers"));
const LearningStyles = lazy(() => import("./pages/LearningStyles"));
const Activities = lazy(() => import("./pages/Activities"));
const Interventions = lazy(() => import("./pages/Interventions"));
const ActivityForm = lazy(() => import("./pages/ActivityForm"));
const InterventionForm = lazy(() => import("./pages/InterventionForm"));
const InterventionWizardPage = lazy(() => import("./pages/InterventionWizardPage"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const SqlMigrations = lazy(() => import("./pages/SqlMigrations"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce memory usage by setting default stale time
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Enable garbage collection of unused queries
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Loading component for better UX during code splitting
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Componente para decidir si mostrar la página de inicio o el dashboard
const HomeRoute = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  return user ? <Dashboard /> : <LandingPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Ruta principal - muestra LandingPage o Dashboard según autenticación */}
              <Route path="/" element={<HomeRoute />} />
              
              {/* Rutas públicas */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Rutas protegidas - requieren autenticación */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/barreras" element={<Barriers />} />
                <Route path="/estilos" element={<LearningStyles />} />
                <Route path="/actividades" element={<Activities />} />
                <Route path="/actividades/nueva" element={<ActivityForm />} />
                <Route path="/actividades/editar/:id" element={<ActivityForm />} />
                <Route path="/actividades/asistente" element={<AIAssistant />} />
                <Route path="/intervenciones" element={<Interventions />} />
                <Route path="/intervenciones/asistente" element={<InterventionWizardPage />} />
                <Route path="/intervenciones/nueva" element={<InterventionForm />} />
                <Route path="/intervenciones/editar/:id" element={<InterventionForm />} />
                <Route path="/admin/migrations" element={<SqlMigrations />} />
              </Route>
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
