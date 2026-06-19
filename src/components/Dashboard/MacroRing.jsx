import React from 'react';
import { motion } from 'framer-motion';

export default function MacroRing({ consumption, target, goal }) {
  const cals = consumption?.cals || 0;
  const targetCals = target?.cals || 2000;
  const macros = target?.macros || target || {};
  const targetP = macros.p || 100;
  const targetC = macros.c || 200;
  const targetF = macros.f || 60;

  const progressPct = Math.min((cals / targetCals) * 100, 100);
  const isOver = cals > targetCals;
  const remaining = Math.max(0, targetCals - cals);

  // SVG ring setup
  const size = 280;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  // Glow at 80-100%
  const showGlow = progressPct >= 80 && !isOver;

  // Goal-specific accent colors
  const GOAL_ACCENTS = {
    cut: { from: '#f43f5e', to: '#fb923c' },        // rose -> orange
    recomp: { from: '#8b5cf6', to: '#c084fc' },     // violet -> purple
    bulk: { from: '#3b82f6', to: '#38bdf8' },       // blue -> light blue
    maintain: { from: '#10b981', to: '#34d399' },   // emerald shades
  };
  const accent = GOAL_ACCENTS[goal] || GOAL_ACCENTS.maintain;
  const gradientId = 'macro-ring-gradient';

  // Macro progress bars
  const macroData = [
    { label: 'Protein', key: 'p', consumed: consumption?.macros?.p || 0, target: targetP, color: 'bg-emerald-500', track: 'bg-emerald-500/10' },
    { label: 'Carbs', key: 'c', consumed: consumption?.macros?.c || 0, target: targetC, color: 'bg-amber-500', track: 'bg-amber-500/10' },
    { label: 'Fat', key: 'f', consumed: consumption?.macros?.f || 0, target: targetF, color: 'bg-indigo-500', track: 'bg-indigo-500/10' },
  ];

  return (
    <div className={`relative flex flex-col items-center p-8 rounded-[24px] overflow-hidden transition-all duration-500 border ${
      isOver
        ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30'
        : 'bg-white dark:bg-[#141416] border-gray-100 dark:border-[#1f1f23] shadow-sm'
    }`}>

      {/* Background glow effect */}
      {showGlow && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-56 h-56 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        </div>
      )}

      {/* SVG Ring */}
      <div className="relative flex items-center justify-center mb-6" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isOver ? '#f43f5e' : accent.from} />
              <stop offset="100%" stopColor={isOver ? '#ef4444' : accent.to} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-50 dark:text-[#1a1a1c]"
          />

          {/* Progress arc */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            cx={center}
            cy={center}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            filter={showGlow ? 'url(#glow)' : ''}
          />
        </svg>

        {/* Center content */}
        <div className="text-center z-10 flex flex-col items-center">
          <motion.div
            key={cals}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <h2 className={`text-[64px] leading-[1] font-black tracking-tighter tabular-nums ${
              isOver ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'
            }`}>
              {cals}
            </h2>
          </motion.div>
          <span className="text-[16px] text-gray-400 font-bold mt-1 tabular-nums tracking-wide">
            / {targetCals} kcal
          </span>
          <div className={`mt-3 px-3 py-1.5 rounded-full text-[13px] font-black tabular-nums border ${
            isOver 
              ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' 
              : 'bg-gray-50 text-gray-500 border-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/10'
          }`}>
            {isOver ? `${cals - targetCals} OVER` : `${remaining} REMAINING`}
          </div>
        </div>
      </div>

      {/* Macro progress bars */}
      <div className="w-full space-y-4 px-1">
        {macroData.map(({ label, key, consumed, target: t, color, track }) => {
          const pct = Math.min((consumed / t) * 100, 100);
          const isOverMacro = consumed > t;

          return (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[13px] font-bold">
                <span className="text-gray-600 dark:text-gray-300">{label}</span>
                <span className={`tabular-nums ${isOverMacro ? 'text-rose-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  {consumed} <span className="text-gray-400 dark:text-gray-500 font-medium">/ {t}g</span>
                </span>
              </div>
              <div className={`h-[8px] rounded-full ${track} overflow-hidden`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  className={`h-full rounded-full ${isOverMacro ? 'bg-rose-500' : color}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
