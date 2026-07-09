import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Plus, Flame, Target, Calendar, Trophy, CalendarRange, ChevronRight } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { useWeightStore } from '../store/useWeightStore';
import { useLedgerStore } from '../store/useLedgerStore';
import { useFoodStore } from '../store/useFoodStore';
import { calculateGoalCalories, calculateConsumption, getStreak, hasLoggedFood } from '../engine/projection';
import { triggerHaptic } from '../utils/haptics';
import { toDisplayWeight, weightUnit } from '../utils/units';

export default function ProgressPage() {
  const { goal, targetWeight, profile, setActiveSheet } = useAppStore();
  const unitSystem = useAppStore(state => state.unitSystem);
  const { getWeightTrend, getLatestWeight } = useWeightStore();
  const { ledger } = useLedgerStore();

  const [trendRange, setTrendRange] = useState(30);
  const wu = weightUnit(unitSystem);

  const currentWeight = getLatestWeight() || profile.weight;
  const startWeight = profile.initialWeight || profile.weight;
  const totalChangeNeeded = targetWeight - startWeight;
  const currentChange = currentWeight - startWeight;
  let goalProgressPct;
  if (goal === 'maintain') goalProgressPct = 100;
  else if (totalChangeNeeded !== 0) goalProgressPct = Math.max(0, Math.min(100, (currentChange / totalChangeNeeded) * 100));
  else goalProgressPct = 100;

  const trendData = useMemo(() => (getWeightTrend ? getWeightTrend(trendRange) : []), [trendRange, getWeightTrend]);

  const getFullDB = useFoodStore(state => state.getFullDB);
  const customFoods = useFoodStore(state => state.customFoods);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fullDB = useMemo(() => getFullDB(), [customFoods, getFullDB]);
  const activityLevel = useAppStore(state => state.activityLevel);

  const projection = useMemo(() => calculateGoalCalories(profile, goal, activityLevel), [profile, goal, activityLevel]);

  // ── Weight-trend line geometry (SVG) ──
  const trendChart = useMemo(() => {
    const pts = trendData.filter(d => typeof d.weight === 'number');
    if (pts.length === 0) return null;
    const weights = pts.map(d => d.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const pad = Math.max(0.5, (max - min) * 0.15) || 1;
    const lo = min - pad;
    const hi = max + pad;
    const W = 300, H = 130;
    const x = (i) => pts.length === 1 ? W / 2 : (i / (pts.length - 1)) * W;
    const y = (w) => H - ((w - lo) / (hi - lo)) * H;
    const line = pts.map((d, i) => `${x(i).toFixed(1)},${y(d.weight).toFixed(1)}`).join(' ');
    const area = `0,${H} ${line} ${W},${H}`;
    return {
      W, H, line, area,
      points: pts.map((d, i) => ({ cx: x(i), cy: y(d.weight), date: d.date, weight: d.weight })),
      first: pts[0].weight,
      last: pts[pts.length - 1].weight,
      lo, hi,
      startDate: pts[0].date,
      endDate: pts[pts.length - 1].date,
    };
  }, [trendData]);

  const trendDelta = trendChart ? trendChart.last - trendChart.first : 0;

  // ── Calorie history (last 14 days) ──
  const calHistory = useMemo(() => {
    const days = [];
    const today = new Date();
    const target = projection.targetCals || 2000;
    let maxVal = target;
    for (let i = 13; i >= 0; i--) {
      const key = format(subDays(today, i), 'yyyy-MM-dd');
      const rec = ledger?.[key];
      let cals = null, status = 'gray';
      if (hasLoggedFood(rec)) {
        cals = calculateConsumption(rec.meals, fullDB).cals;
        const pct = (cals / target) * 100;
        status = pct > 105 ? 'red' : pct >= 90 ? 'green' : 'amber';
        if (cals > maxVal) maxVal = cals;
      }
      days.push({ key, cals, status });
    }
    return { days, target, ceiling: maxVal * 1.1 };
  }, [ledger, fullDB, projection.targetCals]);

  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const key = format(subDays(today, i), 'yyyy-MM-dd');
      const dayData = ledger?.[key];
      let status = 'gray';
      if (hasLoggedFood(dayData)) {
        const pct = (calculateConsumption(dayData.meals, fullDB).cals / projection.targetCals) * 100;
        status = pct > 105 ? 'red' : pct >= 90 ? 'green' : 'amber';
      }
      days.push({ key, status });
    }
    return days;
  }, [ledger, fullDB, projection.targetCals]);

  const streakCount = useMemo(() => getStreak(ledger, fullDB, projection.targetCals), [ledger, fullDB, projection.targetCals]);

  const weeklyAverages = useMemo(() => {
    let sumCals = 0, sumProtein = 0, daysWithData = 0;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const key = format(subDays(today, i), 'yyyy-MM-dd');
      const dayData = ledger?.[key];
      if (hasLoggedFood(dayData)) {
        const consumption = calculateConsumption(dayData.meals, fullDB);
        sumCals += consumption.cals;
        sumProtein += consumption.macros.p;
        daysWithData++;
      }
    }
    if (daysWithData === 0) return { cals: projection.targetCals, p: projection.macros.p, label: 'Targets' };
    return { cals: Math.round(sumCals / daysWithData), p: Math.round(sumProtein / daysWithData), label: '7-Day Avg' };
  }, [ledger, fullDB, projection]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-48 px-5 pt-8 min-h-screen bg-bg-app transition-colors duration-500"
    >
      <header className="mb-6">
        <h1 className="text-[28px] font-black tracking-tight text-gray-900 dark:text-white">Progress</h1>
      </header>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px]">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-orange-500" />
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Streak</span>
          </div>
          <div className="text-[32px] font-black tabular-nums text-gray-900 dark:text-white">{streakCount}</div>
          <div className="text-[12px] font-semibold text-gray-400 mt-1">Days in a row</div>
        </div>

        <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px]">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-blue-500" />
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Weight</span>
          </div>
          <div className="flex items-baseline gap-1">
            <div className="text-[32px] font-black tabular-nums text-gray-900 dark:text-white">{toDisplayWeight(currentWeight, unitSystem)}</div>
            <span className="text-[14px] font-bold text-gray-400">{wu}</span>
          </div>
          <div className="text-[12px] font-semibold text-gray-400 mt-1">
            {goal !== 'maintain' ? <>Target: {toDisplayWeight(targetWeight, unitSystem)}{wu}</> : 'Maintaining'}
          </div>
        </div>
      </div>

      {/* Achievements + Weekly Recap entry points */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <button
          onClick={() => { triggerHaptic('light'); setActiveSheet('achievements'); }}
          className="bg-white dark:bg-[#141416] p-4 rounded-[20px] flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[12px] bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0"><Trophy size={17} className="text-amber-500" /></div>
            <span className="font-bold text-sm text-gray-900 dark:text-white">Achievements</span>
          </div>
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
        </button>
        <button
          onClick={() => { triggerHaptic('light'); setActiveSheet('weeklyRecap'); }}
          className="bg-white dark:bg-[#141416] p-4 rounded-[20px] flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[12px] bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0"><CalendarRange size={17} className="text-emerald-500" /></div>
            <span className="font-bold text-sm text-gray-900 dark:text-white">This Week</span>
          </div>
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
        </button>
      </div>

      {/* Goal Progress Bar */}
      {goal !== 'maintain' && (
        <div className="bg-white dark:bg-[#141416] p-6 rounded-[24px] mb-5">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Goal Progress</h3>
              <p className="text-[13px] font-medium text-gray-400 mt-0.5">{goalProgressPct.toFixed(1)}% to target</p>
            </div>
            {goal === 'cut' ? <TrendingDown className="text-rose-500" /> : <TrendingUp className="text-blue-500" />}
          </div>
          <div className="h-3 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goalProgressPct}%` }}
              transition={{ duration: 1.2, type: 'spring' }}
              className={`h-full rounded-full ${goal === 'cut' ? 'bg-rose-500' : 'bg-blue-500'}`}
            />
          </div>
          <div className="flex justify-between mt-3 text-[12px] font-bold text-gray-400 tabular-nums">
            <span>{toDisplayWeight(startWeight, unitSystem)}{wu}</span>
            <span>{toDisplayWeight(targetWeight, unitSystem)}{wu}</span>
          </div>
        </div>
      )}

      {/* Weight Trend — line chart */}
      <div className="bg-white dark:bg-[#141416] p-6 rounded-[24px] mb-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Weight Trend</h3>
            {trendChart && (
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[24px] font-black tabular-nums text-gray-900 dark:text-white">{toDisplayWeight(trendChart.last, unitSystem)}<span className="text-[13px] text-gray-400 ml-0.5">{wu}</span></span>
                <span className={`text-[12px] font-bold tabular-nums ${trendDelta < 0 ? 'text-emerald-500' : trendDelta > 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                  {trendDelta > 0 ? '+' : ''}{toDisplayWeight(Math.abs(trendDelta), unitSystem) * (trendDelta < 0 ? -1 : 1)}{wu} in range
                </span>
              </div>
            )}
          </div>
          <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-full border border-gray-100 dark:border-white/5">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => { triggerHaptic('light'); setTrendRange(days); }}
                className={`px-3 py-1 text-[11px] font-bold rounded-full transition-colors ${trendRange === days ? 'bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        {trendChart ? (
          <>
            <div className="relative">
              <svg viewBox={`0 0 ${trendChart.W} ${trendChart.H}`} className="w-full h-[140px]" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.polygon initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} points={trendChart.area} fill="url(#weightArea)" />
                <motion.polyline
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  points={trendChart.line}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                {trendChart.points.length <= 14 && trendChart.points.map((p, i) => (
                  <circle key={i} cx={p.cx} cy={p.cy} r="3" fill="#10b981" stroke="var(--color-surface, #fff)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                ))}
              </svg>
            </div>
            <div className="flex justify-between mt-2 text-[11px] font-bold text-gray-400 tabular-nums">
              <span>{format(new Date(trendChart.startDate + 'T00:00:00'), 'MMM d')}</span>
              <span className="text-gray-300 dark:text-gray-600">{toDisplayWeight(trendChart.lo, unitSystem)}–{toDisplayWeight(trendChart.hi, unitSystem)} {wu}</span>
              <span>{format(new Date(trendChart.endDate + 'T00:00:00'), 'MMM d')}</span>
            </div>
          </>
        ) : (
          <div className="h-[140px] flex items-center justify-center text-[13px] font-bold text-gray-400">
            Log your weight a few times to see the trend
          </div>
        )}
      </div>

      {/* Calorie History — last 14 days */}
      <div className="bg-white dark:bg-[#141416] p-6 rounded-[24px] mb-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Calories · Last 14 Days</h3>
          <span className="text-[11px] font-bold text-gray-400 tabular-nums">Target {calHistory.target}</span>
        </div>
        <div className="relative h-[130px] flex items-end justify-between gap-1.5">
          {/* Target reference line */}
          <div className="absolute left-0 right-0 border-t border-dashed border-gray-300 dark:border-gray-600 z-10" style={{ bottom: `${(calHistory.target / calHistory.ceiling) * 100}%` }} />
          {calHistory.days.map((d, i) => {
            const h = d.cals ? Math.max(4, (d.cals / calHistory.ceiling) * 100) : 2;
            const color = d.status === 'green' ? 'bg-emerald-500' : d.status === 'amber' ? 'bg-amber-400' : d.status === 'red' ? 'bg-rose-500' : 'bg-gray-200 dark:bg-white/10';
            return (
              <div key={d.key} className="flex-1 flex flex-col justify-end h-full" title={d.cals ? `${d.cals} kcal` : 'No log'}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.6, delay: i * 0.02 }}
                  className={`w-full rounded-t-[4px] ${color}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Adherence + Weekly Averages */}
      <div className="bg-white dark:bg-[#141416] p-6 rounded-[24px] mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-gray-400" />
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">30-Day Adherence</h3>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-3">
          {heatmapDays.map((d, i) => {
            let bg = 'bg-gray-100 dark:bg-white/5';
            if (d.status === 'green') bg = 'bg-emerald-500/80';
            if (d.status === 'amber') bg = 'bg-amber-500/80';
            if (d.status === 'red') bg = 'bg-rose-500/80';
            return (
              <motion.div key={d.key} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.01 }} className={`aspect-square rounded-[8px] ${bg}`} title={d.key} />
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-5 text-[10px] font-bold text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-500/80" /> On target</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-amber-500/80" /> Under</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-rose-500/80" /> Over</span>
        </div>

        <div className="flex justify-between items-center mb-3">
          <h4 className="text-[13px] font-bold text-gray-500 dark:text-gray-400">{weeklyAverages.label}</h4>
          <button onClick={() => { triggerHaptic('light'); setActiveSheet('science'); }} className="text-emerald-500 font-bold text-[12px] flex items-center gap-1 hover:opacity-80 transition-opacity">
            ℹ️ How is this calculated?
          </button>
        </div>
        <div className="flex justify-between items-center bg-gray-50 dark:bg-[#0A0A0C] p-4 rounded-[16px]">
          <div className="flex-1 text-center">
            <span className="block text-[12px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Calories</span>
            <span className="text-[20px] font-black text-gray-900 dark:text-white tabular-nums">{weeklyAverages.cals}</span>
          </div>
          <div className="w-[1px] h-10 bg-gray-200 dark:bg-white/10" />
          <div className="flex-1 text-center">
            <span className="block text-[12px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Protein</span>
            <span className="text-[20px] font-black text-emerald-500 tabular-nums">{weeklyAverages.p}g</span>
          </div>
        </div>
      </div>

      {/* Floating Weight Log Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => { triggerHaptic('light'); setActiveSheet('weightLog'); }}
        aria-label="Log weight"
        className="fixed bottom-[100px] right-6 w-[56px] h-[56px] bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(255,255,255,0.15)] flex items-center justify-center z-40"
      >
        <Plus size={24} strokeWidth={2.5} />
      </motion.button>
    </motion.div>
  );
}
