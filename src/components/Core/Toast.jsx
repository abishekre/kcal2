import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '../../lib/toast';

// ═══════════════════════════════════════════════════════════════════════════
// Toast UI Component — Render this at the root level
// ═══════════════════════════════════════════════════════════════════════════
const TOAST_STYLES = {
  success: 'bg-emerald-500/90 text-white',
  error: 'bg-red-500/90 text-white',
  warning: 'bg-amber-500/90 text-white',
  info: 'bg-gray-800/90 dark:bg-white/90 text-white dark:text-gray-900',
  undo: 'bg-gray-800/90 dark:bg-white/90 text-white dark:text-gray-900',
};

const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
  undo: '↩',
};

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);
  const removeToast = useToastStore(s => s.removeToast);

  return (
    <div
      className="fixed bottom-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4"
      aria-live="polite"
      role="status"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl
              shadow-lg backdrop-blur-md max-w-sm w-full
              ${TOAST_STYLES[t.type] || TOAST_STYLES.info}
            `}
            role="alert"
          >
            <span className="text-sm font-bold flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {TOAST_ICONS[t.type]}
            </span>
            <span className="text-sm font-medium flex-1 leading-tight">{t.message}</span>
            {t.type === 'undo' && t.onUndo && (
              <button
                onClick={() => {
                  t.onUndo();
                  removeToast(t.id);
                }}
                className="text-sm font-bold px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 transition-all flex-shrink-0"
              >
                {t.undoLabel || 'Undo'}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
