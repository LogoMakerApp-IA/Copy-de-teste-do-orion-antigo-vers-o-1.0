import React from 'react';
import { Routine } from '../types';
import { Zap, Play, Trash2, Clock, ArrowRight } from 'lucide-react';

interface Props {
  routines: Routine[];
  onToggleRoutine: (id: string) => void;
  onDeleteRoutine: (id: string) => void;
}

const RoutineManager: React.FC<Props> = ({ routines, onToggleRoutine, onDeleteRoutine }) => {
  if (routines.length === 0) {
    return (
      <div className="text-center p-8 bg-orion-800/30 rounded-2xl border border-white/5 border-dashed">
        <Zap className="mx-auto text-gray-600 mb-2" size={32} />
        <p className="text-gray-400 text-sm">Nenhuma rotina ativa.</p>
        <p className="text-xs text-gray-600 mt-1">Converse com ORION para criar automações.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
        <Zap className="text-orion-400" size={20} />
        Rotinas Ativas
      </h2>
      <div className="grid gap-4">
        {routines.map((routine) => (
          <div 
            key={routine.id} 
            className={`p-4 rounded-xl border transition-all duration-300 ${
              routine.active 
                ? 'bg-orion-700/40 border-orion-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                : 'bg-orion-800/30 border-white/5 opacity-70'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-white font-medium">{routine.name}</h3>
                <div className="flex items-center gap-2 text-xs text-orion-400 mt-1">
                   <Clock size={12} />
                   <span>{routine.trigger}</span>
                </div>
              </div>
              <button 
                onClick={() => onToggleRoutine(routine.id)}
                className={`w-10 h-6 rounded-full p-1 transition-colors ${
                  routine.active ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  routine.active ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {routine.actions.map((action, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                    <ArrowRight size={10} className="text-orion-400" />
                    {action}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
                <button 
                    onClick={() => onDeleteRoutine(routine.id)}
                    className="text-gray-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors"
                >
                    <Trash2 size={12} />
                    Remover
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoutineManager;