import { useMemo } from 'react';
import { Bot, User, Settings as SettingsIcon, Database, ExternalLink, Moon, Sun, Monitor, Info } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { triggerHaptic } from '../../utils/haptics';
import { GOAL_CONFIGS, ACTIVITY_LEVELS, calculateGoalCalories } from '../../engine/projection';

export default function SettingsSheet() {
  const profile = useAppStore(state => state.profile);
  const setProfile = useAppStore(state => state.setProfile);
  const goal = useAppStore(state => state.goal);
  const setGoal = useAppStore(state => state.setGoal);
  const targetWeight = useAppStore(state => state.targetWeight);
  const setTargetWeight = useAppStore(state => state.setTargetWeight);
  const activityLevel = useAppStore(state => state.activityLevel);
  const setActivityLevel = useAppStore(state => state.setActivityLevel);
  
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);
  const robotMode = useAppStore(state => state.robotMode);
  const setRobotMode = useAppStore(state => state.setRobotMode);
  const resetAll = useAppStore(state => state.resetAll);
    
  const projection = useMemo(() => calculateGoalCalories(profile, goal, activityLevel), [profile, goal, activityLevel]);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      triggerHaptic('heavy');
      resetAll();
    }
  };

  return (
    <div className="min-h-[100dvh] pb-32 animate-in fade-in duration-500">
      <header className="px-6 pt-16 pb-6 sticky top-0 bg-[#FAFBFC]/80 dark:bg-[#0A0A0C]/80 backdrop-blur-xl z-20">
        <h1 className="text-3xl font-black tracking-tighter">Settings</h1>
      </header>

      <div className="px-6 space-y-10">
        
        {/* PROFILE */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400">
            <User size={18} /> <h3 className="font-bold uppercase tracking-widest text-xs">Profile</h3>
          </div>
          <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] border border-gray-100 dark:border-[#1f1f23] shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-[#1f1f23]">
              <span className="font-bold text-sm">Gender</span>
              <div className="flex bg-gray-100 dark:bg-[#0A0A0C] rounded-full p-1">
                {['male', 'female'].map(g => (
                  <button 
                    key={g}
                    onClick={() => { triggerHaptic(); setProfile({ gender: g }); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${profile.gender === g ? 'bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            {['height', 'weight', 'age'].map(m => (
              <div key={m} className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-[#1f1f23] last:border-0 last:pb-0">
                <span className="font-bold text-sm capitalize">{m}</span>
                <input 
                  type="number" 
                  value={profile[m]} 
                  onChange={e => setProfile({ [m]: Number(e.target.value) })} 
                  className="bg-transparent text-right font-black text-xl w-24 outline-none tabular-nums text-gray-900 dark:text-white" 
                />
              </div>
            ))}
          </div>
        </section>

        {/* GOAL & TARGETS */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400">
            <SettingsIcon size={18} /> <h3 className="font-bold uppercase tracking-widest text-xs">Goal & Targets</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {Object.entries(GOAL_CONFIGS).map(([key, config]) => (
              <button 
                key={key}
                onClick={() => { triggerHaptic('light'); setGoal(key); }}
                className={`w-full p-4 rounded-[20px] flex items-center justify-between transition-colors border-2 ${goal === key ? `border-${config.color}-500 bg-${config.color}-50 dark:bg-${config.color}-500/10` : 'border-transparent bg-gray-50 dark:bg-[#0A0A0C]'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.emoji}</span>
                  <div className="text-left">
                    <div className={`font-bold ${goal === key ? `text-${config.color}-700 dark:text-${config.color}-400` : 'text-gray-900 dark:text-white'}`}>{config.label}</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500">{config.desc}</div>
                  </div>
                </div>
                {goal === key && <div className={`w-3 h-3 rounded-full bg-${config.color}-500`} />}
              </button>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-[20px] mt-4 flex gap-3 text-blue-800 dark:text-blue-300">
            <Info className="shrink-0 mt-0.5" size={18} />
            <div className="text-sm font-medium leading-relaxed">
              <strong>Recomp</strong> targets simultaneous fat loss and muscle gain (slight calorie deficit + high protein). <strong>Maintain</strong> purely focuses on keeping your current weight stable (eating your exact TDEE).
            </div>
          </div>

          <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] border border-gray-100 dark:border-[#1f1f23] shadow-sm mb-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-sm">Target Weight</span>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  value={targetWeight} 
                  onChange={e => setTargetWeight(Number(e.target.value))} 
                  className="bg-transparent text-right font-black text-xl w-20 outline-none tabular-nums text-gray-900 dark:text-white" 
                />
                <span className="text-sm font-bold text-gray-500">kg</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-bold text-sm">Activity Level</span>
              <select 
                value={activityLevel} 
                onChange={e => setActivityLevel(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0A0A0C] rounded-xl px-4 py-3 font-bold text-sm outline-none border border-transparent appearance-none"
              >
                {Object.entries(ACTIVITY_LEVELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} ({v.desc})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-[24px] border border-emerald-100 dark:border-emerald-500/20">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-400 text-sm mb-4">Live Preview</h4>
            <div className="flex justify-between text-emerald-800 dark:text-emerald-300 mb-2 text-sm">
              <span>BMR (Base)</span>
              <span className="font-bold tabular-nums">{projection.bmr} kcal</span>
            </div>
            <div className="flex justify-between text-emerald-800 dark:text-emerald-300 mb-4 text-sm">
              <span>TDEE (With Activity)</span>
              <span className="font-bold tabular-nums">{projection.tdee} kcal</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-emerald-200 dark:border-emerald-500/30">
              <span className="font-black text-emerald-900 dark:text-emerald-400">Daily Target</span>
              <span className="font-black text-xl text-emerald-600 dark:text-emerald-400 tabular-nums">{projection.targetCals} kcal</span>
            </div>
          </div>
        </section>

        {/* COMPANION MODE */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400">
            <Bot size={18} /> <h3 className="font-bold uppercase tracking-widest text-xs">Companion Mode</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'good', label: 'Supportive', emoji: '😇' },
              { id: 'normal', label: 'Neutral', emoji: '🤖' },
              { id: 'bad', label: 'Savage', emoji: '😈' }
            ].map(m => (
              <button 
                key={m.id} 
                onClick={() => { triggerHaptic(); setRobotMode(m.id); }}
                className={`p-4 rounded-[20px] flex flex-col items-center justify-center text-center border-2 transition-all ${
                  robotMode === m.id 
                    ? 'border-gray-900 bg-white dark:border-white dark:bg-[#141416]' 
                    : 'border-transparent bg-white dark:bg-[#141416] opacity-60'
                }`}
              >
                <span className="text-2xl mb-1">{m.emoji}</span>
                <span className={`font-bold text-[10px] uppercase tracking-widest ${robotMode === m.id ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{m.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* APPEARANCE */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400">
            <Monitor size={18} /> <h3 className="font-bold uppercase tracking-widest text-xs">Appearance</h3>
          </div>
          <div className="flex bg-white dark:bg-[#141416] p-1.5 rounded-[20px] border border-gray-100 dark:border-[#1f1f23]">
            {[
              { id: 'light', icon: Sun, label: 'Light' },
              { id: 'system', icon: Monitor, label: 'System' },
              { id: 'dark', icon: Moon, label: 'Dark' }
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => { triggerHaptic(); setTheme(t.id); }}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-[16px] transition-colors ${theme === t.id ? 'bg-gray-100 dark:bg-[#1f1f23] text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1f1f23]/50'}`}
              >
                <t.icon size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* DATA & ABOUT */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400">
            <Database size={18} /> <h3 className="font-bold uppercase tracking-widest text-xs">Data & About</h3>
          </div>
          <div className="bg-white dark:bg-[#141416] rounded-[24px] border border-gray-100 dark:border-[#1f1f23] shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 text-left font-bold text-sm flex justify-between items-center border-b border-gray-100 dark:border-[#1f1f23]">
              <div className="flex items-center gap-3">
                <ExternalLink size={16} className="text-gray-400" />
                <span>Kcal App</span>
              </div>
              <span className="text-gray-400 uppercase tracking-widest text-[10px]">v6.0</span>
            </div>
            <button 
              onClick={handleReset}
              className="p-5 text-left font-bold text-sm text-red-500 flex justify-between items-center hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              Reset All Data
            </button>
          </div>
        </section>

      </div>

    </div>
  );
}
