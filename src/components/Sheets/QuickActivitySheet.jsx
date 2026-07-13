import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useExerciseStore } from '../../store/useExerciseStore';
import { useAppStore } from '../../store/useAppStore';
import { estimateSessionCalories } from '../../engine/workoutCalories';
import { BASE_EXERCISE_DB } from '../../data/exercises';
import { triggerHaptic } from '../../utils/haptics';
import { toast } from '../../lib/toast';
import { useSheetA11y } from '../../hooks/useSheetA11y';

// The everyday one-tap picks (walks, sports, classes) — full library is in
// the workout flow; this sheet is for "I played badminton for 40 min" speed.
const QUICK_KEYS = [
  'walking', 'running', 'cycling', 'badminton', 'cricket', 'football',
  'swimming_freestyle', 'yoga', 'hiit_class', 'dancing', 'hiking', 'jump_rope',
];
const DURATIONS = [15, 30, 45, 60, 90];

/**
 * Logs a standalone activity (no sets, no timer): pick what + how long, and
 * it's saved as a finished session with estimated burn.
 */
export default function QuickActivitySheet({ onClose }) {
  const sheetRef = useSheetA11y(onClose);
  const [activityKey, setActivityKey] = useState('walking');
  const [minutes, setMinutes] = useState(30);

  const saveSession = useWorkoutStore((s) => s.saveSession);
  const weightKg = useAppStore((s) => s.profile.weight) || 70;

  const est = useMemo(() => {
    const durationSeconds = minutes * 60;
    const { total } = estimateSessionCalories(
      { entries: [{ exerciseKey: activityKey, type: BASE_EXERCISE_DB[activityKey]?.type || 'activity', durationSeconds }] },
      { weightKg, exerciseDB: BASE_EXERCISE_DB, elapsedSeconds: durationSeconds }
    );
    return total;
  }, [activityKey, minutes, weightKg]);

  const handleLog = () => {
    const durationSeconds = minutes * 60;
    const now = Date.now();
    const ex = BASE_EXERCISE_DB[activityKey];
    const session = {
      id: crypto.randomUUID(),
      date: format(new Date(), 'yyyy-MM-dd'),
      name: ex?.name || 'Activity',
      startedAt: now - durationSeconds * 1000,
      endedAt: now,
      entries: [{
        id: crypto.randomUUID(),
        exerciseKey: activityKey,
        type: ex?.type || 'activity',
        sets: [],
        durationSeconds,
        distanceM: 0,
      }],
      caloriesBurned: est,
    };
    triggerHaptic('success');
    saveSession(session);
    useExerciseStore.getState().rememberLast(activityKey, { durationSeconds, distanceM: 0 });
    toast.success(`Logged ${ex?.name} · ~${est} kcal`);
    onClose();
  };

  return (
    <motion.div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label="Log a quick activity"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      className="fixed inset-0 bg-[#F0F1EE]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-xl z-[60] flex flex-col justify-end"
    >
      <div className="bg-white dark:bg-[#141416] p-6 rounded-t-[32px] border-t border-gray-100 dark:border-[#1f1f23] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <Zap className="text-violet-500" /> Quick Activity
          </h2>
          <button onClick={() => { triggerHaptic('light'); onClose(); }} aria-label="Close" className="p-2 bg-gray-50 dark:bg-[#0A0A0C] rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Activity</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {QUICK_KEYS.map((key) => {
            const ex = BASE_EXERCISE_DB[key];
            const active = activityKey === key;
            return (
              <button
                key={key}
                onClick={() => { triggerHaptic('light'); setActivityKey(key); }}
                aria-pressed={active}
                className={`p-3 rounded-[16px] text-[12px] font-bold leading-tight border-2 transition-all ${active ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'border-transparent bg-gray-50 dark:bg-[#0A0A0C] text-gray-600 dark:text-gray-300'}`}
              >
                {ex?.name.replace(/ \(.+\)/, '')}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Duration</p>
        <div className="flex gap-2 mb-6">
          {DURATIONS.map((m) => (
            <button
              key={m}
              onClick={() => { triggerHaptic('light'); setMinutes(m); }}
              aria-pressed={minutes === m}
              className={`flex-1 py-3 rounded-[14px] font-bold text-sm border-2 transition-all tabular-nums ${minutes === m ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'border-transparent bg-gray-50 dark:bg-[#0A0A0C] text-gray-600 dark:text-gray-300'}`}
            >
              {m}m
            </button>
          ))}
        </div>

        <button
          onClick={handleLog}
          className="w-full bg-violet-500 text-white py-5 rounded-[24px] font-black flex items-center justify-center gap-2 hover:bg-violet-600 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/20"
        >
          Log Activity <span className="opacity-75">~{est} kcal</span>
        </button>
        <p className="text-center text-[11px] text-gray-400 mt-3">Calorie burn is estimated from activity type, duration, and your body weight.</p>
      </div>
    </motion.div>
  );
}
