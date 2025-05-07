import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Save, Trash2, X, Loader2, Clock, BookOpen, ListChecks, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Activity {
  id: string;
  name: string;
  objective: string;
  materials: string[];
  barriers: string[];
  learningStyles: string[];
  development: {
    description: string;
    steps: {
      id: string;
      description: string;
      durationMin: number;
      durationMax: number;
      durationUnit: "minutos" | "horas";
    }[];
  };
}

interface Barrier {
  id: string;
  name: string;
}

interface LearningStyle {
  id: string;
  name: string;
}

interface ActivityFormProps {
  isIntervention?: boolean;
}

const ActivityForm = ({ isIntervention = false }: ActivityFormProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!id;
  
  const [barriers, setBarriers] = useState<Barrier[]>([]);
  const [learningStyles, setLearningStyles] = useState<LearningStyle[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [activity, setActivity] = useState<Activity>({
    id: crypto.randomUUID(),
    name: "",
    objective: "",
    materials: [""],
    barriers: [],
    learningStyles: [],
    development: {
      description: "",
      steps: [
        {
          id: crypto.randomUUID(),
          description: "",
          durationMin: 5,
          durationMax: 10,
          durationUnit: "minutos"
        }
      ]
    }
  });

  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState("");
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState({
    id: "",
    description: "",
    durationMin: 5,
    durationMax: 10,
    durationUnit: "minutos" as "minutos" | "horas"
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  
  // Función para cargar los datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Cargar barreras
        const { data: barriersData, error: barriersError } = await supabase
          .from("barriers")
          .select("id, name")
          .order("name");
          
        if (barriersError) throw barriersError;
        setBarriers(barriersData || []);
        
        // Cargar estilos de aprendizaje
        const { data: stylesData, error: stylesError } = await supabase
          .from("learning_styles")
          .select("id, name")
          .order("name");
          
        if (stylesError) throw stylesError;
        setLearningStyles(stylesData || []);
        
        // Cargar actividades
        const { data: activitiesData, error: activitiesError } = await supabase
          .from("activities")
          .select("*");
          
        if (activitiesError) throw activitiesError;
        
        // Procesar las actividades para manejar las relaciones
        if (activitiesData) {
          const processedActivities = activitiesData.map(act => {
            // Asegurar que materials sea un array de strings
            let materials: string[] = [];
            if (Array.isArray(act.materials)) {
              materials = act.materials.map(m => String(m));
            } else if (typeof act.materials === 'string') {
              try {
                const parsed = JSON.parse(act.materials);
                materials = Array.isArray(parsed) ? parsed.map(m => String(m)) : [];
              } catch (e) {
                materials = [];
              }
            }
            
            // Manejar development
            let development = {
              description: "",
              steps: [] as Array<{
                id: string;
                description: string;
                durationMin: number;
                durationMax: number;
                durationUnit: "minutos" | "horas";
              }>
            };
            
            if (typeof act.development === 'object' && act.development !== null) {
              const dev = act.development as any;
              development = {
                description: dev.description || "",
                steps: Array.isArray(dev.steps) ? dev.steps : []
              };
            } else if (typeof act.development === 'string') {
              try {
                const parsed = JSON.parse(act.development);
                development = {
                  description: parsed.description || "",
                  steps: Array.isArray(parsed.steps) ? parsed.steps : []
                };
              } catch (e) {
                console.error('Error parsing development JSON', e);
              }
            }
            
            return {
              ...act,
              materials,
              development,
              barriers: [], // Se cargarán después
              learningStyles: [] // Se cargarán después
            } as Activity;
          });
          
          setActivities(processedActivities);
          
          // Si estamos editando, cargar la actividad específica
          if (isEditing && id) {
            const currentActivity = processedActivities.find(a => a.id === id);
            if (currentActivity) {
              // Cargar las barreras de esta actividad
              const { data: activityBarriers, error: abError } = await supabase
                .from("activity_barriers")
                .select("barrier_id")
                .eq("activity_id", id);
                
              if (abError) throw abError;
              
              // Cargar los estilos de aprendizaje de esta actividad
              const { data: activityStyles, error: asError } = await supabase
                .from("activity_learning_styles")
                .select("learning_style_id")
                .eq("activity_id", id);
                
              if (asError) throw asError;
              
              // Establecer la actividad con todas sus relaciones
              setActivity({
                ...currentActivity,
                barriers: activityBarriers?.map(ab => ab.barrier_id) || [],
                learningStyles: activityStyles?.map(as => as.learning_style_id) || []
              });
            } else {
              // Si no se encuentra la actividad, redirigir
              toast({
                title: "Error",
                description: "Actividad no encontrada",
                variant: "destructive"
              });
              navigate("/actividades");
            }
          }
        }
      } catch (error: any) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Error al cargar los datos necesarios",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditing, navigate, toast]);

  const handleDurationUnitChange = (value: string) => {
    setCurrentStep(prev => {
      const durationUnit = value === "horas" ? "horas" : "minutos";
      return {
        ...prev,
        durationUnit
      };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setActivity(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDevelopmentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setActivity(prev => ({
      ...prev,
      development: {
        ...prev.development,
        description: e.target.value
      }
    }));
  };

  const handleBarrierToggle = (barrierId: string) => {
    setActivity(prev => {
      const barriers = prev.barriers.includes(barrierId)
        ? prev.barriers.filter(id => id !== barrierId)
        : [...prev.barriers, barrierId];
      return { ...prev, barriers };
    });
  };

  const handleStyleToggle = (styleId: string) => {
    setActivity(prev => {
      const learningStyles = prev.learningStyles.includes(styleId)
        ? prev.learningStyles.filter(id => id !== styleId)
        : [...prev.learningStyles, styleId];
      return { ...prev, learningStyles };
    });
  };

  const handleAddMaterial = () => {
    if (currentMaterial.trim()) {
      setActivity(prev => ({
        ...prev,
        materials: [...prev.materials.filter(m => m.trim()), currentMaterial.trim()]
      }));
      setCurrentMaterial("");
      setMaterialDialogOpen(false);
      toast({
        description: "Material añadido correctamente"
      });
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setActivity(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const openStepDialog = (step?: typeof activity.development.steps[0], index?: number) => {
    if (step) {
      setCurrentStep({
        ...step,
        durationUnit: step.durationUnit as "minutos" | "horas"
      });
      setCurrentStepIndex(index || -1);
    } else {
      setCurrentStep({
        id: crypto.randomUUID(),
        description: "",
        durationMin: 5,
        durationMax: 10,
        durationUnit: "minutos"
      });
      setCurrentStepIndex(-1);
    }
    setStepDialogOpen(true);
  };

  const handleStepChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentStep(prev => ({
      ...prev,
      [name]: name === "durationMin" || name === "durationMax" ? Number(value) : value
    }));
  };

  const handleSaveStep = () => {
    if (currentStep.description.trim()) {
      setActivity(prev => {
        const newSteps = [...prev.development.steps];
        
        if (currentStepIndex >= 0) {
          newSteps[currentStepIndex] = {
            ...currentStep,
            durationUnit: currentStep.durationUnit as "minutos" | "horas"
          };
        } else {
          newSteps.push({
            ...currentStep,
            durationUnit: currentStep.durationUnit as "minutos" | "horas"
          });
        }
        
        return {
          ...prev,
          development: {
            ...prev.development,
            steps: newSteps
          }
        };
      });
      
      setStepDialogOpen(false);
      toast({
        description: currentStepIndex >= 0 ? "Paso actualizado correctamente" : "Paso añadido correctamente"
      });
    } else {
      toast({
        variant: "destructive",
        description: "La descripción del paso es obligatoria"
      });
    }
  };

  const handleRemoveStep = (index: number) => {
    setActivity(prev => ({
      ...prev,
      development: {
        ...prev.development,
        steps: prev.development.steps.filter((_, i) => i !== index)
      }
    }));
    
    toast({
      description: "Paso eliminado"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    const missingFields = [];
    if (!activity.name.trim()) missingFields.push("Nombre de la actividad");
    if (!activity.objective.trim()) missingFields.push("Objetivo pedagógico");
    if (activity.barriers.length === 0) missingFields.push("Barreras de aprendizaje");
    if (activity.learningStyles.length === 0) missingFields.push("Estilos de aprendizaje");
    if (!activity.development.description.trim()) missingFields.push("Descripción del desarrollo");
    if (activity.development.steps.length === 0) missingFields.push("Pasos del desarrollo");
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos requeridos",
        description: `Por favor completa: ${missingFields.join(", ")}`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Preparar los datos para guardar
      const activityData = {
        name: activity.name,
        objective: activity.objective,
        materials: activity.materials.filter(m => m.trim()),
        development: activity.development,
        created_by: user?.id || ''
      };
      
      let activityId = activity.id;
      
      if (isEditing) {
        // Actualizar la actividad
        const { error } = await supabase
          .from("activities")
          .update(activityData)
          .eq("id", id);
          
        if (error) throw error;
      } else {
        // Crear nueva actividad
        const { data, error } = await supabase
          .from("activities")
          .insert([activityData])
          .select()
          .single();
          
        if (error) throw error;
        if (data) activityId = data.id;
      }
      
      // Primero eliminamos las relaciones existentes si es una edición
      if (isEditing) {
        await supabase
          .from("activity_barriers")
          .delete()
          .eq("activity_id", activityId);
          
        await supabase
          .from("activity_learning_styles")
          .delete()
          .eq("activity_id", activityId);
      }
      
      // Insertar barreras relacionadas
      if (activity.barriers.length > 0) {
        const barrierRows = activity.barriers.map(barrierId => ({
          activity_id: activityId,
          barrier_id: barrierId
        }));
        
        const { error: barrierError } = await supabase
          .from("activity_barriers")
          .insert(barrierRows);
          
        if (barrierError) throw barrierError;
      }
      
      // Insertar estilos de aprendizaje relacionados
      if (activity.learningStyles.length > 0) {
        const styleRows = activity.learningStyles.map(styleId => ({
          activity_id: activityId,
          learning_style_id: styleId
        }));
        
        const { error: styleError } = await supabase
          .from("activity_learning_styles")
          .insert(styleRows);
          
        if (styleError) throw styleError;
      }
      
      toast({
        title: "Éxito",
        description: isEditing ? "Actividad actualizada correctamente" : "Actividad creada correctamente"
      });
      
      navigate("/actividades");
    } catch (error: any) {
      console.error("Error saving activity:", error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar la actividad",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Helpers para el diseño 
  const getBarrierById = (id: string) => barriers.find(b => b.id === id);
  const getStyleById = (id: string) => learningStyles.find(s => s.id === id);
  
  // Asignamos un color diferente a cada estilo
  const styleColors = {
    "Visual": "bg-blue-100 text-blue-800",
    "Auditivo": "bg-purple-100 text-purple-800",
    "Kinestésico": "bg-green-100 text-green-800",
    "Lector/Escritor": "bg-amber-100 text-amber-800"
  };

  const getStyleColor = (styleName: string) => {
    // @ts-ignore
    return styleColors[styleName] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center flex-1">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" asChild className="mr-4">
            <Link to="/actividades">
              <ArrowLeft size={18} className="mr-2" /> Volver
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {isEditing ? "Editar Actividad" : "Nueva Actividad"}
          </h1>
        </div>

          <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Información General
                </CardTitle>
                <CardDescription>
                  Proporciona la información básica sobre la actividad educativa
                </CardDescription>
              </CardHeader>
              
              <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nombre de la Actividad<span className="text-red-500">*</span>
                      </Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={activity.name} 
                    onChange={handleChange} 
                    placeholder="Ej: Aritmética en la Vida Real" 
                    className="mt-1"
                  />
                </div>
                
                <div>
                      <Label htmlFor="objective" className="text-sm font-medium">
                        Objetivo Pedagógico<span className="text-red-500">*</span>
                      </Label>
                  <Textarea 
                    id="objective" 
                    name="objective" 
                    value={activity.objective} 
                    onChange={handleChange} 
                    placeholder="Ej: Aplicar el cálculo a situaciones cotidianas para mejorar su comprensión" 
                    className="mt-1"
                        rows={4}
                  />
                    </div>
                </div>
                
                  <div className="space-y-6">
                <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">
                          Barreras de Aprendizaje<span className="text-red-500">*</span>
                          <span className="ml-2 inline-block text-xs text-gray-500">
                            (Seleccionadas: {activity.barriers.length})
                          </span>
                        </Label>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md border max-h-40 overflow-y-auto">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {activity.barriers.map(barrierId => {
                            const barrier = getBarrierById(barrierId);
                            return barrier ? (
                              <Badge 
                                key={barrierId} 
                                variant="secondary"
                                className="bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer"
                                onClick={() => handleBarrierToggle(barrierId)}
                              >
                                {barrier.name}
                                <X className="ml-1 h-3 w-3" />
                              </Badge>
                            ) : null;
                          })}
                          {activity.barriers.length === 0 && (
                            <span className="text-sm text-gray-500 italic">
                              No hay barreras seleccionadas
                            </span>
                          )}
              </div>
              
                        <div className="border-t pt-2 mt-2">
                          <p className="text-xs font-medium text-gray-500 mb-2">Seleccionar barreras:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {barriers
                              .filter(barrier => !activity.barriers.includes(barrier.id))
                              .map((barrier) => (
                      <div key={barrier.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`barrier-${barrier.id}`} 
                          checked={activity.barriers.includes(barrier.id)} 
                          onCheckedChange={() => handleBarrierToggle(barrier.id)}
                        />
                        <label 
                          htmlFor={`barrier-${barrier.id}`}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {barrier.name}
                        </label>
                      </div>
                    ))}
                          </div>
                        </div>
                  </div>
                </div>
                
                <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">
                          Estilos de Aprendizaje<span className="text-red-500">*</span>
                          <span className="ml-2 inline-block text-xs text-gray-500">
                            (Seleccionados: {activity.learningStyles.length})
                          </span>
                        </Label>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md border max-h-40 overflow-y-auto">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {activity.learningStyles.map(styleId => {
                            const style = getStyleById(styleId);
                            return style ? (
                              <Badge 
                                key={styleId} 
                                variant="secondary"
                                className={`hover:bg-opacity-80 cursor-pointer ${getStyleColor(style.name)}`}
                                onClick={() => handleStyleToggle(styleId)}
                              >
                                {style.name}
                                <X className="ml-1 h-3 w-3" />
                              </Badge>
                            ) : null;
                          })}
                          {activity.learningStyles.length === 0 && (
                            <span className="text-sm text-gray-500 italic">
                              No hay estilos seleccionados
                            </span>
                          )}
                        </div>
                        
                        <div className="border-t pt-2 mt-2">
                          <p className="text-xs font-medium text-gray-500 mb-2">Seleccionar estilos:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {learningStyles
                              .filter(style => !activity.learningStyles.includes(style.id))
                              .map((style) => (
                      <div key={style.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`style-${style.id}`} 
                          checked={activity.learningStyles.includes(style.id)} 
                          onCheckedChange={() => handleStyleToggle(style.id)}
                        />
                        <label 
                          htmlFor={`style-${style.id}`}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {style.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Materiales Necesarios
                </CardTitle>
                <CardDescription>
                  Indica los materiales que se necesitarán para realizar la actividad
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {activity.materials.filter(m => m.trim()).length > 0 ? (
                    <div className="space-y-2">
                      {activity.materials.filter(m => m.trim()).map((material, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <span className="text-sm">{material}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveMaterial(index)}
                            className="h-7 w-7 p-0 rounded-full"
                          >
                            <X size={16} className="text-gray-500" />
                            <span className="sr-only">Eliminar material</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-500">No hay materiales agregados</p>
                    </div>
                  )}
                  
                  <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                      >
                        <Plus size={16} className="mr-2" /> Añadir Material
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Añadir Material</DialogTitle>
                        <DialogDescription>
                          Introduce el material necesario para esta actividad
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="material">Material</Label>
                        <Input
                          id="material"
                          value={currentMaterial}
                          onChange={(e) => setCurrentMaterial(e.target.value)}
                          placeholder="Ej: Calculadora, lápices de colores, etc."
                          className="mt-1"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddMaterial}>
                          Guardar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" />
                  Desarrollo de la Actividad
                </CardTitle>
                <CardDescription>
                  Describe cómo se llevará a cabo la actividad educativa
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="development" className="text-sm font-medium">
                      Descripción General<span className="text-red-500">*</span>
                    </Label>
              <Textarea 
                id="development" 
                value={activity.development.description} 
                onChange={handleDevelopmentChange} 
                placeholder="Describe el desarrollo general de la actividad" 
                className="mt-1"
                rows={4}
              />
            </div>
            
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">
                        Pasos del Desarrollo<span className="text-red-500">*</span>
                      </Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                        onClick={() => openStepDialog()}
                        className="h-8"
                >
                  <Plus size={16} className="mr-2" /> Añadir Paso
                </Button>
              </div>
              
                    {activity.development.steps.length > 0 ? (
              <div className="space-y-3">
                {activity.development.steps.map((step, index) => (
                          <div key={step.id} className="bg-gray-50 p-3 rounded-md border">
                            <div className="flex items-start gap-3">
                              <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {index + 1}
                          </div>
                              <div className="flex-grow">
                                <p className="text-sm font-medium text-gray-800">{step.description}</p>
                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                  <Clock size={14} className="mr-1 flex-shrink-0" />
                                  <span>
                          Duración: {step.durationMin} - {step.durationMax} {step.durationUnit}
                                  </span>
                        </div>
                      </div>
                              <div className="flex gap-1 ml-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                                        onClick={() => openStepDialog(step, index)}
                                        className="h-7 w-7 p-0 rounded-full"
                                      >
                                        <svg 
                                          xmlns="http://www.w3.org/2000/svg" 
                                          width="15" 
                                          height="15" 
                                          viewBox="0 0 24 24" 
                                          fill="none" 
                                          stroke="currentColor" 
                                          strokeWidth="2" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round" 
                                          className="text-gray-500"
                                        >
                                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                          <path d="m15 5 4 4"/>
                                        </svg>
                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar paso</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveStep(index)}
                                        className="h-7 w-7 p-0 rounded-full text-destructive hover:text-destructive"
                        >
                                        <Trash2 size={16} />
                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Eliminar paso</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                      </div>
                    </div>
                  </div>
                ))}
                      </div>
                    ) : (
                      <div className="text-center p-6 bg-gray-50 rounded-md border border-dashed">
                        <p className="text-sm text-gray-500 mb-3">No hay pasos definidos para esta actividad</p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => openStepDialog()}
                          size="sm"
                        >
                          <Plus size={16} className="mr-2" /> Añadir Primer Paso
                        </Button>
                      </div>
                    )}
                  </div>
              </div>
              
                <Dialog open={stepDialogOpen} onOpenChange={setStepDialogOpen}>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{currentStepIndex >= 0 ? "Editar Paso" : "Añadir Paso"}</DialogTitle>
                      <DialogDescription>
                      {currentStepIndex >= 0 
                        ? "Modifica los detalles de este paso" 
                        : "Introduce los detalles para este paso de la actividad"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="step-description" className="text-sm font-medium">
                          Descripción del Paso<span className="text-red-500">*</span>
                        </Label>
                      <Textarea
                        id="step-description"
                        name="description"
                        value={currentStep.description}
                        onChange={handleStepChange}
                        placeholder="Ej: Introducción a la importancia del cálculo diario"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    
                      <div>
                        <Label className="text-sm font-medium">Duración Estimada</Label>
                        <div className="grid grid-cols-5 gap-3 mt-1">
                          <div className="col-span-2">
                        <Input
                          id="durationMin"
                          name="durationMin"
                          type="number"
                          min={1}
                          value={currentStep.durationMin}
                          onChange={handleStepChange}
                              className="w-full"
                              placeholder="Min."
                        />
                      </div>
                          <div className="flex items-center justify-center">
                            <span className="text-gray-500">a</span>
                          </div>
                          <div className="col-span-2">
                        <Input
                          id="durationMax"
                          name="durationMax"
                          type="number"
                          min={1}
                          value={currentStep.durationMax}
                          onChange={handleStepChange}
                              className="w-full"
                              placeholder="Max."
                        />
                          </div>
                      </div>
                    </div>
                    
                    <div>
                        <Label htmlFor="durationUnit" className="text-sm font-medium">
                          Unidad de Tiempo
                        </Label>
                        <Select 
                        value={currentStep.durationUnit}
                          onValueChange={handleDurationUnitChange}
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue placeholder="Seleccionar unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minutos">Minutos</SelectItem>
                            <SelectItem value="horas">Horas</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                  </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setStepDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveStep}>
                      Guardar Paso
                    </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-3 mt-8">
              <Button 
                variant="outline" 
                type="button" 
                asChild
              >
                <Link to="/actividades">Cancelar</Link>
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="min-w-[140px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                  <Save size={18} className="mr-2" />
                    {isEditing ? "Actualizar" : "Guardar"}
                  </>
                )}
              </Button>
            </div>
            </div>
          </form>
      </div>
    </div>
  );
};

export default ActivityForm;
