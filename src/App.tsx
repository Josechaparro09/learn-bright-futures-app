import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Barriers from "./pages/Barriers";
import LearningStyles from "./pages/LearningStyles";
import Activities from "./pages/Activities";
import Interventions from "./pages/Interventions";
import ActivityForm from "./pages/ActivityForm";
import InterventionForm from "./pages/InterventionForm";
import InterventionWizardPage from "./pages/InterventionWizardPage";
import AIAssistant from "./pages/AIAssistant";
import SqlMigrations from "./pages/SqlMigrations";

const queryClient = new QueryClient();

// Componente para decidir si mostrar la página de inicio o el dashboard
const HomeRoute = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
