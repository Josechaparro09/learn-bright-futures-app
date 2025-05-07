import openai from './client';
import { ActivityGenerationParams, ChatMessage, GeneratedActivity, ModelInfo, OpenAIModel, ResponseStatistics } from './types';

// Información de los modelos disponibles
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    description: 'El modelo más inteligente para tareas complejas educativas',
    maxTokens: 128000,
    isAvailable: true
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    description: 'Modelo económico que equilibra velocidad e inteligencia',
    maxTokens: 128000,
    isAvailable: true
  },
  {
    id: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    description: 'El modelo más rápido y rentable para tareas de baja latencia',
    maxTokens: 16000,
    isAvailable: true
  },
  {
    id: 'gpt-4-0125-preview',
    name: 'GPT-4.1 Preview',
    description: 'Versión preliminar de GPT-4.1 con alto rendimiento',
    maxTokens: 128000,
    isAvailable: true
  },
  {
    id: 'gpt-40-mini',
    name: 'GPT-40 Mini',
    description: 'Versión optimizada del modelo GPT-4 con buen equilibrio entre velocidad y calidad',
    maxTokens: 32000,
    isAvailable: true
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Versión mejorada de GPT-4 con mejor respuesta y contexto amplio',
    maxTokens: 128000,
    isAvailable: true
  },
  {
    id: 'gpt-4-0613',
    name: 'GPT-4',
    description: 'Modelo completo GPT-4 con excelente comprensión del contexto educativo',
    maxTokens: 8192,
    isAvailable: true
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Modelo equilibrado con buena velocidad y calidad para la mayoría de tareas educativas',
    maxTokens: 16385,
    isAvailable: true
  }
];

// Modelo predeterminado
export const DEFAULT_MODEL: OpenAIModel = 'gpt-4.1-nano';

// Sistema prompt que define el contexto para el asistente
const SYSTEM_PROMPT = `
Eres un asistente especializado en educación inclusiva, con conocimientos profundos sobre barreras de aprendizaje, 
estilos de aprendizaje e intervenciones educativas personalizadas. Tu trabajo es ayudar a crear 
actividades educativas adaptadas a las necesidades específicas de cada estudiante.

Debes seguir estas reglas:
1. Las actividades deben ser detalladas y específicas para abordar las barreras indicadas.
2. Debes considerar los estilos de aprendizaje proporcionados.
3. Si tienes información del estudiante, personaliza aún más la actividad.
4. Responde siempre en español.

FORMATO OBLIGATORIO:
Debes estructurar la actividad siguiendo EXACTAMENTE este formato:

Nombre: [Nombre creativo y descriptivo de la actividad]

Objetivo: [Objetivo pedagógico claro y medible]

Materiales:
- [Material 1]
- [Material 2]
- [Material 3]
...

Desarrollo:
La actividad debe incluir una descripción general seguida de pasos numerados, cada uno con duración estimada:

Paso 1: [Descripción detallada] (10-15 minutos)
Paso 2: [Descripción detallada] (15-20 minutos)
Paso 3: [Descripción detallada] (20-25 minutos)
...

Es CRUCIAL que incluyas al menos 3-5 pasos con sus respectivas duraciones entre paréntesis.
Cada paso debe ser detallado y específico, explicando qué deben hacer tanto el docente como los estudiantes.

Recuerda ser creativo pero práctico, proponiendo actividades realizables en contextos educativos reales.
`;

/**
 * Genera mensajes de contexto basados en los parámetros proporcionados
 */
