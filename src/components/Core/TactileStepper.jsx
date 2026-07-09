
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { Trash2 } from 'lucide-react';
import { toast } from '../../lib/toast';

// Holding +/- ramps the step size up instead of only moving one increment
// per tap — for dialing in a much larger quantity without a long tap-fest.
const LONG_PRESS_DELAY_MS = 450;
const REPEAT_INTERVAL_MS = 90;
const RAMP_AFTER_REPEATS = 8; // after this many repeats, start multiplying the step

export default function TactileStepper({ value, onChange, onRemove, label, unit, isLocked, cals, step: stepProp }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value);
  const [capped, setCapped] = useState(false);

  // tempVal only matters while isEditing is true, so it's seeded fresh
  // from the current value right when edit mode starts rather than kept
  // in sync via an effect on every external value change.
  const startEditing = () => {
    if (isLocked) return;
    setTempVal(value);
    setIsEditing(true);
  };

  // Guard against undefined cals
  const safeCals = cals || 0;

  // Step defaults: 50 for grams, 1 for items, or use explicit prop
  const increment = stepProp != null ? stepProp : (unit === 'g' ? 50 : 1);

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

  const handleMinus = () => {
    if (isLocked) return;
    triggerHaptic('light');
    const newVal = Math.max(0, value - increment);
    if (newVal === 0 && onRemove) {
      // Show undo toast before removing
      const savedValue = value;
      toast.undo(`Removed ${label}`, {
        onUndo: () => {
          onChange(savedValue);
        },
      });
      onRemove();
    } else {
      onChange(newVal);
      setTempVal(newVal);
    }
  };

  const handlePlus = () => {
    if (isLocked) return;
    if (value >= 9999) {
      triggerHaptic('error');
      setCapped(true);
      setTimeout(() => setCapped(false), 400);
      return;
    }
    triggerHaptic('light');
    const newVal = Math.min(9999, value + increment);
    onChange(newVal);
    setTempVal(newVal);
  };

  // Long-press-to-accelerate on "+": holding ramps the step size up after a
  // few repeats, so dialing in a much larger quantity doesn't take a long
  // tap-fest. Uses refs (not state) for the timers so starting/stopping
  // doesn't itself trigger re-renders.
  const longPressTimer = useRef(null);
  const repeatTimer = useRef(null);
  const repeatCount = useRef(0);
  const didLongPress = useRef(false);
  const liveValue = useRef(value);
  useEffect(() => {
    liveValue.current = value;
  }, [value]);

  const stopLongPress = useCallback(() => {
    clearTimeout(longPressTimer.current);
    clearInterval(repeatTimer.current);
    longPressTimer.current = null;
    repeatTimer.current = null;
    repeatCount.current = 0;
  }, []);

  const tick = useCallback(() => {
    if (isLocked || liveValue.current >= 9999) {
      stopLongPress();
      return;
    }
    repeatCount.current += 1;
    const rampMultiplier = 1 + Math.floor(repeatCount.current / RAMP_AFTER_REPEATS);
    const step = increment * rampMultiplier;
    const newVal = Math.min(9999, liveValue.current + step);
    triggerHaptic('light');
    onChange(newVal);
    setTempVal(newVal);
  }, [isLocked, increment, onChange, stopLongPress]);

  const startLongPress = useCallback(() => {
    if (isLocked) return;
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      repeatTimer.current = setInterval(tick, REPEAT_INTERVAL_MS);
    }, LONG_PRESS_DELAY_MS);
  }, [isLocked, tick]);

  useEffect(() => stopLongPress, [stopLongPress]);

  // Calculate total calories for this item
  const multiplier = unit === 'g' ? value / 100 : value;
  const totalCals = Math.round(safeCals * multiplier);

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
            {safeCals} per {perUnitLabel}
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
            aria-label={value <= increment && onRemove ? `Remove ${label}` : `Decrease ${label}`}
            className={`w-[44px] h-[44px] flex items-center justify-center rounded-[16px] font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              value <= increment && onRemove
                ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10'
                : 'bg-[#F0F1EE] dark:bg-[#0A0A0C] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-[#1f1f23]'
            }`}
          >
            {value <= increment && onRemove ? <Trash2 size={16} /> : '−'}
          </motion.button>
        )}

        {capped && (
          <span role="status" className="text-[10px] font-bold text-rose-500 -mr-1 whitespace-nowrap">Max</span>
        )}

        {isEditing && !isLocked ? (
          <input
            autoFocus
            type="number"
            aria-label={`${label} quantity`}
            value={tempVal}
            onChange={e => {
              const numericVal = Number(e.target.value);
              if (e.target.value === '' || (!isNaN(numericVal) && numericVal <= 9999)) {
                setTempVal(e.target.value);
              }
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-14 text-center font-black text-[16px] bg-transparent outline-none border-b-2 border-emerald-500 tabular-nums text-gray-900 dark:text-gray-100"
          />
        ) : (
          <span
            onClick={startEditing}
            onKeyDown={(e) => {
              if (!isLocked && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                startEditing();
              }
            }}
            role={!isLocked ? 'button' : undefined}
            tabIndex={!isLocked ? 0 : undefined}
            aria-label={!isLocked ? `Edit ${label} quantity: ${value}${displayUnit}` : undefined}
            className={`w-14 text-center font-black text-[16px] tabular-nums tracking-tight text-gray-900 dark:text-gray-100 outline-none ${!isLocked ? 'cursor-pointer border-b-2 border-dashed border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 rounded-t py-1 focus-visible:ring-2 focus-visible:ring-emerald-500' : ''}`}
          >
            {value}{value > 0 && displayUnit ? <span className="text-[12px] text-gray-500 ml-0.5 font-bold">{displayUnit}</span> : ''}
          </span>
        )}

        {!isLocked && (
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => {
              // A long-press ramp already applied its own changes — a
              // trailing click on release would double up the last step.
              if (didLongPress.current) {
                didLongPress.current = false;
                return;
              }
              handlePlus();
            }}
            onPointerDown={startLongPress}
            onPointerUp={stopLongPress}
            onPointerLeave={stopLongPress}
            onPointerCancel={stopLongPress}
            aria-label={`Increase ${label} (hold to increase faster)`}
            className="w-[44px] h-[44px] flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[16px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            +
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
