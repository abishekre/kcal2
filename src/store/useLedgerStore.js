// SUPABASE: Maps to table 'ledger'
import { create } from 'zustand';
import { getTodayKey, getRelativeYesterdayKey } from '../utils/dates';
import { supabase } from '../lib/supabase.js';
import { useAppStore } from './useAppStore.js';
import debounce from 'lodash/debounce';

export const getInitialDayRecord = () => ({
  locked: false,
  meals: {
    morning: {},
    lunch: {},
    eve: {},
    dinner: {}
  }
});

export const useLedgerStore = create((set, get) => ({
  ledger: {},
  templates: {},
  customMealConfigs: {},

  hydrateLedger: async (userId) => {
    if (!userId) return;
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

  syncLedgerDay: debounce((dateKey) => {
    const userId = useAppStore.getState().userId;
    if (!userId) return;
    const record = useLedgerStore.getState().ledger[dateKey] || getInitialDayRecord();
    supabase.from('ledger').upsert({
      user_id: userId,
      date: dateKey,
      meals: record.meals,
      locked: record.locked
    }).catch(err => console.error('Failed to sync ledger day', err));
  }, 1000),

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
      
      const currentRecord = state.ledger[dateKey] || getInitialDayRecord();
      const mergedMeals = { ...currentRecord.meals };
      for (const mKey of Object.keys(template.meals)) {
        mergedMeals[mKey] = {
          ...(mergedMeals[mKey] || {}),
          ...template.meals[mKey]
        };
      }

      return {
        ledger: {
          ...state.ledger,
          [dateKey]: {
            ...currentRecord,
            locked: false,
            meals: mergedMeals
          }
        }
      };
    });
    get().syncLedgerDay(dateKey);
  },

  addMealSlot: (dateKey, label, emoji = '🍽️') => {
    const mealKey = `custom_${Date.now()}`;
    set((state) => {
      const record = state.ledger[dateKey] || getInitialDayRecord();
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
      }).catch(err => console.error('Failed to add custom meal', err));
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
      supabase.from('custom_meal_configs').delete().match({ user_id: userId, meal_key: mealKey })
        .catch(err => console.error('Failed to remove custom meal', err));
    }
    get().syncLedgerDay(dateKey);
  },

  getRecord: (dateKey) => {
    return get().ledger[dateKey] || getInitialDayRecord();
  },

  getTodayRecord: () => {
    return get().getRecord(getTodayKey());
  },

  addFoodToMeal: (dateKey, mealKey, foodId, qty = 1) => {
    set((state) => {
      const record = state.ledger[dateKey] || getInitialDayRecord();
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
      const record = state.ledger[dateKey] || getInitialDayRecord();
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
      const record = state.ledger[dateKey] || getInitialDayRecord();
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

  dittoYesterday: (dateKey, mealKey) => {
    set((state) => {
      const yesterdayRecord = state.ledger[getRelativeYesterdayKey(dateKey)];
      if (!yesterdayRecord) return state;
      
      const targetMeals = mealKey ? { [mealKey]: yesterdayRecord.meals[mealKey] || {} } : yesterdayRecord.meals;
      const currentRecord = state.ledger[dateKey] || getInitialDayRecord();
      
      return {
        ledger: {
          ...state.ledger,
          [dateKey]: {
            ...currentRecord,
            locked: false,
            meals: {
              ...currentRecord.meals,
              ...JSON.parse(JSON.stringify(targetMeals))
            }
          }
        }
      };
    });
    get().syncLedgerDay(dateKey);
  },

  commitDay: (dateKey) => {
    set((state) => {
      const record = state.ledger[dateKey] || getInitialDayRecord();
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
      const record = state.ledger[dateKey] || getInitialDayRecord();
      return {
        ledger: {
          ...state.ledger,
          [dateKey]: { ...record, locked: false }
        }
      };
    });
    get().syncLedgerDay(dateKey);
  }
}));
