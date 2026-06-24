import { useState } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { Trash2 } from 'lucide-react';

export default function TactileStepper({ value, onChange, onRemove, label, unit, isLocked, cals }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    let parsed = Number(tempVal);
    if (!isNaN(parsed) && parsed >= 0) {
      if (parsed > 9999) parsed = 9999;
      if (parsed === 0 && onRemove) {
        onRemove();
      } else {
        onChange(parsed);
      }
    } else {
      setTempVal(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const increment = unit === 'g' ? 50 : 1;

  const handleMinus = () => {
    if (isLocked) return;
    triggerHaptic('light');
    const newVal = Math.max(0, value - increment);
    if (newVal === 0 && onRemove) {
      onRemove();
    } else {
      onChange(newVal);
      setTempVal(newVal);
    }
  };

  const handlePlus = () => {
    if (isLocked) return;
    triggerHaptic('light');
    const newVal = Math.min(9999, value + increment);
    onChange(newVal);
    setTempVal(newVal);
  };

  // Calculate total calories for this item
  const multiplier = unit === 'g' ? value / 100 : value;
  const totalCals = Math.round(cals * multiplier);

  // Clean unit display
  const displayUnit = unit === 'g' ? 'g' : unit?.trim() || '';
  const perUnitLabel = unit === 'g' ? '100g' : displayUnit;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`flex items-center justify-between p-4 min-h-[64px] rounded-[24px] mb-1 transition-all ${
        isLocked
          ? 'opacity-60'
          : 'hover:bg-gray-50 dark:hover:bg-white/5'
      }`}
    >
      <div className="flex flex-col min-w-0 flex-1 mr-3">
        <span className="font-bold text-[15px] tracking-tight truncate text-gray-900 dark:text-gray-100">{label}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[12px] font-semibold text-gray-400 tabular-nums">
            {cals} per {perUnitLabel}
          </span>
          {value > 0 && (
            <>
              <span className="text-[12px] text-gray-300 dark:text-gray-600">·</span>
              <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400 tabular-nums">
                {totalCals} kcal
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!isLocked && (
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleMinus}
            aria-label={`Decrease ${label}`}
            className={`w-[44px] h-[44px] flex items-center justify-center rounded-[16px] font-bold transition-colors ${
              value <= increment && onRemove
                ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10'
                : 'bg-[#FAFBFC] dark:bg-[#0A0A0C] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-[#1f1f23]'
            }`}
          >
            {value <= increment && onRemove ? <Trash2 size={16} /> : '−'}
          </motion.button>
        )}

        {isEditing && !isLocked ? (
          <input
            autoFocus
            type="number"
            value={tempVal}
            onChange={e => {
              if (e.target.value.length <= 4) setTempVal(e.target.value);
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-14 text-center font-black text-[16px] bg-transparent outline-none border-b-2 border-emerald-500 tabular-nums text-gray-900 dark:text-gray-100"
          />
        ) : (
          <span
            onClick={() => !isLocked && setIsEditing(true)}
            className={`w-14 text-center font-black text-[16px] tabular-nums tracking-tight text-gray-900 dark:text-gray-100 ${!isLocked ? 'cursor-pointer border-b-2 border-dashed border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 rounded-t py-1' : ''}`}
          >
            {value}{value > 0 && displayUnit ? <span className="text-[12px] text-gray-500 ml-0.5 font-bold">{displayUnit}</span> : ''}
          </span>
        )}

        {!isLocked && (
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handlePlus}
            aria-label={`Increase ${label}`}
            className="w-[44px] h-[44px] flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[16px] font-bold"
          >
            +
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
