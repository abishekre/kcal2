import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useGlobalStore = create((set, get) => ({
  globalFoods: {},
  robotMessages: [],
  insightTexts: [],

  fetchGlobals: async () => {
    try {
      const [foodsRes, msgsRes, insightsRes] = await Promise.all([
        supabase.from('global_foods').select('*'),
        supabase.from('robot_messages').select('*'),
        supabase.from('insight_texts').select('*')
      ]);

      if (foodsRes.error) console.error('Foods error', foodsRes.error);
      if (msgsRes.error) console.error('Msgs error', msgsRes.error);
      if (insightsRes.error) console.error('Insights error', insightsRes.error);

      const foodsMap = {};
      (foodsRes.data || []).forEach(f => {
        foodsMap[f.food_key] = f.data;
      });

      set({
        globalFoods: foodsMap,
        robotMessages: msgsRes.data || [],
        insightTexts: insightsRes.data || []
      });
    } catch (e) {
      console.error('Failed to fetch globals', e);
    }
  }
}));
