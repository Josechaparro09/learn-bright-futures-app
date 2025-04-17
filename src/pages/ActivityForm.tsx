
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Save, Trash2, X } from "lucide-react";
import { Activity, barriers, learningStyles, activities as initialActivities } from "@/data/sampleData";

interface ActivityFormProps {
  isIntervention?: boolean;
}

const ActivityForm = ({ isIntervention = false }: ActivityFormProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;
  
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
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

  const [materialSheetOpen, setMaterialSheetOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState("");
  const [stepSheetOpen, setStepSheetOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState({
    id: "",
    description: "",
    durationMin: 5,
    durationMax: 10,
    durationUnit: "minutos" as "minutos" | "horas" // Fix: type assertion to allowed values
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  // Load activity data if editing
  useEffect(() => {
    if (isEditing) {
      const existingActivity = activities.find(a => a.id === id);
      if (existingActivity) {
        setActivity(existingActivity);
      } else {
        toast({
          title: "Error",
          description: "Actividad no encontrada",
          variant: "destructive"
        });
        navigate("/actividades");
      }
    }
  }, [id, isEditing, activities, navigate, toast]);

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
        materials: [...prev.materials, currentMaterial.trim()]
      }));
      setCurrentMaterial("");
      setMaterialSheetOpen(false);
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

  const openStepSheet = (step?: typeof activity.development.steps[0], index?: number) => {
    if (step) {
      setCurrentStep({
        ...step,
        durationUnit: step.durationUnit as "minutos" | "horas" // Fix: ensure proper type
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
    setStepSheetOpen(true);
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
          // Edit existing step
          newSteps[currentStepIndex] = {
            ...currentStep,
            durationUnit: currentStep.durationUnit as "minutos" | "horas" // Fix: ensure proper type
          };
        } else {
          // Add new step
          newSteps.push({
            ...currentStep,
            durationUnit: currentStep.durationUnit as "minutos" | "horas" // Fix: ensure proper type
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
      
      setStepSheetOpen(false);
      toast({
        description: currentStepIndex >= 0 ? "Paso actualizado correctamente" : "Paso añadido correctamente"
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!activity.name.trim() || !activity.objective.trim() || 
        activity.barriers.length === 0 || activity.learningStyles.length === 0 ||
        !activity.development.description.trim() || activity.development.steps.length === 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }
    
    if (isEditing) {
      // Update existing activity
      setActivities(prev => prev.map(a => a.id === id ? activity : a));
    } else {
      // Add new activity
      setActivities(prev => [...prev, activity]);
    }
    
    toast({
      title: "Éxito",
      description: isEditing ? "Actividad actualizada correctamente" : "Actividad creada correctamente"
    });
    navigate("/actividades");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link to="/actividades">
              <ArrowLeft size={18} className="mr-2" /> Volver
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? "Editar Actividad" : "Nueva Actividad"}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre de la Actividad*</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={activity.name} 
                    onChange={handleChange} 
                    placeholder="Ej: Aritmética en la Vida Real" 
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="objective">Objetivo Pedagógico*</Label>
                  <Textarea 
                    id="objective" 
                    name="objective" 
                    value={activity.objective} 
                    onChange={handleChange} 
                    placeholder="Ej: Aplicar el cálculo a situaciones cotidianas para mejorar su comprensión" 
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label className="block mb-2">Materiales Necesarios*</Label>
                  <div className="space-y-2">
                    {activity.materials.filter(m => m.trim()).map((material, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <span>{material}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveMaterial(index)}
                        >
                          <X size={16} className="text-gray-500" />
                        </Button>
                      </div>
                    ))}
                    
                    <Sheet open={materialSheetOpen} onOpenChange={setMaterialSheetOpen}>
                      <SheetTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="w-full mt-2">
                          <Plus size={16} className="mr-2" /> Añadir Material
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Añadir Material</SheetTitle>
                          <SheetDescription>
                            Introduce el material necesario para esta actividad
                          </SheetDescription>
                        </SheetHeader>
                        <div className="py-6">
                          <Label htmlFor="material">Material</Label>
                          <Input
                            id="material"
                            value={currentMaterial}
                            onChange={(e) => setCurrentMaterial(e.target.value)}
                            placeholder="Ej: Calculadora"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setMaterialSheetOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddMaterial}>
                            Guardar Material
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="block mb-2">Barreras de Aprendizaje*</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {barriers.map((barrier) => (
                      <div key={barrier.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`barrier-${barrier.id}`} 
                          checked={activity.barriers.includes(barrier.id)} 
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
                          checked={activity.learningStyles.includes(style.id)} 
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
            
            <div className="mt-8">
              <Label htmlFor="development">Descripción del Desarrollo*</Label>
              <Textarea 
                id="development" 
                value={activity.development.description} 
                onChange={handleDevelopmentChange} 
                placeholder="Describe el desarrollo general de la actividad" 
                className="mt-1"
                rows={4}
                required
              />
            </div>
            
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <Label>Pasos del Desarrollo*</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openStepSheet()}
                >
                  <Plus size={16} className="mr-2" /> Añadir Paso
                </Button>
              </div>
              
              <div className="space-y-3">
                {activity.development.steps.map((step, index) => (
                  <div key={step.id} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center">
                          <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                            {index + 1}
                          </div>
                          <h4 className="font-medium">{step.description}</h4>
                        </div>
                        <div className="ml-9 text-sm text-gray-500 mt-1">
                          Duración: {step.durationMin} - {step.durationMax} {step.durationUnit}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openStepSheet(step, index)}
                        >
                          Editar
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveStep(index)}
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Sheet open={stepSheetOpen} onOpenChange={setStepSheetOpen}>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>{currentStepIndex >= 0 ? "Editar Paso" : "Añadir Paso"}</SheetTitle>
                    <SheetDescription>
                      {currentStepIndex >= 0 
                        ? "Modifica los detalles de este paso" 
                        : "Introduce los detalles para este paso de la actividad"}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 space-y-4">
                    <div>
                      <Label htmlFor="step-description">Descripción del Paso</Label>
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
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="durationMin">Duración Mínima</Label>
                        <Input
                          id="durationMin"
                          name="durationMin"
                          type="number"
                          min={1}
                          value={currentStep.durationMin}
                          onChange={handleStepChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="durationMax">Duración Máxima</Label>
                        <Input
                          id="durationMax"
                          name="durationMax"
                          type="number"
                          min={1}
                          value={currentStep.durationMax}
                          onChange={handleStepChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="durationUnit">Unidad de Tiempo</Label>
                      <select
                        id="durationUnit"
                        name="durationUnit"
                        value={currentStep.durationUnit}
                        onChange={(e) => setCurrentStep(prev => ({ ...prev, durationUnit: e.target.value }))}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      >
                        <option value="minutos">Minutos</option>
                        <option value="horas">Horas</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setStepSheetOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveStep}>
                      Guardar Paso
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            <div className="mt-8 flex justify-end space-x-2">
              <Button variant="outline" type="button" asChild>
                <Link to="/actividades">Cancelar</Link>
              </Button>
              <Button type="submit">
                <Save size={18} className="mr-2" />
                {isEditing ? "Actualizar Actividad" : "Crear Actividad"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ActivityForm;
