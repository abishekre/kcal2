// SUPABASE: Maps to table 'custom_foods'
import { create } from 'zustand';
import { BASE_FOOD_DB } from '../data/foods';
import { supabase } from '../lib/supabase.js';
import { useAppStore } from './useAppStore.js';

export const useFoodStore = create((set, get) => ({
  customFoods: {},

  hydrateFoods: async (userId) => {
    const { data } = await supabase.from('custom_foods').select('*').eq('user_id', userId);
    if (data) {
      const customFoods = {};
      data.forEach(row => {
        customFoods[row.food_key] = row.data;
      });
      set({ customFoods });
    }
  },

  addCustomFood: (id, foodData) => {
    set((state) => ({
      customFoods: {
        ...state.customFoods,
        [id]: foodData
      }
    }));
    const userId = useAppStore.getState().userId;
    if (userId) {
      supabase.from('custom_foods').upsert({
        user_id: userId,
        food_key: id,
        data: foodData
      });
    }
  },

  removeCustomFood: (id) => {
    set((state) => {
      const newFoods = { ...state.customFoods };
      delete newFoods[id];
      return { customFoods: newFoods };
    });
    const userId = useAppStore.getState().userId;
    if (userId) {
      supabase.from('custom_foods').delete().match({ user_id: userId, food_key: id });
    }
  },

  getFullDB: () => {
    return { ...BASE_FOOD_DB, ...get().customFoods };
  },

  getRecentFoods: (ledger, limit = 10) => {
    const recentFoodIds = new Set();
    const dates = Object.keys(ledger).sort((a, b) => new Date(b) - new Date(a));
    
    for (const date of dates) {
      const record = ledger[date];
      if (!record || !record.meals) continue;
      
      for (const mealKey of Object.keys(record.meals)) {
        const mealFoods = Object.keys(record.meals[mealKey] || {});
        for (const foodId of mealFoods) {
          recentFoodIds.add(foodId);
          if (recentFoodIds.size >= limit) {
            return Array.from(recentFoodIds);
          }
        }
      }
    }
    return Array.from(recentFoodIds);
  },

  getFrequentFoods: (ledger, limit = 10) => {
    const counts = {};
    const dates = Object.keys(ledger);
    
    for (const date of dates) {
      const record = ledger[date];
      if (!record || !record.meals) continue;
      
      for (const mealKey of Object.keys(record.meals)) {
        const mealFoods = Object.keys(record.meals[mealKey] || {});
        for (const foodId of mealFoods) {
          counts[foodId] = (counts[foodId] || 0) + 1;
        }
      }
    }
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(entry => entry[0]);
  }
}));
