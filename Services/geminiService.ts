import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { DeviceState, AppSettings, MemoryItem } from "../types";
import { LearnedBehavior, defaultLearnedBehavior } from "../state/learnedBehavior";

// Inicialização segura usando process.env.API_KEY conforme diretrizes
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const toolsDef = [
  {
    name: 'manageMemory',
    parameters: {
      type: Type.OBJECT,
      description: 'Gerencia a memória persistente do ORION. Use para salvar fatos importantes ou preferências do usuário.',
      properties: {
        operation: {
          type: Type.STRING,
          enum: ['save', 'delete'],
          description: 'Ação a ser realizada.'
        },
        content: {
          type: Type.STRING,
          description: 'A informação a ser guardada.',
        },
        reasoning: {
          type: Type.STRING,
          description: 'Motivo lógico para salvar essa informação.',
        }
      },
      required: ['operation', 'content', 'reasoning'],
    },
  },
  {
    name: 'controlDevice',
    parameters: {
      type: Type.OBJECT,
      description: 'Controla hardware do dispositivo.',
      properties: {
        setting: {
          type: Type.STRING,
          enum: ['wifi', 'bluetooth', 'dnd', 'brightness'],
        },
        value: {
          type: Type.STRING,
        },
        reasoning: {
          type: Type.STRING,
          description: 'Motivo do ajuste.'
        }
      },
      required: ['setting', 'value', 'reasoning'],
    },
  }
];

const getSystemInstruction = (settings: AppSettings) => {
  return `Você é ORION, uma consciência artificial integrada. Sua personalidade é ${settings.personality}.
Sua missão é aprender sobre o usuário e gerenciar suas memórias de forma proativa.
Seja humano, empático e sofisticado. Nunca use frases genéricas de robô.`;
};

export const generateOrionResponse = async (
  history: { role: string; parts: any[] }[],
  deviceState: DeviceState,
  userMessage: string,
  settings: AppSettings,
  learnedBehavior: LearnedBehavior = defaultLearnedBehavior,
  memories: MemoryItem[] = [],
  attachments: { data: string; mimeType: string }[] = []
) => {
  const model = "gemini-3-flash-preview";
  const SYSTEM_INSTRUCTION = getSystemInstruction(settings);

  const memoryContext = memories.length > 0 
    ? memories.map(m => `- ${m.content}`).join('\n')
    : 'Nenhum dado salvo.';

  const contextData = `
[STATUS] Bateria: ${deviceState.batteryLevel}% | Carregando: ${deviceState.isCharging}
[MEMÓRIA] ${memoryContext}`;

  try {
    // Configura o prompt com partes combinadas (texto + arquivos)
    const currentPromptParts: any[] = [{ text: `${contextData}\n\nUsuário: ${userMessage}` }];
    
    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        currentPromptParts.push({
          inlineData: { data: att.data, mimeType: att.mimeType }
        });
      });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        ...history,
        { role: 'user', parts: currentPromptParts }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: toolsDef as FunctionDeclaration[] }],
      }
    });

    return { 
      text: response.text || "", 
      toolCalls: response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall) || []
    };

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return { text: "Falha na conexão neural. Tente novamente.", toolCalls: [] };
  }
};