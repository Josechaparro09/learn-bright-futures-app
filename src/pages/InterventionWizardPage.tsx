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
      
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Crear nueva intervención</h1>
          <Button 
            onClick={() => navigate("/intervenciones")}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            Volver a Intervenciones
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6 flex-1">
          <p className="text-gray-600 text-sm mb-6">
            Complete los pasos para crear una intervención personalizada.
          </p>
          
          <InterventionWizard />
        </div>
      </div>
    </div>
  );
};

export default InterventionWizardPage;
