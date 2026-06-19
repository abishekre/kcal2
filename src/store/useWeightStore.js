// SUPABASE: Maps to table 'weight_log'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWeightStore = create(
  persist(
    (set, get) => ({
      weightLog: {},
      
      logWeight: (dateKey, weight) => set((state) => ({
        weightLog: {
          ...state.weightLog,
          [dateKey]: Number(weight)
        }
      })),

      removeWeight: (dateKey) => set((state) => {
        const newLog = { ...state.weightLog };
        delete newLog[dateKey];
        return { weightLog: newLog };
      }),

      getWeightForDate: (dateKey) => {
        return get().weightLog[dateKey] || null;
      },

      getWeightTrend: (days) => {
        const log = get().weightLog;
        const keys = Object.keys(log).sort((a, b) => new Date(a) - new Date(b));
        const trend = keys.map(date => ({ date, weight: log[date] }));
        if (days && days > 0) {
          return trend.slice(-days);
        }
        return trend;
      },

      getLatestWeight: () => {
        const log = get().weightLog;
        const keys = Object.keys(log).sort((a, b) => new Date(b) - new Date(a));
        if (keys.length === 0) return null;
        return log[keys[0]];
      }
    }),
    {
      name: 'kcal_weight',
    }
  )
);
