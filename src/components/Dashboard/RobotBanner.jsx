import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import { getRobotMessage, determineScenario } from '../../robot/messages';

const MODE_STYLES = {
  good: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-900 dark:text-emerald-200',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    icon: 'text-emerald-500',
  },
  normal: {
    bg: 'bg-[#FAFBFC] dark:bg-[#141416]',
    text: 'text-gray-800 dark:text-gray-200',
    border: 'border-gray-200 dark:border-[#1f1f23]',
    icon: 'text-gray-500 dark:text-gray-400',
  },
  bad: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-900 dark:text-rose-200',
    border: 'border-rose-200 dark:border-rose-500/20',
    icon: 'text-rose-500',
  },
};

export default function RobotBanner({ mode, cals, targetCals, streakCount, goal }) {
  const scenario = determineScenario(cals, targetCals, streakCount);
  const message = getRobotMessage(scenario, mode);

  if (!message) return null;

  const style = MODE_STYLES[mode] || MODE_STYLES.normal;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${mode}-${scenario}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`p-4 rounded-[20px] mb-6 border flex items-start gap-3 shadow-sm ${style.bg} ${style.text} ${style.border}`}
      >
        <motion.div
          className="mt-0.5 shrink-0"
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5 }}
        >
          <Bot size={22} className={style.icon} />
        </motion.div>
        <div className="min-w-0">
          <span className="font-bold text-[14px] tracking-tight leading-snug">
            {message}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
