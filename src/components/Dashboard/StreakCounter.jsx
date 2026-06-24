
import { motion } from 'framer-motion';
import { Flame, Zap, Star, Award, Medal, Trophy, Crown } from 'lucide-react';

const MILESTONES = [
  { days: 3, icon: Zap, label: 'Spark', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { days: 7, icon: Star, label: 'Week Warrior', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { days: 14, icon: Award, label: 'Fortnight', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { days: 30, icon: Medal, label: 'Monthly', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  { days: 60, icon: Trophy, label: 'Legend', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  { days: 90, icon: Crown, label: 'Elite', color: 'text-amber-400', bg: 'bg-amber-50 dark:bg-amber-400/10' },
];

function getCurrentMilestone(count) {
  let current = null;
  for (const m of MILESTONES) {
    if (count >= m.days) current = m;
  }
  return current;
}

export default function StreakCounter({ streakCount }) {
  if (!streakCount || streakCount === 0) return null;

  const milestone = getCurrentMilestone(streakCount);
  const isAtMilestone = MILESTONES.some(m => m.days === streakCount);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex items-center gap-2"
    >
      <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3.5 py-2 rounded-[14px] font-black text-[13px] tracking-tight border border-orange-200 dark:border-orange-500/20 shadow-sm">
        <motion.div
          animate={streakCount > 2 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Flame size={16} />
        </motion.div>
        <span className="tabular-nums">
          {streakCount} Day{streakCount !== 1 && 's'}
        </span>
      </div>

      {milestone && (
        <motion.div
          key={milestone.days}
          initial={isAtMilestone ? { scale: 0, rotate: -180 } : { opacity: 0 }}
          animate={isAtMilestone ? { scale: 1, rotate: 0 } : { opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`flex items-center justify-center w-8 h-8 rounded-[12px] ${milestone.color} ${milestone.bg} border border-current/20`}
          title={milestone.label}
        >
          <milestone.icon size={16} strokeWidth={2.5} />
        </motion.div>
      )}
    </motion.div>
  );
}
