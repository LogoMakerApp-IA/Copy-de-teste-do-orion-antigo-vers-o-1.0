
export enum Sender {
  USER = 'user',
  ORION = 'orion',
  SYSTEM = 'system'
}

export enum MessageType {
  TEXT = 'text',
  ACTION_REQUEST = 'action_request',
  ROUTINE_SUGGESTION = 'routine_suggestion',
  INFO_CARD = 'info_card'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  type: MessageType;
  timestamp: number;
  metadata?: any; 
  feedback?: 'like' | 'dislike' | null;
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
  preview: string;
  messages: Message[];
}

export interface MemoryItem {
  id: string;
  content: string;
  timestamp: number;
  category?: string;
}

export type SystemAccessLevel = 'full' | 'partial' | 'restricted';

export interface DeviceState {
  wifi: boolean;
  bluetooth: boolean;
  dnd: boolean;
  batteryLevel: number;
  isCharging: boolean;
  location: string;
  brightness: number;
  timeOfDay: string;
  model: string;
  brand: string;
  osVersion: string;
  accessLevel: SystemAccessLevel;
  storageTotal: string;
  storageFree: string;
  memory: string;
}

export interface Routine {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  active: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; 
  date: string; 
  description?: string;
}

export type NotificationType = 'call' | 'message' | 'system' | 'calendar' | 'battery';

export interface OrionNotification {
  id: string;
  type: NotificationType;
  text: string;
  timestamp: number;
  isOld: boolean; // Para marcar se é uma notificação "lembrete" (> 3 min)
}

export type VoiceAvatar = 'orion_core' | 'orion_calm' | 'orion_direct' | 'orion_warm' | 'orion_minimal';
export type ThemePreset = 'system' | 'emerald' | 'rose' | 'amber' | 'amethyst' | 'custom';
export type ThemeMode = 'system' | 'light' | 'dark';
export type AppLanguage = 'auto' | 'pt-BR' | 'en-US' | 'es-ES';
export type ResponseSpeed = 'fast' | 'balanced' | 'reflective';
export type VisualIntensity = 'low' | 'medium' | 'high';

export interface GoogleUser {
    name: string;
    email: string;
    avatar?: string;
    isLoggedIn: boolean;
}

export interface AppSettings {
  aiName: string;
  personality: 'professional' | 'friendly' | 'concise';
  autonomousMode: boolean; 
  voiceTone: 'calm' | 'energetic';
  voiceAvatar: VoiceAvatar; 
  themePreset: ThemePreset; 
  themeMode: ThemeMode;
  customColor: string; 
  language: AppLanguage;
  googleUser: GoogleUser;
  responseSpeed: ResponseSpeed;
  visualIntensity: VisualIntensity;
}