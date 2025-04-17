
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { barriers, learningStyles, activities, Activity, Barrier, LearningStyle } from "@/data/sampleData";

interface InterventionWizardProps {
  onClose: () => void;
}

const InterventionWizard = ({ onClose }: InterventionWizardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Selection states
  const [selectedBarrier, setSelectedBarrier] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  
  // Filter activities when selections change
  useEffect(() => {
    if (!selectedBarrier || selectedStyles.length === 0) {
      setFilteredActivities([]);
      return;
    }
    
    // Find activities that match selected barrier and ALL selected styles
    const filtered = activities.filter(activity => {
      // Check if activity includes the selected barrier
      const hasBarrier = activity.barriers.includes(selectedBarrier);
      
      // Check if activity includes ALL selected learning styles
      const hasAllStyles = selectedStyles.every(styleId => 
        activity.learningStyles.includes(styleId)
      );
      
      return hasBarrier && hasAllStyles;
    });
    
    setFilteredActivities(filtered);
  }, [selectedBarrier, selectedStyles]);
  
  // Toggle a learning style
  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev => 
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };
  
  // Helper to get barrier or style name from ID
  const getBarrierName = (id: string): string => {
    const barrier = barriers.find(b => b.id === id);
    return barrier ? barrier.name : "Desconocido";
  };
  
  const getStyleName = (id: string): string => {
    const style = learningStyles.find(s => s.id === id);
    return style ? style.name : "Desconocido";
  };
  
  // Filtered styles based on selected barrier
  const relevantStyles = selectedBarrier
    ? learningStyles
    : [];
  
  // Navigate to create intervention with pre-filled data
  const handleCreateIntervention = () => {
    if (!selectedActivity) {
      toast({
        title: "Error",
        description: "Debe seleccionar una actividad",
        variant: "destructive"
      });
      return;
    }
    
    // Navigate to intervention form with pre-populated data
    navigate(`/intervenciones/nueva?activity=${selectedActivity}&barrier=${selectedBarrier}&styles=${selectedStyles.join(",")}`);
    onClose();
  };
  
  return (
    <div className="p-4">
      <SheetHeader className="text-left mb-6">
        <SheetTitle>Asistente de Intervención</SheetTitle>
        <SheetDescription>
          Seleccione una barrera, los estilos de aprendizaje y una actividad para crear una intervención.
        </SheetDescription>
      </SheetHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Columna 1: Barreras */}
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="text-lg font-medium mb-4 text-center">Barreras de Aprendizaje</h3>
          
          <RadioGroup 
            value={selectedBarrier || ""} 
            onValueChange={(value) => setSelectedBarrier(value)}
            className="space-y-3"
          >
            {barriers.map((barrier: Barrier) => (
              <div 
                key={barrier.id} 
                className={`flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${
                  selectedBarrier === barrier.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedBarrier(barrier.id)}
              >
                <RadioGroupItem value={barrier.id} id={`barrier-${barrier.id}`} />
                <label 
                  htmlFor={`barrier-${barrier.id}`}
                  className="flex-grow font-medium cursor-pointer"
                >
                  {barrier.name}
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        {/* Columna 2: Estilos de Aprendizaje */}
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="text-lg font-medium mb-4 text-center">Estilos de Aprendizaje</h3>
          
          {!selectedBarrier ? (
            <div className="text-center py-8 text-gray-500">
              <p>Seleccione primero una barrera de aprendizaje</p>
            </div>
          ) : relevantStyles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay estilos disponibles para esta barrera</p>
            </div>
          ) : (
            <div className="space-y-3">
              {relevantStyles.map((style: LearningStyle) => (
                <div 
                  key={style.id} 
                  className={`flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${
                    selectedStyles.includes(style.id) ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => toggleStyle(style.id)}
                >
                  <Checkbox 
                    id={`style-${style.id}`} 
                    checked={selectedStyles.includes(style.id)}
                    onCheckedChange={() => toggleStyle(style.id)}
                  />
                  <label 
                    htmlFor={`style-${style.id}`}
                    className="flex-grow font-medium cursor-pointer"
                  >
                    {style.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Columna 3: Actividades Filtradas */}
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="text-lg font-medium mb-4 text-center">Actividades</h3>
          
          {!selectedBarrier || selectedStyles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Seleccione una barrera y al menos un estilo de aprendizaje</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No se encontraron actividades que coincidan con los criterios seleccionados</p>
            </div>
          ) : (
            <RadioGroup 
              value={selectedActivity || ""} 
              onValueChange={(value) => setSelectedActivity(value)}
              className="space-y-3"
            >
              {filteredActivities.map((activity: Activity) => (
                <div 
                  key={activity.id} 
                  className={`p-4 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedActivity === activity.id ? 'border-primary ring-1 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedActivity(activity.id)}
                >
                  <div className="flex items-start">
                    <RadioGroupItem value={activity.id} id={`activity-${activity.id}`} className="mt-1" />
                    <div className="ml-3">
                      <label 
                        htmlFor={`activity-${activity.id}`}
                        className="font-medium cursor-pointer block mb-1"
                      >
                        {activity.name}
                      </label>
                      <p className="text-sm text-gray-600">{activity.objective}</p>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      </div>
      
      {/* Footer con botón para crear intervención */}
      <div className="mt-6 flex justify-end border-t pt-4">
        <Button 
          onClick={handleCreateIntervention} 
          disabled={!selectedActivity}
          className="gap-2"
        >
          Crear Intervención <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default InterventionWizard;
