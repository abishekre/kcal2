import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, Target, Calendar, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useWeightStore } from '../store/useWeightStore';
import { useLedgerStore } from '../store/useLedgerStore';
import { useFoodStore } from '../store/useFoodStore';
import { calculateGoalCalories, calculateConsumption, getStreak } from '../engine/projection';
import { triggerHaptic } from '../utils/haptics';
import { getPastDaysKeys } from '../utils/dates';

export default function ProgressPage() {
  const { goal, targetWeight, profile, setActiveSheet } = useAppStore();
  const { weightLog, logWeight, getWeightTrend, getLatestWeight } = useWeightStore();
  const { ledger } = useLedgerStore();
  
  const [trendRange, setTrendRange] = useState(30);

  const currentWeight = getLatestWeight() || profile.weight;
  
  // Calculate Goal Progress
  const startWeight = profile.weight; // simplification for progress bar
  const totalChangeNeeded = targetWeight - startWeight;
  const currentChange = currentWeight - startWeight;
  let goalProgressPct = 0;
  
  if (goal === 'maintain') {
    goalProgressPct = 100; // N/A
  } else if (totalChangeNeeded !== 0) {
    goalProgressPct = Math.max(0, Math.min(100, (currentChange / totalChangeNeeded) * 100));
  }

  // Weight Trend Data
  const trendData = useMemo(() => getWeightTrend ? getWeightTrend(trendRange) : [], [trendRange, getWeightTrend]);
  const minWeight = Math.min(...trendData.map(d => d.weight), currentWeight) - 1;
  const maxWeight = Math.max(...trendData.map(d => d.weight), currentWeight) + 1;

  const getFullDB = useFoodStore(state => state.getFullDB);
  const fullDB = useMemo(() => getFullDB(), [getFullDB]);
  const activityLevel = useAppStore(state => state.activityLevel);

  const projection = useMemo(() => calculateGoalCalories(profile, goal, activityLevel), [profile, goal, activityLevel]);

  // Calorie Heatmap Data (Last 30 days)
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toLocaleDateString('en-CA');
      
      const dayData = ledger?.[key];
      let status = 'gray'; // no data
      if (dayData && dayData.locked) {
        const consumption = calculateConsumption(dayData.meals, fullDB);
        const pct = (consumption.cals / projection.targetCals) * 100;
        if (pct > 105) status = 'red';
        else if (pct >= 90) status = 'green';
        else status = 'amber';
      }
      days.push({ key, status });
    }
    return days;
  }, [ledger, fullDB, projection.targetCals]);

  // Streak Stats
  const streakCount = useMemo(() => getStreak(ledger, fullDB, projection.targetCals), [ledger, fullDB, projection.targetCals]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32 px-5 pt-8 min-h-screen bg-bg-app transition-colors duration-1000"
    >
      <header className="mb-8">
        <h1 className="text-[28px] font-black tracking-tight text-gray-900 dark:text-white">Progress</h1>
      </header>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] border border-gray-100 dark:border-[#1f1f23] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-orange-500" />
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Streak</span>
          </div>
          <div className="text-[32px] font-black tabular-nums text-gray-900 dark:text-white">
            {streakCount}
          </div>
          <div className="text-[12px] font-semibold text-gray-400 mt-1">Days in a row</div>
        </div>

        <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] border border-gray-100 dark:border-[#1f1f23] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-blue-500" />
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Weight</span>
          </div>
          <div className="flex items-baseline gap-1">
            <div className="text-[32px] font-black tabular-nums text-gray-900 dark:text-white">
              {currentWeight}
            </div>
            <span className="text-[14px] font-bold text-gray-400">kg</span>
          </div>
          <div className="text-[12px] font-semibold text-gray-400 mt-1">
            {goal !== 'maintain' && (
              <>Target: {targetWeight}kg</>
            )}
            {goal === 'maintain' && 'Maintaining'}
          </div>
        </div>
      </div>

      {/* Goal Progress Bar */}
      {goal !== 'maintain' && (
        <div className="bg-white dark:bg-[#141416] p-6 rounded-[24px] border border-gray-100 dark:border-[#1f1f23] shadow-sm mb-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Goal Progress</h3>
              <p className="text-[13px] font-medium text-gray-400 mt-0.5">
                {goalProgressPct.toFixed(1)}% to target
              </p>
            </div>
            {goal === 'cut' ? <TrendingDown className="text-rose-500" /> : <TrendingUp className="text-blue-500" />}
          </div>
          <div className="h-3 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goalProgressPct}%` }}
              transition={{ duration: 1.5, type: 'spring' }}
              className={`h-full rounded-full ${goal === 'cut' ? 'bg-rose-500' : 'bg-blue-500'}`}
            />
          </div>
          <div className="flex justify-between mt-3 text-[12px] font-bold text-gray-400 tabular-nums">
            <span>{startWeight}kg</span>
            <span>{targetWeight}kg</span>
          </div>
        </div>
      )}

      {/* Weight Trend Chart */}
      <div className="bg-white dark:bg-[#141416] p-6 rounded-[24px] border border-gray-100 dark:border-[#1f1f23] shadow-sm mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Weight Trend</h3>
          <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-full border border-gray-100 dark:border-white/5">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => { triggerHaptic('light'); setTrendRange(days); }}
                className={`px-3 py-1 text-[11px] font-bold rounded-full transition-colors ${
                  trendRange === days
                    ? 'bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        <div className="relative h-[160px] w-full flex items-end justify-between gap-1">
          {trendData.length > 0 ? trendData.map((d, i) => {
            const pct = ((d.weight - minWeight) / (maxWeight - minWeight)) * 100;
            return (
              <div key={i} className="relative flex-1 flex flex-col justify-end group h-full">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(10, pct)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.02 }}
                  className="w-full bg-emerald-500/20 dark:bg-emerald-500/20 rounded-t-sm group-hover:bg-emerald-500 transition-colors"
                />
              </div>
            );
          }) : (
            <div className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-gray-400">
              Not enough data for trend
            </div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white dark:bg-[#141416] p-6 rounded-[24px] border border-gray-100 dark:border-[#1f1f23] shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-gray-400" />
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">30-Day Adherence</h3>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {heatmapDays.map((d, i) => {
            let bg = 'bg-gray-100 dark:bg-white/5';
            if (d.status === 'green') bg = 'bg-emerald-500/80';
            if (d.status === 'amber') bg = 'bg-amber-500/80';
            if (d.status === 'red') bg = 'bg-rose-500/80';

            return (
              <motion.div
                key={d.key}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.01 }}
                className={`aspect-square rounded-[8px] ${bg}`}
                title={d.key}
              />
            );
          })}
        </div>
      </div>

      {/* Weekly Averages */}
      <div className="bg-white dark:bg-[#141416] p-6 rounded-[24px] border border-gray-100 dark:border-[#1f1f23] shadow-sm mb-6">
        <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-4">Weekly Averages</h3>
        <div className="flex justify-between items-center bg-gray-50 dark:bg-[#0A0A0C] p-4 rounded-[16px] border border-gray-100 dark:border-[#1f1f23]">
          <div className="flex-1 text-center">
            <span className="block text-[12px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Calories</span>
            <span className="text-[20px] font-black text-gray-900 dark:text-white tabular-nums">
              {Math.round(goal === 'cut' ? profile.weight * 22 : profile.weight * 30)}
            </span>
          </div>
          <div className="w-[1px] h-10 bg-gray-200 dark:bg-white/10" />
          <div className="flex-1 text-center">
            <span className="block text-[12px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Protein</span>
            <span className="text-[20px] font-black text-emerald-500 tabular-nums">
              {Math.round(profile.weight * 2.2)}g
            </span>
          </div>
        </div>
      </div>

      {/* Floating Weight Log Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => { triggerHaptic('light'); setActiveSheet('weightLog'); }}
        className="fixed bottom-[100px] right-6 w-[56px] h-[56px] bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(255,255,255,0.15)] flex items-center justify-center z-40"
      >
        <Plus size={24} strokeWidth={2.5} />
      </motion.button>
    </motion.div>
  );
}
