import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { Target, ChevronRight, Lock, Unlock, Copy } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useLedgerStore, INITIAL_DAY_RECORD } from '../store/useLedgerStore';
import { useFoodStore } from '../store/useFoodStore';
import { getTodayKey, getPastDaysKeys, formatDateShort, getTimeOfDay } from '../utils/dates';
import { calculateGoalCalories, calculateConsumption, getStreak } from '../engine/projection';
import { triggerHaptic } from '../utils/haptics';

import MacroRing from '../components/Dashboard/MacroRing';
import CompactMacroBar from '../components/Dashboard/CompactMacroBar';
import RobotBanner from '../components/Dashboard/RobotBanner';
import StreakCounter from '../components/Dashboard/StreakCounter';
import MealSection from '../components/Dashboard/MealSection';

import DateNavigator from '../components/Core/DateNavigator';

import FoodSearchSheet from '../components/Sheets/FoodSearchSheet';
import CustomFoodSheet from '../components/Sheets/CustomFoodSheet';
import WeightLogSheet from '../components/Sheets/WeightLogSheet';
import TemplateSheet from '../components/Sheets/TemplateSheet';
import CustomMealSheet from '../components/Sheets/CustomMealSheet';

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

  const customFoods = useFoodStore(state => state.customFoods);
  const getFullDB = useFoodStore(state => state.getFullDB);
  const fullDB = useMemo(() => getFullDB(), [customFoods]);
  
  const todayKey = getTodayKey();
  const isToday = selectedDate === todayKey;

  const ledger = useLedgerStore(state => state.ledger); 
  const getRecord = useLedgerStore(state => state.getRecord);
  const selectedRecord = getRecord(selectedDate) || INITIAL_DAY_RECORD;

  const customMealConfigs = useLedgerStore(state => state.customMealConfigs);
  const addMealSlot = useLedgerStore(state => state.addMealSlot);
  const { scrollY } = useScroll();
  const [showCompact, setShowCompact] = useState(false);

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

  const target = {
    cals: projection.targetCals,
    p: projection.macros.p,
    c: projection.macros.c,
    f: projection.macros.f
  };

  const isOverload = consumption.cals > target.cals;
  const isLocked = selectedRecord.locked;

  const setUiStatus = useAppStore(state => state.setUiStatus);
  const [hour, setHour] = useState(new Date().getHours());

  useEffect(() => {
    // Set UI background status based on adherence
    if (projection.targetCals > 0) {
      const pct = (consumption.cals / projection.targetCals) * 100;
      if (pct > 105) setUiStatus('over');
      else if (pct >= 90) setUiStatus('perfect');
      else setUiStatus('low');
    }
  }, [consumption.cals, projection.targetCals, setUiStatus]);

  const streakCount = useMemo(() => getStreak(ledger, fullDB, projection.targetCals), [ledger, fullDB, projection.targetCals]);

  const handleCommitDay = (info) => {
    if (info.offset.x > window.innerWidth * 0.4) {
      triggerHaptic('heavy');
      commitDay(selectedDate);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, []);

  const greeting = getTimeOfDay();

  return (
    <div className="min-h-[100dvh] pb-32 relative">
      
      {/* HEADER */}
      <header className="px-6 pt-16 pb-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              <Target size={12} className="text-gray-900 dark:text-white" /> 
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
          <div className="mb-8">
            <RobotBanner 
              mode={robotMode} 
              cals={consumption.cals} 
              targetCals={target.cals} 
              streakCount={streakCount} 
              goal={goal}
              hour={hour}
              consumption={consumption}
            />
          </div>
        )}

        <section className="mb-10 relative">
          <MacroRing consumption={consumption} target={target} goal={goal} />
        </section>

        <section className="mb-6">
          <button 
            onClick={() => { triggerHaptic('light'); setActiveSheet('templates'); }}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-[16px] font-bold text-sm transition-colors active:scale-95"
          >
            <Copy size={16} className="text-gray-400 dark:text-gray-500" /> Load/Save Template
          </button>
        </section>

        <div className="space-y-4">
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
                onRemoveFood={(fk) => removeFoodFromMeal(selectedDate, mealKey, fk)}
                onDitto={() => dittoYesterday(selectedDate, mealKey)}
                onAddTap={() => { triggerHaptic('light'); setActiveMealTarget(mealKey); setActiveSheet('search'); }}
                onDeleteMeal={isCustom ? () => {
                  if (window.confirm(`Delete ${title}?`)) {
                    removeMealSlot(selectedDate, mealKey);
                  }
                } : undefined}
              />
            );
          })}
          
          {!isLocked && (
            <button 
              onClick={() => {
                triggerHaptic('light');
                setActiveSheet('customMeal');
              }}
              className="w-full py-4 rounded-[24px] border-2 border-dashed border-gray-200 dark:border-[#2c2c2e] text-gray-400 font-bold text-sm hover:border-gray-300 dark:hover:border-gray-600 active:scale-95 transition-all"
            >
              + Add Custom Meal Time
            </button>
          )}
        </div>

        {/* COMMIT SLIDER - ONLY FOR TODAY */}
        {isToday && (
          <div className="mt-16 mb-8">
            {isLocked ? (
              <div className="flex gap-2">
                <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 py-5 rounded-[24px] font-black text-center flex items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                  <Lock size={18} /> DAY LOCKED
                </div>
                <button onClick={() => { triggerHaptic('medium'); unlockDay(todayKey); }} className="px-6 bg-white dark:bg-[#141416] border border-gray-100 dark:border-[#1f1f23] text-gray-400 rounded-[24px] flex items-center justify-center hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm">
                  <Unlock size={18} />
                </button>
              </div>
            ) : (
              <div className="w-full bg-white dark:bg-[#141416] h-[72px] rounded-[36px] relative overflow-hidden flex items-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-[#1f1f23]">
                <span className="absolute w-full text-center font-black text-gray-400 tracking-widest text-sm pointer-events-none uppercase">Slide to Commit Day</span>
                <motion.div 
                  drag="x" dragConstraints={{ left: 0, right: 300 }} dragSnapToOrigin onDragEnd={(e, i) => handleCommitDay(i)}
                  className="h-14 w-14 bg-gray-900 dark:bg-white rounded-full ml-2 flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-10"
                >
                  <ChevronRight className="text-white dark:text-gray-900" />
                </motion.div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* SHEETS */}
      <AnimatePresence>
        {activeSheet === 'search' && <FoodSearchSheet mealKey={activeMealTarget} onClose={() => setActiveSheet(null)} />}
        {activeSheet === 'customFood' && <CustomFoodSheet onClose={() => setActiveSheet('search')} />}
        {activeSheet === 'weightLog' && <WeightLogSheet onClose={() => setActiveSheet(null)} />}
        {activeSheet === 'templates' && <TemplateSheet onClose={() => setActiveSheet(null)} />}
        {activeSheet === 'customMeal' && (
          <CustomMealSheet 
            onClose={() => setActiveSheet(null)} 
            onAdd={(name) => addMealSlot(selectedDate, name)} 
          />
        )}
      </AnimatePresence>
      
    </div>
  );
}
