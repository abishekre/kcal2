// SUPABASE: Maps to table 'custom_exercises'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BASE_EXERCISE_DB } from '../data/exercises';
import { supabase } from '../lib/supabase.js';
import { useAppStore } from './useAppStore.js';
import { toast } from '../lib/toast';

export const useExerciseStore = create(
  persist(
    (set, get) => ({
      customExercises: {},
      // Last values the user logged per exercise — strength: {weight, reps},
      // cardio/activity: {durationSeconds, distanceM}. Prefills the next set
      // so nobody re-types their usual working weight (portion-memory analog).
      lastValues: {},

      rememberLast: (exerciseKey, values) => {
        if (!exerciseKey || !values) return;
        set((state) => ({ lastValues: { ...state.lastValues, [exerciseKey]: values } }));
      },
      getLast: (exerciseKey) => get().lastValues[exerciseKey],

      hydrateExercises: async (userId) => {
        if (!userId) return;
        try {
          const { data, error } = await supabase
            .from('custom_exercises')
            .select('*')
            .eq('user_id', userId);
          if (error) {
            console.error('Custom exercises fetch error', error);
            return;
          }
          if (data) {
            set((state) => {
              const customExercises = { ...state.customExercises };
              data.forEach((row) => { customExercises[row.exercise_key] = row.data; });
              return { customExercises };
            });
          }
        } catch (e) {
          console.error('Custom exercises hydrate failed', e);
        }
      },

      addCustomExercise: async (id, data) => {
        const userId = useAppStore.getState().userId;
        if (!userId) {
          toast.error('You must be signed in to add exercises');
          return id;
        }
        let safeId = id;
        if (BASE_EXERCISE_DB[id] || get().customExercises[id]) {
          safeId = `custom_${id}_${Date.now().toString(36)}`;
        }
        set((state) => ({ customExercises: { ...state.customExercises, [safeId]: data } }));
        try {
          const { error } = await supabase.from('custom_exercises').upsert({
            user_id: userId,
            exercise_key: safeId,
            data,
          }, { onConflict: 'user_id,exercise_key' });
          if (error) throw error;
        } catch {
          set((state) => {
            const reverted = { ...state.customExercises };
            delete reverted[safeId];
            return { customExercises: reverted };
          });
          toast.error('Failed to save exercise');
        }
        return safeId;
      },

      removeCustomExercise: async (id) => {
        const userId = useAppStore.getState().userId;
        if (!userId) return;
        const previous = get().customExercises[id];
        set((state) => {
          const next = { ...state.customExercises };
          delete next[id];
          return { customExercises: next };
        });
        try {
          const { error } = await supabase
            .from('custom_exercises')
            .delete()
            .eq('user_id', userId)
            .eq('exercise_key', id);
          if (error) throw error;
        } catch {
          if (previous !== undefined) {
            set((state) => ({ customExercises: { ...state.customExercises, [id]: previous } }));
          }
          toast.error('Failed to remove exercise');
        }
      },

      getFullExerciseDB: () => ({ ...BASE_EXERCISE_DB, ...get().customExercises }),

      // Recent exercise keys from workout history, newest session first.
      getRecentExercises: (sessions, limit = 12) => {
        const recent = new Set();
        const sorted = Object.values(sessions || {}).sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
        for (const session of sorted) {
          for (const entry of session.entries || []) {
            recent.add(entry.exerciseKey);
            if (recent.size >= limit) return Array.from(recent);
          }
        }
        return Array.from(recent);
      },

      getFrequentExercises: (sessions, limit = 12) => {
        const counts = {};
        for (const session of Object.values(sessions || {})) {
          for (const entry of session.entries || []) {
            counts[entry.exerciseKey] = (counts[entry.exerciseKey] ?? 0) + 1;
          }
        }
        return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map((e) => e[0]);
      },

      getForYouExercises: (sessions, limit = 12) => {
        const recent = get().getRecentExercises(sessions, limit);
        if (recent.length >= limit) return recent;
        const merged = [...recent];
        for (const id of get().getFrequentExercises(sessions, limit)) {
          if (!merged.includes(id)) merged.push(id);
          if (merged.length >= limit) break;
        }
        return merged;
      },

      clearAll: () => set({ customExercises: {}, lastValues: {} }),
    }),
    {
      name: 'kcal-exercises',
      partialize: (state) => ({ customExercises: state.customExercises, lastValues: state.lastValues }),
    }
  )
);
