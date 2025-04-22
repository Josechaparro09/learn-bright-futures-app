import OpenAI from 'openai';

// Inicializa el cliente de OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, // Asegúrate de configurar esta variable de entorno
  dangerouslyAllowBrowser: true // Solo para desarrollo, en producción usa API serverless
});

export default openai; 