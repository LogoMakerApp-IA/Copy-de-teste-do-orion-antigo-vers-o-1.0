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

const App: React.FC = () => {
  const [orionState, dispatchOrion] = useReducer(orionReducer, initialOrionState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isBooting, setIsBooting] = useState(true);
  const [activeNotification, setActiveNotification] = useState<OrionNotification | null>(null);
  const notificationQueueRef = useRef<OrionNotification[]>([]);
  const [chargingEvent, setChargingEvent] = useState<'connected' | 'disconnected' | null>(null);
  const prevChargingRef = useRef<boolean>(false);

  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    const saved = localStorage.getItem('orion_memories');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('orion_memories', JSON.stringify(memories));
  }, [memories]);

  const [deviceState, setDeviceState] = useState<DeviceState>({
    wifi: true,
    bluetooth: true,
    dnd: false,
    batteryLevel: 100,
    isCharging: false,
    location: 'Sistema Local',
    brightness: 80,
    timeOfDay: '',
    model: 'Orion Alpha',
    brand: 'System',
    osVersion: 'WebOS',
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
    themeMode: 'system',
    customColor: '#FFFFFF',
    language: 'pt-BR',
    responseSpeed: 'balanced',
    visualIntensity: 'medium',
    googleUser: { name: 'Usuário', email: '', isLoggedIn: true }
  });

  // BOOT SEQUENCE
  useEffect(() => {
    const bootTimer = setTimeout(() => setIsBooting(false), 3500);
    return () => clearTimeout(bootTimer);
  }, []);

  // BATTERY & SENSORS REAL-TIME
  useEffect(() => {
    const updateBatteryInfo = (battery: any) => {
      setDeviceState(prev => ({
        ...prev,
        batteryLevel: Math.round(battery.level * 100),
        isCharging: battery.charging
      }));

      if (battery.charging !== prevChargingRef.current) {
        setChargingEvent(battery.charging ? 'connected' : 'disconnected');
        setTimeout(() => setChargingEvent(null), 3000);
        prevChargingRef.current = battery.charging;
      }
    };

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        updateBatteryInfo(battery);
        battery.addEventListener('levelchange', () => updateBatteryInfo(battery));
        battery.addEventListener('chargingchange', () => updateBatteryInfo(battery));
      });
    }

    const updateOnline = () => setDeviceState(prev => ({ ...prev, wifi: navigator.onLine }));
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  // TOOL EXECUTION ENGINE
  const handleToolExecution = (toolCalls: any[]) => {
    let feedbacks: string[] = [];

    toolCalls.forEach(call => {
      const args = call.args;
      
      if (call.name === 'manageMemory') {
        if (args.operation === 'save') {
          const newItem: MemoryItem = {
            id: uuidv4(),
            content: args.content,
            timestamp: Date.now()
          };
          setMemories(prev => [...prev, newItem]);
          feedbacks.push(`Aprendi algo novo: "${args.content}"`);
        } 
        else if (args.operation === 'delete') {
          setMemories(prev => prev.filter(m => !m.content.includes(args.content)));
          feedbacks.push(`Informação removida da memória.`);
        }
      }

      if (call.name === 'controlDevice') {
        feedbacks.push(`Ajustei ${args.setting} para ${args.value}.`);
      }
    });

    return feedbacks.join(' | ');
  };

  const handleSendMessage = async (forcedText?: string) => {
    const text = (forcedText ?? inputValue).trim();
    if (!text) return;

    dispatchOrion({ type: 'THINKING' });

    const userMessage: Message = {
      id: uuidv4(),
      text: text,
      sender: Sender.USER,
      type: MessageType.TEXT,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setActiveNotification(null);

    try {
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
        memories,
        [] 
      );

      let toolFeedback = "";
      if (response.toolCalls && response.toolCalls.length > 0) {
        toolFeedback = handleToolExecution(response.toolCalls);
      }

      dispatchOrion({ type: 'RESPONDING' });

      // Se a ferramenta de memória foi usada e não há texto de resposta, o ORION confirma a ação
      const finalMsg = response.text || (toolFeedback ? `*${toolFeedback}*` : "Entendido.");

      const orionMessage: Message = {
        id: uuidv4(),
        text: finalMsg,
        sender: Sender.ORION,
        type: MessageType.TEXT,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, orionMessage]);

    } catch (err) {
      dispatchOrion({ type: 'ERROR', payload: 'Neural Link Error' });
    } finally {
      dispatchOrion({ type: 'IDLE' });
    }
  };

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