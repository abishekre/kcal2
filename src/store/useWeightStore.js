// SUPABASE: Maps to table 'weight_log'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase.js';
import { useAppStore } from './useAppStore.js';
import { toast } from '../lib/toast';
import { validateWeight, checkWeightAnomaly } from '../utils/validation';
import { registerFlusher } from '../lib/retrySync';

export const useWeightStore = create(
  persist(
    (set, get) => ({
      weightLog: {},
      // dirty: { [dateKey]: userId } — presence in weightLog decides upsert
      // vs. delete when a dirty entry is flushed.
      dirty: {},

      // Sorted-keys are computed fresh on every call rather than cached in
      // state — getLatestWeight()/getWeightTrend() are called directly from
      // component render bodies, and a cache implemented via set() would
      // update the store *during* that render (React: "Cannot update a
      // component while rendering a different component"). Weight logs are
      // small (at most a few hundred entries), so re-sorting each call is
      // cheap enough that a cache isn't worth the risk.
      _getSortedKeysAsc: () => {
        return Object.keys(get().weightLog).sort((a, b) => new Date(a) - new Date(b));
      },

      _getSortedKeysDesc: () => {
        return get()._getSortedKeysAsc().reverse();
      },

      hydrateWeights: async (userId) => {
        if (!userId) return;
        try {
          const { data, error } = await supabase
            .from('weight_log')
            .select('*')
            .eq('user_id', userId);

          if (error) {
            toast.error('Failed to load weight history');
            return;
          }
          if (data) {
            set((state) => {
              const weightLog = { ...state.weightLog };
              data.forEach((row) => {
                if (!state.dirty[row.date]) {
                  weightLog[row.date] = row.weight;
                }
              });
              return { weightLog };
            });
          }
        } catch {
          toast.error('Failed to load weight history');
        }
      },

      // Returns a warning string if the new weight is a big jump from the
      // last logged entry, or null if it looks normal.
      checkAnomaly: (weight) => {
        const last = get().getLatestWeight();
        return checkWeightAnomaly(weight, last);
      },

      logWeight: (dateKey, weight) => {
        const validation = validateWeight(weight);
        if (!validation.valid) {
          toast.error(validation.error);
          return;
        }
        const validWeight = validation.value;

        set((state) => ({
          weightLog: { ...state.weightLog, [dateKey]: validWeight },
        }));
        get()._queueSync(dateKey);
      },

      removeWeight: (dateKey) => {
        set((state) => {
          const newLog = { ...state.weightLog };
          delete newLog[dateKey];
          return { weightLog: newLog };
        });
        get()._queueSync(dateKey);
      },

      _queueSync: (dateKey) => {
        const userId = useAppStore.getState().userId;
        if (!userId) return;
        set((state) => ({ dirty: { ...state.dirty, [dateKey]: userId } }));

        if (get()._syncTimer) clearTimeout(get()._syncTimer);
        const timer = setTimeout(() => { get()._flushSyncs(); }, 600);
        set({ _syncTimer: timer });
      },

      _flushSyncs: async () => {
        if (get()._syncTimer) clearTimeout(get()._syncTimer);
        set({ _syncTimer: null });

        const dirty = get().dirty;
        const entries = Object.entries(dirty);
        if (entries.length === 0) return;

        const weightLog = get().weightLog;
        const results = await Promise.allSettled(entries.map(async ([dateKey, userId]) => {
          if (Object.prototype.hasOwnProperty.call(weightLog, dateKey)) {
            const { error } = await supabase.from('weight_log').upsert({
              user_id: userId,
              date: dateKey,
              weight: weightLog[dateKey],
            }, { onConflict: 'user_id,date' });
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('weight_log')
              .delete()
              .eq('user_id', userId)
              .eq('date', dateKey);
            if (error) throw error;
          }
          return dateKey;
        }));

        let failedCount = 0;
        set((state) => {
          const newDirty = { ...state.dirty };
          results.forEach((result, i) => {
            const [dateKey] = entries[i];
            if (result.status === 'fulfilled') delete newDirty[dateKey];
            else { failedCount++; console.error('Weight sync failed', dateKey, result.reason); }
          });
          return { dirty: newDirty };
        });

        if (failedCount > 0) {
          toast.error('Failed to save weight — will retry automatically');
        }
      },

      getWeightForDate: (dateKey) => {
        return get().weightLog[dateKey] ?? null;
      },

      getWeightTrend: (days) => {
        const log = get().weightLog;
        const keys = get()._getSortedKeysAsc();
        const trend = keys.map((date) => ({ date, weight: log[date] }));
        if (days && days > 0) {
          return trend.slice(-days);
        }
        return trend;
      },

      getLatestWeight: () => {
        const keys = get()._getSortedKeysDesc();
        if (keys.length === 0) return null;
        return get().weightLog[keys[0]];
      },

      // Wipes all local weight state — used on sign-out so the next person
      // on this device doesn't see the previous account's weight log.
      clearAll: () => {
        const timer = get()._syncTimer;
        if (timer) clearTimeout(timer);
        set({ weightLog: {}, dirty: {}, _syncTimer: null });
      }
    }),
    {
      name: 'kcal-weight',
      partialize: (state) => ({ weightLog: state.weightLog, dirty: state.dirty }),
    }
  )
);

registerFlusher(() => useWeightStore.getState()._flushSyncs());
