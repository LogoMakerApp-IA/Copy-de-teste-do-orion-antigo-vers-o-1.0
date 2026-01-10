import OrionEyes from './OrionEyes';
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Sender, DeviceState, AppSettings, OrionNotification } from '../../types';
import { OrionState } from '../../state/orionState';
import { Phone, MessageSquare, Bell, BatteryCharging, Zap, Calendar, AlertTriangle } from 'lucide-react';

interface OrionShellProps {
  messages: Message[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: (text?: string) => void;
  settings: AppSettings;
  deviceState: DeviceState;
  orionState: OrionState;
  activeNotification?: OrionNotification | null;
  chargingEvent?: 'connected' | 'disconnected' | null;
  isBooting?: boolean;
}

// --- COMPONENTE DE DIGITAÇÃO ---
const TypingMessage: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isCursorVisible, setIsCursorVisible] = useState(true);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    let currentIndex = 0;
    let currentString = '';
    let timeoutId: ReturnType<typeof setTimeout>;

    const typeChar = () => {
      if (currentIndex >= text.length) {
        setIsCursorVisible(false);
        return;
      }

      const char = text[currentIndex];
      currentString += char;
      setDisplayedText(currentString);
      currentIndex++;

      let delay = Math.random() * 30 + 20; 

      if (char === ',') delay += 200; 
      if (['.', '!', '?', ':'].includes(char)) delay += 500; 
      if (char === '\n') delay += 700; 

      timeoutId = setTimeout(typeChar, delay);
    };

    timeoutId = setTimeout(typeChar, 100);

    return () => clearTimeout(timeoutId);
  }, [text]);

  return (
    <div className="relative">
      <ReactMarkdown>{displayedText}</ReactMarkdown>
      {isCursorVisible && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-material-on-surface align-text-bottom animate-pulse" style={{ animationDuration: '0.8s' }} />
      )}
    </div>
  );
};

// --- COMPONENTE ICONE DE NOTIFICAÇÃO ---
const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
    const iconProps = { size: 16, className: "text-material-primary opacity-90" }; 
    
    switch (type) {
        case 'call': return <Phone {...iconProps} />;
        case 'message': return <MessageSquare {...iconProps} />;
        case 'battery': return <BatteryCharging {...iconProps} />;
        case 'calendar': return <Calendar {...iconProps} />;
        case 'system': return <Zap {...iconProps} />;
        default: return <Bell {...iconProps} />;
    }
}

/**
 * ORION SHELL - Interface Unificada Minimalista
 */
