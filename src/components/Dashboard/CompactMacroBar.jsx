import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompactMacroBar({ consumption, target, show }) {
  const cals = consumption?.cals || 0;
  const targetCals = target?.cals || 2000;
  const macros = target?.macros || target || {};
  
  const pPct = Math.min(((consumption?.macros?.p || 0) / (macros.p || 100)) * 100, 100);
  const cPct = Math.min(((consumption?.macros?.c || 0) / (macros.c || 200)) * 100, 100);
  const fPct = Math.min(((consumption?.macros?.f || 0) / (macros.f || 60)) * 100, 100);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50 px-6 pt-[env(safe-area-inset-top,16px)] pb-4 bg-[#FAFBFC]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-xl border-b border-gray-100 dark:border-[#1f1f23] shadow-sm flex items-end justify-between"
        >
          <div className="flex flex-col mt-4">
            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Remaining</span>
            <span className="text-xl font-black tabular-nums">{Math.max(0, targetCals - cals)}</span>
          </div>
          
          <div className="flex gap-3 pb-1">
            {[
              { color: 'bg-emerald-500', pct: pPct },
              { color: 'bg-amber-500', pct: cPct },
              { color: 'bg-indigo-500', pct: fPct }
            ].map((m, i) => (
              <div key={i} className="w-12 h-2 rounded-full bg-gray-100 dark:bg-[#1c1c1e] overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${m.pct}%` }}
                  className={`h-full rounded-full ${m.color}`} 
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