const createContextMessages = (params: ActivityGenerationParams): ChatMessage[] => {
  const { barriers, learningStyles, studentInfo, customDescription } = params;
  
  let context = `Necesito generar una actividad educativa adaptada a lo siguiente:\n\n`;
  
  // Añadir información sobre barreras
  context += `BARRERAS DE APRENDIZAJE:\n`;
  barriers.forEach(barrier => {
    context += `- ${barrier.name}: ${barrier.description}\n`;
  });
  
  // Añadir información sobre estilos de aprendizaje
  context += `\nESTILOS DE APRENDIZAJE PREFERENTES:\n`;
  learningStyles.forEach(style => {
    context += `- ${style.name}: ${style.description}\n`;
  });
  
  // Añadir información del estudiante si está disponible
  if (studentInfo) {
    context += `\nINFORMACIÓN DEL ESTUDIANTE:\n`;
    context += `- Nombre: ${studentInfo.name}\n`;
    context += `- Grado: ${studentInfo.grade}\n`;
    
    // Añadir historial de intervenciones si está disponible
    if (studentInfo.interventions && studentInfo.interventions.length > 0) {
      context += `\nHISTORIAL DE INTERVENCIONES:\n`;
      studentInfo.interventions.forEach((intervention, index) => {
        context += `- Intervención ${index + 1}: ${intervention.observations || 'Sin observaciones'}\n`;
      });
    }
    
    // Añadir comentarios si están disponibles
    if (studentInfo.comments && studentInfo.comments.length > 0) {
      context += `\nCOMENTARIOS DE PROFESORES:\n`;
      studentInfo.comments.forEach((comment, index) => {
        context += `- Comentario ${index + 1}: ${comment.content}\n`;
      });
    }
  }
  
  // Añadir descripción personalizada si está disponible
  if (customDescription && customDescription.trim()) {
    context += `\nCONSIDERACIONES ADICIONALES DEL EDUCADOR:\n${customDescription.trim()}\n`;
  }
  
  context += `\nPor favor, genera una actividad educativa detallada con nombre, objetivo, materiales y desarrollo paso a paso con tiempos estimados.`;
  
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: context }
  ];
};

/**
 * Genera una actividad educativa basada en barreras y estilos de aprendizaje
 */
export const generateActivity = async (params: ActivityGenerationParams): Promise<{
  activity: GeneratedActivity;
  statistics: ResponseStatistics;
}> => {
  try {
    const requestTimestamp = Date.now();
    const messages = createContextMessages(params);
    // Forzar el uso del modelo nano siempre
    const selectedModel = 'gpt-4.1-nano';
    
    const response = await openai.chat.completions.create({
      model: selectedModel,
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });
    
    const responseTimestamp = Date.now();
    const activityText = response.choices[0].message.content || '';
    
    // Crear estadísticas de respuesta
    const statistics: ResponseStatistics = {
      requestTimestamp,
      responseTimestamp,
      latencyMs: responseTimestamp - requestTimestamp,
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
      model: response.model
    };
    console.log(statistics);
    // Analizar el texto para extraer la estructura de la actividad
    const activity = parseActivityFromText(activityText);
    
    return { activity, statistics };
  } catch (error) {
    console.error('Error generando actividad:', error);
    throw new Error('No se pudo generar la actividad. Por favor, inténtalo de nuevo.');
  }
};

/**
 * Analiza el texto generado por la IA para convertirlo en una estructura de actividad
 */
