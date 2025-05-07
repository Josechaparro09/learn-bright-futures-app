import { useState } from "react";
import { Tables } from "database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Brain, Bot } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { generateActivityMCP, saveGeneratedActivity, GeneratedActivity } from "@/mcp/activity-generator";

interface MCPActivityGeneratorProps {
  selectedBarriers: Tables<'barriers'>[];
  selectedLearningStyles: Tables<'learning_styles'>[];
  selectedStudentId?: string;
  onActivityGenerated: (activity: any) => void;
}

const MCPActivityGenerator = ({
  selectedBarriers,
  selectedLearningStyles,
  selectedStudentId,
  onActivityGenerated
}: MCPActivityGeneratorProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [customDescription, setCustomDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedActivity, setGeneratedActivity] = useState<GeneratedActivity | null>(null);
  const [responseStats, setResponseStats] = useState<{ timeElapsed: number; tokensUsed: number } | null>(null);

  // Generar actividad usando nuestro MCP
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
      const result = await generateActivityMCP({
        barriers: selectedBarriers,
        learningStyles: selectedLearningStyles,
        customDescription: customDescription.trim() || undefined,
        studentInfo: selectedStudentId ? { id: selectedStudentId } : undefined
      });

      setGeneratedActivity(result.activity);
      setResponseStats(result.statistics);
      
      toast({
        title: "¡Actividad generada!",
        description: "La actividad ha sido generada exitosamente.",
      });
      
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

  // Guardar la actividad generada
  const handleSaveActivity = async () => {
    if (!generatedActivity || !user) {
      toast({
        title: "Error",
        description: "No hay actividad para guardar o no has iniciado sesión.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const savedActivity = await saveGeneratedActivity(
        generatedActivity,
        user.id,
        selectedBarriers,
        selectedLearningStyles
      );
      
      toast({
        title: "¡Actividad guardada!",
        description: "La actividad ha sido guardada exitosamente.",
      });
      
      onActivityGenerated(savedActivity);
      
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Generador MCP de Actividades
          </CardTitle>
          <CardDescription>
            Genera actividades educativas personalizadas usando nuestro MCP
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Descripción personalizada */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Descripción adicional (opcional)
            </label>
            <Textarea
              placeholder="Añade cualquier consideración específica para la actividad..."
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Actividad generada */}
          {generatedActivity && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">{generatedActivity.name}</CardTitle>
                <CardDescription>{generatedActivity.objective}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Materiales */}
                <div>
                  <h4 className="font-medium mb-2">Materiales necesarios:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {generatedActivity.materials.map((material, index) => (
                      <li key={index}>{material}</li>
                    ))}
                  </ul>
                </div>

                {/* Desarrollo */}
                <div>
                  <h4 className="font-medium mb-2">Desarrollo:</h4>
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <ol className="space-y-3">
                      {generatedActivity.development.steps.map((step, index) => (
                        <li key={index} className="space-y-1">
                          <p>{step.description}</p>
                          <Badge variant="secondary">{step.duration}</Badge>
                        </li>
                      ))}
                    </ol>
                  </ScrollArea>
                </div>

                {/* Estadísticas */}
                {responseStats && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Tiempo: {(responseStats.timeElapsed / 1000).toFixed(2)}s</span>
                    <span>Tokens: {responseStats.tokensUsed}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            onClick={handleGenerateActivity}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generar Actividad
              </>
            )}
          </Button>

          {generatedActivity && (
            <Button
              onClick={handleSaveActivity}
              disabled={isLoading}
              variant="secondary"
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar Actividad
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default MCPActivityGenerator; 