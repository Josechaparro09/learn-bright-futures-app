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
  Lightbulb, Sparkles, Clock, Brain, Bot, InfoIcon
} from "lucide-react";
import { AVAILABLE_MODELS, DEFAULT_MODEL, generateActivity } from "@/integrations/openai/service";
import { 
  ActivityGenerationParams, ChatMessage, GeneratedActivity, 
  ModelInfo, OpenAIModel, ResponseStatistics 
} from "@/integrations/openai/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ActivityAIGeneratorProps {
  selectedBarriers: Tables<'barriers'>[];
  selectedLearningStyles: Tables<'learning_styles'>[];
  selectedStudentId?: string;
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
  const [selectedModel, setSelectedModel] = useState<OpenAIModel>(DEFAULT_MODEL);
  const [generatedActivity, setGeneratedActivity] = useState<GeneratedActivity | null>(null);
  const [responseStats, setResponseStats] = useState<ResponseStatistics | null>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
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

  // Generar actividad con OpenAI
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
        selectedModel,
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
      
      // En un entorno real, enviaríamos esto a la API de OpenAI
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

  // Formatear milisegundos como string
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Formatear tokens
  const formatTokens = (count: number): string => {
    return count.toLocaleString();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Asistente de Creación de Actividades</CardTitle>
        <CardDescription>
          Usa IA para generar actividades adaptadas a barreras y estilos de aprendizaje
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="chat">
        <TabsList className="mx-6">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="activity" disabled={!generatedActivity}>
            Actividad Generada
          </TabsTrigger>
          <TabsTrigger value="stats" disabled={!responseStats}>
            Estadísticas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat">
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <p className="text-sm font-medium w-full mb-1">Barreras seleccionadas:</p>
                {selectedBarriers.map((barrier) => (
                  <Badge key={barrier.id} variant="outline">
                    {barrier.name}
                  </Badge>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <p className="text-sm font-medium w-full mb-1">Estilos de aprendizaje:</p>
                {selectedLearningStyles.map((style) => (
                  <Badge key={style.id} variant="outline">
                    {style.name}
                  </Badge>
                ))}
              </div>
              
              {studentInfo && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1">Estudiante:</p>
                  <Badge variant="secondary">{studentInfo.name} - {studentInfo.grade}</Badge>
                </div>
              )}
              
              <div className="space-y-1.5">
                <Label htmlFor="model-selector">Modelo de IA</Label>
                <Select 
                  defaultValue={selectedModel}
                  onValueChange={(value) => setSelectedModel(value as OpenAIModel)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center">
                          <span>{model.name}</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="ml-1 h-5 w-5">
                                <InfoIcon className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-3 text-sm">
                              <p className="font-medium">{model.name}</p>
                              <p className="text-muted-foreground">{model.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">Máx. tokens: {model.maxTokens.toLocaleString()}</p>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label 
                  htmlFor="custom-description" 
                  className="flex items-center gap-1"
                >
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Consideraciones adicionales
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5">
                        <InfoIcon className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3 text-sm">
                      <p>Aquí puedes añadir información específica sobre el comportamiento del estudiante, 
                      sugerencias para la actividad, o cualquier otra consideración que deba tenerse en cuenta.</p>
                      <p className="mt-1">Por ejemplo: "El estudiante se distrae fácilmente con estímulos visuales 
                      y responde mejor a actividades con movimiento" o "Incluir actividades que refuercen la memoria 
                      a corto plazo".</p>
                    </PopoverContent>
                  </Popover>
                </Label>
                <Textarea 
                  id="custom-description"
                  placeholder="Describe comportamientos específicos, sugerencias o cualquier detalle adicional..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="resize-none h-24"
                />
              </div>
              
              <Button
                onClick={handleGenerateActivity}
                disabled={isLoading || selectedBarriers.length === 0 || selectedLearningStyles.length === 0}
                className="w-full mb-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar Actividad
                  </>
                )}
              </Button>
              
              <ScrollArea className="h-[250px] rounded-md border p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center text-muted-foreground p-4">
                    <p>
                      Pregunta al asistente sobre estrategias para las barreras y estilos seleccionados, o
                      genera una actividad completa.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`rounded-lg px-4 py-2 max-w-[80%] ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-lg px-4 py-2 bg-muted">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
          
          <CardFooter className="flex gap-2">
            <Textarea
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button size="icon" onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="activity">
          {generatedActivity && (
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">{generatedActivity.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Actividad generada por IA basada en tus selecciones
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Objetivo:</h4>
                  <p>{generatedActivity.objective}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Materiales:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {generatedActivity.materials.map((material, idx) => (
                      <li key={idx}>{material}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Desarrollo:</h4>
                  <ol className="space-y-4">
                    {generatedActivity.development.steps.map((step, idx) => (
                      <li key={idx} className="pl-5">
                        <div className="flex items-start">
                          <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                            {idx + 1}
                          </div>
                          <div>
                            <p>{step.description}</p>
                            <p className="text-sm text-muted-foreground">{step.duration}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
                
                <div className="pt-4 flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setGeneratedActivity(null)}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Descartar
                  </Button>
                  <Button onClick={handleSaveActivity} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Guardar Actividad
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </TabsContent>
        
        <TabsContent value="stats">
          {responseStats && (
            <CardContent>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart2 className="mr-2 h-5 w-5 text-primary" />
                Estadísticas de Generación
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center">
                      <Bot className="mr-2 h-4 w-4" />
                      Modelo Utilizado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-xl font-semibold">
                      {AVAILABLE_MODELS.find(m => m.id === responseStats.model)?.name || responseStats.model}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {AVAILABLE_MODELS.find(m => m.id === responseStats.model)?.description || 'Modelo de OpenAI'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Tiempo de Respuesta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-xl font-semibold">
                      {formatTime(responseStats.latencyMs)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hora: {new Date(responseStats.responseTimestamp).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center">
                      <Brain className="mr-2 h-4 w-4" />
                      Tokens de Entrada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-xl font-semibold">
                      {formatTokens(responseStats.promptTokens)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tokens utilizados en el prompt
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Tokens de Salida
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-xl font-semibold">
                      {formatTokens(responseStats.completionTokens)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tokens utilizados en la respuesta
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center">
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Resumen Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <span>Tokens Totales:</span>
                        <span className="font-semibold">{formatTokens(responseStats.totalTokens)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tiempo de Procesamiento:</span>
                        <span className="font-semibold">{formatTime(responseStats.latencyMs)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Modelo:</span>
                        <span className="font-semibold">
                          {AVAILABLE_MODELS.find(m => m.id === responseStats.model)?.name || responseStats.model}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default ActivityAIGenerator; 