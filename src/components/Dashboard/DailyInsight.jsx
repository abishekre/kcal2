import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

function generateInsight(consumption, target, goal, streak) {
  const cals = consumption?.cals || 0;
  const targetCals = target?.cals || 2000;
  const protein = consumption?.macros?.p || 0;
  const targetP = target?.p || 100;
  const remaining = targetCals - cals;
  const pctConsumed = targetCals > 0 ? (cals / targetCals) * 100 : 0;
  const proteinDeficit = targetP - protein;
  const hour = new Date().getHours();

  // Priority-based insight selection
  if (cals === 0 && hour < 10) {
    return { text: "Start your day right — a protein-rich breakfast keeps cravings at bay.", accent: 'text-amber-500' };
  }

  if (cals === 0 && hour >= 10) {
    return { text: "Haven't logged yet today. Track as you eat for the most accurate results.", accent: 'text-gray-400' };
  }

  if (pctConsumed > 110) {
    return { text: "Over target today. Tomorrow's a reset — not a reason to spiral.", accent: 'text-rose-500' };
  }

  if (pctConsumed >= 95 && pctConsumed <= 105) {
    return { text: "Right on target! Consistency like this is what drives real results.", accent: 'text-emerald-500' };
  }

  if (streak && streak % 7 === 0) {
    return { text: `${streak} days straight! This is how you build a new baseline.`, accent: 'text-violet-500' };
  }

  if (proteinDeficit > 30 && remaining > 300) {
    return { text: `You're missing ${Math.round(proteinDeficit)}g of protein. Grab some greek yogurt or whey.`, accent: 'text-indigo-500' };
  }

  if (remaining < 200 && remaining > 0 && hour < 18) {
    return { text: `Only ${Math.round(remaining)} kcal left but it's early. Focus on high-volume, low-calorie foods.`, accent: 'text-orange-500' };
  }

  if (pctConsumed >= 50 && pctConsumed < 80) {
    return { text: `${Math.round(remaining)} kcal left to budget. Plan your remaining meals wisely.`, accent: 'text-blue-500' };
  }

  if (goal === 'cut') {
    return { text: "Cutting phase: protein and fiber are your best friends for satiety.", accent: 'text-rose-500' };
  }

  if (goal === 'bulk') {
    return { text: "Surplus days fuel growth. Make sure those extra calories are clean.", accent: 'text-blue-500' };
  }

  return { text: "Track consistently and the results will follow. Every entry counts.", accent: 'text-gray-400' };
}

export default function DailyInsight({ consumption, target, goal, streak }) {
  const setActiveSheet = useAppStore(state => state.setActiveSheet);
  
  const insight = useMemo(
    () => generateInsight(consumption, target, goal, streak),
    [consumption, target, goal, streak]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.2 }}
      className="flex flex-col p-5 rounded-[20px] bg-white dark:bg-[#141416] border border-gray-100 dark:border-[#1f1f23] mb-6 shadow-sm gap-4"
    >
      <div className="flex items-start gap-3.5">
        <div className={`mt-0.5 ${insight.accent}`}>
          <Sparkles size={20} fill="currentColor" className="opacity-20 absolute" />
          <Sparkles size={20} className="relative z-10" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-medium leading-relaxed text-gray-700 dark:text-gray-300">
            {insight.text}
          </p>
        </div>
      </div>
      
      <div className="h-px w-full bg-gray-100 dark:bg-[#1f1f23]" />
      
      <button 
        onClick={() => setActiveSheet('templates')}
        className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 dark:bg-[#0A0A0C] hover:bg-gray-100 dark:hover:bg-[#1c1c1e] text-gray-900 dark:text-white rounded-[12px] font-bold text-sm transition-colors active:scale-95"
      >
        <Copy size={16} /> Load / Save Day Template
      </button>
    </motion.div>
  );
}
