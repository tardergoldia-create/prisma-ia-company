import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAIClient = () => {
  const apiKey = (process && (process.env?.API_KEY || process.env?.GEMINI_API_KEY)) || '';
  return { apiKey, client: apiKey ? new GoogleGenAI({ apiKey }) : null } as const;
};

/**
 * Chat with Gemini using a simple prompt + optional history.
 * If no API key is present, returns a harmless mock response instead of throwing.
 */
export const chatWithGemini = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<string> => {
  const { apiKey, client } = getAIClient();
  if (!apiKey || !client) {
    // Return a safe mock response so the app doesn't crash when API key is not set.
    return `MOCK RESPONSE: Recebi sua pergunta: "${prompt}". (Sem API key configurada.)`;
  }

  const contents = [...history, { role: 'user', parts: [{ text: prompt }] }];

  const response: GenerateContentResponse = await client.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction:
        "You are PRISMA, the highly advanced AI assistant for PRISMA IA COMPANY. You are helpful, professional, and tech-savvy. You can assist with coding, business strategy, creative tasks, and more. Use Markdown for formatting.",
    },
  } as any);

  return response?.text || '';
};

/**
 * Generate an image for a given prompt. Returns a data URL string or null.
 */
export const generateImage = async (prompt: string): Promise<string | null> => {
  const { apiKey, client } = getAIClient();
  if (!apiKey || !client) {
    // Mock: return null when no key is configured to avoid runtime errors.
    return null;
  }

  const parts = [
    {
      text: `Create a high-quality, professional corporate tech image for PRISMA IA COMPANY based on this: ${prompt}. Style: Futuristic, glassmorphism, cinematic lighting.`,
    },
  ];

  const response: GenerateContentResponse = await client.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts } as any,
    config: { imageConfig: { aspectRatio: '16:9' } },
  } as any);

  for (const part of response?.candidates?.[0]?.content?.parts || []) {
    if ((part as any).inlineData) {
      return `data:${(part as any).inlineData.mimeType};base64,${(part as any).inlineData.data}`;
    }
  }
  return null;
};

/**
 * Analyze a screenshot/frame (base64 data URL). Returns response text from the model.
 */
export const analyzeScreenFrame = async (base64Image: string): Promise<string> => {
  const { apiKey, client } = getAIClient();
  if (!apiKey || !client) {
    return 'MOCK: Sem API key configurada. (Resposta de análise não disponível.)';
  }

  const imagePart = {
    inlineData: {
      data: base64Image.split(',')[1],
      mimeType: 'image/jpeg',
    },
  } as any;

  const promptPart = {
    text: "Analyze this screen capture as a PRISMA IA expert. Identify trends, data patterns, or specific 'signals' (like opportunities or risks). Format the response as a single concise signal with a status (BULLISH, BEARISH, NEUTRAL, ALERT) and a brief reason.",
  };

  const response: GenerateContentResponse = await client.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [imagePart, promptPart] } as any,
  } as any);

  return response?.text || '';
};
