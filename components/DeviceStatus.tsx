
import React from 'react';
import { DeviceState } from '../types';
import { Wifi, Bluetooth, Moon, Battery, MapPin, BatteryCharging, AlertCircle, HardDrive, Cpu, Smartphone, Lock, Unlock } from 'lucide-react';

interface Props {
  state: DeviceState;
  autonomousMode?: boolean; 
}

const DeviceStatus: React.FC<Props> = ({ state, autonomousMode = false }) => {
  const isLocationActive = state.location !== 'Localizando...' && 
                           state.location !== 'GPS Offline' && 
                           state.location !== 'N/A' &&
                           state.location !== 'Localização Desativada';

  // Cálculo de Estilo da Bateria com Gradientes Suaves
  const getBatteryStyle = (level: number) => {
    if (level > 50) {
      // Alto: Verde para Azul (Tech/Clean)
      return {
        background: 'linear-gradient(90deg, #4ade80 0%, #3b82f6 100%)',
        shadowColor: '#4ade80'
      };
    } else if (level > 20) {
      // Médio: Laranja para Amarelo/Verde (Warning)
      return {
        background: 'linear-gradient(90deg, #f97316 0%, #eab308 100%)',
        shadowColor: '#f97316'
      };
    } else {
      // Crítico: Vermelho Escuro para Vermelho Vivo (Danger)
      return {
        background: 'linear-gradient(90deg, #991b1b 0%, #ef4444 100%)',
        shadowColor: '#ef4444'
      };
    }
  };

  const batteryStyle = getBatteryStyle(state.batteryLevel);
  const batteryLabel = state.isCharging ? 'Carregando' : 'Bateria';

  const itemBaseClass = "flex items-center justify-between text-sm p-2 rounded-xl transition-all border border-transparent";
  const itemActiveClass = "bg-material-surface text-material-on-surface shadow-sm border-material-outline-variant/20";
  const itemInactiveClass = "text-material-outline hover:bg-material-surface-bright";

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      
      {/* Indicador de Bateria Dinâmico */}
      <div 
        className="space-y-2 group p-4 -mx-2 rounded-3xl transition-all duration-700 border border-transparent"
        style={{ backgroundColor: `${batteryStyle.shadowColor}10` }} // 10% de opacidade para o fundo do container
      >
        <div className="flex justify-between items-end px-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-500" style={{ color: batteryStyle.shadowColor }}>
                {state.isCharging ? <BatteryCharging size={14} className="animate-pulse" /> : <Battery size={14} />}
                <span>{batteryLabel}</span>
            </div>
            <span className="font-mono text-xs text-material-on-surface font-medium">{state.batteryLevel}%</span>
        </div>
        
        <div className="relative h-2.5 w-full bg-material-surface-bright rounded-full overflow-hidden shadow-inner">
             <div 
                className="relative h-full transition-all duration-1000 ease-out overflow-hidden rounded-full"
                style={{ 
                  width: `${state.batteryLevel}%`,
                  background: batteryStyle.background,
                  boxShadow: `0 0 20px ${batteryStyle.shadowColor}60`
                }}
             >
                 {state.isCharging && (
                     <>
                        <div className="absolute inset-0 w-full h-full bg-white/20 animate-[pulse_1.5s_infinite]"></div>
                        <div className="absolute top-0 left-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-flow"></div>
                     </>
                 )}
             </div>
        </div>
      </div>

      {/* Hardware Info Card */}
      <div className="bg-material-surface-bright/50 rounded-2xl p-3 border border-material-outline-variant/30 space-y-3">
          <div className="text-[10px] text-material-primary font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Smartphone size={12} />
              Hardware & Sistema
          </div>
          
          <div className="flex items-center justify-between text-xs">
              <span className="text-material-on-surface-variant">Marca</span>
              <span className="text-material-on-surface font-medium truncate ml-2 text-right">{state.brand}</span>
          </div>
           <div className="flex items-center justify-between text-xs">
              <span className="text-material-on-surface-variant">SO</span>
              <span className="text-material-on-surface font-medium truncate ml-2 text-right">{state.osVersion}</span>
          </div>

          <div className="h-px bg-material-outline-variant/20 my-1"></div>

          <div className="space-y-1">
             <div className="flex items-center justify-between text-[10px] text-material-on-surface-variant">
                 <span className="flex items-center gap-1"><HardDrive size={10} /> Armazenamento</span>
                 <span>{state.storageFree !== '...' ? `${state.storageFree} livres` : '...'}</span>
             </div>
             <div className="h-1 bg-material-surface rounded-full overflow-hidden">
                 <div className="h-full bg-material-secondary rounded-full" style={{ width: state.storageFree !== '...' && state.storageTotal !== '...' ? `${Math.max(10, 100 - (parseFloat(state.storageFree)/parseFloat(state.storageTotal) * 100))}%` : '0%' }}></div>
             </div>
          </div>

          <div className="space-y-1">
             <div className="flex items-center justify-between text-[10px] text-material-on-surface-variant">
                 <span className="flex items-center gap-1"><Cpu size={10} /> Memória RAM</span>
                 <span>{state.memory}</span>
             </div>
          </div>
          
          <div className={`mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider p-2 rounded-lg justify-center ${
              state.accessLevel === 'full' ? 'bg-emerald-500/10 text-emerald-400' :
              state.accessLevel === 'partial' ? 'bg-amber-500/10 text-amber-400' :
              'bg-red-500/10 text-red-400'
          }`}>
              {state.accessLevel === 'full' ? <Unlock size={10} /> : state.accessLevel === 'partial' ? <AlertCircle size={10} /> : <Lock size={10} />}
              <span>
                  {state.accessLevel === 'full' ? 'Acesso Total' : state.accessLevel === 'partial' ? 'Acesso Parcial' : 'Restrito'}
              </span>
          </div>
      </div>

      {/* Connectivity Group */}
      <div className="space-y-2">
         <div className="text-[10px] text-material-primary font-bold uppercase tracking-widest px-2 mb-2">Conexões</div>
         
         <div className={`${itemBaseClass} ${state.wifi ? itemActiveClass : itemInactiveClass}`}>
            <div className="flex items-center gap-3">
                <Wifi size={18} className={state.wifi ? 'text-material-primary' : 'opacity-50'} />
                <span className={!state.wifi ? 'line-through opacity-70' : ''}>Wi-Fi</span>
            </div>
            {state.wifi && <div className="w-1.5 h-1.5 rounded-full bg-material-primary shadow-[0_0_8px_var(--md-sys-color-primary)]"></div>}
         </div>

         <div className={`${itemBaseClass} ${state.bluetooth ? itemActiveClass : itemInactiveClass}`}>
            <div className="flex items-center gap-3">
                <Bluetooth size={18} className={state.bluetooth ? 'text-material-primary' : 'opacity-50'} />
                <span className={!state.bluetooth ? 'line-through opacity-70' : ''}>Bluetooth</span>
            </div>
            {state.bluetooth && <div className="w-1.5 h-1.5 rounded-full bg-material-primary shadow-[0_0_8px_var(--md-sys-color-primary)]"></div>}
         </div>
         
         <div className={`${itemBaseClass} ${state.dnd ? 'bg-material-surface text-purple-400 shadow-sm border-purple-500/20' : itemInactiveClass}`}>
            <div className="flex items-center gap-3">
                <Moon size={18} className={state.dnd ? 'text-purple-400' : 'opacity-50'} />
                <span>Não Perturbe</span>
            </div>
            {state.dnd && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>}
         </div>

         <div className={`${itemBaseClass} ${isLocationActive ? itemActiveClass : itemInactiveClass}`}>
            <div className="flex items-center gap-3 overflow-hidden">
                <MapPin size={18} className={isLocationActive ? 'text-emerald-400' : 'opacity-50'} />
                <span className={`truncate ${!isLocationActive ? 'opacity-70' : ''}`}>
                    {isLocationActive ? state.location : 'Localização'}
                </span>
            </div>
            {isLocationActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>}
         </div>
      </div>

      {/* Brilho */}
      <div className="space-y-3 px-2 pt-2">
         <div className="flex items-center justify-between text-[10px] text-material-primary font-bold uppercase tracking-widest">
            <span>Brilho</span>
            <span className="text-material-on-surface">{state.brightness}%</span>
         </div>
         <div className="relative h-1 w-full bg-material-surface-bright rounded-full overflow-hidden">
             <div 
                className="absolute top-0 left-0 h-full bg-material-on-surface transition-all duration-1000 ease-in-out opacity-80"
                style={{ width: `${state.brightness}%` }}
             ></div>
         </div>
      </div>
    </div>
  );
};

export default DeviceStatus;