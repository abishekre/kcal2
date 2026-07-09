import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Copy, CalendarPlus } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { useSheetA11y } from '../../hooks/useSheetA11y';

/**
 * Bundles the less-frequent, power-user actions (templates, custom meal
 * slots) behind a single overflow button instead of two permanent
 * full-width buttons in the main scroll.
 */
export default function MoreMenu({ onTemplates, onCustomMeal }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const menuRef = useSheetA11y(close);

  return (
    <div className="relative">
      <button
        onClick={() => { triggerHaptic('light'); setOpen(o => !o); }}
        aria-label="More meal actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <MoreHorizontal size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={close} aria-hidden="true" />
            <motion.div
              ref={menuRef}
              role="menu"
              aria-label="More meal actions"
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute right-0 top-11 z-40 w-60 bg-white dark:bg-[#141416] rounded-[18px] border border-gray-100 dark:border-[#1f1f23] shadow-xl overflow-hidden"
            >
              <button
                role="menuitem"
                onClick={() => { triggerHaptic('light'); close(); onTemplates(); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <Copy size={16} className="text-gray-400" aria-hidden="true" /> Load/Save Template
              </button>
              <button
                role="menuitem"
                onClick={() => { triggerHaptic('light'); close(); onCustomMeal(); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-t border-gray-100 dark:border-[#1f1f23]"
              >
                <CalendarPlus size={16} className="text-gray-400" aria-hidden="true" /> Add Custom Meal Time
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
