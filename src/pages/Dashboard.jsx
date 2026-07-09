import { useMemo, useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { Target, ChevronRight, Lock, Unlock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useLedgerStore, getInitialDayRecord } from '../store/useLedgerStore';
import { useFoodStore } from '../store/useFoodStore';
import { getTodayKey, getTimeOfDay } from '../utils/dates';
import { calculateGoalCalories, calculateConsumption, getStreak } from '../engine/projection';
import { triggerHaptic } from '../utils/haptics';
import { toast } from '../lib/toast';
import { STREAK_MILESTONES } from '../utils/constants';

import MacroRing from '../components/Dashboard/MacroRing';
import CompactMacroBar from '../components/Dashboard/CompactMacroBar';
import RobotBanner from '../components/Dashboard/RobotBanner';
import StreakCounter from '../components/Dashboard/StreakCounter';
import MealSection from '../components/Dashboard/MealSection';
import ToolsSection from '../components/Dashboard/ToolsSection';
import QuickLogBar from '../components/Dashboard/QuickLogBar';
import Celebration from '../components/Dashboard/Celebration';
import MoreMenu from '../components/Dashboard/MoreMenu';
import DateNavigator from '../components/Core/DateNavigator';

// Streak lengths that trigger a milestone celebration toast.
const MILESTONE_DAYS = new Set(STREAK_MILESTONES.map((m) => m.min));

// Lazy-load sheets for code splitting
const FoodSearchSheet = lazy(() => import('../components/Sheets/FoodSearchSheet'));
const CustomFoodSheet = lazy(() => import('../components/Sheets/CustomFoodSheet'));
const TemplateSheet = lazy(() => import('../components/Sheets/TemplateSheet'));
const CustomMealSheet = lazy(() => import('../components/Sheets/CustomMealSheet'));

// Stable empty record to prevent reference instability
const EMPTY_RECORD = getInitialDayRecord();
Object.freeze(EMPTY_RECORD);
Object.freeze(EMPTY_RECORD.meals);

export default function Dashboard() {
  const profile = useAppStore(state => state.profile);
  const goal = useAppStore(state => state.goal);
  const activityLevel = useAppStore(state => state.activityLevel);
  const robotMode = useAppStore(state => state.robotMode);
  const activeSheet = useAppStore(state => state.activeSheet);
  const setActiveSheet = useAppStore(state => state.setActiveSheet);
  const activeMealTarget = useAppStore(state => state.activeMealTarget);
  const setActiveMealTarget = useAppStore(state => state.setActiveMealTarget);
  
  const selectedDate = useAppStore(state => state.selectedDate);
  const setSelectedDate = useAppStore(state => state.setSelectedDate);

  const getFullDB = useFoodStore(state => state.getFullDB);
  const customFoods = useFoodStore(state => state.customFoods);
  // customFoods is read inside getFullDB() via the store's get(), not as a
  // literal argument — it's a real (necessary) dependency, not a stale one.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fullDB = useMemo(() => getFullDB(), [customFoods, getFullDB]);
  
  // Recalculate todayKey periodically to handle midnight rollover. If the
  // user was looking at "today" when the rollover happens, selectedDate
  // follows it forward — otherwise they'd silently end up viewing
  // yesterday with no indication anything changed.
  const [todayKey, setTodayKey] = useState(getTodayKey());
  const rollTodayForward = useCallback((newToday) => {
    if (newToday === todayKey) return;
    if (selectedDate === todayKey) setSelectedDate(newToday);
    setTodayKey(newToday);
  }, [todayKey, selectedDate, setSelectedDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      rollTodayForward(getTodayKey());
    }, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [rollTodayForward]);

  // Also update on visibility change (user reopens app after midnight)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        rollTodayForward(getTodayKey());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [rollTodayForward]);

  const isToday = selectedDate === todayKey;

  const ledger = useLedgerStore(state => state.ledger); 
  // Use a stable reference for empty records to prevent unnecessary re-renders
  const selectedRecord = useMemo(
    () => ledger[selectedDate] || EMPTY_RECORD,
    [ledger, selectedDate]
  );

  const customMealConfigs = useLedgerStore(state => state.customMealConfigs);
  const addMealSlot = useLedgerStore(state => state.addMealSlot);
  const getMostRecentMealDate = useLedgerStore(state => state.getMostRecentMealDate);
  const repeatMostRecentMeal = useLedgerStore(state => state.repeatMostRecentMeal);
  const { scrollY } = useScroll();
  const [showCompact, setShowCompact] = useState(false);
  const sliderRef = useRef(null);

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setShowCompact(latest > 250);
    });
  }, [scrollY]);

  const updateQty = useLedgerStore(state => state.updateQty);
  const removeFoodFromMeal = useLedgerStore(state => state.removeFoodFromMeal);
  const dittoYesterday = useLedgerStore(state => state.dittoYesterday);
  const commitDay = useLedgerStore(state => state.commitDay);
  const unlockDay = useLedgerStore(state => state.unlockDay);
  const removeMealSlot = useLedgerStore(state => state.removeMealSlot);

  const projection = useMemo(() => calculateGoalCalories(profile, goal, activityLevel), [profile, goal, activityLevel]);
  const consumption = useMemo(() => calculateConsumption(selectedRecord.meals, fullDB), [selectedRecord, fullDB]);

  const target = useMemo(() => ({
    cals: projection.targetCals,
    p: projection.macros.p,
    c: projection.macros.c,
    f: projection.macros.f
  }), [projection]);

  const isLocked = selectedRecord.locked;

  const setUiStatus = useAppStore(state => state.setUiStatus);
  const [hour, setHour] = useState(new Date().getHours());

  // Celebration fires once when today's intake first crosses into the "on
  // target" band (90–105%). prevPctRef tracks the previous percentage so we
  // only fire on the upward crossing, never on mount or on every re-render.
  const [celebrate, setCelebrate] = useState(false);
  const prevPctRef = useRef(null);

  // Only update UI status for today's date
  useEffect(() => {
    if (!isToday) {
      setUiStatus('low');
      prevPctRef.current = null;
      return;
    }
    if (projection.targetCals > 0) {
      const pct = (consumption.cals / projection.targetCals) * 100;
      if (pct > 105) setUiStatus('over');
      else if (pct >= 90) setUiStatus('perfect');
      else setUiStatus('low');

      const prev = prevPctRef.current;
      if (prev !== null && prev < 90 && pct >= 90 && pct <= 105) {
        setCelebrate(true);
        triggerHaptic('success');
      }
      prevPctRef.current = pct;
    }
  }, [consumption.cals, projection.targetCals, setUiStatus, isToday]);

  const streakCount = useMemo(() => getStreak(ledger, fullDB, projection.targetCals), [ledger, fullDB, projection.targetCals]);

  // Celebrate reaching a new streak milestone (3, 7, 14, … days). prevStreakRef
  // guards against firing on mount or on unrelated re-renders.
  const prevStreakRef = useRef(null);
  useEffect(() => {
    const prev = prevStreakRef.current;
    if (prev !== null && streakCount > prev && MILESTONE_DAYS.has(streakCount)) {
      triggerHaptic('success');
      toast.success(`🔥 ${streakCount}-day streak!`);
    }
    prevStreakRef.current = streakCount;
  }, [streakCount]);

  const handleCommitDay = useCallback((info) => {
    const threshold = sliderRef.current ? sliderRef.current.offsetWidth * 0.5 : 150;
    if (info.offset.x > threshold) {
      triggerHaptic('heavy');
      commitDay(selectedDate);
      toast.success('Day locked 🔒');
    }
  }, [commitDay, selectedDate]);

  useEffect(() => {
    const interval = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, []);

  const greeting = getTimeOfDay();

  // Check if any meals have food entries
  const hasMealEntries = useMemo(() => 
    Object.values(selectedRecord.meals).some(meal => Object.keys(meal).length > 0),
    [selectedRecord.meals]
  );

  return (
    <div className="min-h-[100dvh] pb-32 relative">

      <Celebration show={celebrate} onDone={() => setCelebrate(false)} />

      {/* HEADER */}
      <header className="px-6 pt-16 pb-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              <Target size={12} className="text-gray-900 dark:text-white" aria-hidden="true" /> 
              {goal} / {projection.targetCals} kcal
            </span>
            <h1 className="text-3xl font-black tracking-tighter capitalize">Good {greeting}</h1>
          </div>
          <StreakCounter streakCount={streakCount} />
        </div>
        
        <DateNavigator 
          selectedDate={selectedDate} 
          onDateChange={(d) => { triggerHaptic('light'); setSelectedDate(d); }} 
          ledger={ledger} 
        />
      </header>

      <CompactMacroBar consumption={consumption} target={projection} show={showCompact} />

      <main className="max-w-md mx-auto px-6 mt-4">
        
        {isToday && (
          <RobotBanner
            mode={robotMode}
            cals={consumption.cals}
            targetCals={target.cals}
            streakCount={streakCount}
            goal={goal}
            hour={hour}
            consumption={consumption}
            target={target}
          />
        )}

        <section className="mb-8 relative" aria-label="Calorie and macro progress">
          <MacroRing consumption={consumption} target={target} goal={goal} />
        </section>

        {isToday && !isLocked && (
          <QuickLogBar dateKey={selectedDate} fullDB={fullDB} />
        )}

        <ToolsSection dateKey={selectedDate} />

        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[13px] font-black uppercase tracking-widest text-gray-400">Meals</h2>
          <MoreMenu
            onTemplates={() => setActiveSheet('templates')}
            onCustomMeal={() => setActiveSheet('customMeal')}
          />
        </div>

        <div className="space-y-4" role="list" aria-label="Meal sections">
          {Object.keys(selectedRecord.meals).map(mealKey => {
            const isCustom = mealKey.startsWith('custom_');
            const title = isCustom 
              ? (customMealConfigs[mealKey]?.label || 'Snack') 
              : (mealKey === 'eve' ? 'Evening Snacks' : mealKey.charAt(0).toUpperCase() + mealKey.slice(1));
            return (
              <MealSection 
                key={mealKey}
                mealKey={mealKey}
                title={title}
                foods={selectedRecord.meals[mealKey]}
                fullDB={fullDB}
                isLocked={isLocked}
                onUpdateQty={(fk, val) => updateQty(selectedDate, mealKey, fk, val)}
                onRemoveFood={(fk) => {
                  removeFoodFromMeal(selectedDate, mealKey, fk);
                }}
                onDitto={() => dittoYesterday(selectedDate, mealKey)}
                onAddTap={() => { triggerHaptic('light'); setActiveMealTarget(mealKey); setActiveSheet('search'); }}
                onDeleteMeal={isCustom ? () => {
                  removeMealSlot(selectedDate, mealKey);
                } : undefined}
                canRepeat={!!getMostRecentMealDate(selectedDate, mealKey)}
                onRepeat={() => repeatMostRecentMeal(selectedDate, mealKey)}
              />
            );
          })}

          {/* Empty state when no food logged yet */}
          {!hasMealEntries && !isLocked && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 px-4"
            >
              <div className="text-4xl mb-3">🍽️</div>
              <p className="text-gray-400 dark:text-gray-500 font-medium text-sm mb-1">
                No meals logged yet
              </p>
              <p className="text-gray-300 dark:text-gray-600 text-xs">
                Tap the <span className="font-bold">+</span> button in any meal section to start tracking
              </p>
            </motion.div>
          )}
        </div>

        {/* COMMIT SLIDER - ONLY FOR TODAY */}
        {isToday && (
          <div className="mt-10 mb-8">
            {isLocked ? (
              <div className="flex gap-2">
                <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 py-5 rounded-[24px] font-black text-center flex items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                  <Lock size={18} aria-hidden="true" /> DAY LOCKED
                </div>
                <button
                  onClick={() => { triggerHaptic('medium'); unlockDay(todayKey); }}
                  aria-label="Unlock day for editing"
                  className="px-6 bg-white dark:bg-[#141416] border border-gray-100 dark:border-[#1f1f23] text-gray-400 rounded-[24px] flex items-center justify-center hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm"
                >
                  <Unlock size={18} />
                </button>
              </div>
            ) : (
              <div ref={sliderRef} className="w-full bg-white dark:bg-[#141416] h-[72px] rounded-[36px] relative overflow-hidden flex items-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-[#1f1f23]" role="slider" aria-label="Slide to lock day" aria-valuemin={0} aria-valuemax={100}>
                <span className="absolute w-full text-center font-black text-gray-400 tracking-widest text-sm pointer-events-none uppercase" aria-hidden="true">Slide to Lock Day</span>
                <motion.div 
                  drag="x" dragConstraints={sliderRef} dragSnapToOrigin onDragEnd={(e, i) => handleCommitDay(i)}
                  className="h-14 w-14 bg-gray-900 dark:bg-white rounded-full ml-2 flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-10"
                  role="button"
                  aria-label="Drag to lock day"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      triggerHaptic('heavy');
                      commitDay(selectedDate);
                      toast.success('Day locked 🔒');
                    }
                  }}
                >
                  <ChevronRight className="text-white dark:text-gray-900" />
                </motion.div>
              </div>
            )}
            {!isLocked && (
              <p className="text-center text-[11px] font-medium text-gray-400 dark:text-gray-600 mt-3 px-4">
                Optional — locks the day to prevent edits. Your streak already counts it.
              </p>
            )}
          </div>
        )}
      </main>

      {/* SHEETS - Wrapped in Suspense for code splitting */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {activeSheet === 'search' && <FoodSearchSheet mealKey={activeMealTarget} onClose={() => setActiveSheet(null)} />}
          {activeSheet === 'customFood' && <CustomFoodSheet onClose={() => setActiveSheet('search')} />}
          {activeSheet === 'templates' && <TemplateSheet onClose={() => setActiveSheet(null)} />}
          {activeSheet === 'customMeal' && (
            <CustomMealSheet 
              onClose={() => setActiveSheet(null)} 
              onAdd={(name) => addMealSlot(selectedDate, name)} 
            />
          )}
        </AnimatePresence>
      </Suspense>
      
    </div>
  );
}
