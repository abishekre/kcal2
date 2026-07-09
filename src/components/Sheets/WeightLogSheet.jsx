import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Plus, Scale, Save, CalendarDays, AlertTriangle, Trash2 } from 'lucide-react';
import { useWeightStore } from '../../store/useWeightStore';
import { useAppStore } from '../../store/useAppStore';
import { formatDateLong } from '../../utils/dates';
import { triggerHaptic } from '../../utils/haptics';
import { toast } from '../../lib/toast';
import { useSheetA11y } from '../../hooks/useSheetA11y';
import { kgToLbs, lbsToKg, weightUnit } from '../../utils/units';

export default function WeightLogSheet({ onClose }) {
  const sheetRef = useSheetA11y(onClose);
  const selectedDate = useAppStore(state => state.selectedDate);
  const profile = useAppStore(state => state.profile);
  const setProfile = useAppStore(state => state.setProfile);
  const unitSystem = useAppStore(state => state.unitSystem);

  const logWeight = useWeightStore(state => state.logWeight);
  const removeWeight = useWeightStore(state => state.removeWeight);
  const getWeightForDate = useWeightStore(state => state.getWeightForDate);
  const getWeightTrend = useWeightStore(state => state.getWeightTrend);
  const checkAnomaly = useWeightStore(state => state.checkAnomaly);

  const [weight, setWeight] = useState(profile.weight);
  const [prevSelectedDate, setPrevSelectedDate] = useState(selectedDate);
  const [confirmAnomaly, setConfirmAnomaly] = useState(false);

  if (selectedDate !== prevSelectedDate) {
    setPrevSelectedDate(selectedDate);
    const existing = getWeightForDate(selectedDate);
    setWeight(existing || profile.weight);
    setConfirmAnomaly(false);
  }

  const recentWeights = getWeightTrend(5).reverse();
  const anomalyWarning = checkAnomaly(weight);

  const handleLog = () => {
    if (anomalyWarning && !confirmAnomaly) {
      triggerHaptic('error');
      setConfirmAnomaly(true);
      return;
    }
    triggerHaptic('success');
    logWeight(selectedDate, weight);
    // Sync the profile weight to the most recent weigh-in in the log — not
    // whatever date was being edited — so back-filling an old date never
    // clobbers current weight (which drives BMR/TDEE). Reads store state
    // after logWeight so a rejected/invalid entry leaves the profile alone.
    const latest = useWeightStore.getState().getLatestWeight();
    if (latest != null) setProfile({ weight: latest });
    onClose();
  };

  // Weight is always stored in kg; these convert to/from the user's display
  // unit at 1-decimal precision (so imperial keeps ~0.1 lb granularity).
  const toDisp = (kg) => (kg === '' || kg == null ? '' : Math.round((unitSystem === 'imperial' ? kgToLbs(kg) : kg) * 10) / 10);
  const toKg = (disp) => Math.round((unitSystem === 'imperial' ? lbsToKg(disp) : disp) * 10) / 10;
  const wu = weightUnit(unitSystem);

  // adjust `amount` is in the DISPLAY unit (±1 lb or ±1 kg).
  const adjust = (amount) => {
    triggerHaptic('light');
    setConfirmAnomaly(false);
    setWeight(prev => {
      const cur = prev === '' || prev == null ? 0 : toDisp(prev);
      return toKg(Math.round((cur + amount) * 10) / 10);
    });
  };

  return (
    <motion.div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label="Log weight"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.8 }}
      onDragEnd={(e, info) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
          triggerHaptic('light');
          onClose();
        }
      }}
      className="fixed inset-0 bg-[#F0F1EE] dark:bg-[#0A0A0C] z-50 overflow-y-auto"
    >
      <div className="p-6 pb-4 sticky top-0 bg-[#F0F1EE]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-xl z-20">
        <div className="flex justify-between items-center pt-4 mb-6">
          <h2 className="text-3xl font-black tracking-tighter">Log Weight</h2>
          <button onClick={() => { triggerHaptic('light'); onClose(); }} className="p-3 bg-white dark:bg-[#141416] rounded-full shadow-sm border border-gray-100 dark:border-[#1f1f23]">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-32 space-y-8">
        
        <div className="flex items-center justify-center gap-2 text-gray-500 font-bold text-sm bg-gray-100 dark:bg-[#141416] py-3 rounded-full mx-auto w-max px-6">
          <CalendarDays size={18} /> {formatDateLong(selectedDate)}
        </div>

        <div className="bg-white dark:bg-[#141416] p-8 rounded-[32px] flex flex-col items-center">
          <Scale size={32} className="text-gray-300 dark:text-gray-700 mb-6" />
          
          <div className="flex items-center justify-center gap-6 w-full">
            <button 
              onClick={() => adjust(-0.1)}
              onPointerDown={() => triggerHaptic('light')}
              className="w-14 h-14 bg-gray-50 dark:bg-[#0A0A0C] rounded-full flex items-center justify-center active:scale-90 transition-transform active:bg-gray-200 dark:active:bg-[#1f1f23]"
            >
              <Minus size={24} />
            </button>
            
            <div className="flex items-baseline w-40 justify-center">
              <input
                type="text"
                inputMode="decimal"
                value={toDisp(weight)}
                aria-label={`Weight in ${wu}`}
                onChange={(e) => {
                  setConfirmAnomaly(false);
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) setWeight(toKg(val));
                  else if (e.target.value === '') setWeight('');
                }}
                onBlur={() => {
                  if (!weight || weight < 20) setWeight(profile.weight);
                }}
                className="text-6xl font-black tabular-nums tracking-tighter text-center bg-transparent outline-none w-full border-none"
              />
              <span className="text-xl font-bold text-gray-400 ml-1">{wu}</span>
            </div>
            
            <button 
              onClick={() => adjust(0.1)}
              onPointerDown={() => triggerHaptic('light')}
              className="w-14 h-14 bg-gray-50 dark:bg-[#0A0A0C] rounded-full flex items-center justify-center active:scale-90 transition-transform active:bg-gray-200 dark:active:bg-[#1f1f23]"
            >
              <Plus size={24} />
            </button>
          </div>

          <div className="flex gap-4 mt-8 w-full">
            {[-1, -0.5, 0.5, 1].map(val => (
              <button 
                key={val}
                onClick={() => adjust(val)}
                className="flex-1 py-3 bg-gray-50 dark:bg-[#0A0A0C] rounded-[16px] font-bold text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {val > 0 ? '+' : ''}{val}
              </button>
            ))}
          </div>
        </div>

        {anomalyWarning && (
          <div role="alert" className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-4 rounded-[20px] flex items-start gap-3 font-medium text-sm">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>{anomalyWarning}</span>
          </div>
        )}

        <button
          onClick={handleLog}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-5 rounded-[24px] font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
        >
          <Save size={20} /> {confirmAnomaly ? 'Save Anyway' : 'Save Weight'}
        </button>

        {recentWeights.length > 0 && (
          <section>
            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-4 px-2">Recent Logs</h3>
            <div className="bg-white dark:bg-[#141416] rounded-[24px] overflow-hidden">
              {recentWeights.map((log, index) => (
                <div key={log.date} className={`flex justify-between items-center p-4 ${index !== recentWeights.length - 1 ? 'border-b border-gray-100 dark:border-[#1f1f23]' : ''}`}>
                  <span className="font-bold text-sm text-gray-500">{formatDateLong(log.date)}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-black tabular-nums">{toDisp(log.weight)} {wu}</span>
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        const removed = log.weight;
                        removeWeight(log.date);
                        toast.undo(`Removed ${removed.toFixed(1)} kg log`, { onUndo: () => logWeight(log.date, removed) });
                      }}
                      aria-label={`Delete weigh-in from ${formatDateLong(log.date)}`}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </motion.div>
  );
}
