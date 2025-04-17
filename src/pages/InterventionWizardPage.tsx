
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import InterventionWizard from "@/components/InterventionWizard";

const InterventionWizardPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Asistente de Intervención</h1>
            <p className="text-gray-600">
              Seleccione una barrera, los estilos de aprendizaje y una actividad para crear una intervención.
            </p>
          </div>
          <Button 
            onClick={() => navigate("/intervenciones")}
            variant="outline"
            className="mt-4 md:mt-0"
          >
            Volver a Intervenciones
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <InterventionWizard />
        </div>
      </div>
    </div>
  );
};

export default InterventionWizardPage;
