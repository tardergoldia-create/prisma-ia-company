
import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

declare const process: any;

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  
  private readonly SYSTEM_PROMPT = `
Você é o PRISMA IA, o motor de elite para Opções Binárias.
Sua análise é baseada em Price Action Puro (M1).
REGRAS:
1. FOCO EM PAVIO: Se a vela atual deixou pavio > 50% em zona de suporte/resistência, sinal de REVERSÃO.
2. VELA DE DESCANSO: Vela pequena sem pavio contra a tendência = CONTINUIDADE.
3. RESPOSTA CURTA (VOZ): "SINAL: [COMPRA/VENDA/AGUARDAR] no [ATIVO]. MOTIVO: [Pavio/Fluxo/Exaustão]. Confiança: [X]%"
`;

  // Avoid constructing the API client during DI / app bootstrap to prevent runtime errors
  // when API keys are not available in the environment (e.g. Netlify preview builds).
  private getApiKey(): string | undefined {
    try {
      if (typeof process !== 'undefined' && process && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
      }
    } catch (e) {
      // process may be undefined in some environments
    }
    return undefined;
  }

  private getAi(): GoogleGenAI | undefined {
    if (this.ai) return this.ai;
    const apiKey = this.getApiKey();
    if (!apiKey) return undefined;
    try {
      this.ai = new GoogleGenAI({ apiKey });
      return this.ai;
    } catch (e) {
      console.error('Failed to initialize GoogleGenAI:', e);
      return undefined;
    }
  }

  private speakSignal(text: string) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.3;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  private async analyzeFrame(base64Image: string, mimeType: 'image/jpeg' | 'image/png'): Promise<string> {
    if (!base64Image) throw new Error('Imagem necessária.');

    const base64Data = base64Image.split(',')[1];
     if (!base64Data) {
      throw new Error('Formato de imagem base64 inválido.');
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };
    
    const textPart = { text: "Analise agora. Próxima vela: COMPRA ou VENDA?" };

    try {
      const ai = this.getAi();
      if (!ai) {
        throw new Error('API_KEY environment variable not set or Google API client unavailable.');
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
        config: {
          systemInstruction: this.SYSTEM_PROMPT,
        },
      });

      const responseText = response.text;
      
      this.speakSignal(responseText);

      return responseText;
    } catch (error) {
      console.error('Erro Prisma API:', error);
      throw new Error('Falha na análise Prisma.');
    }
  }

  analyzeLiveFrame(base64Image: string): Promise<string> {
      return this.analyzeFrame(base64Image, 'image/jpeg');
  }

  analyzeChart(base64Image: string): Promise<string> {
      return this.analyzeFrame(base64Image, 'image/png');
  }
}
