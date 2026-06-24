// SUPABASE: Maps to table 'ledger'
import { create } from 'zustand';
import { calculateConsumption } from '../engine/projection';
import { getTodayKey, getYesterdayKey } from '../utils/dates';
import { supabase } from '../lib/supabase.js';
import { useAppStore } from './useAppStore.js';

export const INITIAL_DAY_RECORD = {
  locked: false,
  meals: {
    morning: {},
    lunch: {},
    eve: {},
    dinner: {}
  }
};

export const useLedgerStore = create((set, get) => ({
  ledger: {},
  templates: {},
  customMealConfigs: {},

  hydrateLedger: async (userId) => {
    const { data: ledgerData } = await supabase.from('ledger').select('*').eq('user_id', userId);
    const { data: mealConfigs } = await supabase.from('custom_meal_configs').select('*').eq('user_id', userId);
    
    const ledger = {};
    if (ledgerData) {
      ledgerData.forEach(row => {
        ledger[row.date] = { locked: row.locked, meals: row.meals };
      });
    }
    
    const customMealConfigs = {};
    if (mealConfigs) {
      mealConfigs.forEach(row => {
        customMealConfigs[row.meal_key] = {
          label: row.label,
          emoji: '🍽️',
          accent: 'text-gray-500',
          bg: 'bg-gray-50 dark:bg-gray-500/10',
          border: 'border-gray-100 dark:border-gray-500/20'
        };
      });
    }
    
    set({ ledger, customMealConfigs });
  },

  syncLedgerDay: (dateKey) => {
    const userId = useAppStore.getState().userId;
    if (!userId) return;
    const record = get().ledger[dateKey] || INITIAL_DAY_RECORD;
    supabase.from('ledger').upsert({
      user_id: userId,
      date: dateKey,
      meals: record.meals,
      locked: record.locked
    });
  },

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

  loadTemplate: (dateKey, templateId) => {
    set((state) => {
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
    });
    get().syncLedgerDay(dateKey);
  },

  addMealSlot: (dateKey, label, emoji = '🍽️') => {
    const mealKey = `custom_${Date.now()}`;
    set((state) => {
      const record = state.ledger[dateKey] || JSON.parse(JSON.stringify(INITIAL_DAY_RECORD));
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
    });

    const userId = useAppStore.getState().userId;
    if (userId) {
      supabase.from('custom_meal_configs').upsert({
        user_id: userId,
        meal_key: mealKey,
        label
      });
    }
    get().syncLedgerDay(dateKey);
  },

  removeMealSlot: (dateKey, mealKey) => {
    set((state) => {
      const record = state.ledger[dateKey];
      if (!record) return state;
      const newMeals = { ...record.meals };
      delete newMeals[mealKey];
      
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
    });

    const userId = useAppStore.getState().userId;
    if (userId) {
      supabase.from('custom_meal_configs').delete().match({ user_id: userId, meal_key: mealKey });
    }
    get().syncLedgerDay(dateKey);
  },

  getRecord: (dateKey) => {
    return get().ledger[dateKey] || INITIAL_DAY_RECORD;
  },

  getTodayRecord: () => {
    return get().getRecord(getTodayKey());
  },

  addFoodToMeal: (dateKey, mealKey, foodId, qty = 1) => {
    set((state) => {
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
    });
    get().syncLedgerDay(dateKey);
  },

  removeFoodFromMeal: (dateKey, mealKey, foodId) => {
    set((state) => {
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
    });
    get().syncLedgerDay(dateKey);
  },

  updateQty: (dateKey, mealKey, foodId, newQty) => {
    set((state) => {
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
    });
    get().syncLedgerDay(dateKey);
  },

  dittoYesterday: (dateKey) => {
    set((state) => {
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
    });
    get().syncLedgerDay(dateKey);
  },

  commitDay: (dateKey) => {
    set((state) => {
      const record = state.ledger[dateKey] || INITIAL_DAY_RECORD;
      return {
        ledger: {
          ...state.ledger,
          [dateKey]: { ...record, locked: true }
        }
      };
    });
    get().syncLedgerDay(dateKey);
  },

  unlockDay: (dateKey) => {
    set((state) => {
      const record = state.ledger[dateKey] || INITIAL_DAY_RECORD;
      return {
        ledger: {
          ...state.ledger,
          [dateKey]: { ...record, locked: false }
        }
      };
    });
    get().syncLedgerDay(dateKey);
  },

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
}));
