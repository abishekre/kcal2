// SUPABASE: Maps to table 'custom_foods'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BASE_FOOD_DB } from '../data/foods';
import { supabase } from '../lib/supabase.js';
import { useAppStore } from './useAppStore.js';
import { toast } from '../lib/toast';

// Stable content signature used to dedupe quick-add entries — same name and
// macros should reuse the same custom food row instead of minting a new one
// on every tap.
const contentKey = (foodData) =>
  `${(foodData.name || '').trim().toLowerCase()}|${foodData.cals}|${foodData.p || 0}|${foodData.c || 0}|${foodData.f || 0}`;

export const useFoodStore = create(
  persist(
    (set, get) => ({
      customFoods: {},

      hydrateFoods: async (userId) => {
        if (!userId) return;
        try {
          const { data, error } = await supabase
            .from('custom_foods')
            .select('*')
            .eq('user_id', userId);

          if (error) {
            toast.error('Failed to load custom foods');
            return;
          }
          if (data) {
            set((state) => {
              const customFoods = { ...state.customFoods };
              data.forEach((row) => {
                customFoods[row.food_key] = row.data;
              });
              return { customFoods };
            });
          }
        } catch {
          toast.error('Failed to load custom foods');
        }
      },

      addCustomFood: async (id, foodData) => {
        const userId = useAppStore.getState().userId;
        if (!userId) {
          toast.error('You must be signed in to add custom foods');
          return id;
        }

        // Key collision detection: avoid clobbering a base food OR an
        // existing custom food that already owns this id.
        let safeId = id;
        if (BASE_FOOD_DB[id] || (get().customFoods[id] && get().customFoods[id] !== foodData)) {
          safeId = `custom_${id}_${Date.now().toString(36)}`;
        }

        // Optimistic local update
        set((state) => ({
          customFoods: {
            ...state.customFoods,
            [safeId]: foodData,
          },
        }));

        // Sync to Supabase with rollback on failure
        try {
          const { error } = await supabase.from('custom_foods').upsert({
            user_id: userId,
            food_key: safeId,
            data: foodData,
          }, { onConflict: 'user_id,food_key' });
          if (error) {
            set((state) => {
              const reverted = { ...state.customFoods };
              delete reverted[safeId];
              return { customFoods: reverted };
            });
            toast.error('Failed to save custom food');
          }
        } catch {
          set((state) => {
            const reverted = { ...state.customFoods };
            delete reverted[safeId];
            return { customFoods: reverted };
          });
          toast.error('Failed to save custom food');
        }
        return safeId;
      },

      // Reuses an existing custom food with identical name/macros instead of
      // creating a new row every time — used by the quick-add flow so
      // repeated one-off entries don't pile up as duplicate rows.
      addOrReuseCustomFood: async (id, foodData) => {
        const key = contentKey(foodData);
        const existingId = Object.entries(get().customFoods).find(
          ([, data]) => contentKey(data) === key
        )?.[0];
        if (existingId) return existingId;
        return get().addCustomFood(id, foodData);
      },

      removeCustomFood: async (id) => {
        const userId = useAppStore.getState().userId;
        if (!userId) {
          toast.error('You must be signed in to remove custom foods');
          return;
        }

        const previous = get().customFoods[id];

        set((state) => {
          const newFoods = { ...state.customFoods };
          delete newFoods[id];
          return { customFoods: newFoods };
        });

        try {
          const { error } = await supabase
            .from('custom_foods')
            .delete()
            .eq('user_id', userId)
            .eq('food_key', id);

          if (error) {
            if (previous !== undefined) {
              set((state) => ({
                customFoods: { ...state.customFoods, [id]: previous },
              }));
            }
            toast.error('Failed to remove custom food');
          }
        } catch {
          if (previous !== undefined) {
            set((state) => ({
              customFoods: { ...state.customFoods, [id]: previous },
            }));
          }
          toast.error('Failed to remove custom food');
        }
      },

      /**
       * Returns the full food database (base + custom).
       * Note: Actual search/filtering with `.limit()` is handled in
       * FoodSearchSheet. This getter provides the complete local DB.
       */
      getFullDB: () => {
        return { ...BASE_FOOD_DB, ...get().customFoods };
      },

      getRecentFoods: (ledger, limit = 10) => {
        const recentFoodIds = new Set();
        const dates = Object.keys(ledger).sort((a, b) => new Date(b) - new Date(a));

        for (const date of dates) {
          const record = ledger[date];
          if (!record?.meals) continue;

          for (const mealKey of Object.keys(record.meals)) {
            const mealFoods = Object.keys(record.meals[mealKey] ?? {});
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
          if (!record?.meals) continue;

          for (const mealKey of Object.keys(record.meals)) {
            const mealFoods = Object.keys(record.meals[mealKey] ?? {});
            for (const foodId of mealFoods) {
              counts[foodId] = (counts[foodId] ?? 0) + 1;
            }
          }
        }

        return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map((entry) => entry[0]);
      },

      // Merged "for you" shortlist: recent items first, backfilled with
      // frequent items, deduped — so the common case never needs to type.
      getForYouFoods: (ledger, limit = 12) => {
        const recent = get().getRecentFoods(ledger, limit);
        if (recent.length >= limit) return recent;
        const frequent = get().getFrequentFoods(ledger, limit);
        const merged = [...recent];
        for (const id of frequent) {
          if (!merged.includes(id)) merged.push(id);
          if (merged.length >= limit) break;
        }
        return merged;
      },

      clearAll: () => {
        set({ customFoods: {} });
      },
    }),
    {
      name: 'kcal-foods',
      partialize: (state) => ({ customFoods: state.customFoods }),
    }
  )
);
