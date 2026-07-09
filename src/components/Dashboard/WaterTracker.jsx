import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Plus, Minus, Wand2 } from 'lucide-react';
import { useWaterStore } from '../../store/useWaterStore';
import { useAppStore } from '../../store/useAppStore';
import { getTodayKey } from '../../utils/dates';
import { triggerHaptic } from '../../utils/haptics';
import { WATER_GLASS_ML } from '../../utils/constants';
import { getRecommendedWaterGlasses } from '../../engine/projection';

/**
 * Compact water intake tracker widget for the dashboard.
 * Shows a row of glass icons and quick-add buttons.
 */
function WaterTracker({ dateKey }) {
  const key = dateKey ?? getTodayKey();
  const waterTarget = useWaterStore(s => s.waterTarget);
  const waterLog = useWaterStore(s => s.waterLog);
  const addGlass = useWaterStore(s => s.addGlass);
  const removeGlass = useWaterStore(s => s.removeGlass);
  const addBottle = useWaterStore(s => s.addBottle);
  const setWaterTarget = useWaterStore(s => s.setWaterTarget);
  const weight = useAppStore(s => s.profile.weight);

  const recommended = getRecommendedWaterGlasses(weight);
  const handlePersonalize = useCallback(() => {
    triggerHaptic('success');
    setWaterTarget(recommended);
  }, [recommended, setWaterTarget]);

  const current = waterLog[key] ?? { glasses: 0, ml: 0 };
  const glasses = current.glasses;
  const isFull = glasses >= waterTarget;

  const handleAdd = useCallback(() => {
    triggerHaptic('light');
    addGlass(key);
  }, [key, addGlass]);

  const handleRemove = useCallback(() => {
    if (glasses <= 0) return;
    triggerHaptic('light');
    removeGlass(key);
  }, [key, glasses, removeGlass]);

  const handleAddBottle = useCallback(() => {
    triggerHaptic('light');
    addBottle(key);
  }, [key, addBottle]);

  return (
    <div className="bg-white dark:bg-[#141416] rounded-[24px] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-50 dark:bg-sky-500/10 rounded-[10px] flex items-center justify-center">
            <Droplets size={16} className="text-sky-500" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">Water</span>
        </div>
        <span className={`text-sm font-black tabular-nums ${isFull ? 'text-sky-500' : 'text-gray-400'}`}>
          {glasses}/{waterTarget}
        </span>
      </div>

      {waterTarget !== recommended && (
        <button
          onClick={handlePersonalize}
          className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600 dark:text-sky-400 mb-3 hover:opacity-80 transition-opacity"
        >
          <Wand2 size={12} /> Use {recommended}-glass target for your weight
        </button>
      )}

      {/* Glass row */}
      <div className="flex gap-1 mb-3 flex-wrap" role="group" aria-label={`${glasses} of ${waterTarget} glasses`}>
        {Array.from({ length: waterTarget }).map((_, i) => (
          <motion.button
            key={i}
            onClick={i < glasses ? handleRemove : handleAdd}
            whileTap={{ scale: 0.85 }}
            aria-label={i < glasses ? `Remove glass ${i + 1}` : `Add glass ${i + 1}`}
            className="flex-1 min-w-[40px] max-w-[44px]"
          >
            <div className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-colors ${
              i < glasses 
                ? 'bg-sky-500/20 text-sky-500' 
                : 'bg-gray-50 dark:bg-white/5 text-gray-300 dark:text-gray-600'
            }`}>
              {i < glasses ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  💧
                </motion.span>
              ) : '·'}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Quick-add buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleRemove}
          disabled={glasses <= 0}
          aria-label="Remove a glass"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 dark:bg-white/5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30"
        >
          <Minus size={12} /> Glass
        </button>
        <button
          onClick={handleAdd}
          aria-label={`Add a glass (${WATER_GLASS_ML}ml)`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-sky-50 dark:bg-sky-500/10 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 active:scale-95 transition-all"
        >
          <Plus size={12} /> Glass
        </button>
        <button
          onClick={handleAddBottle}
          aria-label="Add a bottle (500ml)"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-sky-50 dark:bg-sky-500/10 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 active:scale-95 transition-all"
        >
          <Plus size={12} /> Bottle
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-sky-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (glasses / waterTarget) * 100)}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1 text-center">
        {current.ml}ml of {waterTarget * WATER_GLASS_ML}ml
      </p>
    </div>
  );
}

export default memo(WaterTracker);
