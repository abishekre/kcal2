// In-progress workout — persisted so a reload/tab-close never loses a session
// (elapsed + rest countdown recompute from timestamps, like the fasting timer).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import { useWorkoutStore } from './useWorkoutStore.js';
import { useExerciseStore } from './useExerciseStore.js';
import { useAppStore } from './useAppStore.js';
import { estimateSessionCalories, detectPRs } from '../engine/workoutCalories';
import { DEFAULT_REST_SECONDS } from '../utils/constants';

const newSet = (prefill) => ({
  weight: prefill?.weight ?? 0,
  reps: prefill?.reps ?? 0,
  isWarmup: false,
  done: false,
});

export const useActiveWorkoutStore = create(
  persist(
    (set, get) => ({
      // active: null | { id, name, startedAt, entries: [{ id, exerciseKey,
      //   type, sets, durationSeconds, distanceM }] }
      active: null,
      // rest: null | { endsAt, total } — timestamps so it survives reload.
      rest: null,

      startWorkout: (name) => {
        if (get().active) return; // never clobber an in-progress session
        set({
          active: {
            id: crypto.randomUUID(),
            name: name || 'Workout',
            startedAt: Date.now(),
            entries: [],
          },
          rest: null,
        });
      },

      startFromRoutine: (routineId) => {
        if (get().active) return;
        const routine = useWorkoutStore.getState().routines[routineId];
        if (!routine) return;
        set({
          active: {
            id: crypto.randomUUID(),
            name: routine.name,
            startedAt: Date.now(),
            // Fresh entry ids so edits never alias the stored routine.
            entries: routine.entries.map((e) => ({ ...e, id: crypto.randomUUID() })),
          },
          rest: null,
        });
      },

      addExercise: (exerciseKey) => {
        const active = get().active;
        if (!active) return;
        const db = useExerciseStore.getState().getFullExerciseDB();
        const ex = db[exerciseKey];
        if (!ex) return;
        const last = useExerciseStore.getState().getLast(exerciseKey);
        const entry = {
          id: crypto.randomUUID(),
          exerciseKey,
          type: ex.type,
          sets: ex.type === 'strength' ? [newSet(last)] : [],
          durationSeconds: ex.type !== 'strength' ? (last?.durationSeconds ?? 0) : 0,
          distanceM: 0,
        };
        set({ active: { ...active, entries: [...active.entries, entry] } });
      },

      removeEntry: (entryId) => {
        const active = get().active;
        if (!active) return;
        set({ active: { ...active, entries: active.entries.filter((e) => e.id !== entryId) } });
      },

      _updateEntry: (entryId, updater) => {
        const active = get().active;
        if (!active) return;
        set({
          active: {
            ...active,
            entries: active.entries.map((e) => (e.id === entryId ? updater(e) : e)),
          },
        });
      },

      addSet: (entryId) => {
        get()._updateEntry(entryId, (e) => {
          const prev = e.sets[e.sets.length - 1];
          return { ...e, sets: [...e.sets, newSet(prev)] };
        });
      },

      updateSet: (entryId, setIdx, patch) => {
        get()._updateEntry(entryId, (e) => ({
          ...e,
          sets: e.sets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s)),
        }));
      },

      removeSet: (entryId, setIdx) => {
        get()._updateEntry(entryId, (e) => ({
          ...e,
          sets: e.sets.filter((_, i) => i !== setIdx),
        }));
      },

      toggleSetDone: (entryId, setIdx) => {
        let becameDone = false;
        get()._updateEntry(entryId, (e) => ({
          ...e,
          sets: e.sets.map((s, i) => {
            if (i !== setIdx) return s;
            becameDone = !s.done;
            return { ...s, done: !s.done };
          }),
        }));
        // Completing a set auto-starts the rest countdown.
        if (becameDone) get().startRest(DEFAULT_REST_SECONDS);
        else set({ rest: null });
      },

      setCardio: (entryId, { durationSeconds, distanceM }) => {
        get()._updateEntry(entryId, (e) => ({
          ...e,
          durationSeconds: durationSeconds ?? e.durationSeconds,
          distanceM: distanceM ?? e.distanceM,
        }));
      },

      // ── Rest timer (timestamps → survives reload) ──
      startRest: (seconds) => set({ rest: { endsAt: Date.now() + seconds * 1000, total: seconds } }),
      adjustRest: (deltaSeconds) => {
        const rest = get().rest;
        if (!rest) return;
        const endsAt = Math.max(Date.now(), rest.endsAt + deltaSeconds * 1000);
        set({ rest: { ...rest, endsAt, total: Math.max(1, rest.total + deltaSeconds) } });
      },
      stopRest: () => set({ rest: null }),
      getRestRemaining: () => {
        const rest = get().rest;
        if (!rest) return 0;
        return Math.max(0, Math.ceil((rest.endsAt - Date.now()) / 1000));
      },

      getElapsedSeconds: () => {
        const active = get().active;
        return active ? Math.max(0, Math.floor((Date.now() - active.startedAt) / 1000)) : 0;
      },

      /**
       * Finalizes the session: computes estimated burn (using current body
       * weight), detects PRs vs history, saves to the workout store, remembers
       * last-used values per exercise, clears the active state.
       * Returns { session, prs, capped }.
       */
      finishWorkout: () => {
        const active = get().active;
        if (!active) return null;

        const endedAt = Date.now();
        const elapsedSeconds = Math.max(1, Math.floor((endedAt - active.startedAt) / 1000));
        const weightKg = useAppStore.getState().profile.weight || 70;
        const exerciseDB = useExerciseStore.getState().getFullExerciseDB();

        // Keep entries that actually have work in them.
        const entries = active.entries.filter((e) =>
          e.type === 'strength'
            ? e.sets.some((s) => s.done)
            : (e.durationSeconds || 0) > 0
        );

        const { total, capped } = estimateSessionCalories(
          { entries },
          { weightKg, exerciseDB, elapsedSeconds }
        );

        const session = {
          id: active.id,
          date: format(new Date(active.startedAt), 'yyyy-MM-dd'),
          name: active.name,
          startedAt: active.startedAt,
          endedAt,
          entries,
          caloriesBurned: total,
        };

        const history = Object.values(useWorkoutStore.getState().sessions);
        const prs = detectPRs(session, history);

        useWorkoutStore.getState().saveSession(session);

        // Remember last-used values so next time prefills correctly.
        const remember = useExerciseStore.getState().rememberLast;
        for (const e of entries) {
          if (e.type === 'strength') {
            const lastDone = [...e.sets].reverse().find((s) => s.done);
            if (lastDone) remember(e.exerciseKey, { weight: lastDone.weight, reps: lastDone.reps });
          } else {
            remember(e.exerciseKey, { durationSeconds: e.durationSeconds, distanceM: e.distanceM });
          }
        }

        set({ active: null, rest: null });
        return { session, prs, capped };
      },

      cancelWorkout: () => set({ active: null, rest: null }),
      clearAll: () => set({ active: null, rest: null }),
    }),
    {
      name: 'kcal-active-workout',
      partialize: (state) => ({ active: state.active, rest: state.rest }),
    }
  )
);
