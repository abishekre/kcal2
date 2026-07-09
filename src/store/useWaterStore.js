import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WATER_GLASS_ML, WATER_BOTTLE_ML, VALIDATION } from '../utils/constants';
import { supabase } from '../lib/supabase';
import { useAppStore } from './useAppStore';
import { toast } from '../lib/toast';
import { registerFlusher } from '../lib/retrySync';

const BOTTLE_GLASSES = WATER_BOTTLE_ML / WATER_GLASS_ML;
const MAX_GLASSES = VALIDATION.waterGlassesMax;
const MAX_ML = VALIDATION.waterMlMax;

export const useWaterStore = create(
  persist(
    (set, get) => ({
      waterLog: {},        // { dateKey: { glasses: number, ml: number } }
      waterTarget: 8,      // glasses/day
      // dirty: { [dateKey]: userId } — same write-ahead pattern as the ledger.
      dirty: {},

      getWaterForDate: (dateKey) => {
        return get().waterLog[dateKey] ?? { glasses: 0, ml: 0 };
      },

      addGlass: (dateKey) => {
        set(state => {
          const current = state.waterLog[dateKey] ?? { glasses: 0, ml: 0 };
          if (current.glasses >= MAX_GLASSES) return state;
          const newGlasses = current.glasses + 1;
          return {
            waterLog: {
              ...state.waterLog,
              [dateKey]: { glasses: newGlasses, ml: Math.min(newGlasses * WATER_GLASS_ML, MAX_ML) }
            }
          };
        });
        get()._queueSync(dateKey);
      },

      removeGlass: (dateKey) => {
        set(state => {
          const current = state.waterLog[dateKey] ?? { glasses: 0, ml: 0 };
          const newGlasses = Math.max(0, current.glasses - 1);
          return {
            waterLog: {
              ...state.waterLog,
              [dateKey]: { glasses: newGlasses, ml: newGlasses * WATER_GLASS_ML }
            }
          };
        });
        get()._queueSync(dateKey);
      },

      addBottle: (dateKey) => {
        set(state => {
          const current = state.waterLog[dateKey] ?? { glasses: 0, ml: 0 };
          const newGlasses = Math.min(current.glasses + BOTTLE_GLASSES, MAX_GLASSES);
          return {
            waterLog: {
              ...state.waterLog,
              [dateKey]: { glasses: newGlasses, ml: Math.min(newGlasses * WATER_GLASS_ML, MAX_ML) }
            }
          };
        });
        get()._queueSync(dateKey);
      },

      setWaterTarget: (n) => {
        set({ waterTarget: Math.max(1, Math.min(MAX_GLASSES, n)) });
      },

      hydrateWater: async (userId) => {
        if (!userId) return;
        try {
          const { data, error } = await supabase
            .from('water_log')
            .select('*')
            .eq('user_id', userId);
          if (error) {
            console.error('Water hydrate error', error);
            return;
          }
          if (data) {
            set((state) => {
              const waterLog = { ...state.waterLog };
              data.forEach(row => {
                if (!state.dirty[row.date]) {
                  waterLog[row.date] = { glasses: row.glasses, ml: row.ml };
                }
              });
              return { waterLog };
            });
          }
        } catch (e) {
          console.error('Water hydrate failed', e);
        }
      },

      _queueSync: (dateKey) => {
        const userId = useAppStore.getState().userId;
        if (!userId) return;
        set((state) => ({ dirty: { ...state.dirty, [dateKey]: userId } }));

        if (get()._syncTimer) clearTimeout(get()._syncTimer);
        const timer = setTimeout(() => { get()._flushSyncs(); }, 800);
        set({ _syncTimer: timer });
      },

      _flushSyncs: async () => {
        if (get()._syncTimer) clearTimeout(get()._syncTimer);
        set({ _syncTimer: null });

        const dirty = get().dirty;
        const entries = Object.entries(dirty);
        if (entries.length === 0) return;

        const waterLog = get().waterLog;
        const results = await Promise.allSettled(entries.map(async ([dateKey, userId]) => {
          const entry = waterLog[dateKey] ?? { glasses: 0, ml: 0 };
          const { error } = await supabase.from('water_log').upsert({
            user_id: userId,
            date: dateKey,
            glasses: entry.glasses,
            ml: entry.ml
          }, { onConflict: 'user_id,date' });
          if (error) throw error;
          return dateKey;
        }));

        let failedCount = 0;
        set((state) => {
          const newDirty = { ...state.dirty };
          results.forEach((result, i) => {
            const [dateKey] = entries[i];
            if (result.status === 'fulfilled') delete newDirty[dateKey];
            else { failedCount++; console.error('Water sync failed', dateKey, result.reason); }
          });
          return { dirty: newDirty };
        });

        if (failedCount > 0) {
          toast.error('Failed to save water log — will retry automatically');
        }
      },

      clearAll: () => {
        const timer = get()._syncTimer;
        if (timer) clearTimeout(timer);
        set({ waterLog: {}, dirty: {}, _syncTimer: null });
      }
    }),
    {
      name: 'kcal-water',
      partialize: (state) => ({ waterLog: state.waterLog, waterTarget: state.waterTarget, dirty: state.dirty }),
    }
  )
);

registerFlusher(() => useWaterStore.getState()._flushSyncs());
