
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, TrendingUp, Settings } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

const TABS = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Home' },
  { key: 'progress', icon: TrendingUp, label: 'Progress' },
  { key: 'settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav({ activePage, onNavigate }) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-[max(env(safe-area-inset-bottom),16px)] px-6 pointer-events-none"
    >
      <motion.div
        layout
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30, delay: 0.1 }}
        role="tablist"
        aria-label="App sections"
        className="pointer-events-auto flex items-center p-1.5 rounded-[24px] bg-white/80 dark:bg-[#141416]/80 backdrop-blur-xl border border-gray-100 dark:border-[#1f1f23] shadow-lg dark:shadow-2xl"
      >
        {TABS.map(({ key, icon: Icon, label }) => {
          const isActive = activePage === key;

          return (
            <motion.button
              key={key}
              layout
              role="tab"
              aria-selected={isActive}
              aria-label={label}
              onClick={() => {
                if (isActive) return;
                triggerHaptic('light');
                onNavigate(key);
              }}
              whileTap={{ scale: 0.92 }}
              className={`relative flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-[20px] transition-colors min-h-[48px] outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#141416] ${
                isActive
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 bg-gray-900 dark:bg-white rounded-[20px]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white dark:text-gray-900' : ''} />
                {/* Label appears only on the active tab. We fade opacity and let
                    the button's `layout` animation handle the width change — the
                    old approach animated `width: 0 → auto` manually, which fought
                    the sliding pill (layoutId) and caused the jitter/reflow. */}
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-[14px] font-bold tracking-tight whitespace-nowrap text-white dark:text-gray-900"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </nav>
  );
}
