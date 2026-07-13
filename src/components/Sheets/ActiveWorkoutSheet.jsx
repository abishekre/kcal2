import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Trash2, Check, Timer, Flame, Trophy, Dumbbell, X } from 'lucide-react';
import { useActiveWorkoutStore } from '../../store/useActiveWorkoutStore';
import { useExerciseStore } from '../../store/useExerciseStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useAppStore } from '../../store/useAppStore';
import { estimateSessionCalories, sessionVolume } from '../../engine/workoutCalories';
import { EXERCISE_CATEGORIES } from '../../data/exercises';
import { kgToLbs, lbsToKg, weightUnit } from '../../utils/units';
import { triggerHaptic } from '../../utils/haptics';
import { toast } from '../../lib/toast';
import ExerciseSearchSheet from './ExerciseSearchSheet';

const formatClock = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
};

/** Numeric input with a free-typing buffer; commits (≥0, ≤9999) on blur. */
function BufInput({ value, onCommit, integer = false, ariaLabel, className, placeholder }) {
  const [buf, setBuf] = useState(null);
  const shown = buf === null ? (value || value === 0 ? String(value) : '') : buf;
  return (
    <input
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      value={shown}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
      onFocus={() => setBuf(String(value ?? ''))}
      onChange={(e) => setBuf(e.target.value.replace(/[^0-9.]/g, ''))}
      onBlur={() => {
        if (buf !== null && buf.trim() !== '') {
          const n = Number(buf);
          if (!Number.isNaN(n)) {
            const v = Math.max(0, Math.min(9999, integer ? Math.round(n) : Math.round(n * 10) / 10));
            onCommit(v);
          }
        }
        setBuf(null);
      }}
    />
  );
}

