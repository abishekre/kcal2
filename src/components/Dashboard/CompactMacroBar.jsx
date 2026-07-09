
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_MACRO_TARGETS } from '../../utils/constants';

const MACRO_LABELS = ['P', 'C', 'F'];
const MACRO_NAMES = ['Protein', 'Carbs', 'Fat'];
const MACRO_COLORS = ['bg-emerald-500', 'bg-amber-500', 'bg-indigo-500'];
const MACRO_KEYS = ['p', 'c', 'f'];

const CompactMacroBar = React.memo(function CompactMacroBar({ consumption, target, show }) {
  const cals = consumption?.cals || 0;
  const targetCals = target?.cals || 2000;
  const macros = target?.macros || target || {};

  const pctValues = MACRO_KEYS.map((key) => {
    const consumed = consumption?.macros?.[key] || 0;
    const t = macros[key] || DEFAULT_MACRO_TARGETS[key];
    return t > 0 ? Math.min((consumed / t) * 100, 100) : 0;
  });

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          // Not a live region: this bar mirrors the main calorie ring
          // (which already exposes the same total via role="img") and
          // would otherwise re-announce on nearly every log action.
          aria-label={`${Math.max(0, targetCals - cals)} calories remaining`}
          className="fixed top-0 left-0 right-0 z-50 px-6 pt-[env(safe-area-inset-top,16px)] pb-4 bg-[#F0F1EE]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-xl border-b border-gray-100 dark:border-[#1f1f23] shadow-sm flex items-end justify-between"
        >
          <div className="flex flex-col mt-4">
            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Remaining</span>
            <span className="text-xl font-black tabular-nums">{Math.max(0, targetCals - cals)}</span>
          </div>

          <div className="flex gap-3 pb-1 items-center">
            {pctValues.map((pct, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase">{MACRO_LABELS[i]}</span>
                <div
                  className="w-12 h-2 rounded-full bg-gray-100 dark:bg-[#1c1c1e] overflow-hidden"
                  role="progressbar"
                  aria-label={`${MACRO_NAMES[i]}: ${Math.round(pct)}%`}
                  aria-valuenow={Math.round(pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: pct / 100 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: 'left' }}
                    className={`h-full w-full rounded-full ${MACRO_COLORS[i]}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default CompactMacroBar;
