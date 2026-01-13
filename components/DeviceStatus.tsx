import React from 'react';
import { DeviceState } from '../types';
import { Wifi, Bluetooth, Moon, Battery, MapPin, BatteryCharging, AlertCircle, HardDrive, Cpu, Smartphone, Lock, Unlock } from 'lucide-react';

interface Props {
  state: DeviceState;
  autonomousMode?: boolean; 
}

const DeviceStatus: React.FC<Props> = ({ state, autonomousMode = false }) => {
  const isLocationActive = state.location !== 'Localizando...' && state.location !== 'N/A';

  const getBatteryStyle = (level: number, charging: boolean) => {
    if (charging) {
      return {
        background: 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #10b981 100%)',
        shadowColor: '#10b981',
        glow: '0 0 15px rgba(16, 185, 129, 0.5)'
      };
    }
    if (level > 50) return { background: 'linear-gradient(90deg, #4ade80 0%, #3b82f6 100%)', shadowColor: '#4ade80', glow: 'none' };
    if (level > 20) return { background: 'linear-gradient(90deg, #f97316 0%, #eab308 100%)', shadowColor: '#f97316', glow: 'none' };
    return { background: 'linear-gradient(90deg, #991b1b 0%, #ef4444 100%)', shadowColor: '#ef4444', glow: 'none' };
  };

  const style = getBatteryStyle(state.batteryLevel, state.isCharging);
  const itemBaseClass = "flex items-center justify-between text-sm p-2 rounded-xl transition-all border border-transparent";

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      
      {/* Indicador de Bateria Dinâmico */}
      <div 
        className="space-y-2 group p-4 -mx-2 rounded-3xl transition-all duration-700"
        style={{ backgroundColor: `${style.shadowColor}10` }}
      >
        <div className="flex justify-between items-end px-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: style.shadowColor }}>
                {state.isCharging ? <BatteryCharging size={14} className="animate-pulse" /> : <Battery size={14} />}
                <span>{state.isCharging ? 'Carregando' : 'Bateria'}</span>
            </div>
            <span className="font-mono text-xs text-material-on-surface font-medium">{state.batteryLevel}%</span>
        </div>
        
        <div className="relative h-3 w-full bg-material-surface-bright rounded-full overflow-hidden shadow-inner border border-material-outline-variant/10">
             <div 
                className={`relative h-full transition-all duration-1000 ease-out rounded-full ${state.isCharging ? 'animate-pulse' : ''}`}
                style={{ 
                  width: `${state.batteryLevel}%`,
                  background: style.background,
                  boxShadow: style.glow,
                  backgroundSize: state.isCharging ? '200% 100%' : '100% 100%'
                }}
             >
                 {state.isCharging && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-flow" style={{ animationDuration: '1.5s' }}></div>
                 )}
             </div>
        </div>
      </div>

      {/* Connectivity Group */}
      <div className="grid grid-cols-2 gap-2">
         <div className={`${itemBaseClass} bg-material-surface-container/50 ${state.wifi ? 'text-material-on-surface' : 'opacity-40'}`}>
            <Wifi size={16} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Wi-Fi</span>
         </div>
         <div className={`${itemBaseClass} bg-material-surface-container/50 ${state.bluetooth ? 'text-material-on-surface' : 'opacity-40'}`}>
            <Bluetooth size={16} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">BT</span>
         </div>
      </div>

      {/* Hardware Mini Card */}
      <div className="bg-material-surface-bright/50 rounded-2xl p-3 border border-material-outline-variant/30 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-material-on-surface-variant font-bold uppercase">
              <span className="flex items-center gap-1"><Smartphone size={10} /> {state.brand}</span>
              <span>{state.osVersion}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-material-on-surface-variant">
              <span className="flex items-center gap-1"><Cpu size={10} /> Memória</span>
              <span className="font-mono">{state.memory}</span>
          </div>
      </div>
    </div>
  );
};

export default DeviceStatus;