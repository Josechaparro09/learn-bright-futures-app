import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tables } from "database.types";
import Navbar from "@/components/Navbar";
import ActivityAIGenerator from "@/components/ActivityAIGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BookOpen, CheckCircle2, CircleSlash, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import StudentSelector, { Student } from "@/components/StudentSelector";

// Tipo extendido para asegurar compatibilidad con learning_styles
type LearningStyle = {
  id: string;
  name: string;
  description: string;
  color: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
};

const AIAssistant = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Estados
  const [barriers, setBarriers] = useState<Tables<'barriers'>[]>([]);
  const [selectedBarriers, setSelectedBarriers] = useState<Tables<'barriers'>[]>([]);
  const [learningStyles, setLearningStyles] = useState<LearningStyle[]>([]);
  const [selectedLearningStyles, setSelectedLearningStyles] = useState<LearningStyle[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cargar barreras y estilos de aprendizaje
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Obtener barreras
        const { data: barriersData, error: barriersError } = await supabase
          .from('barriers')
          .select('*');
        
        if (barriersError) throw barriersError;
        setBarriers(barriersData || []);
        
        // Obtener estilos de aprendizaje
        const { data: stylesData, error: stylesError } = await supabase
          .from('learning_styles')
          .select('*');
          
        if (stylesError) throw stylesError;
        
        // Asegurarse de que todos los campos existan
        const formattedStyles = (stylesData || []).map(style => ({
          id: style.id,
          name: style.name,
          description: style.description,
          color: (style as any).color || null,
          created_at: style.created_at,
          created_by: style.created_by,
          updated_at: style.updated_at
        }));
        
        setLearningStyles(formattedStyles);
        
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos. Inténtalo de nuevo.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Manejar selección de barrera
  const handleBarrierToggle = (barrier: Tables<'barriers'>) => {
    if (selectedBarriers.some(b => b.id === barrier.id)) {
      setSelectedBarriers(selectedBarriers.filter(b => b.id !== barrier.id));
    } else {
      setSelectedBarriers([...selectedBarriers, barrier]);
    }
  };
  
  // Manejar selección de estilo de aprendizaje
  const handleLearningStyleToggle = (style: LearningStyle) => {
    if (selectedLearningStyles.some(s => s.id === style.id)) {
      setSelectedLearningStyles(selectedLearningStyles.filter(s => s.id !== style.id));
    } else {
      setSelectedLearningStyles([...selectedLearningStyles, style]);
    }
  };
  
  // Manejar actividad generada
  const handleActivityGenerated = (activity: any) => {
    toast({
      title: "Actividad guardada",
      description: `La actividad "${activity.name}" ha sido guardada exitosamente.`,
    });
    
    // Navegar a la página de actividades después de un breve retraso
    setTimeout(() => {
      navigate('/actividades');
    }, 2000);
  };
  
  // Manejar cambio de estudiante
  const handleStudentChange = (student: Student) => {
    setSelectedStudent(student);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Asistente de IA</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Selecciones</CardTitle>
                <CardDescription>Selecciona barreras, estilos y estudiante</CardDescription>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="barriers">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="barriers" className="flex-1">Barreras</TabsTrigger>
                    <TabsTrigger value="styles" className="flex-1">Estilos</TabsTrigger>
                    <TabsTrigger value="student" className="flex-1">Estudiante</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="barriers">
                    <div className="space-y-3">
                      <Label>Selecciona barreras de aprendizaje</Label>
                      <ScrollArea className="h-[300px] rounded-md border p-2">
                        <div className="space-y-2">
                          {barriers.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                              No hay barreras registradas
                            </p>
                          ) : (
                            barriers.map(barrier => (
                              <div key={barrier.id} className="flex items-start space-x-2">
                                <Button
                                  variant={selectedBarriers.some(b => b.id === barrier.id) ? "default" : "outline"}
                                  size="sm"
                                  className="w-full justify-start h-auto py-2"
                                  onClick={() => handleBarrierToggle(barrier)}
                                >
                                  <div>
                                    <p className="font-medium text-left">{barrier.name}</p>
                                    <p className="text-xs text-left text-muted-foreground mt-1">
                                      {barrier.description}
                                    </p>
                                  </div>
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                      
                      <div className="pt-2">
                        <p className="text-sm">
                          {selectedBarriers.length} barreras seleccionadas
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="styles">
                    <div className="space-y-3">
                      <Label>Selecciona estilos de aprendizaje</Label>
                      <ScrollArea className="h-[300px] rounded-md border p-2">
                        <div className="space-y-2">
                          {learningStyles.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                              No hay estilos de aprendizaje registrados
                            </p>
                          ) : (
                            learningStyles.map(style => (
                              <div key={style.id} className="flex items-start space-x-2">
                                <Button
                                  variant={selectedLearningStyles.some(s => s.id === style.id) ? "default" : "outline"}
                                  size="sm"
                                  className="w-full justify-start h-auto py-2"
                                  onClick={() => handleLearningStyleToggle(style)}
                                >
                                  <div>
                                    <p className="font-medium text-left">{style.name}</p>
                                    <p className="text-xs text-left text-muted-foreground mt-1">
                                      {style.description}
                                    </p>
                                  </div>
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                      
                      <div className="pt-2">
                        <p className="text-sm">
                          {selectedLearningStyles.length} estilos seleccionados
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="student">
                    <div className="space-y-3">
                      <Label>Selecciona un estudiante (opcional)</Label>
                      <div className="rounded-md border p-3">
                        <StudentSelector 
                          selectedStudent={selectedStudent}
                          onStudentChange={handleStudentChange}
                        />
                        
                        <div className="mt-4 text-sm text-muted-foreground">
                          <Info className="h-4 w-4 inline mr-1" />
                          Al seleccionar un estudiante, la IA podrá personalizar
                          la actividad basándose en su historial de intervenciones.
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <Label>Resumen de selecciones</Label>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Barreras seleccionadas:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedBarriers.length === 0 ? (
                          <Badge variant="outline" className="border-red-200 text-red-500">
                            <CircleSlash className="h-3 w-3 mr-1" />
                            Ninguna seleccionada
                          </Badge>
                        ) : (
                          selectedBarriers.map(barrier => (
                            <Badge key={barrier.id} variant="outline">
                              {barrier.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Estilos seleccionados:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedLearningStyles.length === 0 ? (
                          <Badge variant="outline" className="border-red-200 text-red-500">
                            <CircleSlash className="h-3 w-3 mr-1" />
                            Ninguno seleccionado
                          </Badge>
                        ) : (
                          selectedLearningStyles.map(style => (
                            <Badge key={style.id} variant="outline">
                              {style.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Estudiante:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {!selectedStudent ? (
                          <Badge variant="outline" className="border-gray-200 text-gray-500">
                            No seleccionado (opcional)
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {selectedStudent.name} - {selectedStudent.grade}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  Asistente de IA
                </CardTitle>
                <CardDescription>
                  Genera actividades educativas personalizadas con inteligencia artificial
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
                    </div>
                  </div>
                ) : (
                  <ActivityAIGenerator
                    selectedBarriers={selectedBarriers}
                    selectedLearningStyles={selectedLearningStyles}
                    selectedStudentId={selectedStudent?.id}
                    onActivityGenerated={handleActivityGenerated}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAssistant; 