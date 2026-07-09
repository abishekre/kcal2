import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, CalendarRange, Flame, Beef, CheckCircle2, Trophy } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useFoodStore } from '../../store/useFoodStore';
import { useAppStore } from '../../store/useAppStore';
import { calculateGoalCalories, calculateConsumption, getStreak } from '../../engine/projection';
import { triggerHaptic } from '../../utils/haptics';
import { useSheetA11y } from '../../hooks/useSheetA11y';

function Stat({ icon: Icon, color, label, value, sub }) {
  return (
    <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px]">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={color} />
        <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-[28px] font-black tabular-nums text-gray-900 dark:text-white leading-none">{value}</div>
      {sub && <div className="text-[12px] font-semibold text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function WeeklyRecapSheet({ onClose }) {
  const sheetRef = useSheetA11y(onClose);
  const ledger = useLedgerStore(s => s.ledger);
  const customFoods = useFoodStore(s => s.customFoods);
  const getFullDB = useFoodStore(s => s.getFullDB);
  const profile = useAppStore(s => s.profile);
  const goal = useAppStore(s => s.goal);
  const activityLevel = useAppStore(s => s.activityLevel);

  const recap = useMemo(() => {
    const fullDB = getFullDB();
    const projection = calculateGoalCalories(profile, goal, activityLevel);
    const target = projection.targetCals;

    let sumCals = 0, sumProtein = 0, daysLogged = 0;
    let best = null; // { key, cals, distance }
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const key = format(subDays(today, i), 'yyyy-MM-dd');
      const rec = ledger[key];
      if (!rec?.meals) continue;
      const c = calculateConsumption(rec.meals, fullDB);
      if (c.cals <= 0) continue;
      daysLogged += 1;
      sumCals += c.cals;
      sumProtein += c.macros.p;
      // "Best" = closest to (at/under) target — the healthiest adherence.
      const distance = c.cals <= target ? target - c.cals : (c.cals - target) * 3;
      if (best === null || distance < best.distance) best = { key, cals: c.cals, distance };
    }

    return {
      target,
      daysLogged,
      avgCals: daysLogged ? Math.round(sumCals / daysLogged) : 0,
      avgProtein: daysLogged ? Math.round(sumProtein / daysLogged) : 0,
      bestDay: best ? format(subDays(today, 0), 'yyyy-MM-dd') === best.key ? 'Today' : format(new Date(best.key + 'T00:00:00'), 'EEEE') : null,
      bestCals: best?.cals ?? null,
      streak: getStreak(ledger, fullDB, target),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledger, profile, goal, activityLevel, customFoods]);

  return (
    <motion.div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label="Your week in review"
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
        <h2 className="text-3xl font-black tracking-tighter flex items-center gap-2"><CalendarRange size={24} className="text-emerald-500" /> Your Week</h2>
        <button onClick={() => { triggerHaptic('light'); onClose(); }} aria-label="Close weekly recap" className="w-10 h-10 bg-gray-100 dark:bg-[#1f1f23] rounded-full flex items-center justify-center shrink-0">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
        {recap.daysLogged === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📅</div>
            <p className="font-bold text-gray-500 dark:text-gray-400">No logs in the last 7 days</p>
            <p className="text-sm text-gray-400 mt-1">Log a few days and your recap will appear here.</p>
          </div>
        ) : (
          <>
            <p className="text-[15px] font-bold text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              You logged <span className="text-gray-900 dark:text-white">{recap.daysLogged} of the last 7 days</span>
              {recap.streak > 0 && <> and you&apos;re on a <span className="text-orange-500">{recap.streak}-day streak</span> 🔥</>}.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Stat icon={Flame} color="text-orange-500" label="Avg Calories" value={recap.avgCals} sub={`Target ${recap.target}`} />
              <Stat icon={Beef} color="text-emerald-500" label="Avg Protein" value={`${recap.avgProtein}g`} />
              <Stat icon={CheckCircle2} color="text-blue-500" label="Days Logged" value={`${recap.daysLogged}/7`} />
              <Stat icon={Trophy} color="text-amber-500" label="Best Day" value={recap.bestDay || '—'} sub={recap.bestCals ? `${recap.bestCals} kcal` : undefined} />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
