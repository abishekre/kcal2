import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, RotateCcw } from 'lucide-react';
import { useFoodStore } from '../../store/useFoodStore';
import { useLedgerStore } from '../../store/useLedgerStore';
import { FOOD_CATEGORIES } from '../../data/foods';
import { triggerHaptic } from '../../utils/haptics';
import { toast } from '../../lib/toast';
import { getRelativeYesterdayKey } from '../../utils/dates';

const MEAL_LABEL = { morning: 'Morning', lunch: 'Lunch', eve: 'Evening', dinner: 'Dinner' };

// Route a one-tap add to the meal that fits the current time of day, so the
// most common action ("log the thing I'm eating right now") never requires
// picking a meal first.
function currentMealKey(hour) {
  if (hour >= 4 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 20) return 'eve';
  return 'dinner';
}

/**
 * One-tap quick-log row for the dashboard: the user's usual foods as chips
 * that log straight to the time-appropriate meal, plus a "Repeat yesterday"
 * shortcut that copies the whole previous day. Renders nothing for a
 * brand-new user with no history (so it never adds empty clutter).
 */
function QuickLogBar({ dateKey, fullDB }) {
  const getForYouFoods = useFoodStore((s) => s.getForYouFoods);
  const ledger = useLedgerStore((s) => s.ledger);
  const addFoodToMeal = useLedgerStore((s) => s.addFoodToMeal);
  const dittoYesterday = useLedgerStore((s) => s.dittoYesterday);

  const mealKey = currentMealKey(new Date().getHours());
  const mealLabel = MEAL_LABEL[mealKey] || 'meal';

  const chips = useMemo(() => {
    return getForYouFoods(ledger, 10)
      .map((id) => [id, fullDB[id]])
      .filter(([, food]) => food);
  }, [getForYouFoods, ledger, fullDB]);

  const yesterday = ledger[getRelativeYesterdayKey(dateKey)];
  const canRepeatDay = !!yesterday
    && Object.values(yesterday.meals || {}).some((m) => Object.keys(m).length > 0);

  if (chips.length === 0 && !canRepeatDay) return null;

  const handleQuickAdd = (id, food) => {
    const qty = food.unit === 'g' || food.unit === 'ml' ? 100 : 1;
    triggerHaptic('success');
    addFoodToMeal(dateKey, mealKey, id, qty);
    toast.success(`Added ${food.name} to ${mealLabel}`);
  };

  const handleRepeatDay = () => {
    triggerHaptic('medium');
    dittoYesterday(dateKey); // no mealKey → copies every meal from yesterday
  };

  return (
    <section className="mb-6" aria-label="Quick log">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Zap size={13} className="text-amber-500" aria-hidden="true" />
        <h2 className="text-[13px] font-black uppercase tracking-widest text-gray-400">
          Quick add · {mealLabel}
        </h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-6 px-6">
        {canRepeatDay && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleRepeatDay}
            aria-label="Repeat everything you logged yesterday"
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm shadow-sm active:scale-95 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <RotateCcw size={14} aria-hidden="true" /> Repeat yesterday
          </motion.button>
        )}
        {chips.map(([id, food]) => {
          const emoji = food.emoji || FOOD_CATEGORIES[food.category]?.emoji || '🍽️';
          return (
            <motion.button
              key={id}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleQuickAdd(id, food)}
              aria-label={`Quick add ${food.name} to ${mealLabel}`}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-[#141416] border border-gray-100 dark:border-[#1f1f23] font-bold text-sm shadow-sm active:scale-95 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <span aria-hidden="true">{emoji}</span>
              <span className="max-w-[120px] truncate">{food.name}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

export default memo(QuickLogBar);
