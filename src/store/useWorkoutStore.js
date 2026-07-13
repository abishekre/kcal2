// SUPABASE: Maps to tables 'workout_sessions' and 'workout_routines'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase.js';
import { useAppStore } from './useAppStore.js';
import { toast } from '../lib/toast';
import { registerFlusher } from '../lib/retrySync';

export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      // sessions: { [sessionId]: { id, date, name, startedAt, endedAt,
      //   entries: [...], caloriesBurned } }
      sessions: {},
      routines: {}, // { [routineId]: { name, entries } }
      // dirty: { [sessionId]: userId } — presence in `sessions` decides
      // upsert vs. delete when flushed (same write-ahead pattern as weights).
      dirty: {},
      _syncTimer: null,

      hydrateWorkouts: async (userId) => {
        if (!userId) return;
        try {
          const [sessionsRes, routinesRes] = await Promise.all([
            supabase.from('workout_sessions').select('*').eq('user_id', userId),
            supabase.from('workout_routines').select('*').eq('user_id', userId),
          ]);
          if (sessionsRes.error) {
            console.error('Workout sessions fetch error', sessionsRes.error);
            toast.error('Failed to load workouts');
          }
          if (routinesRes.error) console.error('Routines fetch error', routinesRes.error);

          set((state) => {
            const sessions = { ...state.sessions };
            (sessionsRes.data || []).forEach((row) => {
              if (!state.dirty[row.id]) {
                sessions[row.id] = {
                  id: row.id,
                  date: row.date,
                  name: row.name,
                  startedAt: row.started_at ? new Date(row.started_at).getTime() : null,
                  endedAt: row.ended_at ? new Date(row.ended_at).getTime() : null,
                  entries: row.entries || [],
                  caloriesBurned: row.calories_burned || 0,
                };
              }
            });
            const routines = { ...state.routines };
            (routinesRes.data || []).forEach((row) => {
              routines[row.routine_id] = { name: row.name, entries: row.data?.entries || [] };
            });
            return { sessions, routines };
          });
        } catch (e) {
          console.error('Workout hydrate failed', e);
        }
      },

      _queueSync: (sessionId) => {
        const userId = useAppStore.getState().userId;
        if (!userId) return;
        set((state) => ({ dirty: { ...state.dirty, [sessionId]: userId } }));
        if (get()._syncTimer) clearTimeout(get()._syncTimer);
        const timer = setTimeout(() => { get()._flushSyncs(); }, 800);
        set({ _syncTimer: timer });
      },

      _flushSyncs: async () => {
        if (get()._syncTimer) clearTimeout(get()._syncTimer);
        set({ _syncTimer: null });

        const entries = Object.entries(get().dirty);
        if (entries.length === 0) return;

        const sessions = get().sessions;
        const results = await Promise.allSettled(entries.map(async ([id, userId]) => {
          const s = sessions[id];
          if (s) {
            const { error } = await supabase.from('workout_sessions').upsert({
              id,
              user_id: userId,
              date: s.date,
              name: s.name,
              started_at: s.startedAt ? new Date(s.startedAt).toISOString() : null,
              ended_at: s.endedAt ? new Date(s.endedAt).toISOString() : null,
              entries: s.entries,
              calories_burned: s.caloriesBurned || 0,
            }, { onConflict: 'id' });
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('workout_sessions')
              .delete()
              .eq('id', id)
              .eq('user_id', userId);
            if (error) throw error;
          }
          return id;
        }));

        let failed = 0;
        set((state) => {
          const newDirty = { ...state.dirty };
          results.forEach((r, i) => {
            if (r.status === 'fulfilled') delete newDirty[entries[i][0]];
            else { failed++; console.error('Workout sync failed', entries[i][0], r.reason); }
          });
          return { dirty: newDirty };
        });
        if (failed > 0) toast.error('Failed to save workout — will retry automatically');
      },

      saveSession: (session) => {
        set((state) => ({ sessions: { ...state.sessions, [session.id]: session } }));
        get()._queueSync(session.id);
      },

      deleteSession: (sessionId) => {
        set((state) => {
          const sessions = { ...state.sessions };
          delete sessions[sessionId];
          return { sessions };
        });
        get()._queueSync(sessionId);
      },

      getSessionsForDate: (dateKey) =>
        Object.values(get().sessions).filter((s) => s.date === dateKey),

      // Total estimated kcal burned on a date — the hook for eat-back later.
      getBurnedForDate: (dateKey) =>
        get().getSessionsForDate(dateKey).reduce((sum, s) => sum + (s.caloriesBurned || 0), 0),

      // ── Routines ──
      saveRoutine: (name, entries) => {
        const routineId = `rt_${crypto.randomUUID()}`;
        // Strip per-set done flags so a routine starts fresh.
        const cleaned = entries.map((e) => ({
          ...e,
          sets: (e.sets || []).map((s) => ({ ...s, done: false })),
          durationSeconds: 0,
          distanceM: 0,
        }));
        set((state) => ({ routines: { ...state.routines, [routineId]: { name, entries: cleaned } } }));

        const userId = useAppStore.getState().userId;
        if (userId) {
          supabase.from('workout_routines').upsert({
            user_id: userId,
            routine_id: routineId,
            name,
            data: { entries: cleaned },
          }, { onConflict: 'user_id,routine_id' }).then(({ error }) => {
            if (error) console.error('Failed to save routine', error);
          });
        }
        toast.success(`Routine "${name}" saved`);
        return routineId;
      },

      deleteRoutine: (routineId) => {
        set((state) => {
          const routines = { ...state.routines };
          delete routines[routineId];
          return { routines };
        });
        const userId = useAppStore.getState().userId;
        if (userId) {
          supabase.from('workout_routines').delete()
            .match({ user_id: userId, routine_id: routineId })
            .then(({ error }) => { if (error) console.error('Failed to delete routine', error); });
        }
      },

      clearAll: () => {
        const timer = get()._syncTimer;
        if (timer) clearTimeout(timer);
        set({ sessions: {}, routines: {}, dirty: {}, _syncTimer: null });
      },
    }),
    {
      name: 'kcal-workouts',
      partialize: (state) => ({
        sessions: state.sessions,
        routines: state.routines,
        dirty: state.dirty,
      }),
    }
  )
);

registerFlusher(() => useWorkoutStore.getState()._flushSyncs());