const OrionShell: React.FC<OrionShellProps> = ({
  messages,
  inputValue,
  onInputChange,
  onSend,
  orionState,
  activeNotification = null,
  chargingEvent = null,
  isBooting = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // Mapeamento dos estados para lógica de interface
  const isThinking = orionState.status === 'THINKING';
  const isResponding = orionState.status === 'RESPONDING';
  const isError = orionState.status === 'ERROR';
  
  // Qualquer estado que não seja IDLE conta como "interagindo" para os olhos
  const isInteracting = orionState.status !== 'IDLE' || isFocused;
  
  const hasMessages = messages.length > 0;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isResponding, hasMessages]);

  return (
    <div className="fixed inset-0 bg-material-surface flex flex-col items-center justify-center overflow-hidden font-mono selection:bg-material-on-surface/20 transition-colors duration-500">
      
      {/* 
        CONTAINER PRINCIPAL (Olhos + Input)
      */}
      <div 
        className={`
          relative z-30 flex flex-col items-center w-full max-w-lg transition-all duration-[2000ms] cubic-bezier(0.22, 1, 0.36, 1)
          ${isBooting 
             ? 'translate-y-0 scale-110' // Centralizado durante o boot
             : hasMessages 
                ? '-translate-y-24 md:-translate-y-32 scale-100' 
                : 'translate-y-0 scale-100' // Estado normal sem mensagens
           }
        `}
      >
        {/* OLHOS */}
        <div className="mb-10 scale-125 md:scale-150">
          <OrionEyes 
            status={orionState.status} 
            isInteracting={isInteracting} 
            chargingEvent={chargingEvent}
            isBooting={isBooting}
          />
        </div>

        {/* MENSAGEM DE ERRO (Se houver) */}
        {isError && (
            <div className="absolute top-0 -mt-8 flex items-center gap-2 text-red-500 animate-pulse bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                <AlertTriangle size={12} />
                <span className="text-xs font-bold tracking-widest uppercase">{orionState.errorMessage || 'System Failure'}</span>
            </div>
        )}

        {/* INPUT & NOTIFICAÇÕES (Ocultos durante boot) */}
        <div 
            className={`w-full px-8 md:px-0 relative transition-opacity duration-[1500ms] delay-500 ${isBooting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          
          {/* CAMADA DE NOTIFICAÇÃO (Sobreposta ao placeholder) */}
          {activeNotification && !isFocused && !inputValue && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-4 animate-fade-in">
                 <div className={`flex items-center gap-3 px-4 py-2 rounded-full ${activeNotification.isOld ? 'bg-material-surface-container border border-material-outline/20' : ''}`}>
                     <NotificationIcon type={activeNotification.type} />
                     <span className={`text-sm tracking-wide ${activeNotification.isOld ? 'text-material-on-surface opacity-60' : 'text-material-on-surface'}`}>
                        {activeNotification.text}
                     </span>
                 </div>
             </div>
          )}

          <input
            autoFocus={!isBooting}
            type="text"
            value={inputValue}
            onChange={e => onInputChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder=""
            disabled={isThinking || isResponding || isBooting}
            onKeyDown={e => {
              if (e.key === 'Enter' && !isThinking && !isResponding && inputValue.trim()) {
                onSend();
              }
            }}
            className={`
              w-full text-center
              bg-transparent
              text-material-on-surface text-lg md:text-xl font-light tracking-widest
              outline-none
              border-b border-material-outline/20
              focus:border-material-on-surface/30
              transition-all duration-700 ease-out
              pb-4 caret-material-on-surface
              placeholder:text-sm placeholder:tracking-normal placeholder:transition-opacity placeholder:duration-500
              disabled:opacity-50 disabled:cursor-not-allowed
              ${activeNotification ? 'placeholder:opacity-0' : ''} 
            `}
          />
        </div>
      </div>

      {/* 
        JANELA DE CONVERSA (Histórico) - Oculta durante boot
      */}
      <div 
        className={`
          absolute bottom-0 w-full max-w-2xl px-6 z-20
          transition-all duration-1000 ease-in-out
          ${(hasMessages && !isBooting) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
        `}
        style={{ height: '45vh' }}
      >
        {/* Máscara de gradiente */}
        <div className="h-full overflow-y-auto custom-scrollbar mask-gradient-top pb-8">
          <style>{`
            .mask-gradient-top {
              mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 100%);
              -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 100%);
            }
            .custom-scrollbar::-webkit-scrollbar { width: 0px; }
          `}</style>

          <div className="flex flex-col justify-end min-h-full space-y-6 pt-12">
            {messages.map((msg, index) => {
              const isLastMessage = index === messages.length - 1;
              const isOrion = msg.sender === Sender.ORION;
              const shouldAnimate = isLastMessage && isOrion;

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.sender === Sender.USER ? 'items-end' : 'items-start'} animate-slide-up`}
                >
                  <div 
                    className={`max-w-[85%] text-sm md:text-base leading-relaxed py-2 px-4 rounded-2xl border border-transparent transition-all duration-500
                      ${msg.sender === Sender.USER 
                        ? 'text-material-on-surface/50 text-right italic border-material-outline/10 bg-material-on-surface/[0.03]' 
                        : 'text-material-on-surface text-left font-light tracking-wide shadow-sm bg-material-surface-container/50'
                      }
                    `}
                  >
                    {isOrion ? (
                       shouldAnimate ? (
                         <TypingMessage text={msg.text} />
                       ) : (
                         <ReactMarkdown>{msg.text}</ReactMarkdown>
                       )
                    ) : (
                       <span>{msg.text}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Indicador de Processamento */}
            {(isThinking || isResponding) && (
              <div className="flex items-center gap-3 pl-4 pt-2 opacity-50">
                 <div className="w-1.5 h-1.5 bg-material-on-surface rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-1.5 h-1.5 bg-material-on-surface rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-1.5 h-1.5 bg-material-on-surface rounded-full animate-bounce"></div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>
      </div>

    </div>
  );
};

export default OrionShell;