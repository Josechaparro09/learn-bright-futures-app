import { Tables } from "database.types";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityGenerationInput {
  barriers: Tables<'barriers'>[];
  learningStyles: Tables<'learning_styles'>[];
  customDescription?: string;
  studentInfo?: any;
}

export interface GeneratedActivity {
  name: string;
  objective: string;
  materials: string[];
  development: {
    steps: {
      description: string;
      duration: string;
    }[];
  };
}

export interface ActivityGenerationResult {
  activity: GeneratedActivity;
  statistics: {
    timeElapsed: number;
    tokensUsed: number;
  };
}

export const generateActivityMCP = async (input: ActivityGenerationInput): Promise<ActivityGenerationResult> => {
  // Aquí implementaremos la lógica de generación
  const startTime = Date.now();
  
  try {
    // 1. Preparar el prompt
    const barriersText = input.barriers.map(b => `${b.name}: ${b.description}`).join('\n');
    const stylesText = input.learningStyles.map(s => `${s.name}: ${s.description}`).join('\n');
    
    const prompt = `
      Genera una actividad educativa que aborde las siguientes barreras de aprendizaje:
      ${barriersText}
      
      Y que se adapte a estos estilos de aprendizaje:
      ${stylesText}
      
      ${input.customDescription ? `\nConsideraciones adicionales: ${input.customDescription}` : ''}
      ${input.studentInfo ? `\nInformación del estudiante: ${JSON.stringify(input.studentInfo)}` : ''}
      
      La actividad debe incluir:
      1. Nombre descriptivo
      2. Objetivo claro
      3. Lista de materiales necesarios
      4. Desarrollo paso a paso con tiempos estimados
    `;

    // 2. Llamar a la API de OpenAI (simulado por ahora)
    const generatedActivity: GeneratedActivity = {
      name: "Actividad de ejemplo",
      objective: "Objetivo de ejemplo",
      materials: ["Material 1", "Material 2"],
      development: {
        steps: [
          {
            description: "Paso 1",
            duration: "10 minutos"
          },
          {
            description: "Paso 2",
            duration: "15 minutos"
          }
        ]
      }
    };

    // 3. Calcular estadísticas
    const timeElapsed = Date.now() - startTime;
    const tokensUsed = prompt.length / 4; // Estimación simple

    return {
      activity: generatedActivity,
      statistics: {
        timeElapsed,
        tokensUsed
      }
    };
  } catch (error) {
    console.error("Error en generateActivityMCP:", error);
    throw error;
  }
};

export const saveGeneratedActivity = async (
  activity: GeneratedActivity,
  userId: string,
  barriers: Tables<'barriers'>[],
  learningStyles: Tables<'learning_styles'>[]
): Promise<Tables<'activities'>> => {
  try {
    // 1. Insertar la actividad
    const { data: activityData, error: activityError } = await supabase
      .from('activities')
      .insert({
        name: activity.name,
        objective: activity.objective,
        materials: activity.materials,
        development: activity.development,
        created_by: userId
      })
      .select()
      .single();

    if (activityError) throw activityError;

    // 2. Crear relaciones con barreras
    if (barriers.length > 0) {
      const barrierRelations = barriers.map(barrier => ({
        activity_id: activityData.id,
        barrier_id: barrier.id
      }));

      const { error: barriersError } = await supabase
        .from('activity_barriers')
        .insert(barrierRelations);

      if (barriersError) throw barriersError;
    }

    // 3. Crear relaciones con estilos de aprendizaje
    if (learningStyles.length > 0) {
      const styleRelations = learningStyles.map(style => ({
        activity_id: activityData.id,
        learning_style_id: style.id
      }));

      const { error: stylesError } = await supabase
        .from('activity_learning_styles')
        .insert(styleRelations);

      if (stylesError) throw stylesError;
    }

    return activityData;
  } catch (error) {
    console.error("Error en saveGeneratedActivity:", error);
    throw error;
  }
}; 