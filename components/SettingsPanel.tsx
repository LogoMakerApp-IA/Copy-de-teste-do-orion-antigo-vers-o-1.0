
import React from 'react';
import { AppSettings, VoiceAvatar, ThemePreset, ThemeMode, AppLanguage, VisualIntensity } from '../types';
import { 
  Shield, 
  Cpu, 
  Volume2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Zap,
  Palette,
  CheckCircle,
  Wand2,
  Sparkles,
  Bot,
  Feather,
  Sun,
  Moon,
  Monitor,
  Globe,
  Eye,
  Activity
} from 'lucide-react';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClearHistory: () => void;
}

const SettingsPanel: React.FC<Props> = ({ settings, onUpdateSettings, onClearHistory }) => {
  
  const toggleAutonomous = () => onUpdateSettings({ ...settings, autonomousMode: !settings.autonomousMode });
  const setPersonality = (p: AppSettings['personality']) => onUpdateSettings({ ...settings, personality: p });
  const setVoiceAvatar = (v: VoiceAvatar) => onUpdateSettings({ ...settings, voiceAvatar: v });
  const setThemePreset = (p: ThemePreset) => onUpdateSettings({ ...settings, themePreset: p });
  const setThemeMode = (m: ThemeMode) => onUpdateSettings({ ...settings, themeMode: m });
  const setLanguage = (l: AppLanguage) => onUpdateSettings({ ...settings, language: l });
  const setVisualIntensity = (i: VisualIntensity) => onUpdateSettings({ ...settings, visualIntensity: i });

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateSettings({ ...settings, themePreset: 'custom', customColor: e.target.value });
  };

  const themes: { id: ThemePreset, color: string, label: string }[] = [
      { id: 'system', color: '#8AB4F8', label: 'Tech Blue' },
      { id: 'emerald', color: '#6DD58C', label: 'Nature' },
      { id: 'rose', color: '#F28B82', label: 'Blossom' },
      { id: 'amber', color: '#FDCB6E', label: 'Sunlight' },
      { id: 'amethyst', color: '#C58AF9', label: 'Galaxy' }
  ];

  const voicePersonas: { id: VoiceAvatar, label: string, icon: React.ReactNode }[] = [
    { id: 'orion_core', label: 'Core', icon: <Sparkles size={24} className="mb-2 opacity-80" /> },
    { id: 'orion_calm', label: 'Calm', icon: <Feather size={24} className="mb-2 opacity-80" /> },
    { id: 'orion_direct', label: 'Direct', icon: <Zap size={24} className="mb-2 opacity-80" /> },
    { id: 'orion_warm', label: 'Warm', icon: <Sun size={24} className="mb-2 opacity-80" /> },
    { id: 'orion_minimal', label: 'Minimal', icon: <Bot size={24} className="mb-2 opacity-80" /> },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
      <div className="border-b border-material-outline-variant pb-6 flex justify-between items-end">
        <div>
            <h2 className="text-2xl md:text-3xl font-normal text-material-on-surface mb-2">Ajustes</h2>
            <p className="text-sm text-material-on-surface-variant font-mono">System Configuration • v3.5</p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-material-primary uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} />
            Desempenho Visual
        </h3>
        <div className="bg-material-surface-container rounded-3xl p-4 md:p-6 border border-material-outline-variant/30 backdrop-blur-sm">
             <label className="text-sm text-material-on-surface-variant mb-4 block">Intensidade das Animações</label>
             <div className="grid grid-cols-3 gap-2 p-1 bg-material-surface-bright rounded-2xl">
                 {(['low', 'medium', 'high'] as VisualIntensity[]).map((intensity) => (
                     <button 
                        key={intensity}
                        onClick={() => setVisualIntensity(intensity)}
                        className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                            settings.visualIntensity === intensity 
                            ? 'bg-material-surface text-material-primary shadow-md ring-1 ring-material-primary/20' 
                            : 'text-material-on-surface-variant hover:text-material-on-surface'
                        }`}
                     >
                         {intensity === 'low' ? 'Mínima' : intensity === 'medium' ? 'Equilibrada' : 'Máxima'}
                     </button>
                 ))}
             </div>
             <p className="mt-4 text-[10px] text-material-on-surface-variant uppercase tracking-widest text-center opacity-60">
                {settings.visualIntensity === 'low' ? 'Ideal para economia de energia e foco total.' : 
                 settings.visualIntensity === 'medium' ? 'Experiência padrão do Material You.' : 
                 'Efeitos reativos completos e física de molas ativa.'}
             </p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-material-primary uppercase tracking-widest flex items-center gap-2">
            <Palette size={14} />
            Interface & Tema
        </h3>
        <div className="bg-material-surface-container rounded-3xl p-4 md:p-6 border border-material-outline-variant/30 backdrop-blur-sm">
             <div className="mb-8">
                 <label className="text-sm text-material-on-surface-variant mb-4 block">Aparência</label>
                 <div className="grid grid-cols-3 gap-2 p-1 bg-material-surface-bright rounded-2xl">
                     <button onClick={() => setThemeMode('light')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs md:text-sm font-medium transition-all ${settings.themeMode === 'light' ? 'bg-material-surface text-material-on-surface shadow-md' : 'text-material-on-surface-variant hover:text-material-on-surface'}`}><Sun size={16} /> <span className="hidden md:inline">Claro</span></button>
                     <button onClick={() => setThemeMode('dark')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs md:text-sm font-medium transition-all ${settings.themeMode === 'dark' ? 'bg-material-surface text-material-on-surface shadow-md' : 'text-material-on-surface-variant hover:text-material-on-surface'}`}><Moon size={16} /> <span className="hidden md:inline">Escuro</span></button>
                     <button onClick={() => setThemeMode('system')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs md:text-sm font-medium transition-all ${settings.themeMode === 'system' ? 'bg-material-surface text-material-on-surface shadow-md' : 'text-material-on-surface-variant hover:text-material-on-surface'}`}><Monitor size={16} /> <span className="hidden md:inline">Auto</span></button>
                 </div>
             </div>

             <div className="mb-6">
                 <div className="flex items-center gap-2 mb-4">
                    <Wand2 className="text-material-primary" size={20}/>
                    <label className="text-lg text-material-on-surface font-medium">Cores Dinâmicas</label>
                 </div>
                 <div className="flex flex-wrap gap-4 mb-4 justify-start">
                     {themes.map((theme) => (
                         <button key={theme.id} onClick={() => setThemePreset(theme.id)} className={`group relative w-12 h-12 md:w-14 md:h-14 rounded-full transition-all flex items-center justify-center ${settings.themePreset === theme.id ? 'ring-2 ring-offset-2 ring-offset-material-surface scale-110 shadow-lg' : 'opacity-70 hover:opacity-100 hover:scale-105'}`} style={{ backgroundColor: theme.color }} title={theme.label}>
                             {settings.themePreset === theme.id && <CheckCircle size={20} className="text-black/50 drop-shadow-md" />}
                         </button>
                     ))}
                     <div className="relative flex items-center group">
                        <input type="color" value={settings.customColor} onChange={handleCustomColorChange} className="absolute opacity-0 w-full h-full cursor-pointer z-10" />
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all bg-[conic-gradient(from_180deg_at_50%_50%,#FF0000_0deg,#00FF00_120deg,#0000FF_240deg,#FF0000_360deg)] ${settings.themePreset === 'custom' ? 'ring-2 ring-offset-2 ring-offset-material-surface scale-110 shadow-lg' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}>
                            {settings.themePreset === 'custom' && <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-black/20" style={{backgroundColor: settings.customColor}} />}
                        </div>
                     </div>
                 </div>
             </div>
        </div>
      </section>

      {/* Restante do arquivo mantido conforme original... */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-material-primary uppercase tracking-widest flex items-center gap-2"><Volume2 size={14} /> Personas de Voz</h3>
        <div className="bg-material-surface-container rounded-3xl p-4 md:p-6 border border-material-outline-variant/30"><div className="grid grid-cols-2 gap-3">{voicePersonas.map(voice => (<button key={voice.id} onClick={() => setVoiceAvatar(voice.id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${settings.voiceAvatar === voice.id ? 'bg-material-secondary-container border-material-primary text-material-on-secondary-container shadow-md' : 'bg-material-surface-bright border-transparent text-material-on-surface-variant hover:bg-material-surface'}`}>{voice.icon}<span className="text-[10px] font-bold uppercase tracking-wider mb-1">{voice.label}</span></button>))}</div></div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-material-primary uppercase tracking-widest flex items-center gap-2"><Globe size={14} /> Idioma & Região</h3>
        <div className="bg-material-surface-container rounded-3xl p-4 md:p-6 border border-material-outline-variant/30"><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{ id: 'auto', label: 'Auto (Detect)', icon: <Sparkles size={16}/> }, { id: 'pt-BR', label: 'Português', icon: <span className="text-xs">🇧🇷</span> }, { id: 'en-US', label: 'English', icon: <span className="text-xs">🇺🇸</span> }, { id: 'es-ES', label: 'Español', icon: <span className="text-xs">🇪🇸</span> }].map((lang) => (<button key={lang.id} onClick={() => setLanguage(lang.id as AppLanguage)} className={`flex flex-col items-center justify-center p-3 rounded-xl gap-2 transition-all ${settings.language === lang.id ? 'bg-material-secondary-container text-material-on-secondary-container shadow-md ring-1 ring-material-primary' : 'bg-material-surface-bright text-material-on-surface-variant hover:bg-material-surface'}`}>{lang.icon}<span className="text-xs font-medium">{lang.label}</span></button>))}</div></div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-material-primary uppercase tracking-widest flex items-center gap-2"><Shield size={14} /> Privacidade</h3>
        <div className="bg-material-surface-container rounded-3xl border border-material-outline-variant/30 overflow-hidden"><button onClick={onClearHistory} className="w-full flex items-center justify-between p-6 hover:bg-material-surface-bright transition-colors group"><div className="flex items-center gap-3"><div className="p-2 bg-material-surface rounded-xl text-material-on-surface-variant group-hover:text-red-400 transition-colors"><Trash2 size={18} /></div><div className="text-left"><span className="block text-sm text-material-on-surface group-hover:text-red-400">Limpar Memória</span><span className="block text-xs text-material-on-surface-variant">Apaga o contexto local.</span></div></div></button></div>
      </section>
    </div>
  );
};

export default SettingsPanel;
