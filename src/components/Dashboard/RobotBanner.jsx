import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import { getRobotMessage, determineScenario } from '../../robot/messages';
import { generateInsight } from '../../engine/insights';

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

export default function RobotBanner({ mode, cals, targetCals, streakCount, goal, hour, consumption, target }) {
  const scenario = determineScenario(cals, targetCals, streakCount, hour, consumption);
  const robotMessage = getRobotMessage(scenario, mode, `${cals}-${hour}`);
  const insight = generateInsight(consumption, target, goal, streakCount, mode);

  if (!robotMessage) return null;

  const style = MODE_STYLES[mode] || MODE_STYLES.normal;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${mode}-${scenario}-${hour}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`p-5 rounded-[24px] mb-6 flex flex-col gap-3 transition-colors ${style.bg} ${style.text}`}
      >
        <div className="flex items-start gap-3">
          <motion.div
            className="mt-0.5 shrink-0"
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5 }}
          >
            <Bot size={24} className={style.icon} />
          </motion.div>
          <div className="flex flex-col min-w-0 gap-1.5 pt-0.5">
            <span className="font-bold text-[15px] tracking-tight leading-relaxed">
              {robotMessage} {insight.text}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
