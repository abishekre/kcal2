import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Timer, ChevronDown } from 'lucide-react';
import { useWaterStore } from '../../store/useWaterStore';
import { useTimerStore } from '../../store/useTimerStore';
import { triggerHaptic } from '../../utils/haptics';
import WaterTracker from './WaterTracker';
import FastingTimer from './FastingTimer';

const FASTING_LABEL = { idle: 'Not fasting', fasting: 'Fasting', eating: 'Eating window' };

/**
 * Water + fasting collapse into one compact, tappable summary row by
 * default — the full widgets (power-user territory) are one tap away
 * instead of permanently occupying two full cards on every visit.
 */
export default function ToolsSection({ dateKey }) {
  const [open, setOpen] = useState(false);
  const waterLog = useWaterStore(s => s.waterLog);
  const waterTarget = useWaterStore(s => s.waterTarget);
  const timerState = useTimerStore(s => s.timerState);

  const glasses = (waterLog[dateKey] ?? { glasses: 0 }).glasses;

  return (
    <section className="mb-6" aria-label="Water and fasting tools">
      <button
        onClick={() => { triggerHaptic('light'); setOpen(o => !o); }}
        aria-expanded={open}
        aria-label={`Water and fasting tools, ${glasses} of ${waterTarget} glasses, ${FASTING_LABEL[timerState]}, ${open ? 'expanded' : 'collapsed'}`}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-[#141416] rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[13px] font-bold text-sky-600 dark:text-sky-400 tabular-nums">
            <Droplets size={15} aria-hidden="true" /> {glasses}/{waterTarget}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] font-bold text-violet-600 dark:text-violet-400">
            <Timer size={15} aria-hidden="true" /> {FASTING_LABEL[timerState]}
          </span>
        </div>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-3 pt-3">
              <WaterTracker dateKey={dateKey} />
              <FastingTimer />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
