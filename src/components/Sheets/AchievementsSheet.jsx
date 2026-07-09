import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy } from 'lucide-react';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useWeightStore } from '../../store/useWeightStore';
import { useWaterStore } from '../../store/useWaterStore';
import { useFoodStore } from '../../store/useFoodStore';
import { useAppStore } from '../../store/useAppStore';
import { calculateGoalCalories, getStreak } from '../../engine/projection';
import { evaluateAchievements } from '../../engine/achievements';
import { triggerHaptic } from '../../utils/haptics';
import { useSheetA11y } from '../../hooks/useSheetA11y';

export default function AchievementsSheet({ onClose }) {
  const sheetRef = useSheetA11y(onClose);

  const ledger = useLedgerStore(s => s.ledger);
  const weightLog = useWeightStore(s => s.weightLog);
  const waterLog = useWaterStore(s => s.waterLog);
  const waterTarget = useWaterStore(s => s.waterTarget);
  const customFoods = useFoodStore(s => s.customFoods);
  const getFullDB = useFoodStore(s => s.getFullDB);
  const profile = useAppStore(s => s.profile);
  const goal = useAppStore(s => s.goal);
  const activityLevel = useAppStore(s => s.activityLevel);

  const achievements = useMemo(() => {
    const fullDB = getFullDB();
    const projection = calculateGoalCalories(profile, goal, activityLevel);
    const streak = getStreak(ledger, fullDB, projection.targetCals);
    return evaluateAchievements({
      ledger,
      fullDB,
      targetCals: projection.targetCals,
      targetProtein: projection.macros.p,
      weightLog,
      waterLog,
      waterTarget,
      initialWeight: profile.initialWeight || profile.weight,
      streak,
    });
    // getFullDB is stable; customFoods drives DB changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledger, weightLog, waterLog, waterTarget, profile, goal, activityLevel, customFoods]);

  const earned = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);

  return (
    <motion.div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label="Achievements"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.8 }}
      onDragEnd={(e, info) => { if (info.offset.y > 100 || info.velocity.y > 500) { triggerHaptic('light'); onClose(); } }}
      className="fixed inset-0 bg-[#F0F1EE] dark:bg-[#0A0A0C] z-50 flex flex-col"
    >
      <div className="px-6 pt-16 pb-4 bg-white/90 dark:bg-[#141416]/90 backdrop-blur-xl z-20 border-b border-gray-100 dark:border-[#1f1f23] rounded-b-[32px] shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tighter flex items-center gap-2"><Trophy size={24} className="text-amber-500" /> Achievements</h2>
          <p className="text-sm font-bold text-gray-400 mt-1 tabular-nums">{earned.length} of {achievements.length} unlocked</p>
        </div>
        <button onClick={() => { triggerHaptic('light'); onClose(); }} aria-label="Close achievements" className="w-10 h-10 bg-gray-100 dark:bg-[#1f1f23] rounded-full flex items-center justify-center shrink-0">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-8">
        {earned.length > 0 && (
          <section>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">Earned</h3>
            <div className="grid grid-cols-2 gap-3">
              {earned.map(a => (
                <div key={a.id} className="bg-white dark:bg-[#141416] p-4 rounded-[20px] border border-amber-200 dark:border-amber-500/20 flex items-center gap-3">
                  <span className="text-[28px]" aria-hidden="true">{a.icon}</span>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-gray-900 dark:text-white truncate">{a.title}</p>
                    <p className="text-[11px] font-medium text-gray-400 leading-tight">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">In progress</h3>
          <div className="grid grid-cols-1 gap-3">
            {locked.map(a => (
              <div key={a.id} className="bg-white dark:bg-[#141416] p-4 rounded-[20px] flex items-center gap-3 opacity-90">
                <span className="text-[28px] grayscale opacity-60" aria-hidden="true">{a.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-sm text-gray-900 dark:text-white truncate">{a.title}</p>
                    <span className="text-[11px] font-bold text-gray-400 tabular-nums shrink-0">
                      {Math.min(a.current, a.goal)}/{a.goal}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-400 leading-tight mb-2">{a.desc}</p>
                  <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-400 dark:bg-gray-500 rounded-full" style={{ width: `${a.progress * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
