// SUPABASE: Maps to table 'ledger'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTodayKey, getRelativeYesterdayKey } from '../utils/dates';
import { supabase } from '../lib/supabase.js';
import { useAppStore } from './useAppStore.js';
import { toast } from '../lib/toast';
import { registerFlusher } from '../lib/retrySync';

export const getInitialDayRecord = () => ({
  locked: false,
  meals: {
    morning: {},
    lunch: {},
    eve: {},
    dinner: {}
  }
});

export const useLedgerStore = create(
  persist(
    (set, get) => ({
      ledger: {},
      templates: {},
      customMealConfigs: {},
      // dirty: { [dateKey]: { userId, ts } } — survives reload; a key only
      // leaves this map after a *confirmed* successful Supabase write, and
      // is always flushed under the userId captured when the edit was made
      // (not whoever happens to be logged in when the flush fires).
      dirty: {},
      _syncTimer: null,

      hydrateLedger: async (userId) => {
        if (!userId) return;
        try {
          const [ledgerRes, mealConfigsRes] = await Promise.all([
            supabase.from('ledger').select('*').eq('user_id', userId),
            supabase.from('custom_meal_configs').select('*').eq('user_id', userId)
          ]);

          if (ledgerRes.error) {
            console.error('Ledger fetch error', ledgerRes.error);
            toast.error('Failed to load your food log');
          }
          if (mealConfigsRes.error) {
            console.error('Meal configs fetch error', mealConfigsRes.error);
          }

          // Merge server data with anything still queued locally (e.g. from
          // a previous session that never got a chance to sync) rather than
          // clobbering it outright.
          set((state) => {
            const ledger = { ...state.ledger };
            if (ledgerRes.data) {
              ledgerRes.data.forEach(row => {
                if (!state.dirty[row.date]) {
                  ledger[row.date] = { locked: row.locked, meals: row.meals };
                }
              });
            }

            const customMealConfigs = { ...state.customMealConfigs };
            if (mealConfigsRes.data) {
              mealConfigsRes.data.forEach(row => {
                customMealConfigs[row.meal_key] = {
                  label: row.label,
                  emoji: row.emoji || '🍽️',
                  accent: 'text-gray-500',
                  bg: 'bg-gray-50 dark:bg-gray-500/10',
                  border: 'border-gray-100 dark:border-gray-500/20'
                };
              });
            }

            return { ledger, customMealConfigs };
          });
        } catch (e) {
          console.error('Hydration error', e);
          toast.error('Failed to load food data');
        }
      },

      // Per-date sync queue: marks a dateKey dirty (under the current user)
      // and schedules a debounced flush.
      _queueSync: (dateKey) => {
        const userId = useAppStore.getState().userId;
        if (!userId) return;

        set((state) => ({
          dirty: { ...state.dirty, [dateKey]: { userId, ts: Date.now() } }
        }));

        const state = get();
        if (state._syncTimer) clearTimeout(state._syncTimer);
        const timer = setTimeout(() => {
          get()._flushSyncs();
        }, 1000);
        set({ _syncTimer: timer });
      },

      _flushSyncs: async () => {
        if (get()._syncTimer) {
          clearTimeout(get()._syncTimer);
        }
        set({ _syncTimer: null });

        const dirty = get().dirty;
        const entries = Object.entries(dirty);
        if (entries.length === 0) return;

        const ledger = get().ledger;
        const results = await Promise.allSettled(entries.map(async ([dateKey, { userId }]) => {
          const record = ledger[dateKey] || getInitialDayRecord();
          const { error } = await supabase.from('ledger').upsert({
            user_id: userId,
            date: dateKey,
            meals: record.meals,
            locked: record.locked
          }, { onConflict: 'user_id,date' });
          if (error) throw error;
          return dateKey;
        }));

        let failedCount = 0;
        set((state) => {
          const newDirty = { ...state.dirty };
          results.forEach((result, i) => {
            const [dateKey] = entries[i];
            if (result.status === 'fulfilled') {
              delete newDirty[dateKey];
            } else {
              failedCount++;
              console.error('Failed to sync ledger day', dateKey, result.reason);
            }
          });
          return { dirty: newDirty };
        });

        if (failedCount > 0) {
          toast.error(`Couldn't save ${failedCount} day${failedCount > 1 ? 's' : ''} of changes — will retry automatically`);
        }
      },

      saveTemplate: (name, dateKey) => {
        const record = get().ledger[dateKey];
        if (!record) return;
        const templateId = `tpl_${crypto.randomUUID()}`;
        set((state) => ({
          templates: {
            ...state.templates,
            [templateId]: { name, meals: JSON.parse(JSON.stringify(record.meals)) }
          }
        }));
        toast.success(`Template "${name}" saved`);
      },

      deleteTemplate: (templateId) => {
        set((state) => {
          const newTemplates = { ...state.templates };
          delete newTemplates[templateId];
          return { templates: newTemplates };
        });
        toast.success('Template deleted');
      },

      loadTemplate: (dateKey, templateId) => {
        const template = get().templates[templateId];
        if (!template) return;

        const currentRecord = get().ledger[dateKey] || getInitialDayRecord();
        if (currentRecord.locked) {
          toast.warning('Day is locked. Unlock it first.');
          return;
        }

        set((state) => {
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
              [dateKey]: { ...currentRecord, meals: mergedMeals }
            }
          };
        });
        get()._queueSync(dateKey);
        toast.success(`Loaded "${template.name}"`);
      },

      addMealSlot: (dateKey, label, emoji = '🍽️') => {
        const mealKey = `custom_${crypto.randomUUID().slice(0, 8)}`;
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
                meals: { ...record.meals, [mealKey]: {} }
              }
            }
          };
        });

        const userId = useAppStore.getState().userId;
        if (userId) {
          supabase.from('custom_meal_configs').upsert({
            user_id: userId,
            meal_key: mealKey,
            label,
            emoji
          }, { onConflict: 'user_id,meal_key' }).then(({ error }) => { if (error) console.error('Failed to add custom meal', error); });
        }
        get()._queueSync(dateKey);
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
              [dateKey]: { ...record, meals: newMeals }
            }
          };
        });

        const userId = useAppStore.getState().userId;
        if (userId) {
          supabase.from('custom_meal_configs').delete()
            .match({ user_id: userId, meal_key: mealKey })
            .then(({ error }) => { if (error) console.error('Failed to remove custom meal', error); });
        }
        get()._queueSync(dateKey);
      },

      getRecord: (dateKey) => {
        return get().ledger[dateKey] || getInitialDayRecord();
      },

      getTodayRecord: () => {
        return get().getRecord(getTodayKey());
      },

      // Returns the most recent dateKey (other than `excludeKey`) that has
      // at least one food logged in `mealKey`, or null if none exists.
      getMostRecentMealDate: (excludeKey, mealKey) => {
        const ledger = get().ledger;
        const dates = Object.keys(ledger)
          .filter((d) => d !== excludeKey && d < excludeKey)
          .sort((a, b) => new Date(b) - new Date(a));

        for (const date of dates) {
          const meal = ledger[date]?.meals?.[mealKey];
          if (meal && Object.keys(meal).length > 0) return date;
        }
        return null;
      },

      addFoodToMeal: (dateKey, mealKey, foodId, qty = 1) => {
        const record = get().ledger[dateKey] || getInitialDayRecord();
        if (record.locked) {
          toast.warning('Day is locked. Unlock it first to make changes.');
          return;
        }
        set((state) => {
          const currentRecord = state.ledger[dateKey] || getInitialDayRecord();
          const meal = currentRecord.meals[mealKey] || {};
          return {
            ledger: {
              ...state.ledger,
              [dateKey]: {
                ...currentRecord,
                meals: {
                  ...currentRecord.meals,
                  [mealKey]: { ...meal, [foodId]: (meal[foodId] || 0) + qty }
                }
              }
            }
          };
        });
        get()._queueSync(dateKey);
      },

      removeFoodFromMeal: (dateKey, mealKey, foodId) => {
        const record = get().ledger[dateKey];
        if (record?.locked) {
          toast.warning('Day is locked.');
          return;
        }
        set((state) => {
          const currentRecord = state.ledger[dateKey] || getInitialDayRecord();
          const meal = { ...(currentRecord.meals[mealKey] || {}) };
          delete meal[foodId];
          return {
            ledger: {
              ...state.ledger,
              [dateKey]: {
                ...currentRecord,
                meals: { ...currentRecord.meals, [mealKey]: meal }
              }
            }
          };
        });
        get()._queueSync(dateKey);
      },

      updateQty: (dateKey, mealKey, foodId, newQty) => {
        const record = get().ledger[dateKey];
        if (record?.locked) {
          toast.warning('Day is locked.');
          return;
        }
        set((state) => {
          const currentRecord = state.ledger[dateKey] || getInitialDayRecord();
          const meal = { ...(currentRecord.meals[mealKey] || {}) };
          if (newQty <= 0) {
            delete meal[foodId];
          } else {
            meal[foodId] = newQty;
          }
          return {
            ledger: {
              ...state.ledger,
              [dateKey]: {
                ...currentRecord,
                meals: { ...currentRecord.meals, [mealKey]: meal }
              }
            }
          };
        });
        get()._queueSync(dateKey);
      },

      dittoYesterday: (dateKey, mealKey) => {
        const record = get().ledger[dateKey] || getInitialDayRecord();
        if (record.locked) {
          toast.warning('Day is locked.');
          return;
        }

        const yesterdayRecord = get().ledger[getRelativeYesterdayKey(dateKey)];
        if (!yesterdayRecord) {
          toast.info('No data from yesterday to copy');
          return;
        }

        const targetMeals = mealKey
          ? { [mealKey]: yesterdayRecord.meals[mealKey] || {} }
          : yesterdayRecord.meals;

        // Check if there's actually food to copy
        const hasFood = Object.values(targetMeals).some(m => Object.keys(m).length > 0);
        if (!hasFood) {
          toast.info('No food to copy from yesterday');
          return;
        }

        set((state) => {
          const currentRecord = state.ledger[dateKey] || getInitialDayRecord();
          return {
            ledger: {
              ...state.ledger,
              [dateKey]: {
                ...currentRecord,
                meals: {
                  ...currentRecord.meals,
                  ...JSON.parse(JSON.stringify(targetMeals))
                }
              }
            }
          };
        });
        get()._queueSync(dateKey);
        toast.success('Copied from yesterday ✓');
      },

      // Repeats the most recent day that had food logged in `mealKey`
      // (not strictly yesterday) — the one-tap "repeat last meal" shortcut.
      repeatMostRecentMeal: (dateKey, mealKey) => {
        const record = get().ledger[dateKey] || getInitialDayRecord();
        if (record.locked) {
          toast.warning('Day is locked.');
          return;
        }

        const sourceDate = get().getMostRecentMealDate(dateKey, mealKey);
        if (!sourceDate) {
          toast.info('No previous meal to repeat');
          return;
        }

        const sourceMeal = get().ledger[sourceDate].meals[mealKey];
        set((state) => {
          const currentRecord = state.ledger[dateKey] || getInitialDayRecord();
          const meal = { ...(currentRecord.meals[mealKey] || {}) };
          for (const [foodId, qty] of Object.entries(sourceMeal)) {
            meal[foodId] = (meal[foodId] || 0) + qty;
          }
          return {
            ledger: {
              ...state.ledger,
              [dateKey]: {
                ...currentRecord,
                meals: { ...currentRecord.meals, [mealKey]: meal }
              }
            }
          };
        });
        get()._queueSync(dateKey);
        toast.success('Meal repeated ✓');
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
        get()._queueSync(dateKey);
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
        get()._queueSync(dateKey);
      },

      // Wipes all local ledger state — used on sign-out to prevent the next
      // person on this device from seeing the previous account's data.
      clearAll: () => {
        const timer = get()._syncTimer;
        if (timer) clearTimeout(timer);
        set({ ledger: {}, templates: {}, customMealConfigs: {}, dirty: {}, _syncTimer: null });
      }
    }),
    {
      name: 'kcal-ledger',
      partialize: (state) => ({
        ledger: state.ledger,
        templates: state.templates,
        customMealConfigs: state.customMealConfigs,
        dirty: state.dirty,
      }),
    }
  )
);

registerFlusher(() => useLedgerStore.getState()._flushSyncs());
