// SUPABASE: Maps to table 'weight_log'
import { create } from 'zustand';
import { supabase } from '../lib/supabase.js';
import { useAppStore } from './useAppStore.js';

export const useWeightStore = create((set, get) => ({
  weightLog: {},

  hydrateWeights: async (userId) => {
    if (!userId) return;
    const { data } = await supabase.from('weight_log').select('*').eq('user_id', userId);
    if (data) {
      const weightLog = {};
      data.forEach(row => {
        weightLog[row.date] = row.weight;
      });
      set({ weightLog });
    }
  },

  logWeight: async (dateKey, weight) => {
    set((state) => ({
      weightLog: {
        ...state.weightLog,
        [dateKey]: Number(weight)
      }
    }));
    
    const userId = useAppStore.getState().userId;
    if (userId) {
      await supabase.from('weight_log').upsert({
        user_id: userId,
        date: dateKey,
        weight: Number(weight)
      }).catch(err => console.error("Failed to save weight", err));
    }
  },

  removeWeight: async (dateKey) => {
    set((state) => {
      const newLog = { ...state.weightLog };
      delete newLog[dateKey];
      return { weightLog: newLog };
    });
    
    const userId = useAppStore.getState().userId;
    if (userId) {
      await supabase.from('weight_log').delete().match({ user_id: userId, date: dateKey })
        .catch(err => console.error("Failed to delete weight", err));
    }
  },

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
}));