const parseActivityFromText = (text: string): GeneratedActivity => {
  // Extraer el nombre (generalmente es la primera línea o después de "Nombre:")
  const nameMatch = text.match(/(?:Nombre|Título|Actividad):\s*([^\n]+)/i) || 
                   text.match(/^#\s*([^\n]+)/m) ||
                   text.match(/^([^\n]+)/);
  const name = nameMatch ? nameMatch[1].trim() : 'Actividad Generada';
  
  // Extraer el objetivo
  const objectiveMatch = text.match(/(?:Objetivo|Objetivos|Propósito):\s*([\s\S]+?)(?=\n\s*(?:Materiales|Recursos|Desarrollo|Pasos|$))/i);
  const objective = objectiveMatch ? objectiveMatch[1].trim() : 'Desarrollar habilidades adaptadas a las necesidades específicas del estudiante';
  
  // Extraer materiales
  const materialsMatch = text.match(/(?:Materiales|Recursos):\s*([\s\S]+?)(?=\n\s*(?:Desarrollo|Procedimiento|Pasos|$))/i);
  let materials: string[] = [];
  
  if (materialsMatch && materialsMatch[1]) {
    materials = materialsMatch[1]
      .split(/\n-|\n•|\n\*|\n\d+\./)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  
  // Extraer desarrollo/pasos
  const developmentMatch = text.match(/(?:Desarrollo|Procedimiento|Pasos|Actividades):\s*([\s\S]+)$/i);
  let steps: Array<{ description: string; duration: string }> = [];
  let developmentDescription = "";
  
  if (developmentMatch && developmentMatch[1]) {
    // Extraer la descripción general del desarrollo (si existe)
    const descriptionEndIndex = developmentMatch[1].search(/\n\s*Paso\s*\d+:|^\s*Paso\s*\d+:/im);
    if (descriptionEndIndex > 0) {
      developmentDescription = developmentMatch[1].substring(0, descriptionEndIndex).trim();
    }
    
    // Buscar pasos numerados con sus duraciones
    const stepMatches = Array.from(
      developmentMatch[1].matchAll(/(?:Paso\s*)?(\d+)[.:]\s*([^(]+)\s*\(([^)]+)\)/gi)
    );
    
    if (stepMatches.length > 0) {
      for (const match of stepMatches) {
        const description = match[2]?.trim() || '';
        const duration = match[3]?.trim() || '15-20 minutos';
        
        if (description) {
          steps.push({ description, duration });
        }
      }
    } else {
      // Alternativa: buscar párrafos que podrían ser pasos
      const paragraphs = developmentMatch[1]
        .split(/\n\n+/)
        .filter(p => p.trim().length > 0 && !p.trim().startsWith('Paso'));
      
      if (paragraphs.length > 1) {
        // Usamos los párrafos como pasos separados
        paragraphs.forEach((paragraph, index) => {
          // Intentar extraer duración si existe en formato "(X minutos)"
          const durationMatch = paragraph.match(/\((\d+(?:-\d+)?\s*(?:minutos?|horas?))\)/i);
          const duration = durationMatch ? durationMatch[1] : `${(index + 1) * 10}-${(index + 1) * 10 + 5} minutos`;
          
          // Eliminar la duración del texto si existe
          let description = paragraph.trim();
          if (durationMatch) {
            description = description.replace(durationMatch[0], '').trim();
          }
          
          if (description) {
            steps.push({ description, duration });
          }
        });
      }
    }
  }
  
  // Si no se pudieron extraer pasos estructurados, crear al menos uno genérico
  if (steps.length === 0) {
    steps = [
      { description: 'Introducción a la actividad', duration: '10-15 minutos' },
      { description: 'Desarrollo de la actividad principal', duration: '30-40 minutos' },
      { description: 'Cierre y reflexión sobre lo aprendido', duration: '10-15 minutos' }
    ];
  }
  
  return {
    name,
    objective,
    materials: materials.length > 0 ? materials : ['Materiales según necesidades específicas'],
    development: { 
      description: developmentDescription,
      steps 
    }
  };
};

/**
 * Continúa una conversación con el asistente educativo
 */
export const chatWithEducationalAssistant = async (
  messages: ChatMessage[],
  selectedModel: OpenAIModel = DEFAULT_MODEL
): Promise<{
  response: string;
  statistics: ResponseStatistics;
}> => {
  try {
    const requestTimestamp = Date.now();
    
    // Asegurarse de que hay un mensaje de sistema al inicio
    if (messages.length === 0 || messages[0].role !== 'system') {
      messages.unshift({ role: 'system', content: SYSTEM_PROMPT });
    }
    
    // Forzar el uso del modelo nano
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    const responseTimestamp = Date.now();
    
    // Crear estadísticas de respuesta
    const statistics: ResponseStatistics = {
      requestTimestamp,
      responseTimestamp,
      latencyMs: responseTimestamp - requestTimestamp,
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
      model: response.model
    };
    
    return {
      response: response.choices[0].message.content || '',
      statistics
    };
  } catch (error) {
    console.error('Error en la conversación:', error);
    throw new Error('No se pudo completar la conversación. Por favor, inténtalo de nuevo.');
  }
}; 