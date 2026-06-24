import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, ChevronDown, Trash2 } from 'lucide-react';
import TactileStepper from '../Core/TactileStepper';
import { triggerHaptic } from '../../utils/haptics';

const MEAL_CONFIG = {
  morning: { label: 'Morning', emoji: '🌅', accent: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
  lunch:   { label: 'Lunch',   emoji: '☀️', accent: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
  eve:     { label: 'Evening', emoji: '🌆', accent: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
  dinner:  { label: 'Dinner',  emoji: '🌙', accent: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-100 dark:border-violet-500/20' },
};

export default function MealSection({
  mealKey,
  title,
  foods,
  fullDB,
  isLocked,
  onUpdateQty,
  onRemoveFood,
  onDitto,
  onAddTap,
  onDeleteMeal
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const foodEntries = Object.entries(foods || {}).filter(([, qty]) => qty > 0);
  const config = MEAL_CONFIG[mealKey] || MEAL_CONFIG.morning;

  // Calculate meal total
  const mealTotal = foodEntries.reduce((sum, [fk, qty]) => {
    const food = fullDB[fk];
    if (!food) return sum;
    const multiplier = food.unit === 'g' ? qty / 100 : qty;
    return sum + Math.round(food.cals * multiplier);
  }, 0);

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`rounded-[32px] overflow-hidden mb-6 transition-colors ${
        isLocked
          ? 'bg-[#FAFBFC]/50 dark:bg-[#141416]/50 opacity-80'
          : 'bg-white dark:bg-[#141416]'
      }`}
    >
      {/* Header */}
      <div
        onClick={() => { setCollapsed(!collapsed); triggerHaptic('light'); }}
        className="w-full flex items-center justify-between px-5 py-5 min-h-[64px] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-[44px] h-[44px] rounded-[16px] flex items-center justify-center text-[22px] ${config.bg}`}>
            {config.emoji}
          </div>
          <div className="flex flex-col items-start">
            <h3 className={`text-[16px] font-black tracking-tight ${config.accent}`}>
              {title}
            </h3>
            {mealTotal > 0 && (
              <span className="text-[13px] font-bold text-gray-400 tabular-nums">
                {mealTotal} kcal
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isLocked && foodEntries.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onDitto(); }}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                title="Copy Yesterday"
              >
                <Copy size={16} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onAddTap(); }}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
              >
                <Plus size={18} />
              </motion.button>
              {onDeleteMeal && (
                confirmDelete ? (
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); triggerHaptic('heavy'); setConfirmDelete(false); onDeleteMeal(); }}
                    className="h-[36px] px-3 flex items-center justify-center rounded-full bg-red-500 text-white font-bold text-xs shadow-sm ml-1"
                  >
                    Confirm?
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      triggerHaptic('medium'); 
                      setConfirmDelete(true); 
                      setTimeout(() => setConfirmDelete(false), 3000); 
                    }}
                    className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors ml-1"
                    title="Delete Custom Meal"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                )
              )}
            </div>
          )}
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-white/5"
          >
            <ChevronDown size={18} className="text-gray-400 dark:text-gray-500" />
          </motion.div>
        </div>
      </div>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-3 space-y-1">
              <AnimatePresence>
                {foodEntries.map(([fk, qty]) => {
                  const foodDef = fullDB[fk];
                  if (!foodDef) return null;
                  return (
                    <TactileStepper
                      key={fk}
                      label={foodDef.name}
                      unit={foodDef.unit}
                      cals={foodDef.cals}
                      value={qty}
                      onChange={(val) => onUpdateQty(fk, val)}
                      onRemove={() => onRemoveFood(fk)}
                      isLocked={isLocked}
                    />
                  );
                })}
              </AnimatePresence>

              {foodEntries.length === 0 && !isLocked && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { triggerHaptic('light'); onAddTap(); }}
                  className={`w-full py-6 mt-1 border-[1.5px] border-dashed rounded-[20px] font-bold text-[14px] flex items-center justify-center gap-2.5 transition-colors ${config.border} ${config.accent} hover:bg-gray-50 dark:hover:bg-white/5 opacity-80 hover:opacity-100`}
                >
                  <Plus size={18} /> Add to {config.label}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
