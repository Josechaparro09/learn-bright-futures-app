
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { barriers, learningStyles, activities, Activity, Barrier, LearningStyle } from "@/data/sampleData";

interface InterventionWizardProps {
  onClose: () => void;
}

const InterventionWizard = ({ onClose }: InterventionWizardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Selection states
  const [selectedBarrier, setSelectedBarrier] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  
  // Reset styles when barrier changes
  useEffect(() => {
    setSelectedStyles([]);
    setSelectedActivity(null);
  }, [selectedBarrier]);
  
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
  
  // Filtered styles based on selected barrier (for step 2)
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
    <div className="p-4 max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
              currentStep >= 1 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {currentStep > 1 ? <Check size={16} /> : "1"}
            </div>
            <div className={`h-1 w-16 mx-2 ${
              currentStep >= 2 ? "bg-primary" : "bg-gray-200"
            }`}></div>
          </div>
          
          <div className="flex items-center">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
              currentStep >= 2 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {currentStep > 2 ? <Check size={16} /> : "2"}
            </div>
            <div className={`h-1 w-16 mx-2 ${
              currentStep >= 3 ? "bg-primary" : "bg-gray-200"
            }`}></div>
          </div>
          
          <div className="flex items-center">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
              currentStep >= 3 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {currentStep > 3 ? <Check size={16} /> : "3"}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-2 text-sm">
          <span className={currentStep === 1 ? "text-primary font-medium" : "text-gray-500"}>
            Barrera
          </span>
          <span className={currentStep === 2 ? "text-primary font-medium" : "text-gray-500"}>
            Estilos
          </span>
          <span className={currentStep === 3 ? "text-primary font-medium" : "text-gray-500"}>
            Actividad
          </span>
        </div>
      </div>
      
      {/* Step 1: Select Barrier */}
      {currentStep === 1 && (
        <div className="animate-fade-in">
          <h3 className="text-lg font-medium mb-4">Selecciona una barrera de aprendizaje</h3>
          
          <RadioGroup 
            value={selectedBarrier || ""} 
            onValueChange={(value) => setSelectedBarrier(value)}
            className="space-y-3"
          >
            {barriers.map((barrier: Barrier) => (
              <div key={barrier.id} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50">
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
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={() => setCurrentStep(2)} 
              disabled={!selectedBarrier}
              className="gap-2"
            >
              Siguiente <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 2: Select Learning Styles */}
      {currentStep === 2 && (
        <div className="animate-fade-in">
          <h3 className="text-lg font-medium mb-2">Estilos de aprendizaje</h3>
          <p className="text-gray-500 mb-4">
            Selecciona los estilos de aprendizaje para la barrera: 
            <span className="font-medium text-gray-700"> {getBarrierName(selectedBarrier || "")}</span>
          </p>
          
          <div className="space-y-3">
            {relevantStyles.map((style: LearningStyle) => (
              <div key={style.id} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50">
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
          
          <div className="mt-6 flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(1)}
            >
              Anterior
            </Button>
            <Button 
              onClick={() => setCurrentStep(3)} 
              disabled={selectedStyles.length === 0}
              className="gap-2"
            >
              Siguiente <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 3: Select Activity */}
      {currentStep === 3 && (
        <div className="animate-fade-in">
          <h3 className="text-lg font-medium mb-2">Actividades recomendadas</h3>
          <div className="flex items-center mb-4">
            <div className="text-sm text-gray-500 flex-grow">
              <p>Barrera: <span className="font-medium text-gray-700">{getBarrierName(selectedBarrier || "")}</span></p>
              <p>Estilos: {selectedStyles.map(s => 
                <span key={s} className="font-medium text-gray-700">{getStyleName(s)}</span>
              ).reduce((prev, curr) => [prev, ', ', curr] as any)}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => setCurrentStep(2)}
            >
              <Filter size={14} /> Cambiar
            </Button>
          </div>
          
          {filteredActivities.length === 0 ? (
            <div className="text-center py-10 border rounded-md bg-gray-50">
              <p className="text-gray-500 mb-2">No se encontraron actividades que coincidan con los criterios seleccionados.</p>
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Cambiar selección
              </Button>
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
                    selectedActivity === activity.id ? 'border-primary ring-1 ring-primary' : ''
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
                      
                      <div className="mt-2 flex flex-wrap gap-1">
                        {activity.learningStyles.map(styleId => (
                          <span 
                            key={styleId} 
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              selectedStyles.includes(styleId) 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {getStyleName(styleId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}
          
          <div className="mt-6 flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(2)}
            >
              Anterior
            </Button>
            <Button 
              onClick={handleCreateIntervention} 
              disabled={!selectedActivity}
            >
              Crear Intervención
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterventionWizard;
