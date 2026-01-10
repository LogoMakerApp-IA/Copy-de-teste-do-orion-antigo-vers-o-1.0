
import React from 'react';
import { ChatSession } from '../types';
import { History, Trash2, MessageSquare, Calendar, ChevronRight } from 'lucide-react';

interface Props {
  sessions: ChatSession[];
  onLoadSession: (session: ChatSession) => void;
  onDeleteSession: (id: string) => void;
}

const ChatHistoryView: React.FC<Props> = ({ sessions, onLoadSession, onDeleteSession }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="border-b border-material-outline-variant pb-6">
        <h2 className="text-3xl font-normal text-material-on-surface">Histórico de Chats</h2>
        <p className="text-sm text-material-on-surface-variant font-mono mt-1">Registros de interações passadas • Localmente seguros</p>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
            <History size={64} strokeWidth={1} />
            <div>
                <p className="text-lg font-medium">Nenhum histórico encontrado</p>
                <p className="text-xs">Inicie uma nova conversa para começar a registrar.</p>
            </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div 
                key={session.id}
                onClick={() => onLoadSession(session)}
                className="group relative bg-material-surface-container p-6 rounded-[2rem] border border-material-outline-variant/30 cursor-pointer hover:border-material-primary transition-all duration-300 shadow-sm hover:shadow-md"
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-material-on-surface group-hover:text-material-primary transition-colors pr-10">
                            {session.title || "Nova Conversa"}
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-material-on-surface-variant uppercase tracking-wider opacity-60">
                            <span className="flex items-center gap-1.5"><Calendar size={12}/> {session.date}</span>
                            <span className="flex items-center gap-1.5"><MessageSquare size={12}/> {session.messages.length} mensagens</span>
                        </div>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                        className="p-2 rounded-full hover:bg-red-500/10 text-material-outline hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
                
                <p className="text-sm text-material-on-surface-variant line-clamp-2 italic mb-4 opacity-80">
                    "{session.preview}..."
                </p>

                <div className="flex justify-between items-center pt-4 border-t border-material-outline-variant/10">
                    <span className="text-[10px] font-bold text-material-primary uppercase tracking-widest">Abrir Registro</span>
                    <ChevronRight size={16} className="text-material-primary group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatHistoryView;