function SetRow({ index, set, unitSystem, onPatch, onToggle, onRemove }) {
  const toDisp = (kg) => (unitSystem === 'imperial' ? Math.round(kgToLbs(kg) * 10) / 10 : kg);
  const toKg = (v) => (unitSystem === 'imperial' ? Math.round(lbsToKg(v) * 10) / 10 : v);
  return (
    <div className={`flex items-center gap-2 py-1.5 rounded-[12px] px-1 transition-colors ${set.done ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''}`}>
      <button
        onClick={() => { triggerHaptic('light'); onPatch({ isWarmup: !set.isWarmup }); }}
        aria-label={set.isWarmup ? `Set ${index + 1}: warmup — tap for working set` : `Set ${index + 1} — tap to mark warmup`}
        className={`w-8 h-8 shrink-0 rounded-[10px] text-[12px] font-black flex items-center justify-center ${set.isWarmup ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}
      >
        {set.isWarmup ? 'W' : index + 1}
      </button>
      <BufInput
        value={toDisp(set.weight)}
        onCommit={(v) => onPatch({ weight: toKg(v) })}
        ariaLabel={`Set ${index + 1} weight`}
        placeholder="0"
        className="flex-1 min-w-0 bg-gray-50 dark:bg-[#0A0A0C] rounded-[10px] py-2 text-center font-bold text-[15px] tabular-nums outline-none border border-transparent focus:border-violet-300 dark:focus:border-violet-500/40"
      />
      <BufInput
        value={set.reps}
        integer
        onCommit={(v) => onPatch({ reps: v })}
        ariaLabel={`Set ${index + 1} reps`}
        placeholder="0"
        className="flex-1 min-w-0 bg-gray-50 dark:bg-[#0A0A0C] rounded-[10px] py-2 text-center font-bold text-[15px] tabular-nums outline-none border border-transparent focus:border-violet-300 dark:focus:border-violet-500/40"
      />
      <button
        onClick={() => { triggerHaptic(set.done ? 'light' : 'success'); onToggle(); }}
        aria-label={set.done ? `Mark set ${index + 1} not done` : `Complete set ${index + 1}`}
        className={`w-9 h-8 shrink-0 rounded-[10px] flex items-center justify-center transition-colors ${set.done ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}
      >
        <Check size={16} strokeWidth={3} />
      </button>
      <button
        onClick={() => { triggerHaptic('light'); onRemove(); }}
        aria-label={`Remove set ${index + 1}`}
        className="w-7 h-8 shrink-0 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function EntryCard({ entry, exercise, unitSystem }) {
  const updateSet = useActiveWorkoutStore((s) => s.updateSet);
  const toggleSetDone = useActiveWorkoutStore((s) => s.toggleSetDone);
  const removeSet = useActiveWorkoutStore((s) => s.removeSet);
  const addSet = useActiveWorkoutStore((s) => s.addSet);
  const removeEntry = useActiveWorkoutStore((s) => s.removeEntry);
  const setCardio = useActiveWorkoutStore((s) => s.setCardio);
  const wu = weightUnit(unitSystem);

  if (!exercise) return null;
  const emoji = EXERCISE_CATEGORIES[exercise.category]?.emoji || '🏋️';

  return (
    <div className="bg-white dark:bg-[#141416] rounded-[24px] p-4 shadow-sm border border-gray-100 dark:border-[#1f1f23]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl shrink-0" aria-hidden="true">{emoji}</span>
          <div className="min-w-0">
            <p className="font-black text-[15px] tracking-tight truncate text-violet-600 dark:text-violet-400">{exercise.name}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{(exercise.primary || []).join(', ')}</p>
          </div>
        </div>
        <button
          onClick={() => { triggerHaptic('medium'); removeEntry(entry.id); }}
          aria-label={`Remove ${exercise.name}`}
          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {entry.type === 'strength' ? (
        <>
          <div className="flex items-center gap-2 px-1 mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <span className="w-8 text-center">Set</span>
            <span className="flex-1 text-center">{wu}</span>
            <span className="flex-1 text-center">Reps</span>
            <span className="w-9 text-center">✓</span>
            <span className="w-7" />
          </div>
          {entry.sets.map((s, i) => (
            <SetRow
              key={i}
              index={i}
              set={s}
              unitSystem={unitSystem}
              onPatch={(patch) => updateSet(entry.id, i, patch)}
              onToggle={() => toggleSetDone(entry.id, i)}
              onRemove={() => removeSet(entry.id, i)}
            />
          ))}
          <button
            onClick={() => { triggerHaptic('light'); addSet(entry.id); }}
            className="w-full mt-2 py-2.5 rounded-[14px] border-[1.5px] border-dashed border-gray-200 dark:border-[#2c2c2e] text-gray-400 font-bold text-[13px] flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Plus size={14} /> Add Set
          </button>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 px-1">Minutes</label>
            <BufInput
              integer
              value={Math.round((entry.durationSeconds || 0) / 60)}
              onCommit={(v) => setCardio(entry.id, { durationSeconds: v * 60 })}
              ariaLabel={`${exercise.name} duration in minutes`}
              placeholder="0"
              className="w-full bg-gray-50 dark:bg-[#0A0A0C] rounded-[12px] py-3 text-center font-bold text-[16px] tabular-nums outline-none border border-transparent focus:border-violet-300"
            />
          </div>
          {exercise.tracksDistance && (
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 px-1">Distance (km)</label>
              <BufInput
                value={Math.round(((entry.distanceM || 0) / 1000) * 100) / 100}
                onCommit={(v) => setCardio(entry.id, { distanceM: Math.round(v * 1000) })}
                ariaLabel={`${exercise.name} distance in kilometers`}
                placeholder="0"
                className="w-full bg-gray-50 dark:bg-[#0A0A0C] rounded-[12px] py-3 text-center font-bold text-[16px] tabular-nums outline-none border border-transparent focus:border-violet-300"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Full-screen live workout: elapsed timer, per-exercise set logging with
 * prefilled previous values, auto rest timer, live volume/burn stats, and a
 * finish summary with estimated calories and PR callouts.
 */
export default function ActiveWorkoutSheet({ onClose }) {
  const active = useActiveWorkoutStore((s) => s.active);
  const rest = useActiveWorkoutStore((s) => s.rest);
  const addExercise = useActiveWorkoutStore((s) => s.addExercise);
  const adjustRest = useActiveWorkoutStore((s) => s.adjustRest);
  const stopRest = useActiveWorkoutStore((s) => s.stopRest);
  const finishWorkout = useActiveWorkoutStore((s) => s.finishWorkout);
  const cancelWorkout = useActiveWorkoutStore((s) => s.cancelWorkout);
  const saveRoutine = useWorkoutStore((s) => s.saveRoutine);

  const customExercises = useExerciseStore((s) => s.customExercises);
  const getFullExerciseDB = useExerciseStore((s) => s.getFullExerciseDB);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const db = useMemo(() => getFullExerciseDB(), [customExercises, getFullExerciseDB]);

  const unitSystem = useAppStore((s) => s.unitSystem);
  const weightKg = useAppStore((s) => s.profile.weight) || 70;

  const [now, setNow] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [summary, setSummary] = useState(null); // { session, prs, capped }
  const [routineName, setRoutineName] = useState('');
  const [routineSaved, setRoutineSaved] = useState(false);

  useEffect(() => {
    // First tick is deferred (not sync in the effect body) per react-compiler.
    const t0 = setTimeout(() => setNow(Date.now()), 0);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, []);

  const elapsed = active && now ? Math.max(0, Math.floor((now - active.startedAt) / 1000)) : 0;
  const restRemaining = rest && now ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0;

  const liveStats = useMemo(() => {
    if (!active) return { volume: 0, kcal: 0, doneSets: 0 };
    const doneSets = active.entries.reduce(
      (n, e) => n + (e.sets || []).filter((s) => s.done && !s.isWarmup).length, 0);
    const { total } = estimateSessionCalories(
      { entries: active.entries },
      { weightKg, exerciseDB: db, elapsedSeconds: Math.max(1, elapsed) }
    );
    return { volume: sessionVolume(active), kcal: total, doneSets };
  }, [active, db, weightKg, elapsed]);

  const handleFinish = () => {
    const hasWork = active?.entries.some((e) =>
      e.type === 'strength' ? e.sets.some((s) => s.done) : (e.durationSeconds || 0) > 0);
    if (!hasWork) {
      triggerHaptic('error');
      toast.warning('Complete at least one set (or log a duration) first');
      return;
    }
    triggerHaptic('heavy');
    const result = finishWorkout();
    if (result) {
      setSummary(result);
      if (result.prs.length > 0) triggerHaptic('success');
    }
  };

  const handleCancel = () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      setTimeout(() => setConfirmCancel(false), 4000);
      return;
    }
    triggerHaptic('heavy');
    cancelWorkout();
    onClose();
  };

  // ── Finished: summary screen ──
  if (summary) {
    const { session, prs, capped } = summary;
    const durationSecs = Math.round((session.endedAt - session.startedAt) / 1000);
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-[#F0F1EE] dark:bg-[#0A0A0C] z-50 flex flex-col overflow-y-auto" role="dialog" aria-modal="true" aria-label="Workout summary">
        <div className="max-w-md mx-auto w-full px-6 pt-20 pb-16">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center mb-8">
            <div className="text-5xl mb-3">💪</div>
            <h2 className="text-3xl font-black tracking-tighter">Workout Complete</h2>
            <p className="text-gray-400 font-bold text-sm mt-1">{session.name}</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px]">
              <div className="flex items-center gap-2 mb-1"><Timer size={14} className="text-violet-500" /><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Duration</span></div>
              <span className="text-[26px] font-black tabular-nums">{formatClock(durationSecs)}</span>
            </div>
            <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px]">
              <div className="flex items-center gap-2 mb-1"><Flame size={14} className="text-orange-500" /><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Est. Burn</span></div>
              <span className="text-[26px] font-black tabular-nums">{session.caloriesBurned}<span className="text-[13px] text-gray-400 ml-1">kcal</span></span>
            </div>
            <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px]">
              <div className="flex items-center gap-2 mb-1"><Dumbbell size={14} className="text-emerald-500" /><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Volume</span></div>
              <span className="text-[26px] font-black tabular-nums">{sessionVolume(session)}<span className="text-[13px] text-gray-400 ml-1">kg</span></span>
            </div>
            <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px]">
              <div className="flex items-center gap-2 mb-1"><Check size={14} className="text-blue-500" /><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Exercises</span></div>
              <span className="text-[26px] font-black tabular-nums">{session.entries.length}</span>
            </div>
          </div>

          {prs.length > 0 && (
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-5 rounded-[24px] mb-4">
              <div className="flex items-center gap-2 mb-3"><Trophy size={16} className="text-amber-500" /><span className="font-black text-amber-800 dark:text-amber-300">New PRs! 🎉</span></div>
              {prs.map((pr, i) => (
                <p key={i} className="text-[13px] font-bold text-amber-800 dark:text-amber-300">
                  {db[pr.exerciseKey]?.name || pr.exerciseKey}: {pr.kind === 'weight' ? `${pr.value} kg (prev ${pr.previous})` : `${pr.value} kg set volume (prev ${pr.previous})`}
                </p>
              ))}
            </motion.div>
          )}

          {capped && (
            <p className="text-[12px] font-medium text-amber-600 dark:text-amber-400 mb-4 text-center">
              Burn estimate was capped — double-check your durations.
            </p>
          )}

          <div className="bg-white dark:bg-[#141416] p-4 rounded-[20px] mb-4">
            {routineSaved ? (
              <p className="text-center text-emerald-600 dark:text-emerald-400 font-bold text-sm py-1">Saved as routine ✓</p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  placeholder="Save as routine (e.g. Push Day)"
                  aria-label="Routine name"
                  className="flex-1 bg-gray-50 dark:bg-[#0A0A0C] px-4 py-3 rounded-[14px] font-bold text-sm outline-none"
                />
                <button
                  onClick={() => {
                    if (!routineName.trim()) return;
                    saveRoutine(routineName.trim(), session.entries);
                    setRoutineSaved(true);
                  }}
                  disabled={!routineName.trim()}
                  className="px-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[14px] font-bold text-sm disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => { triggerHaptic('light'); onClose(); }}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-5 rounded-[24px] font-black"
          >
            Done
          </button>
          <p className="text-center text-[11px] text-gray-400 mt-3">Burn is an estimate (MET × body weight × active time).</p>
        </div>
      </motion.div>
    );
  }

  if (!active) return null;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-[#F0F1EE] dark:bg-[#0A0A0C] z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Active workout: ${active.name}`}
    >
      {/* Header */}
      <div className="px-6 pt-14 pb-4 bg-white/90 dark:bg-[#141416]/90 backdrop-blur-xl z-20 border-b border-gray-100 dark:border-[#1f1f23] rounded-b-[28px] shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => { triggerHaptic('light'); onClose(); }}
            aria-label="Minimize workout (keeps running)"
            className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#0A0A0C] flex items-center justify-center text-gray-500"
          >
            <ChevronDown size={20} />
          </button>
          <div className="text-center">
            <p className="font-black text-[16px] tracking-tight leading-none">{active.name}</p>
            <p className="text-[20px] font-black tabular-nums text-violet-600 dark:text-violet-400 mt-1">{formatClock(elapsed)}</p>
          </div>
          <button
            onClick={handleFinish}
            className="px-5 py-2.5 bg-emerald-500 text-white rounded-full font-black text-sm shadow-sm shadow-emerald-500/30 active:scale-95 transition-transform"
          >
            Finish
          </button>
        </div>
        <div className="flex justify-center gap-5 text-[11px] font-bold text-gray-400 tabular-nums">
          <span>{liveStats.doneSets} sets</span>
          <span>{liveStats.volume} kg volume</span>
          <span>~{liveStats.kcal} kcal</span>
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-44 space-y-3">
        {active.entries.length === 0 && (
          <div className="text-center py-14">
            <div className="text-4xl mb-3">🏋️</div>
            <p className="font-bold text-gray-500 dark:text-gray-400 text-sm">Add your first exercise to get going</p>
          </div>
        )}
        {active.entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} exercise={db[entry.exerciseKey]} unitSystem={unitSystem} />
        ))}

        <button
          onClick={() => { triggerHaptic('light'); setShowPicker(true); }}
          className="w-full py-4 rounded-[20px] bg-violet-500 text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 active:scale-[0.99] transition-transform"
        >
          <Plus size={18} /> Add Exercise
        </button>
        <button
          onClick={handleCancel}
          className={`w-full py-3.5 rounded-[18px] font-bold text-[13px] transition-colors ${confirmCancel ? 'bg-red-500 text-white' : 'text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
        >
          {confirmCancel ? 'Tap again to discard this workout' : 'Cancel Workout'}
        </button>
      </div>

      {/* Rest timer bar */}
      <AnimatePresence>
        {restRemaining > 0 && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-[max(env(safe-area-inset-bottom),16px)]"
          >
            <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[22px] p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-bold text-sm"><Timer size={15} /> Rest</span>
                <span className="font-black text-[22px] tabular-nums">{formatClock(restRemaining)}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => { triggerHaptic('light'); adjustRest(-15); }} aria-label="15 seconds less rest" className="px-2.5 py-1.5 rounded-[10px] bg-white/15 dark:bg-black/10 font-bold text-xs">−15</button>
                  <button onClick={() => { triggerHaptic('light'); adjustRest(15); }} aria-label="15 seconds more rest" className="px-2.5 py-1.5 rounded-[10px] bg-white/15 dark:bg-black/10 font-bold text-xs">+15</button>
                  <button onClick={() => { triggerHaptic('light'); stopRest(); }} aria-label="Skip rest" className="px-2.5 py-1.5 rounded-[10px] bg-white/15 dark:bg-black/10 font-bold text-xs">Skip</button>
                </div>
              </div>
              <div className="h-1.5 bg-white/20 dark:bg-black/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-400 rounded-full transition-[width] duration-1000 ease-linear"
                  style={{ width: `${rest?.total ? (restRemaining / rest.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise picker */}
      <AnimatePresence>
        {showPicker && (
          <ExerciseSearchSheet
            onClose={() => setShowPicker(false)}
            onPick={(key) => { addExercise(key); setShowPicker(false); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
