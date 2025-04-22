import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, ArrowRight, Eye, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Barrier {
  id: string;
  name: string;
  description: string;
}

interface LearningStyle {
  id: string;
  name: string;
  description: string;
}

interface ActivityStep {
  id: string;
  description: string;
  durationMin: number;
  durationMax: number;
  durationUnit: string;
}

interface ActivityDevelopment {
  description: string;
  steps: ActivityStep[];
}

interface Activity {
  id: string;
  name: string;
  objective: string;
  materials: string[];
  learningStyles: string[];
  barriers: string[];
  development: ActivityDevelopment;
}

const InterventionWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Data states
  const [barriers, setBarriers] = useState<Barrier[]>([]);
  const [learningStyles, setLearningStyles] = useState<LearningStyle[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Selection states
  const [selectedBarrier, setSelectedBarrier] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  
  // Activity detail view
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);
  
  // Search states
  const [barrierSearch, setBarrierSearch] = useState("");
  const [styleSearch, setStyleSearch] = useState("");
  const [activitySearch, setActivitySearch] = useState("");
  
  // Helper to get barrier or style name from ID
  const getBarrierName = (id: string): string => {
    const barrier = barriers.find(b => b.id === id);
    return barrier ? barrier.name : "Desconocido";
  };
  
  const getStyleName = (id: string): string => {
    const style = learningStyles.find(s => s.id === id);
    return style ? style.name : "Desconocido";
  };
  
  // Filtered data based on search
  const filteredBarriers = barriers.filter(barrier => 
    barrier.name.toLowerCase().includes(barrierSearch.toLowerCase())
  );
  
  // Filtered styles based on selected barrier
  const relevantStyles = selectedBarrier
    ? learningStyles
    : [];
  
  const filteredStyles = relevantStyles.filter(style => 
    style.name.toLowerCase().includes(styleSearch.toLowerCase())
  );
  
  const searchedActivities = filteredActivities.filter(activity => 
    activity.name.toLowerCase().includes(activitySearch.toLowerCase()) ||
    activity.objective.toLowerCase().includes(activitySearch.toLowerCase())
  );
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch barriers
        const { data: barriersData, error: barriersError } = await supabase
          .from('barriers')
          .select('id, name, description');
        
        if (barriersError) throw barriersError;
        
        // Fetch learning styles
        const { data: stylesData, error: stylesError } = await supabase
          .from('learning_styles')
          .select('id, name, description');
        
        if (stylesError) throw stylesError;
        
        // Fetch activities with their barriers and learning styles
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('id, name, objective, materials, development');
        
        if (activitiesError) throw activitiesError;
        
        // For each activity, fetch its barriers
        const activitiesWithRelations = await Promise.all(
          activitiesData.map(async (activity) => {
            // Get barriers for this activity
            const { data: activityBarriers, error: barrierError } = await supabase
              .from('activity_barriers')
              .select('barrier_id')
              .eq('activity_id', activity.id);
            
            if (barrierError) throw barrierError;
            
            // Get learning styles for this activity
            const { data: activityStyles, error: styleError } = await supabase
              .from('activity_learning_styles')
              .select('learning_style_id')
              .eq('activity_id', activity.id);
            
            if (styleError) throw styleError;
            
            // Convert materials from Json to string[]
            let materials: string[] = [];
            if (Array.isArray(activity.materials)) {
              materials = activity.materials as string[];
            } else if (typeof activity.materials === 'string') {
              try {
                materials = JSON.parse(activity.materials);
              } catch (e) {
                console.error('Error parsing materials JSON', e);
                materials = [];
              }
            }
            
            // Convert development from Json to ActivityDevelopment
            let development: ActivityDevelopment = {
              description: '',
              steps: []
            };
            
            if (typeof activity.development === 'object') {
              development = activity.development as unknown as ActivityDevelopment;
            } else if (typeof activity.development === 'string') {
              try {
                development = JSON.parse(activity.development);
              } catch (e) {
                console.error('Error parsing development JSON', e);
              }
            }
            
            return {
              ...activity,
              materials: materials,
              development: development,
              barriers: activityBarriers.map(ab => ab.barrier_id),
              learningStyles: activityStyles.map(als => als.learning_style_id)
            } as Activity;
          })
        );
        
        setBarriers(barriersData);
        setLearningStyles(stylesData);
        setActivities(activitiesWithRelations);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
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
  }, [selectedBarrier, selectedStyles, activities]);
  
  // Toggle a learning style
  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev => 
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };
  
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

    // Obtener la actividad seleccionada
    const activity = activities.find(a => a.id === selectedActivity);
    
    if (!activity) {
      toast({
        title: "Error",
        description: "No se encontró la actividad seleccionada",
        variant: "destructive"
      });
      return;
    }

    // Crear objeto con los datos de la intervención
    const interventionData = {
      activityId: selectedActivity,
      activityName: activity.name,
      barrierId: selectedBarrier,
      barrierName: getBarrierName(selectedBarrier!),
      learningStyles: selectedStyles.map(styleId => ({
        id: styleId,
        name: getStyleName(styleId)
      })),
      activityDetails: {
        objective: activity.objective,
        materials: activity.materials,
        development: activity.development
      }
    };

    // Navegar a la página de intervención con los datos
    navigate('/intervenciones/nueva', {
      state: interventionData
    });
  };
  
  const handleNextStep = () => {
    if (currentStep === 1 && !selectedBarrier) {
      toast({
        title: "Selección necesaria",
        description: "Por favor seleccione una barrera para continuar",
        variant: "default"
      });
      return;
    }
    
    if (currentStep === 2 && selectedStyles.length === 0) {
      toast({
        title: "Selección necesaria",
        description: "Por favor seleccione al menos un estilo de aprendizaje",
        variant: "default"
      });
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };
  
  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const renderSearchBar = (
    placeholder: string, 
    value: string, 
    onChange: (value: string) => void
  ) => (
    <div className="relative mb-4">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search size={16} className="text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {value && (
        <button 
          className="absolute inset-y-0 right-0 flex items-center pr-3"
          onClick={() => onChange("")}
        >
          <X size={16} className="text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
  
  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0 sticky top-0 bg-white z-10 pb-4">
              <CardTitle className="text-lg font-medium">Paso 1: Seleccione una barrera de aprendizaje</CardTitle>
              <CardDescription>Elija la barrera principal que enfrenta el estudiante</CardDescription>
              {renderSearchBar("Buscar barrera...", barrierSearch, setBarrierSearch)}
            </CardHeader>
            <CardContent className="px-0 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              <RadioGroup 
                value={selectedBarrier || ""} 
                onValueChange={(value) => setSelectedBarrier(value)}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                {filteredBarriers.length > 0 ? (
                  filteredBarriers.map((barrier) => (
                    <div 
                      key={barrier.id} 
                      className={`flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedBarrier === barrier.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200'
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
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <p>No se encontraron barreras que coincidan con la búsqueda</p>
                  </div>
                )}
              </RadioGroup>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0 sticky top-0 bg-white z-10 pb-4">
              <div className="flex items-center mb-1">
                <div className="flex-1">
                  <Button variant="ghost" size="sm" onClick={handlePreviousStep} className="pl-0 hover:bg-transparent">
                    <ArrowRight size={14} className="rotate-180 mr-1" /> 
                    <span className="text-sm text-muted-foreground">Volver a barreras</span>
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Barrera: <span className="font-medium text-foreground">{selectedBarrier ? getBarrierName(selectedBarrier) : ""}</span>
                </div>
              </div>
              <CardTitle className="text-lg font-medium">Paso 2: Seleccione estilos de aprendizaje</CardTitle>
              <CardDescription>Puede seleccionar uno o más estilos que se adapten al estudiante</CardDescription>
              {renderSearchBar("Buscar estilos...", styleSearch, setStyleSearch)}
            </CardHeader>
            <CardContent className="px-0 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {relevantStyles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay estilos disponibles para esta barrera</p>
                </div>
              ) : filteredStyles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No se encontraron estilos que coincidan con la búsqueda</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredStyles.map((style) => (
                    <div 
                      key={style.id} 
                      className={`flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedStyles.includes(style.id) ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200'
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
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0 sticky top-0 bg-white z-10 pb-4">
              <div className="flex items-center mb-1">
                <div className="flex-1">
                  <Button variant="ghost" size="sm" onClick={handlePreviousStep} className="pl-0 hover:bg-transparent">
                    <ArrowRight size={14} className="rotate-180 mr-1" /> 
                    <span className="text-sm text-muted-foreground">Volver a estilos</span>
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-1 items-center justify-end">
                  <span>Estilos:</span> 
                  {selectedStyles.map(id => (
                    <span key={id} className="bg-primary/10 text-xs px-2 py-0.5 rounded-full font-medium">
                      {getStyleName(id)}
                    </span>
                  ))}
                </div>
              </div>
              <CardTitle className="text-lg font-medium">Paso 3: Seleccione una actividad</CardTitle>
              <CardDescription>Actividades recomendadas para la barrera y estilos seleccionados</CardDescription>
              {renderSearchBar("Buscar actividades...", activitySearch, setActivitySearch)}
            </CardHeader>
            <CardContent className="px-0 max-h-[50vh] overflow-y-auto pr-2">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No se encontraron actividades que coincidan con los criterios seleccionados</p>
                </div>
              ) : searchedActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No se encontraron actividades que coincidan con la búsqueda</p>
                </div>
              ) : (
                <RadioGroup 
                  value={selectedActivity || ""} 
                  onValueChange={(value) => setSelectedActivity(value)}
                  className="space-y-3"
                >
                  {searchedActivities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className={`p-4 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedActivity === activity.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start">
                        <RadioGroupItem 
                          value={activity.id} 
                          id={`activity-${activity.id}`} 
                          className="mt-1"
                          onClick={() => setSelectedActivity(activity.id)}
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-start">
                            <label 
                              htmlFor={`activity-${activity.id}`}
                              className="font-medium cursor-pointer block mb-1"
                            >
                              {activity.name}
                            </label>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-xs"
                                  onClick={() => setViewingActivity(activity)}
                                >
                                  <Eye size={14} className="mr-1" />
                                  Ver detalles
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>{activity.name}</DialogTitle>
                                  <DialogDescription>
                                    Detalles completos de la actividad
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 my-2 max-h-[60vh] overflow-y-auto">
                                  <div>
                                    <h3 className="font-semibold mb-1">Objetivo</h3>
                                    <p>{activity.objective}</p>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold mb-1">Materiales</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                      {activity.materials.map((material, idx) => (
                                        <li key={idx}>{material}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold mb-1">Desarrollo</h3>
                                    <p className="mb-2">{activity.development.description}</p>
                                    <ol className="space-y-3 pl-5 list-decimal">
                                      {activity.development.steps.map((step, idx) => (
                                        <li key={step.id || idx}>
                                          <p>{step.description}</p>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            Duración estimada: {step.durationMin}-{step.durationMax} {step.durationUnit}
                                          </p>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cerrar</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <p className="text-sm text-gray-600 mr-8">{activity.objective}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }
  
  // Render progress bar
  const renderProgressBar = () => {
    return (
      <div className="mb-6 sticky top-0 bg-white pt-2 z-20">
        <div className="flex justify-between mb-2">
          {[1, 2, 3].map((step) => (
            <div 
              key={step}
              className={`flex flex-col items-center ${
                currentStep >= step ? 'text-primary' : 'text-gray-400'
              }`}
              style={{ width: '33.333%' }}
            >
              <div className={`rounded-full w-8 h-8 flex items-center justify-center border-2 ${
                currentStep > step 
                  ? 'bg-primary border-primary text-white' 
                  : currentStep === step
                    ? 'border-primary text-primary'
                    : 'border-gray-300 text-gray-400'
              }`}>
                {currentStep > step ? <Check size={16} /> : step}
              </div>
              <span className="text-xs mt-1 text-center">
                {step === 1 ? 'Barrera' : step === 2 ? 'Estilos' : 'Actividad'}
              </span>
            </div>
          ))}
        </div>
        
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out" 
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  };
  
  // Render "next" or "create intervention" button based on current step
  const renderActionButton = () => {
    if (currentStep < 3) {
      return (
        <Button 
          onClick={handleNextStep}
          className="gap-2"
          disabled={(currentStep === 1 && !selectedBarrier) || (currentStep === 2 && selectedStyles.length === 0)}
        >
          Siguiente <ArrowRight size={16} />
        </Button>
      );
    } else {
      return (
        <Button 
          onClick={handleCreateIntervention} 
          disabled={!selectedActivity}
          className="gap-2"
        >
          Crear Intervención <ChevronRight size={16} />
        </Button>
      );
    }
  };
  
  return (
    <div className="space-y-6">
      {renderProgressBar()}
      <div className="relative pb-16">
        {getStepContent()}
        <div className="sticky bottom-0 bg-white pt-4 pb-2 mt-6 border-t z-10 flex justify-end">
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export default InterventionWizard;
