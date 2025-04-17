
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { 
  activities, 
  barriers, 
  learningStyles, 
  interventions as initialInterventions,
  Intervention 
} from "@/data/sampleData";

const InterventionForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;
  
  // Get prefilled data from URL params (from wizard)
  const prefilledActivityId = searchParams.get("activity");
  const prefilledBarrierId = searchParams.get("barrier");
  const prefilledStyleIds = searchParams.get("styles")?.split(",") || [];
  
  const [interventions, setInterventions] = useState<Intervention[]>(initialInterventions);
  const [activitySelectOpen, setActivitySelectOpen] = useState(false);
  
  // Initialize intervention state with default values or prefilled data
  const [intervention, setIntervention] = useState<Intervention>({
    id: crypto.randomUUID(),
    date: new Date(),
    teacherName: "",
    student: { name: "", grade: "" },
    activity: prefilledActivityId || "",
    barriers: prefilledBarrierId ? [prefilledBarrierId] : [],
    learningStyles: prefilledStyleIds || [],
    observations: ""
  });
  
  // Load intervention data if editing
  useEffect(() => {
    if (isEditing) {
      const existingIntervention = interventions.find(i => i.id === id);
      if (existingIntervention) {
        setIntervention(existingIntervention);
      } else {
        toast({
          title: "Error",
          description: "Intervención no encontrada",
          variant: "destructive"
        });
        navigate("/intervenciones");
      }
    }
    
    // If prefilled activity, load activity data
    if (prefilledActivityId && !isEditing) {
      const selectedActivity = activities.find(a => a.id === prefilledActivityId);
      if (selectedActivity) {
        // We already set the activity ID in the initial state
        // This ensures we have the latest barriers and styles from the activity
        setIntervention(prev => ({
          ...prev,
          activity: selectedActivity.id,
          barriers: prefilledBarrierId ? [prefilledBarrierId] : selectedActivity.barriers,
          learningStyles: prefilledStyleIds.length > 0 ? prefilledStyleIds : selectedActivity.learningStyles
        }));
      }
    }
  }, [id, isEditing, interventions, navigate, toast, prefilledActivityId, prefilledBarrierId, prefilledStyleIds]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith("student.")) {
      const studentField = name.split(".")[1];
      setIntervention(prev => ({
        ...prev,
        student: {
          ...prev.student,
          [studentField]: value
        }
      }));
    } else {
      setIntervention(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIntervention(prev => ({
      ...prev,
      date: new Date(e.target.value)
    }));
  };
  
  const handleBarrierToggle = (barrierId: string) => {
    setIntervention(prev => {
      const barriers = prev.barriers.includes(barrierId)
        ? prev.barriers.filter(id => id !== barrierId)
        : [...prev.barriers, barrierId];
      return { ...prev, barriers };
    });
  };
  
  const handleStyleToggle = (styleId: string) => {
    setIntervention(prev => {
      const learningStyles = prev.learningStyles.includes(styleId)
        ? prev.learningStyles.filter(id => id !== styleId)
        : [...prev.learningStyles, styleId];
      return { ...prev, learningStyles };
    });
  };
  
  const handleActivitySelect = (activityId: string) => {
    const selectedActivity = activities.find(a => a.id === activityId);
    if (selectedActivity) {
      setIntervention(prev => ({
        ...prev,
        activity: activityId,
        barriers: selectedActivity.barriers,
        learningStyles: selectedActivity.learningStyles
      }));
      setActivitySelectOpen(false);
    }
  };
  
  const getActivityName = (id: string) => {
    const activity = activities.find(a => a.id === id);
    return activity ? activity.name : "Seleccionar actividad";
  };
  
  const getBarrierName = (id: string) => {
    const barrier = barriers.find(b => b.id === id);
    return barrier ? barrier.name : "Desconocido";
  };
  
  const getStyleName = (id: string) => {
    const style = learningStyles.find(s => s.id === id);
    return style ? style.name : "Desconocido";
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!intervention.teacherName.trim() || !intervention.student.name.trim() ||
        !intervention.student.grade.trim() || !intervention.activity ||
        intervention.barriers.length === 0 || intervention.learningStyles.length === 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }
    
    if (isEditing) {
      // Update existing intervention
      setInterventions(prev => prev.map(i => i.id === id ? intervention : i));
    } else {
      // Add new intervention
      setInterventions(prev => [...prev, intervention]);
    }
    
    toast({
      title: "Éxito",
      description: isEditing ? "Intervención actualizada correctamente" : "Intervención creada correctamente"
    });
    navigate("/intervenciones");
  };
  
  // Format date for input
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link to="/intervenciones">
              <ArrowLeft size={18} className="mr-2" /> Volver
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? "Editar Intervención" : "Nueva Intervención"}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="teacherName">Nombre del Docente*</Label>
                  <Input 
                    id="teacherName" 
                    name="teacherName" 
                    value={intervention.teacherName} 
                    onChange={handleChange} 
                    placeholder="Ej: María González" 
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="date">Fecha de la Intervención*</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={formatDateForInput(intervention.date)} 
                    onChange={handleDateChange} 
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="studentName">Nombre del Estudiante*</Label>
                  <Input 
                    id="studentName" 
                    name="student.name" 
                    value={intervention.student.name} 
                    onChange={handleChange} 
                    placeholder="Ej: Juan Pérez" 
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="studentGrade">Grado/Curso*</Label>
                  <Input 
                    id="studentGrade" 
                    name="student.grade" 
                    value={intervention.student.grade} 
                    onChange={handleChange} 
                    placeholder="Ej: 4to Básico" 
                    className="mt-1"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="block mb-1">Actividad*</Label>
                  <Sheet open={activitySelectOpen} onOpenChange={setActivitySelectOpen}>
                    <SheetTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between"
                        type="button"
                      >
                        <span>{intervention.activity ? getActivityName(intervention.activity) : "Seleccionar actividad"}</span>
                        <Plus size={16} />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Seleccionar Actividad</SheetTitle>
                        <SheetDescription>
                          Selecciona una actividad para la intervención
                        </SheetDescription>
                      </SheetHeader>
                      
                      <div className="py-6 space-y-3">
                        <RadioGroup value={intervention.activity}>
                          {activities.map(activity => (
                            <div 
                              key={activity.id} 
                              className="flex items-start space-x-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleActivitySelect(activity.id)}
                            >
                              <RadioGroupItem value={activity.id} id={`activity-${activity.id}`} className="mt-1" />
                              <div>
                                <Label 
                                  htmlFor={`activity-${activity.id}`}
                                  className="font-medium cursor-pointer"
                                >
                                  {activity.name}
                                </Label>
                                <p className="text-sm text-gray-500 mt-1">{activity.objective}</p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                
                <div>
                  <Label className="block mb-2">Barreras de Aprendizaje*</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {barriers.map((barrier) => (
                      <div key={barrier.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`barrier-${barrier.id}`} 
                          checked={intervention.barriers.includes(barrier.id)} 
                          onCheckedChange={() => handleBarrierToggle(barrier.id)}
                        />
                        <label 
                          htmlFor={`barrier-${barrier.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {barrier.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="block mb-2">Estilos de Aprendizaje*</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {learningStyles.map((style) => (
                      <div key={style.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`style-${style.id}`} 
                          checked={intervention.learningStyles.includes(style.id)} 
                          onCheckedChange={() => handleStyleToggle(style.id)}
                        />
                        <label 
                          htmlFor={`style-${style.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {style.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea 
                id="observations" 
                name="observations"
                value={intervention.observations} 
                onChange={handleChange} 
                placeholder="Ingrese observaciones adicionales sobre la intervención..." 
                rows={5}
                className="mt-1"
              />
            </div>
            
            <div className="mt-8 flex justify-end space-x-2">
              <Button variant="outline" type="button" asChild>
                <Link to="/intervenciones">Cancelar</Link>
              </Button>
              <Button type="submit">
                <Save size={18} className="mr-2" />
                {isEditing ? "Actualizar Intervención" : "Crear Intervención"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterventionForm;
