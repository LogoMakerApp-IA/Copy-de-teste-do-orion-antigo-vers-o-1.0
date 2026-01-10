import React, { useState, useReducer, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import {
  orionReducer,
  initialOrionState,
} from './state/orionState';

import {
  Message,
  Sender,
  MessageType,
  DeviceState,
  AppSettings,
  MemoryItem,
  OrionNotification,
  NotificationType
} from './types';

import OrionShell from './components/orion/OrionShell';
import { generateOrionResponse } from './Services/geminiService';
import { defaultLearnedBehavior } from './state/learnedBehavior';

/* ============================
   APP
============================ */

const App: React.FC = () => {

  /* ============================
     ESTADO COGNITIVO
  ============================ */
  const [orionState, dispatchOrion] = useReducer(
    orionReducer,
    initialOrionState
  );

  /* ============================
     ESTADOS PRINCIPAIS
  ============================ */
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  // Estado de Boot (Animação de Entrada)
  const [isBooting, setIsBooting] = useState(true);

  // Estado avançado de notificação
  const [activeNotification, setActiveNotification] = useState<OrionNotification | null>(null);
  const notificationQueueRef = useRef<OrionNotification[]>([]);
  
  // Estado para controlar a animação de carregamento
  const [chargingEvent, setChargingEvent] = useState<'connected' | 'disconnected' | null>(null);
  const prevChargingRef = useRef<boolean>(false);

  // Persistência da Memória
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    const saved = localStorage.getItem('orion_memories');
    return saved ? JSON.parse(saved) : [];
  });

  // Salvar memória sempre que mudar
  useEffect(() => {
    localStorage.setItem('orion_memories', JSON.stringify(memories));
  }, [memories]);

  // Estados mantidos para contexto da IA
  const [deviceState, setDeviceState] = useState<DeviceState>({
    wifi: typeof navigator !== 'undefined' ? navigator.onLine : true,
    bluetooth: true,
    dnd: false,
    batteryLevel: 100,
    isCharging: false,
    location: 'Sistema Local',
    brightness: 80,
    timeOfDay: new Date().getHours() < 12 ? 'Manhã' : new Date().getHours() < 18 ? 'Tarde' : 'Noite',
    model: 'Orion Web Interface',
    brand: 'System',
    osVersion: 'Web',
    accessLevel: 'full',
    storageTotal: '---',
    storageFree: '---',
    memory: '---'
  });

  const [settings] = useState<AppSettings>({
    aiName: 'ORION',
    personality: 'friendly', 
    autonomousMode: true,
    voiceTone: 'calm',
    voiceAvatar: 'orion_core',
    themePreset: 'system',
    themeMode: 'system', // Default to system sync
    customColor: '#FFFFFF',
    language: 'pt-BR',
    responseSpeed: 'balanced',
    visualIntensity: 'medium',
    googleUser: {
      name: 'Usuário',
      email: '',
      isLoggedIn: true
    }
  });

  /* ============================
     BOOT SEQUENCE
  ============================ */
  useEffect(() => {
    // Sequência de abertura:
    // 0s: Olhos fechados (sleeping)
    // 0.5s: Começa a abrir lentamente
    // 3.5s: UI aparece
    const bootTimer = setTimeout(() => {
      setIsBooting(false);
    }, 3500);

    return () => clearTimeout(bootTimer);
  }, []);

  /* ============================
     THEME SYNCHRONIZATION
  ============================ */
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let isDark = false;

      if (settings.themeMode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = settings.themeMode === 'dark';
      }

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    // Apply immediately
    applyTheme();

    // Listen for system changes if mode is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.themeMode === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.themeMode]);


  /* ============================
     REAL-TIME DEVICE SENSORS
  ============================ */
  useEffect(() => {
    // 1. BATERIA
    const initBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          // @ts-ignore
          const battery = await navigator.getBattery();
          
          prevChargingRef.current = battery.charging;

          const updateBattery = () => {
            setDeviceState(prev => ({
              ...prev,
              batteryLevel: Math.round(battery.level * 100),
              isCharging: battery.charging
            }));
          };
          
          updateBattery();
          battery.addEventListener('levelchange', updateBattery);
          battery.addEventListener('chargingchange', updateBattery);
        } catch (e) { console.warn('Battery API Unavailable'); }
      }
    };
    initBattery();

    // 2. REDE
    const updateOnline = () => setDeviceState(prev => ({ ...prev, wifi: navigator.onLine }));
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  /* ============================
     DETECTOR DE EVENTO DE CARGA
  ============================ */
  useEffect(() => {
    if (deviceState.isCharging !== prevChargingRef.current) {
      if (deviceState.isCharging) {
        setChargingEvent('connected');
        // Adiciona notificação de sistema
        addSystemNotification('battery', 'Carregamento iniciado');
      } else {
        setChargingEvent('disconnected');
        addSystemNotification('battery', 'Desconectado da energia');
      }
      
      setTimeout(() => {
        setChargingEvent(null);
      }, 2500);

      prevChargingRef.current = deviceState.isCharging;
    }
  }, [deviceState.isCharging]);


  /* ============================
     SISTEMA DE NOTIFICAÇÕES INTELIGENTE
  ============================ */
  
  const addSystemNotification = (type: NotificationType, text: string) => {
    const newNotif: OrionNotification = {
      id: uuidv4(),
      type,
      text,
      timestamp: Date.now(),
      isOld: false
    };
    
    // Adiciona à fila e define como ativa imediatamente
    notificationQueueRef.current.push(newNotif);
    setActiveNotification(newNotif);

    // Limpa a visualização ativa após 6 segundos, mas mantém na "fila" lógica se não foi descartada
    setTimeout(() => {
       setActiveNotification(prev => (prev?.id === newNotif.id ? null : prev));
    }, 6000);
  };

  // Simulação de Eventos Externos
  useEffect(() => {
    // Prioridade Absoluta: Bateria Crítica
    if (deviceState.batteryLevel <= 15 && !deviceState.isCharging) {
      // Evita spammar se já estiver mostrando
      if (activeNotification?.type !== 'battery') {
          addSystemNotification('battery', `Bateria crítica: ${deviceState.batteryLevel}%`);
      }
      return;
    }

    const eventCycle = setInterval(() => {
      // 80% de chance de não acontecer nada (silêncio)
      if (Math.random() > 0.2) return;
      if (chargingEvent) return; // Não interrompe animação de carga

      const mockEvents: { type: NotificationType, text: string }[] = [
        { type: 'call', text: 'Mãe' },
        { type: 'call', text: 'Desconhecido' },
        { type: 'message', text: 'WhatsApp: Grupo Família (3)' },
        { type: 'message', text: 'Instagram: @ana_design curtiu' },
        { type: 'calendar', text: 'Reunião Daily em 10m' },
        { type: 'system', text: 'Atualização de segurança instalada' },
      ];
      
      const evt = mockEvents[Math.floor(Math.random() * mockEvents.length)];
      addSystemNotification(evt.type, evt.type === 'call' ? `Chamada perdida: ${evt.text}` : evt.text);

    }, 20000); // Tenta a cada 20s

    return () => clearInterval(eventCycle);
  }, [deviceState.batteryLevel, deviceState.isCharging, chargingEvent]);


  // Lógica de "Lembrete de Notificação Antiga" (3-5 min)
  useEffect(() => {
    const reminderCheck = setInterval(() => {
        const now = Date.now();
        const AGING_THRESHOLD = 30000; 

        const oldNotification = notificationQueueRef.current.find(n => 
            (now - n.timestamp > AGING_THRESHOLD) && 
            (now - n.timestamp < 3600000)
        );

        if (oldNotification) {
            notificationQueueRef.current = notificationQueueRef.current.filter(n => n.id !== oldNotification.id);
            
            setActiveNotification({
                ...oldNotification,
                isOld: true, // Marca visualmente como antiga
                text: `Lembrete: ${oldNotification.text}`
            });

            setTimeout(() => {
                setActiveNotification(prev => (prev?.id === oldNotification.id ? null : prev));
            }, 5000);
        }

    }, 10000); // Checa a cada 10s

    return () => clearInterval(reminderCheck);
  }, []);


  /* ============================
     LÓGICA DE FERRAMENTAS (TOOLS)
  ============================ */
  const handleToolExecution = (toolCalls: any[]) => {
    let feedbackMessage = '';

    toolCalls.forEach(call => {
      const args = call.args;
      
      // FERRAMENTA: manageMemory
      if (call.name === 'manageMemory') {
        if (args.operation === 'save') {
          const newItem: MemoryItem = {
            id: uuidv4(),
            content: args.content,
            timestamp: Date.now(),
            category: 'general'
          };
          setMemories(prev => [...prev, newItem]);
          feedbackMessage = `Memória atualizada: "${args.content}"`;
        } 
        else if (args.operation === 'delete') {
          setMemories(prev => prev.filter(m => !m.content.includes(args.content)));
          feedbackMessage = `Removido da memória: "${args.content}"`;
        }
      }

      // FERRAMENTA: controlDevice
      if (call.name === 'controlDevice') {
        feedbackMessage = `Configuração alterada: ${args.setting} para ${args.value}`;
      }
    });

    return feedbackMessage;
  };

  /* ============================
     ENVIO DE MENSAGEM
  ============================ */

  const handleSendMessage = async (forcedText?: string) => {
    const text = (forcedText ?? inputValue).trim();
    if (!text) return;

    // ESTADO: THINKING
    dispatchOrion({ type: 'THINKING' });

    // Adiciona mensagem do usuário
    const userMessage: Message = {
      id: uuidv4(),
      text: text,
      sender: Sender.USER,
      type: MessageType.TEXT,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setActiveNotification(null); // Limpa notificações ao interagir

    try {
      // Prepara histórico para a API
      const history = messages.map(m => ({
        role: m.sender === Sender.USER ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await generateOrionResponse(
        history,
        deviceState,
        text,
        settings,
        defaultLearnedBehavior, 
        memories, // Passa as memórias persistidas
        [] 
      );

      // EXECUTA FERRAMENTAS (Se houver)
      let finalResponseText = response.text;
      
      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolFeedback = handleToolExecution(response.toolCalls);
        
        if (!finalResponseText.trim()) {
           finalResponseText = `*${toolFeedback}*`; 
        }
      }

      // ESTADO: RESPONDING
      dispatchOrion({ type: 'RESPONDING' });

      const orionMessage: Message = {
        id: uuidv4(),
        text: finalResponseText || '...',
        sender: Sender.ORION,
        type: MessageType.TEXT,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, orionMessage]);

    } catch (err) {
      console.error(err);
      
      // ESTADO: ERROR
      dispatchOrion({ type: 'ERROR', payload: 'Falha de Conexão' });

      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          text: 'Erro crítico na conexão neural.',
          sender: Sender.ORION,
          type: MessageType.TEXT,
          timestamp: Date.now()
        }
      ]);
      
      // Reseta para IDLE após mostrar o erro por um tempo
      setTimeout(() => {
          dispatchOrion({ type: 'IDLE' });
      }, 3000);
      return; // Sai antes do bloco finally padrão
    } 
    
    // Sucesso (Finally)
    dispatchOrion({ type: 'IDLE' });
  };

  /* ============================
     RENDER
  ============================ */

  return (
    <OrionShell
      messages={messages}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onSend={() => handleSendMessage()}
      settings={settings}
      deviceState={deviceState}
      orionState={orionState}
      activeNotification={activeNotification}
      chargingEvent={chargingEvent}
      isBooting={isBooting}
    />
  );
};

export default App;