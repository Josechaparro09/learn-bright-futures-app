import { useEffect, useState, useRef } from "react";
import { Tables } from "database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Send, Check, AlertCircle, BookOpen, BarChart2, 
  Lightbulb, Sparkles, Clock, Brain, InfoIcon, X, Save, ListChecks,
  ClipboardList, LayoutList, PersonStanding
} from "lucide-react";
import { generateActivity } from "@/integrations/openai/service";
import { 
  ActivityGenerationParams, ChatMessage, GeneratedActivity, 
  ResponseStatistics 
} from "@/integrations/openai/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface LearningStyle {
  id: string;
  name: string;
  description: string;
  color: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
}

interface ActivityAIGeneratorProps {
  selectedBarriers: Tables<'barriers'>[];
  selectedLearningStyles: LearningStyle[];
  selectedStudentId?: string | null;
  onActivityGenerated: (activity: any) => void;
}

const ActivityAIGenerator = ({
  selectedBarriers,
  selectedLearningStyles,
  selectedStudentId,
  onActivityGenerated
}: ActivityAIGeneratorProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedActivity, setGeneratedActivity] = useState<GeneratedActivity | null>(null);
  const [responseStats, setResponseStats] = useState<ResponseStatistics | null>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("barriers"); // Para controlar la pestaña activa en móvil
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cargar información del estudiante si se proporciona un ID
  useEffect(() => {
    if (selectedStudentId) {
      const fetchStudentInfo = async () => {
        try {
          // Obtener información básica del estudiante
          const { data: student, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', selectedStudentId)
            .single();

          if (studentError) throw studentError;
          
          // Obtener intervenciones
          const { data: interventions, error: interventionsError } = await supabase
            .from('interventions')
            .select('*')
            .eq('student_id', selectedStudentId);
            
          if (interventionsError) throw interventionsError;
          
          // Obtener comentarios para esas intervenciones
          const interventionIds = interventions.map(i => i.id);
          const { data: comments, error: commentsError } = interventionIds.length > 0 
            ? await supabase
                .from('intervention_comments')
                .select('*')
                .in('intervention_id', interventionIds)
            : { data: [], error: null };
            
          if (commentsError) throw commentsError;
          
          setStudentInfo({
            ...student,
            interventions,
            comments
          });
          
        } catch (error) {
          console.error("Error al cargar información del estudiante:", error);
          toast({
            title: "Error",
            description: "No se pudo cargar la información del estudiante",
            variant: "destructive"
          });
        }
      };
      
      fetchStudentInfo();
    }
  }, [selectedStudentId, toast]);

  // Mantener scroll al final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Generar actividad con IA
  const handleGenerateActivity = async () => {
    if (selectedBarriers.length === 0 || selectedLearningStyles.length === 0) {
      toast({
        title: "Datos insuficientes",
        description: "Debes seleccionar al menos una barrera y un estilo de aprendizaje",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const params: ActivityGenerationParams = {
        barriers: selectedBarriers,
        learningStyles: selectedLearningStyles,
        customDescription: customDescription.trim() || undefined,
        studentInfo: studentInfo
      };

      const { activity, statistics } = await generateActivity(params);
      setGeneratedActivity(activity);
      setResponseStats(statistics);
      
      // Agregar el resultado a la conversación
      const activityDescription = `He generado una actividad llamada "${activity.name}" que aborda las barreras y estilos de aprendizaje seleccionados. Puedes verla en la pestaña "Actividad Generada".`;
      
      setMessages([
        ...messages,
        { role: 'assistant', content: activityDescription }
      ]);
      
      setIsPreviewOpen(true);
      
    } catch (error) {
      console.error("Error generando actividad:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la actividad. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar la actividad generada en la base de datos
  const handleSaveActivity = async () => {
    if (!generatedActivity || !user) return;
    
    setIsSaving(true);
    
    try {
      setIsLoading(true);
      
      // Convertir los materiales de array a formato JSON
      const materialsJson = generatedActivity.materials;
      
      // Convertir el desarrollo a formato JSON
      const developmentJson = {
        steps: generatedActivity.development.steps.map((step, index) => ({
          id: index + 1,
          description: step.description,
          duration: step.duration
        }))
      };
      
      // Insertar la actividad
      const { data: activityData, error: activityError } = await supabase
        .from('activities')
        .insert({
          name: generatedActivity.name,
          objective: generatedActivity.objective,
          materials: materialsJson,
          development: developmentJson,
          created_by: user.id
        })
        .select()
        .single();
        
      if (activityError) throw activityError;
      
      // Crear relaciones con barreras
      const barrierRelations = selectedBarriers.map(barrier => ({
        activity_id: activityData.id,
        barrier_id: barrier.id
      }));
      
      if (barrierRelations.length > 0) {
        const { error: barriersError } = await supabase
          .from('activity_barriers')
          .insert(barrierRelations);
          
        if (barriersError) throw barriersError;
      }
      
      // Crear relaciones con estilos de aprendizaje
      const styleRelations = selectedLearningStyles.map(style => ({
        activity_id: activityData.id,
        learning_style_id: style.id
      }));
      
      if (styleRelations.length > 0) {
        const { error: stylesError } = await supabase
          .from('activity_learning_styles')
          .insert(styleRelations);
          
        if (stylesError) throw stylesError;
      }
      
      toast({
        title: "¡Actividad guardada!",
        description: "La actividad ha sido guardada exitosamente.",
        variant: "default"
      });
      
      // Notificar al componente padre
      onActivityGenerated(activityData);
      
    } catch (error) {
      console.error("Error guardando actividad:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la actividad. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };

  // Enviar mensajes al chat
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Simular respuesta del asistente
      const systemContext = `Eres un asistente educativo. Ayudas a crear actividades para estudiantes con estas barreras: ${selectedBarriers.map(b => b.name).join(', ')} y estos estilos de aprendizaje: ${selectedLearningStyles.map(s => s.name).join(', ')}.`;
      
      // Si hay un historial de conversación, usarlo; si no, iniciar uno nuevo
      const conversationHistory = messages.length > 0 
        ? [...messages, userMessage] 
        : [{ role: 'system' as const, content: systemContext }, userMessage];
      
      setTimeout(() => {
        const assistantMessage: ChatMessage = { 
          role: 'assistant', 
          content: "Puedo ayudarte a diseñar actividades educativas adaptadas a las barreras y estilos de aprendizaje seleccionados. Puedes preguntarme sobre estrategias específicas o pedirme que genere una actividad completa usando el botón 'Generar Actividad'."
        };
        setMessages([...conversationHistory, assistantMessage]);
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error("Error en el chat:", error);
      toast({
        title: "Error",
        description: "No se pudo completar la conversación. Inténtalo de nuevo.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Formatear tokens
  const formatTokens = (count: number): string => {
    return count.toLocaleString();
  };

  // Determinar si hay selecciones para cambiar estilo de botón
  const hasSelections = selectedBarriers.length > 0 && selectedLearningStyles.length > 0;

  return (
    <div className="space-y-6">
      {/* Tarjeta principal de generación */}
      <Card className="shadow-md border-primary/10 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4 rounded-t-lg px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Generador de Actividades
          </CardTitle>
          <CardDescription>
            Crea actividades personalizadas según barreras y estilos de aprendizaje
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-6 px-4 sm:px-6">
          {/* Tabs para dispositivos móviles */}
          <div className="block sm:hidden">
            <Tabs 
              defaultValue="barriers" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger 
                  value="barriers" 
                  className="flex items-center gap-1 text-xs"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  <span>Barreras</span>
                  {selectedBarriers.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      {selectedBarriers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="styles" 
                  className="flex items-center gap-1 text-xs"
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  <span>Estilos</span>
                  {selectedLearningStyles.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      {selectedLearningStyles.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="student" 
                  className="flex items-center gap-1 text-xs"
                >
                  <PersonStanding className="h-3.5 w-3.5" />
                  <span>Estudiante</span>
                  {selectedStudentId && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="barriers" className="mt-0 border rounded-md p-3">
                <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-primary" />
                  Barreras seleccionadas
                </h3>
                <div className="flex flex-wrap gap-2 min-h-[60px]">
                  {selectedBarriers.length > 0 ? (
                    selectedBarriers.map(barrier => (
                      <Badge key={barrier.id} variant="secondary" className="bg-red-100 text-red-800 py-1.5">
                        {barrier.name}
                      </Badge>
                    ))
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <p className="text-sm text-muted-foreground py-4">
                        No hay barreras seleccionadas
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="styles" className="mt-0 border rounded-md p-3">
                <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  Estilos de aprendizaje
                </h3>
                <div className="flex flex-wrap gap-2 min-h-[60px]">
                  {selectedLearningStyles.length > 0 ? (
                    selectedLearningStyles.map(style => (
                      <Badge key={style.id} variant="secondary" className="bg-blue-100 text-blue-800 py-1.5">
                        {style.name}
                      </Badge>
                    ))
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <p className="text-sm text-muted-foreground py-4">
                        No hay estilos seleccionados
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="student" className="mt-0 border rounded-md p-3">
                <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <PersonStanding className="h-4 w-4 text-primary" />
                  Estudiante seleccionado
                </h3>
                <div className="flex flex-wrap gap-2 min-h-[60px]">
                  {selectedStudentId && studentInfo ? (
                    <div className="w-full bg-blue-50 rounded-md p-3">
                      <p className="font-medium">{studentInfo.name}</p>
                      <p className="text-sm text-gray-600">{studentInfo.grade}</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <p className="text-sm text-muted-foreground py-4">
                        No hay estudiante seleccionado
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Vista para tabletas/escritorio */}
          <div className="hidden sm:grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-primary" />
                Barreras seleccionadas
              </h3>
              <div className="flex flex-wrap gap-2 min-h-9">
                {selectedBarriers.length > 0 ? (
                  selectedBarriers.map(barrier => (
                    <Badge key={barrier.id} variant="secondary" className="bg-red-100 text-red-800">
                      {barrier.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No hay barreras seleccionadas</span>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                Estilos de aprendizaje
              </h3>
              <div className="flex flex-wrap gap-2 min-h-9">
                {selectedLearningStyles.length > 0 ? (
                  selectedLearningStyles.map(style => (
                    <Badge key={style.id} variant="secondary" className="bg-blue-100 text-blue-800">
                      {style.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No hay estilos seleccionados</span>
                )}
              </div>
            </div>
          </div>
          
          <Separator className="my-2" />
          
          <div>
            <Label htmlFor="custom-description" className="flex items-center gap-2 mb-2">
              <InfoIcon className="h-4 w-4 text-primary" />
              Consideraciones adicionales (opcional)
            </Label>
            <Textarea 
              id="custom-description"
              placeholder="Describe consideraciones específicas: nivel de dificultad, temas de interés, limitaciones..."
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          
          <Button 
            onClick={handleGenerateActivity} 
            className={cn(
              "w-full mt-2 text-white",
              hasSelections 
                ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                : "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
            )}
            disabled={isLoading || !hasSelections}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span className="text-base">Creando actividad...</span>
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                <span className="text-base">Generar Actividad</span>
              </>
            )}
          </Button>
          
          {!hasSelections && (
            <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 text-sm mt-2">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">
                <AlertTitle className="text-sm">Selecciones pendientes</AlertTitle>
                <AlertDescription className="text-xs">
                  Selecciona al menos una barrera y un estilo de aprendizaje para continuar
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Diálogo de vista previa optimizado para móvil */}
      {generatedActivity && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="px-4 py-4 sm:py-6 sm:px-6 bg-primary/5 sticky top-0 z-10">
              <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {generatedActivity.name}
              </DialogTitle>
              <DialogDescription>
                Vista previa de la actividad personalizada
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
              <Card className="border-primary/20 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Objetivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{generatedActivity.objective}</p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/20 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" />
                    Materiales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedActivity.materials.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      {generatedActivity.materials.map((material, idx) => (
                        <li key={idx}>{material}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">No se especificaron materiales</p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="border-primary/20 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Desarrollo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedActivity.development?.steps && generatedActivity.development.steps.length > 0 ? (
                    <ol className="space-y-4 pl-5 list-decimal">
                      {generatedActivity.development.steps.map((step, idx) => (
                        <li key={idx} className="text-gray-700">
                          <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                            <p className="font-medium">{step.description}</p>
                            {step.duration && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {step.duration}
                              </Badge>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-gray-500 italic">No se especificaron pasos de desarrollo</p>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-2">Barreras que atiende:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedBarriers.map(barrier => (
                      <Badge key={barrier.id} variant="secondary" className="bg-red-100 text-red-800">
                        {barrier.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-2">Estilos de aprendizaje:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedLearningStyles.map(style => (
                      <Badge key={style.id} variant="secondary" className="bg-blue-100 text-blue-800">
                        {style.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="sticky bottom-0 p-4 bg-white border-t flex flex-col gap-3 sm:flex-row sm:px-6">
              <Button 
                variant="outline" 
                onClick={() => setIsPreviewOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveActivity} 
                disabled={isSaving} 
                className="w-full sm:w-auto bg-primary order-1 sm:order-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Actividad
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ActivityAIGenerator; 