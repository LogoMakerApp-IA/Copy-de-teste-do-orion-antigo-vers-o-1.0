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
  // Inicializa como sleeping se estiver bootando, senão awake
  const [eyeState, setEyeState] = useState<EyeState>(isBooting ? 'sleeping' : 'awake');
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });
  
  // Estado local para a animação de carregamento (específica do olho esquerdo)
  // 'charging' = Verde pulsante, 'discharging' = Branco/Preto pulsante (normal)
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
      // Cancela timer anterior se houver mudança rápida
      if (batteryAnimTimerRef.current) clearTimeout(batteryAnimTimerRef.current);

      if (chargingEvent === 'connected') {
        setBatteryAnimState('charging');
      } else if (chargingEvent === 'disconnected') {
        setBatteryAnimState('discharging');
      }

      // Animação dura 2.5 segundos para dar tempo de apreciar o efeito
      batteryAnimTimerRef.current = setTimeout(() => {
        setBatteryAnimState(null);
      }, 2500);
    }
  }, [chargingEvent]);

  // 1. Lógica Principal de Estado (State Machine Interna)
  useEffect(() => {
    if (isBooting) return;

    // Se o status cognitivo não for IDLE, forçamos 'awake'
    if (status !== 'IDLE' || isInteracting) {
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
      
      if (eyeState === 'sleeping' || eyeState === 'tired') {
        setEyeState('awake');
        setLookOffset({ x: 0, y: 0 });
      }
      return;
    }

    // Sequência de repouso apenas no IDLE
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
    // Não anima movimentos aleatórios se estiver focado em uma tarefa cognitiva ou dormindo
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
        // --- PISCAR ---
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
        // --- OLHAR EM VOLTA ---
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


  // --- ESTILOS VISUAIS ---

  const getEyeStyles = (index: number) => {
    const elastic = "cubic-bezier(0.34, 1.56, 0.64, 1)";
    const smooth = "cubic-bezier(0.4, 0, 0.2, 1)";
    const slowWake = "cubic-bezier(0.22, 1, 0.36, 1)"; 
    
    // Define se estamos num estado cognitivo ativo
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
        background-color 0.5s ease,
        border-color 0.5s ease
      `,
      backgroundColor: 'var(--orion-eye-color)',
      backgroundImage: 'none',
      animation: 'none',
      border: '0px solid transparent'
    };

    // Override para Animação de Bateria (Apenas Olho Esquerdo - Index 0)
    let batteryOverride = {};
    if (index === 0 && batteryAnimState) {
        if (batteryAnimState === 'charging') {
            batteryOverride = {
                // "Energia Fluindo": Gradiente de Esmeralda Escuro -> Verde Neon Vibrante
                backgroundImage: 'linear-gradient(135deg, #059669 0%, #4ade80 100%)', 
                backgroundColor: 'transparent',
                // Bloom Effect Duplo (Glow interno + Glow externo)
                boxShadow: '0 0 35px #22c55e, inset 0 0 20px rgba(255,255,255,0.4)', 
                // Respiração lenta e profunda (2s)
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                // Borda sutil para definição
                border: '1px solid rgba(134, 239, 172, 0.5)' 
            };
        } else if (batteryAnimState === 'discharging') {
            batteryOverride = {
                // Flash de Luz Branca (Corte de energia)
                backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                backgroundColor: '#ffffff',
                // Luz "Estourada"
                boxShadow: '0 0 60px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 0.8)', 
                // Pulso frenético/glitch (0.15s)
                animation: 'pulse 0.15s ease-in-out infinite',
                border: '1px solid #ffffff'
            };
        }
    }

    // --- ESTADOS COGNITIVOS (Prioridade Alta) ---

    // 1. ERRO (Falha no sistema)
    if (status === 'ERROR') {
      return {
        ...common,
        height: '4rem',
        width: '4rem',
        borderRadius: '0.5rem', // Quadrado arredondado
        backgroundColor: '#ef4444', // Vermelho
        opacity: 1,
        transform: 'scale(1)',
        boxShadow: '0 0 30px rgba(239, 68, 68, 0.6)',
        // Glitch effect (simulado com animação rápida se houvesse keyframes complexos, aqui usamos pulse rápido)
        animation: 'pulse 0.1s infinite', 
        ...batteryOverride
      };
    }

    // 2. LISTENING (Ouvindo/Atento)
    if (status === 'LISTENING') {
      return {
        ...common,
        height: '6rem', // Bem aberto
        width: '6rem',
        borderRadius: '50%',
        opacity: 1,
        transform: 'scale(1.1)',
        // Glow "auditivo"
        boxShadow: '0 0 40px var(--orion-eye-color)', 
        animation: 'orb-breathe 2s ease-in-out infinite',
        ...batteryOverride
      };
    }

    // 3. THINKING (Processando)
    if (status === 'THINKING') {
      return {
        ...common,
        height: '5rem', 
        width: '5rem',
        borderRadius: '1.25rem',
        opacity: 1,
        transform: 'scale(1.1) rotate(180deg)',
        boxShadow: '0 0 30px var(--orion-eye-shadow)',
        animation: 'pulse 1s infinite'
      };
    }

    // 4. RESPONDING (Falando/Digitando)
    if (status === 'RESPONDING') {
      return {
        ...common,
        height: '4.5rem',
        width: '6rem',
        borderRadius: '1rem',
        opacity: 1,
        transform: 'scale(1.05)',
        boxShadow: '0 0 25px var(--orion-eye-shadow)',
        ...batteryOverride
      };
    }

    // --- ESTADOS DE REPOUSO (Prioridade Baixa) ---
    switch (eyeState) {
      case 'blinking':
        return {
          ...common,
          height: '4px',
          width: '5rem',
          borderRadius: '2px',
          opacity: 0.8,
          transform: `translate(${tx}px, ${ty}px)`,
          transition: 'all 0.1s ease-in',
          boxShadow: 'none',
          ...batteryOverride 
        };

      case 'tired':
        return {
          ...common,
          height: '2rem', 
          width: '5rem',
          borderRadius: '0.75rem',
          opacity: 0.7,
          transform: `translate(${tx}px, ${ty}px)`,
          boxShadow: '0 0 10px var(--orion-eye-shadow)',
          transition: `height 1s ${smooth}, transform 1s ${smooth}`,
          ...batteryOverride
        };

      case 'sleeping':
        return {
          ...common,
          height: '2px', // Fechado
          width: '3.5rem',
          borderRadius: '2px',
          opacity: isBooting ? 0 : 0.3, 
          transform: 'translate(0, 10px)',
          boxShadow: 'none',
          transition: `all 2s ease-in-out` 
        };

      case 'awake':
      default:
        return {
          ...common,
          height: '5rem',
          width: '5rem',
          borderRadius: '1.25rem',
          opacity: 0.95,
          transform: `translate(${tx}px, ${ty}px)`,
          boxShadow: '0 0 20px var(--orion-eye-shadow)',
          ...batteryOverride
        };
    }
  };

  return (
    <div className="flex gap-6 items-center justify-center h-32 w-full">
      <div 
        className="backdrop-blur-md"
        style={getEyeStyles(0)} // Olho Esquerdo
      />
      <div 
        className="backdrop-blur-md"
        style={getEyeStyles(1)} // Olho Direito
      />
    </div>
  );
};

export default OrionEyes;