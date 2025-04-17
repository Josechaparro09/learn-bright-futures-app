
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Barriers from "./pages/Barriers";
import LearningStyles from "./pages/LearningStyles";
import Activities from "./pages/Activities";
import Interventions from "./pages/Interventions";
import ActivityForm from "./pages/ActivityForm";
import InterventionForm from "./pages/InterventionForm";
import InterventionWizardPage from "./pages/InterventionWizardPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/barreras" element={<Barriers />} />
          <Route path="/estilos" element={<LearningStyles />} />
          <Route path="/actividades" element={<Activities />} />
          <Route path="/actividades/nueva" element={<ActivityForm />} />
          <Route path="/actividades/editar/:id" element={<ActivityForm />} />
          <Route path="/intervenciones" element={<Interventions />} />
          <Route path="/intervenciones/asistente" element={<InterventionWizardPage />} />
          <Route path="/intervenciones/nueva" element={<InterventionForm />} />
          <Route path="/intervenciones/editar/:id" element={<InterventionForm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
