import { useMemo, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, User, Target, Database, ExternalLink, Moon, Sun, Monitor, Info, Download, LogOut, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useWeightStore } from '../../store/useWeightStore';
import { useFoodStore } from '../../store/useFoodStore';
import { triggerHaptic } from '../../utils/haptics';
import { GOAL_CONFIGS, ACTIVITY_LEVELS, calculateGoalCalories } from '../../engine/projection';
import { toast } from '../../lib/toast';
import { VALIDATION } from '../../utils/constants';

const GOAL_COLORS = {
  rose: { container: 'border-rose-500 bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
  blue: { container: 'border-blue-500 bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  violet: { container: 'border-violet-500 bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
  emerald: { container: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' }
};

const THEME_LABELS = { light: 'Light', system: 'System', dark: 'Dark' };
const COMPANION_LABELS = { good: 'Supportive', normal: 'Neutral', bad: 'Savage' };

const PANELS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'goal', label: 'Goal & Nutrition', icon: Target },
  { id: 'companion', label: 'Companion', icon: Bot },
  { id: 'appearance', label: 'Appearance', icon: Monitor },
  { id: 'data', label: 'Data & Account', icon: Database },
];

/** Sub-page shell: back button + title, consistent across every settings panel. */
function Panel({ title, onBack, children }) {
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => { triggerHaptic('light'); onBack(); }}
          aria-label="Back to settings"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#141416] border border-gray-100 dark:border-[#1f1f23] shadow-sm text-gray-500 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-2xl font-black tracking-tighter">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function NavRow({ icon: Icon, label, value, onClick, isFirst, isLast }) {
  return (
    <button
      onClick={() => { triggerHaptic('light'); onClick(); }}
      className={`w-full flex items-center justify-between p-4 bg-white dark:bg-[#141416] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left ${!isLast ? 'border-b border-gray-100 dark:border-[#1f1f23]' : ''} ${isFirst ? 'rounded-t-[24px]' : ''} ${isLast ? 'rounded-b-[24px]' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 shrink-0 rounded-[12px] bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <Icon size={17} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm text-gray-900 dark:text-white">{label}</div>
          <div className="text-[12px] text-gray-400 truncate">{value}</div>
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" aria-hidden="true" />
    </button>
  );
}

export default function SettingsSheet() {
  const [panel, setPanel] = useState('home');

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
  const signOut = useAppStore(state => state.signOut);
  const deleteAccountData = useAppStore(state => state.deleteAccountData);

  const projection = useMemo(() => calculateGoalCalories(profile, goal, activityLevel), [profile, goal, activityLevel]);

  // Two-step confirmation for destructive actions
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const handleReset = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      setTimeout(() => setConfirmingReset(false), 5000);
      return;
    }
    triggerHaptic('heavy');
    deleteAccountData();
  };

  const handleLogout = () => {
    if (!confirmingLogout) {
      setConfirmingLogout(true);
      setTimeout(() => setConfirmingLogout(false), 5000);
      return;
    }
    triggerHaptic('heavy');
    signOut();
  };

  const handleExport = useCallback(() => {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        version: '6.0',
        profile: useAppStore.getState().profile,
        goal: useAppStore.getState().goal,
        activityLevel: useAppStore.getState().activityLevel,
        targetWeight: useAppStore.getState().targetWeight,
        ledger: useLedgerStore.getState().ledger,
        weightLog: useWeightStore.getState().weightLog,
        customFoods: useFoodStore.getState().customFoods,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kcal-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    }
  }, []);

  const handleProfileChange = (field, value) => {
    const num = Number(value);
    if (isNaN(num)) return;

    const ranges = {
      height: { min: VALIDATION.height.min, max: VALIDATION.height.max },
      weight: { min: VALIDATION.weight.min, max: VALIDATION.weight.max },
      age: { min: VALIDATION.age.min, max: VALIDATION.age.max },
    };

    const range = ranges[field];
    if (range && (num < range.min || num > range.max)) return;

    setProfile({ [field]: num });
  };

  const profileFields = [
    { key: 'height', unit: 'cm', min: VALIDATION.height.min, max: VALIDATION.height.max },
    { key: 'weight', unit: 'kg', min: VALIDATION.weight.min, max: VALIDATION.weight.max },
    { key: 'age', unit: 'yrs', min: VALIDATION.age.min, max: VALIDATION.age.max },
  ];

  const goBack = () => setPanel('home');

  const panelSummaries = {
    profile: `${profile.gender} · ${profile.height}cm · ${profile.weight}kg · ${profile.age}yo`,
    goal: `${GOAL_CONFIGS[goal]?.label || goal} · ${projection.targetCals} kcal/day`,
    companion: COMPANION_LABELS[robotMode] || robotMode,
    appearance: THEME_LABELS[theme] || theme,
    data: 'Export, sign out, delete',
  };

  return (
    <div className="min-h-[100dvh] pb-32 animate-in fade-in duration-500">
      <header className="px-6 pt-16 pb-6 sticky top-0 bg-[#F0F1EE]/80 dark:bg-[#0A0A0C]/80 backdrop-blur-xl z-20">
        <h1 className="text-3xl font-black tracking-tighter">{panel === 'home' ? 'Settings' : PANELS.find(p => p.id === panel)?.label}</h1>
      </header>

      <div className="px-6">
        <AnimatePresence mode="wait">
          {panel === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="bg-white dark:bg-[#141416] rounded-[24px] overflow-hidden"
            >
              {PANELS.map((p, i) => (
                <NavRow
                  key={p.id}
                  icon={p.icon}
                  label={p.label}
                  value={panelSummaries[p.id]}
                  onClick={() => setPanel(p.id)}
                  isFirst={i === 0}
                  isLast={i === PANELS.length - 1}
                />
              ))}
            </motion.div>
          )}

          {panel === 'profile' && (
            <Panel title="Profile" onBack={goBack}>
              <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-[#1f1f23]">
                  <label className="font-bold text-sm" id="gender-label">Gender</label>
                  <div className="flex bg-gray-100 dark:bg-[#0A0A0C] rounded-full p-1" role="radiogroup" aria-labelledby="gender-label">
                    {['male', 'female', 'other'].map(g => (
                      <button
                        key={g}
                        role="radio"
                        aria-checked={profile.gender === g}
                        onClick={() => { triggerHaptic(); setProfile({ gender: g }); }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${profile.gender === g ? 'bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                {profileFields.map(({ key, unit, min, max }) => (
                  <div key={key} className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-[#1f1f23] last:border-0 last:pb-0">
                    <label htmlFor={`profile-${key}`} className="font-bold text-sm capitalize">{key}</label>
                    <div className="flex items-center gap-1">
                      <input
                        id={`profile-${key}`}
                        type="number"
                        min={min}
                        max={max}
                        value={profile[key]}
                        onChange={e => handleProfileChange(key, e.target.value)}
                        aria-label={`${key} in ${unit}`}
                        className="bg-transparent text-right font-black text-xl w-20 outline-none tabular-nums text-gray-900 dark:text-white"
                      />
                      <span className="text-xs font-bold text-gray-400 w-6">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {panel === 'goal' && (
            <Panel title="Goal & Nutrition" onBack={goBack}>
              <div className="grid grid-cols-2 gap-3 mb-4" role="radiogroup" aria-label="Select your fitness goal">
                {Object.entries(GOAL_CONFIGS).map(([key, config]) => (
                  <button
                    key={key}
                    role="radio"
                    aria-checked={goal === key}
                    onClick={() => { triggerHaptic('light'); setGoal(key); }}
                    className={`w-full p-4 rounded-[20px] flex items-center justify-between transition-colors border-2 ${goal === key ? (GOAL_COLORS[config.color]?.container || GOAL_COLORS.emerald.container) : 'border-transparent bg-gray-50 dark:bg-[#0A0A0C]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" aria-hidden="true">{config.emoji}</span>
                      <div className="text-left">
                        <div className={`font-bold ${goal === key ? (GOAL_COLORS[config.color]?.text || 'text-gray-900 dark:text-white') : 'text-gray-900 dark:text-white'}`}>{config.label}</div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500">{config.desc}</div>
                      </div>
                    </div>
                    {goal === key && <div className={`w-3 h-3 rounded-full ${GOAL_COLORS[config.color]?.dot || 'bg-emerald-500'}`} />}
                  </button>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-[20px] mt-4 flex gap-3 text-blue-800 dark:text-blue-300">
                <Info className="shrink-0 mt-0.5" size={18} aria-hidden="true" />
                <div className="text-sm font-medium leading-relaxed">
                  <strong>Recomp</strong> targets simultaneous fat loss and muscle gain (slight calorie deficit + high protein). <strong>Maintain</strong> purely focuses on keeping your current weight stable (eating your exact TDEE).
                </div>
              </div>

              <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] mb-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <label htmlFor="target-weight" className="font-bold text-sm">Target Weight</label>
                  <div className="flex items-center gap-1">
                    <input
                      id="target-weight"
                      type="number"
                      min={VALIDATION.weight.min}
                      max={VALIDATION.weight.max}
                      value={targetWeight}
                      onChange={e => {
                        const v = Number(e.target.value);
                        if (!isNaN(v) && v >= VALIDATION.weight.min && v <= VALIDATION.weight.max) {
                          setTargetWeight(v);
                        }
                      }}
                      className="bg-transparent text-right font-black text-xl w-20 outline-none tabular-nums text-gray-900 dark:text-white"
                    />
                    <span className="text-sm font-bold text-gray-500">kg</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="activity-level" className="font-bold text-sm">Activity Level</label>
                  <div className="relative">
                    <select
                      id="activity-level"
                      value={activityLevel}
                      onChange={e => setActivityLevel(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0A0A0C] rounded-xl px-4 py-3 pr-10 font-bold text-sm outline-none border border-transparent appearance-none cursor-pointer"
                    >
                      {Object.entries(ACTIVITY_LEVELS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label} ({v.desc})</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-[24px] border border-emerald-100 dark:border-emerald-500/20">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-400 text-sm mb-4">Live Preview</h4>
                <div className="flex justify-between text-emerald-800 dark:text-emerald-300 mb-2 text-sm">
                  <span>BMR (Base)</span>
                  <span className="font-bold tabular-nums">{projection.bmr} kcal</span>
                </div>
                <div className="flex justify-between text-emerald-800 dark:text-emerald-300 mb-2 text-sm">
                  <span>TDEE (With Activity)</span>
                  <span className="font-bold tabular-nums">{projection.tdee} kcal</span>
                </div>
                <div className="flex justify-between text-emerald-800 dark:text-emerald-300 mb-4 text-sm">
                  <span>Macros (P / C / F)</span>
                  <span className="font-bold tabular-nums">{projection.macros.p}g / {projection.macros.c}g / {projection.macros.f}g</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-emerald-200 dark:border-emerald-500/30">
                  <span className="font-black text-emerald-900 dark:text-emerald-400">Daily Target</span>
                  <span className="font-black text-xl text-emerald-600 dark:text-emerald-400 tabular-nums">{projection.targetCals} kcal</span>
                </div>
              </div>
            </Panel>
          )}

          {panel === 'companion' && (
            <Panel title="Companion" onBack={goBack}>
              <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Select companion personality">
                {[
                  { id: 'good', label: 'Supportive', emoji: '😇' },
                  { id: 'normal', label: 'Neutral', emoji: '🤖' },
                  { id: 'bad', label: 'Savage', emoji: '😈' }
                ].map(m => (
                  <button
                    key={m.id}
                    role="radio"
                    aria-checked={robotMode === m.id}
                    onClick={() => { triggerHaptic(); setRobotMode(m.id); }}
                    className={`p-4 rounded-[20px] flex flex-col items-center justify-center text-center border-2 transition-all ${
                      robotMode === m.id
                        ? 'border-gray-900 bg-white dark:border-white dark:bg-[#141416]'
                        : 'border-transparent bg-white dark:bg-[#141416] opacity-60'
                    }`}
                  >
                    <span className="text-2xl mb-1" aria-hidden="true">{m.emoji}</span>
                    <span className={`font-bold text-[10px] uppercase tracking-widest ${robotMode === m.id ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{m.label}</span>
                  </button>
                ))}
              </div>
              {robotMode === 'bad' && (
                <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-[20px] mt-4 flex gap-3 text-amber-800 dark:text-amber-300">
                  <Info className="shrink-0 mt-0.5" size={16} aria-hidden="true" />
                  <p className="text-[13px] font-medium leading-relaxed">
                    Savage mode leans into blunt, tough-love messaging. If harsh framing around food/weight isn't helpful for you, Supportive or Neutral are gentler by design — and Kcal always softens the tone automatically if your intake looks dangerously low.
                  </p>
                </div>
              )}
            </Panel>
          )}

          {panel === 'appearance' && (
            <Panel title="Appearance" onBack={goBack}>
              <div className="flex bg-white dark:bg-[#141416] p-1.5 rounded-[20px] border border-gray-100 dark:border-[#1f1f23]" role="radiogroup" aria-label="Select theme">
                {[
                  { id: 'light', icon: Sun, label: 'Light' },
                  { id: 'system', icon: Monitor, label: 'System' },
                  { id: 'dark', icon: Moon, label: 'Dark' }
                ].map(t => (
                  <button
                    key={t.id}
                    role="radio"
                    aria-checked={theme === t.id}
                    onClick={() => { triggerHaptic(); setTheme(t.id); }}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-[16px] transition-colors ${theme === t.id ? 'bg-gray-100 dark:bg-[#1f1f23] text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1f1f23]/50'}`}
                  >
                    <t.icon size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
                  </button>
                ))}
              </div>
            </Panel>
          )}

          {panel === 'data' && (
            <Panel title="Data & Account" onBack={goBack}>
              <div className="bg-white dark:bg-[#141416] rounded-[24px] overflow-hidden flex flex-col">
                <div className="p-5 text-left font-bold text-sm flex justify-between items-center border-b border-gray-100 dark:border-[#1f1f23]">
                  <div className="flex items-center gap-3">
                    <ExternalLink size={16} className="text-gray-400" aria-hidden="true" />
                    <span>Kcal App</span>
                  </div>
                  <span className="text-gray-400 uppercase tracking-widest text-[10px]">v6.0</span>
                </div>

                <button
                  onClick={handleExport}
                  aria-label="Export all your data as JSON"
                  className="p-5 text-left font-bold text-sm flex items-center gap-3 border-b border-gray-100 dark:border-[#1f1f23] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <Download size={16} className="text-emerald-500" />
                  <span>Export My Data</span>
                </button>

                <button
                  onClick={handleLogout}
                  aria-label={confirmingLogout ? 'Confirm sign out' : 'Sign out of this device'}
                  className={`p-5 text-left font-bold text-sm flex justify-between items-center border-b border-gray-100 dark:border-[#1f1f23] transition-colors ${
                    confirmingLogout ? 'bg-amber-50 dark:bg-amber-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LogOut size={16} className={confirmingLogout ? 'text-amber-500' : 'text-gray-400'} />
                    <div>
                      <span className={confirmingLogout ? 'text-amber-600 dark:text-amber-400' : ''}>{confirmingLogout ? 'Tap again to sign out' : 'Sign Out'}</span>
                      {!confirmingLogout && <p className="text-[11px] font-medium text-gray-400 mt-0.5">Your data stays saved in the cloud</p>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleReset}
                  aria-label={confirmingReset ? 'Confirm permanent deletion of all data' : 'Delete all my data'}
                  className={`p-5 text-left font-bold text-sm flex justify-between items-center transition-colors ${
                    confirmingReset ? 'bg-red-50 dark:bg-red-500/10' : 'hover:bg-red-50 dark:hover:bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-red-500" />
                    <div>
                      <span className="text-red-500">{confirmingReset ? '⚠️ Tap again to permanently delete everything' : 'Delete All My Data'}</span>
                      {!confirmingReset && <p className="text-[11px] font-medium text-red-400 mt-0.5">Permanently erases your account data. Cannot be undone.</p>}
                    </div>
                  </div>
                </button>
              </div>
            </Panel>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
