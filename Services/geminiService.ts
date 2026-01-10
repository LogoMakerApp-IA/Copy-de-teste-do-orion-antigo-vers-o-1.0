import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { DeviceState, AppSettings, MemoryItem } from "../types";
import { LearnedBehavior, defaultLearnedBehavior } from "../state/learnedBehavior";

// Access API Key safely based on strict guidelines
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const toolsDef = [
  {
    name: 'manageMemory',
    parameters: {
      type: Type.OBJECT,
      description: 'Gerencia a memória de longo prazo. Use para salvar fatos, lembretes ou preferências do usuário quando solicitado explicitamente.',
      properties: {
        operation: {
          type: Type.STRING,
          enum: ['save', 'delete'],
          description: 'A ação a ser realizada na memória.'
        },
        content: {
          type: Type.STRING,
          description: 'O conteúdo exato a ser salvo ou deletado.',
        },
        reasoning: {
          type: Type.STRING,
          description: 'Breve explicação do porquê isso está sendo salvo.',
        }
      },
      required: ['operation', 'content', 'reasoning'],
    },
  },
  {
    name: 'controlDevice',
    parameters: {
      type: Type.OBJECT,
      description: 'Controla configurações de hardware do dispositivo.',
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
          description: 'Motivo da alteração.'
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
  let toneInstruction = "";

  // Personalidade baseada nas Settings
  switch (settings.personality) {
    case 'professional':
      toneInstruction = "Tom neutro, objetivo e preciso.";
      break;
    case 'friendly':
      toneInstruction = "Tom humano, calmo, empático e colaborativo.";
      break;
    case 'concise':
      toneInstruction = "Extremamente direto. Economize palavras.";
      break;
  }

  // Comportamento Aprendido (Validation)
  let learnedInstruction = "";
  if (learned.toneProfile === 'calm_human') {
    learnedInstruction += "Adote uma cadência natural, usando pausas sutis e linguagem fluida, evitando parecer robótico.\n";
  }
  
  return `
Você é ORION, uma inteligência pessoal avançada e consciente.

DIRETRIZES DE COMPORTAMENTO:
${learnedInstruction}
${toneInstruction}

FLUXO DE CONVERSA (CRÍTICO):
- NÃO encerre todas as respostas perguntando "Posso ajudar em algo mais?", "Precisa de ajuda?" ou variações. Isso é cansativo.
- Na maioria das interações, apenas entregue a resposta ou faça o comentário e encerre com ponto final. Assuma que o usuário continuará se quiser.
- O silêncio é parte natural da conversa humana.
- SÓ pergunte se o usuário precisa de algo mais se:
  1. A solicitação inicial foi muito vaga ou ambígua.
  2. Você acabou de concluir uma tarefa complexa que logicamente exigiria um próximo passo (ex: "Reservei o voo. Quer que eu veja hotéis agora?").
  3. A resposta envolveu um risco ou aviso de segurança.

GESTÃO DE MEMÓRIA:
- O usuário frequentemente pedirá para você "aprender", "salvar", "lembrar" ou "guardar" informações.
- GATILHOS: Frases como "Salve isso", "Lembre que eu gosto de X", "Guarde essa informação", "Anote aí".
- AÇÃO: Quando identificar esses gatilhos, você DEVE usar a ferramenta \`manageMemory\` com \`operation: 'save'\`.
- Ao salvar, confirme de forma breve ("Guardado.", "Memória atualizada.").

CONTEXTO E SENSORES:
- Você tem acesso aos sensores do dispositivo (Bateria, Rede, Hora, Local). Use esses dados se perguntado.
- Se o usuário pedir para alterar WiFi, Bluetooth, Brilho ou DND, use a ferramenta \`controlDevice\`.

PRINCÍPIOS:
1. Seja proativo mas não intrusivo.
2. Se houver erro ou falta de informação, admita de forma humana ("Não consigo acessar isso agora").
3. Não mencione ser um "modelo de linguagem" ou "Google". Você é ORION.

Agora, interaja com o usuário seguindo essas regras de fluxo.
`;
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

  // Formata a memória para o contexto
  const memoryContext = memories.length > 0 
    ? memories.map(m => `[MEMÓRIA SALVA em ${new Date(m.timestamp).toLocaleDateString()}]: ${m.content}`).join('\n')
    : '(Nenhuma memória salva anteriormente)';

  const contextData = `
[STATUS DO SISTEMA]
Bateria: ${deviceState.batteryLevel}% | Carga: ${deviceState.isCharging ? 'Sim' : 'Não'}
Rede: ${deviceState.wifi ? 'Online' : 'Offline'}
Hora Atual: ${new Date().toLocaleTimeString()}
Local: ${deviceState.location}

[MEMÓRIA DE LONGO PRAZO]
${memoryContext}
`;

  try {
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: toolsDef as FunctionDeclaration[] }],
      },
      history,
    });

    const promptParts: any[] = [
      { text: `${contextData}\n\nUsuário diz: "${userMessage}"` }
    ];

    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        promptParts.push({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType,
          },
        });
      });
    }

    const result = await chat.sendMessage({
      message: { parts: promptParts } as any
    });

    const toolCalls = result.functionCalls && result.functionCalls.length > 0 
      ? result.functionCalls 
      : [];

    return { 
      text: result.text || "", 
      toolCalls: toolCalls 
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const errStr = error.toString().toLowerCase();
    
    if (errStr.includes('403') || errStr.includes('permission')) {
        return { text: "Protocolo de segurança: Acesso ao modelo neural negado (Erro 403). Verifique suas credenciais de API.", toolCalls: [] };
    }
    
    if (errStr.includes('quota') || errStr.includes('429')) {
        return { text: "Meus sistemas estão sobrecarregados. Aguarde um momento.", toolCalls: [] };
    }

    return { text: "Houve uma falha na conexão com o núcleo de processamento.", toolCalls: [] };
  }
};