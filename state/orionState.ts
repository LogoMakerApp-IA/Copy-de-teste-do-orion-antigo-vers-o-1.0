
// src/state/orionState.ts

export type OrionCognitiveState = 
  | 'IDLE'        // aguardando
  | 'LISTENING'   // captando voz (futuro)
  | 'THINKING'    // processando IA
  | 'RESPONDING'  // digitando / falando
  | 'ERROR';      // falha

export interface OrionState {
  status: OrionCognitiveState;
  errorMessage?: string;
}

export type OrionAction =
  | { type: 'IDLE' }
  | { type: 'LISTENING' }
  | { type: 'THINKING' }
  | { type: 'RESPONDING' }
  | { type: 'ERROR'; payload?: string };

export const initialOrionState: OrionState = {
  status: 'IDLE'
};

export function orionReducer(
  state: OrionState,
  action: OrionAction
): OrionState {
  switch (action.type) {
    case 'LISTENING':
      return { status: 'LISTENING', errorMessage: undefined };

    case 'THINKING':
      return { status: 'THINKING', errorMessage: undefined };

    case 'RESPONDING':
      return { status: 'RESPONDING', errorMessage: undefined };

    case 'ERROR':
      return { status: 'ERROR', errorMessage: action.payload || 'Erro desconhecido' };

    case 'IDLE':
      return { status: 'IDLE', errorMessage: undefined };

    default:
      return state;
  }
}
