import React, { useEffect, useState, useRef } from 'react';
import { OrionCognitiveState } from '../../state/orionState';

interface OrionEyesProps {
  status: OrionCognitiveState;
  isInteracting?: boolean;
  chargingEvent?: 'connected' | 'disconnected' | null;
  isBooting?: boolean;
}

// Estados visuais internos (movimento natural)
type EyeState = 'awake' | 'tired' | 'sleeping' | 'blinking';

const OrionEyes: React.FC<OrionEyesProps> = ({ status, isInteracting = false, chargingEvent = null, isBooting = false }) => {
  const [eyeState, setEyeState] = useState<EyeState>(isBooting ? 'sleeping' : 'awake');
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });
  
  // Estado local para a animação de carregamento
  const [batteryAnimState, setBatteryAnimState] = useState<'charging' | 'discharging' | null>(null);

  // Refs para controlar timers
  const stateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lifeCycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const batteryAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 0. ANIMAÇÃO DE BOOT (Despertar)
  useEffect(() => {
    if (isBooting) {
      setEyeState('sleeping');
      const openTimer = setTimeout(() => {
        setEyeState('awake');
      }, 500);
      return () => clearTimeout(openTimer);
    }
  }, [isBooting]);

  // 0. Lógica de Animação de Bateria (Prioridade Visual Alta)
  useEffect(() => {
    if (chargingEvent) {
      if (batteryAnimTimerRef.current) clearTimeout(batteryAnimTimerRef.current);

      if (chargingEvent === 'connected') {
        setBatteryAnimState('charging');
      } else if (chargingEvent === 'disconnected') {
        setBatteryAnimState('discharging');
      }

      // Estendemos a animação para 3.5 segundos para garantir que o usuário perceba o fluxo
      batteryAnimTimerRef.current = setTimeout(() => {
        setBatteryAnimState(null);
      }, 3500);
    }
  }, [chargingEvent]);

  // 1. Lógica Principal de Estado
  useEffect(() => {
    if (isBooting) return;

    if (status !== 'IDLE' || isInteracting) {
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
      
      if (eyeState === 'sleeping' || eyeState === 'tired') {
        setEyeState('awake');
        setLookOffset({ x: 0, y: 0 });
      }
      return;
    }

    if (eyeState === 'awake') {
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
      stateTimerRef.current = setTimeout(() => {
        setEyeState('tired');
      }, 4000); 
    }
    else if (eyeState === 'tired') {
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
      stateTimerRef.current = setTimeout(() => {
        if (lifeCycleRef.current) clearInterval(lifeCycleRef.current);
        setLookOffset({ x: 15, y: 5 });
        sequenceTimerRef.current = setTimeout(() => {
            setLookOffset({ x: -15, y: 0 });
            sequenceTimerRef.current = setTimeout(() => {
                setLookOffset({ x: 0, y: 0 });
                setEyeState('sleeping');
            }, 1200);
        }, 1200);
      }, 5500);
    }

    return () => {
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
      if (batteryAnimTimerRef.current) clearTimeout(batteryAnimTimerRef.current);
    };
  }, [status, isInteracting, eyeState, isBooting]);

  // 2. Lógica de "Vida Artificial" (Movimentos e Piscar)
  useEffect(() => {
    if (isBooting || eyeState === 'sleeping' || status === 'THINKING' || status === 'LISTENING' || status === 'ERROR') {
        if (lifeCycleRef.current) clearInterval(lifeCycleRef.current);
        return;
    }

    const cycleTime = 2500; 

    lifeCycleRef.current = setInterval(() => {
      let blinkChance = 0.05; 
      let lookChance = 0.4;   

      if (isInteracting) {
        blinkChance = 0.35; 
        lookChance = 0.05; 
      } else if (eyeState === 'tired') {
        blinkChance = 0.1;
        lookChance = 0.2;
      }

      const randomAction = Math.random();

      if (randomAction < blinkChance) {
        const currentState = eyeState === 'blinking' ? 'awake' : eyeState;
        setEyeState('blinking');
        const blinkDuration = eyeState === 'tired' ? 250 : 150;
        setTimeout(() => {
            setEyeState(prev => {
                if (prev === 'sleeping') return 'sleeping'; 
                return currentState;
            });
        }, blinkDuration);
      } else if (randomAction < (blinkChance + lookChance)) {
        const range = eyeState === 'tired' ? 3 : 12; 
        const x = (Math.random() * range * 2) - range;
        const y = (Math.random() * range * 2) - range;
        setLookOffset({ x, y: y * 0.6 });
      } else {
        if (Math.random() > 0.5 || isInteracting) {
            setLookOffset({ x: 0, y: 0 });
        }
      }
    }, cycleTime);

    return () => {
      if (lifeCycleRef.current) clearInterval(lifeCycleRef.current);
    };
  }, [eyeState, status, isInteracting, isBooting]);

  const getEyeStyles = (index: number) => {
    const elastic = "cubic-bezier(0.34, 1.56, 0.64, 1)";
    const smooth = "cubic-bezier(0.4, 0, 0.2, 1)";
    const slowWake = "cubic-bezier(0.22, 1, 0.36, 1)"; 
    
    const isCognitiveActive = status !== 'IDLE';
    const tx = isCognitiveActive ? 0 : lookOffset.x;
    const ty = isCognitiveActive ? 0 : lookOffset.y;

    const transitionDuration = isBooting ? '2.5s' : '0.4s';
    const transitionEasing = isBooting ? slowWake : elastic;

    const common = {
      transition: `
        height ${transitionDuration} ${transitionEasing}, 
        width ${transitionDuration} ${transitionEasing}, 
        transform 0.5s ${smooth}, 
        border-radius 0.4s ease, 
        opacity 0.5s ease,
        box-shadow 0.5s ease,
        background-color 0.5s ease
      `,
      backgroundColor: 'var(--orion-eye-color)',
      backgroundImage: 'none',
      animation: 'none',
      position: 'relative' as const,
      overflow: 'hidden' as const
    };

    // --- LOGICA DE BATERIA (VORTEX REACTOR) ---
    if (batteryAnimState === 'charging') {
        if (index === 0) { // Olho Esquerdo: O Reator Principal
            return {
                ...common,
                height: '6rem',
                width: '6rem',
                borderRadius: '50%',
                backgroundColor: '#064e3b',
                boxShadow: '0 0 40px #10b981, inset 0 0 20px rgba(255,255,255,0.2)',
                animation: 'reactor-breathe 2s ease-in-out infinite',
                transform: 'scale(1.1)'
            };
        } else { // Olho Direito: Ressonância Simpática
            return {
                ...common,
                height: '5rem',
                width: '5rem',
                borderRadius: '1.25rem',
                animation: 'sympathetic-glow 2s ease-in-out infinite',
                backgroundColor: 'var(--orion-eye-color)',
            };
        }
    }

    if (batteryAnimState === 'discharging') {
        return {
            ...common,
            height: index === 0 ? '5rem' : '5rem',
            width: index === 0 ? '5rem' : '5rem',
            borderRadius: '1.25rem',
            animation: 'disconnect-flash 0.8s ease-out forwards',
        };
    }

    // --- ESTADOS COGNITIVOS ---
    if (status === 'ERROR') {
      return {
        ...common,
        height: '4rem', width: '4rem',
        borderRadius: '0.5rem',
        backgroundColor: '#ef4444',
        boxShadow: '0 0 30px rgba(239, 68, 68, 0.6)',
        animation: 'pulse 0.1s infinite', 
      };
    }

    if (status === 'LISTENING') {
      return {
        ...common,
        height: '6rem', width: '6rem',
        borderRadius: '50%',
        boxShadow: '0 0 40px var(--orion-eye-color)', 
        animation: 'orb-breathe 2s ease-in-out infinite',
      };
    }

    if (status === 'THINKING') {
      return {
        ...common,
        height: '5rem', width: '5rem',
        borderRadius: '1.25rem',
        transform: 'scale(1.1) rotate(180deg)',
        animation: 'pulse 1s infinite'
      };
    }

    if (status === 'RESPONDING') {
      return {
        ...common,
        height: '4.5rem', width: '6rem',
        borderRadius: '1rem',
        transform: 'scale(1.05)',
      };
    }

    // --- ESTADOS DE REPOUSO ---
    switch (eyeState) {
      case 'blinking':
        return {
          ...common,
          height: '4px', width: '5rem',
          borderRadius: '2px', opacity: 0.8,
          transform: `translate(${tx}px, ${ty}px)`,
          transition: 'all 0.1s ease-in',
        };
      case 'tired':
        return {
          ...common,
          height: '2rem', width: '5rem',
          borderRadius: '0.75rem', opacity: 0.7,
          transform: `translate(${tx}px, ${ty}px)`,
          transition: `height 1s ${smooth}, transform 1s ${smooth}`,
        };
      case 'sleeping':
        return {
          ...common,
          height: '2px', width: '3.5rem',
          borderRadius: '2px', opacity: isBooting ? 0 : 0.3, 
          transform: 'translate(0, 10px)',
          transition: `all 2s ease-in-out` 
        };
      case 'awake':
      default:
        return {
          ...common,
          height: '5rem', width: '5rem',
          borderRadius: '1.25rem', opacity: 0.95,
          transform: `translate(${tx}px, ${ty}px)`,
        };
    }
  };

  return (
    <div className="flex gap-6 items-center justify-center h-32 w-full">
      <div 
        className="backdrop-blur-md flex items-center justify-center"
        style={getEyeStyles(0)}
      >
          {batteryAnimState === 'charging' && (
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                    background: 'conic-gradient(from 0deg, transparent, #10b981, transparent)',
                    animation: 'energy-vortex 1.5s linear infinite'
                }}
              />
          )}
          {batteryAnimState === 'charging' && (
              <div className="w-4 h-4 rounded-full bg-white/30 blur-sm animate-pulse" />
          )}
      </div>
      <div 
        className="backdrop-blur-md"
        style={getEyeStyles(1)}
      />
    </div>
  );
};

export default OrionEyes;