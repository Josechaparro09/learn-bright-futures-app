import { Json, Tables } from 'database.types';

export type OpenAIModel = 
  | 'gpt-4-turbo'      // GPT-4 Turbo
  | 'gpt-4-0125-preview' // GPT-4.1
  | 'gpt-4-1106-preview' // GPT-4 Turbo preview
  | 'gpt-4-0613'       // GPT-4
  | 'gpt-4-vision-preview' // GPT-4 con visión
  | 'gpt-4.1'          // GPT-4.1
  | 'gpt-4.1-mini'     // GPT-4.1 Mini
  | 'gpt-4.1-nano'     // GPT-4.1 Nano
  | 'gpt-40-mini'      // GPT-40 Mini
  | 'gpt-3.5-turbo'    // GPT-3.5 Turbo
  | 'gpt-3.5-turbo-16k' // GPT-3.5 Turbo 16k
  | 'gpt-3.5-turbo-instruct'; // GPT-3.5 Instruct

export type ModelInfo = {
  id: OpenAIModel;
  name: string;
  description: string;
  maxTokens: number;
  isAvailable: boolean;
};

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ActivityGenerationParams = {
  barriers: Tables<'barriers'>[];
  learningStyles: Tables<'learning_styles'>[];
  customDescription?: string;
  selectedModel?: OpenAIModel;
  studentInfo?: {
    id: string;
    name: string;
    grade: string;
    interventions?: Tables<'interventions'>[];
    comments?: Tables<'intervention_comments'>[];
  };
};

export type GeneratedActivity = {
  name: string;
  objective: string;
  materials: string[];
  development: {
    description?: string;
    steps: Array<{
      description: string;
      duration: string;
    }>;
  };
};

export type ResponseStatistics = {
  requestTimestamp: number;
  responseTimestamp: number;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}; 