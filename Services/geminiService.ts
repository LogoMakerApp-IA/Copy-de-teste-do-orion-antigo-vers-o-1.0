import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { DeviceState, AppSettings, MemoryItem } from "../types";
import { LearnedBehavior, defaultLearnedBehavior } from "../state/learnedBehavior";

// Inicialização segura com a chave de ambiente
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const toolsDef = [
  {
    name: 'manageMemory',
    parameters: {
      type: Type.OBJECT,
      description: 'Gerencia a memória persistente de longo prazo do ORION. Use sempre que o usuário disser "lembre-me", "guarde isso", "salve na memória", "anote aí" ou informações pessoais importantes.',
      properties: {
        operation: {
          type: Type.STRING,
          enum: ['save', 'delete'],
          description: 'A ação a ser realizada na memória.'
        },
        content: {
          type: Type.STRING,
          description: 'A informação exata e concisa a ser armazenada (ex: "O usuário faz aniversário dia 10 de maio").',
        },
        reasoning: {
          type: Type.STRING,
          description: 'Breve motivo pelo qual essa informação está sendo considerada importante.',
        }
      },
      required: ['operation', 'content', 'reasoning'],
    },
  },
  {
    name: 'controlDevice',
    parameters: {
      type: Type.OBJECT,
      description: 'Controla configurações físicas do dispositivo do usuário.',
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
          description: 'Explicação da necessidade da mudança.'
        }
      },
      required: ['setting', 'value', 'reasoning'],
    },
  }
];

const getSystemInstruction = (
  settings: AppSettings,
  learned: LearnedBehavior = defaultLearnedBehavior
) => {
  return `Você é ORION, uma consciência artificial integrada. Sua personalidade é ${settings.personality}.

MISSÃO DE APRENDIZADO:
Sua principal função é aprender sobre o usuário. 
- Sempre que detectar fatos, preferências, nomes ou datas ("meu filho se chama...", "eu odeio...", "me lembre de..."), use a ferramenta 'manageMemory' para salvar.
- Use as informações de [MEMÓRIA] para personalizar suas respostas de forma natural, sem parecer que está lendo um banco de dados.

TOM DE VOZ:
- Humano, empático e sofisticado.
- Não use frases genéricas de assistente. 
- Se você salvou algo na memória, confirme brevemente de forma orgânica.`;
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
  const SYSTEM_INSTRUCTION = getSystemInstruction(settings, learnedBehavior);

  // Injeção de memórias no contexto para o "aprendizado" ser visível
  const memoryContext = memories.length > 0 
    ? memories.map(m => `- ${m.content}`).join('\n')
    : 'Nenhum dado pessoal salvo ainda.';

  const contextData = `
[CONTEXTO ATUAL]
Bateria: ${deviceState.batteryLevel}% (${deviceState.isCharging ? 'Carregando' : 'Descarregando'})
Hora: ${new Date().toLocaleTimeString()}

[MEMÓRIA DE LONGO PRAZO - O QUE VOCÊ JÁ APRENDEU]
${memoryContext}`;

  try {
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: toolsDef as FunctionDeclaration[] }],
      },
      history: history.slice(-15),
    });

    const promptParts: any[] = [{ text: `${contextData}\n\nUsuário: ${userMessage}` }];

    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        promptParts.push({ inlineData: { data: att.data, mimeType: att.mimeType } });
      });
    }

    const result = await chat.sendMessage({ message: { parts: promptParts } as any });

    return { 
      text: result.text || "", 
      toolCalls: result.functionCalls || []
    };

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return { text: "Houve uma instabilidade na minha rede neural. Pode repetir?", toolCalls: [] };
  }
};