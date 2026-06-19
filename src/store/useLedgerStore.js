// SUPABASE: Maps to table 'food_log'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateConsumption } from '../engine/projection';
import { getTodayKey, getYesterdayKey } from '../utils/dates';

export const INITIAL_DAY_RECORD = {
  locked: false,
  meals: {
    morning: {},
    lunch: {},
    eve: {},
    dinner: {}
  }
};

export const useLedgerStore = create(
  persist(
    (set, get) => ({
      ledger: {},
      templates: {},
      customMealConfigs: {},

      saveTemplate: (name, dateKey) => set((state) => {
        const record = state.ledger[dateKey];
        if (!record) return state;
        const templateId = `tpl_${Date.now()}`;
        return {
          templates: {
            ...state.templates,
            [templateId]: { name, meals: JSON.parse(JSON.stringify(record.meals)) }
          }
        };
      }),

      loadTemplate: (dateKey, templateId) => set((state) => {
        const template = state.templates[templateId];
        if (!template) return state;
        return {
          ledger: {
            ...state.ledger,
            [dateKey]: {
              locked: false,
              meals: JSON.parse(JSON.stringify(template.meals))
            }
          }
        };
      }),

      addMealSlot: (dateKey, label, emoji = '🍽️') => set((state) => {
        const record = state.ledger[dateKey] || JSON.parse(JSON.stringify(INITIAL_DAY_RECORD));
        const mealKey = `custom_${Date.now()}`;
        return {
          customMealConfigs: {
            ...state.customMealConfigs,
            [mealKey]: { label, emoji, accent: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-500/10', border: 'border-gray-100 dark:border-gray-500/20' }
          },
          ledger: {
            ...state.ledger,
            [dateKey]: {
              ...record,
              meals: {
                ...record.meals,
                [mealKey]: {}
              }
            }
          }
        };
      }),

      removeMealSlot: (dateKey, mealKey) => set((state) => {
        const record = state.ledger[dateKey];
        if (!record) return state;
        const newMeals = { ...record.meals };
        delete newMeals[mealKey];
        
        // Optionally remove from customMealConfigs if we want to delete it globally
        const newConfigs = { ...state.customMealConfigs };
        delete newConfigs[mealKey];

        return {
          customMealConfigs: newConfigs,
          ledger: {
            ...state.ledger,
            [dateKey]: {
              ...record,
              meals: newMeals
            }
          }
        };
      }),

      getRecord: (dateKey) => {
        return get().ledger[dateKey] || INITIAL_DAY_RECORD;
      },

      getTodayRecord: () => {
        return get().getRecord(getTodayKey());
      },

      addFoodToMeal: (dateKey, mealKey, foodId, qty = 1) => set((state) => {
        const record = state.ledger[dateKey] || INITIAL_DAY_RECORD;
        const meal = record.meals[mealKey] || {};
        return {
          ledger: {
            ...state.ledger,
            [dateKey]: {
              ...record,
              meals: {
                ...record.meals,
                [mealKey]: { ...meal, [foodId]: (meal[foodId] || 0) + qty }
              }
            }
          }
        };
      }),

      removeFoodFromMeal: (dateKey, mealKey, foodId) => set((state) => {
        const record = state.ledger[dateKey] || INITIAL_DAY_RECORD;
        const meal = { ...(record.meals[mealKey] || {}) };
        delete meal[foodId];
        return {
          ledger: {
            ...state.ledger,
            [dateKey]: {
              ...record,
              meals: {
                ...record.meals,
                [mealKey]: meal
              }
            }
          }
        };
      }),

      updateQty: (dateKey, mealKey, foodId, newQty) => set((state) => {
        const record = state.ledger[dateKey] || INITIAL_DAY_RECORD;
        const meal = { ...(record.meals[mealKey] || {}) };
        if (newQty <= 0) {
          delete meal[foodId];
        } else {
          meal[foodId] = newQty;
        }
        return {
          ledger: {
            ...state.ledger,
            [dateKey]: {
              ...record,
              meals: {
                ...record.meals,
                [mealKey]: meal
              }
            }
          }
        };
      }),

      dittoYesterday: (dateKey) => set((state) => {
        const yesterdayRecord = state.ledger[getYesterdayKey()];
        if (!yesterdayRecord) return state;
        return {
          ledger: {
            ...state.ledger,
            [dateKey]: {
              locked: false,
              meals: JSON.parse(JSON.stringify(yesterdayRecord.meals))
            }
          }
        };
      }),

      commitDay: (dateKey) => set((state) => {
        const record = state.ledger[dateKey] || INITIAL_DAY_RECORD;
        return {
          ledger: {
            ...state.ledger,
            [dateKey]: { ...record, locked: true }
          }
        };
      }),

      unlockDay: (dateKey) => set((state) => {
        const record = state.ledger[dateKey] || INITIAL_DAY_RECORD;
        return {
          ledger: {
            ...state.ledger,
            [dateKey]: { ...record, locked: false }
          }
        };
      }),

      getStreak: (fullDB, targetCals) => {
        const ledger = get().ledger;
        const keys = Object.keys(ledger).sort((a, b) => new Date(b) - new Date(a));
        
        let streak = 0;
        let todayProcessed = false;
        const today = getTodayKey();
        
        for (const date of keys) {
          const record = ledger[date];
          if (!record) continue;
          
          if (date === today) {
            todayProcessed = true;
            if (record.locked) {
              const consumed = calculateConsumption(record.meals, fullDB).cals;
              if (consumed <= targetCals) streak++;
            }
            continue;
          }
          
          if (record.locked) {
            const consumed = calculateConsumption(record.meals, fullDB).cals;
            if (consumed <= targetCals) {
              streak++;
            } else {
              break;
            }
          } else {
            break;
          }
        }
        
        return streak;
      },

      getAdherenceHistory: (days, fullDB, targetCals) => {
        const ledger = get().ledger;
        const dates = Object.keys(ledger).sort((a, b) => new Date(a) - new Date(b)).slice(-days);
        
        return dates.map(date => {
          const record = ledger[date] || INITIAL_DAY_RECORD;
          const cals = calculateConsumption(record.meals, fullDB).cals;
          return {
            date,
            cals,
            target: targetCals,
            adherent: record.locked && cals <= targetCals
          };
        });
      }
    }),
    {
      name: 'kcal_ledger',
    }
  )
);
