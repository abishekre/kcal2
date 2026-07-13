import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Zap, Flame, Dumbbell, Timer, Trash2, ChevronRight, FolderOpen } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useActiveWorkoutStore } from '../store/useActiveWorkoutStore';
import { triggerHaptic } from '../utils/haptics';
import { toast } from '../lib/toast';
import ActiveWorkoutSheet from '../components/Sheets/ActiveWorkoutSheet';
import QuickActivitySheet from '../components/Sheets/QuickActivitySheet';

const formatClock = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

function SessionCard({ session, onDelete }) {
  const durationSecs = session.endedAt && session.startedAt
    ? Math.round((session.endedAt - session.startedAt) / 1000) : 0;
  const setCount = session.entries.reduce(
    (n, e) => n + (e.sets || []).filter((s) => s.done && !s.isWarmup).length, 0);

  return (
    <div className="bg-white dark:bg-[#141416] rounded-[20px] p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-black text-[15px] tracking-tight truncate">{session.name}</p>
        <p className="text-[11px] font-bold text-gray-400 mt-0.5 tabular-nums">
          {format(new Date(session.startedAt), 'EEE, MMM d · h:mm a')}
        </p>
        <div className="flex gap-3 mt-1.5 text-[11px] font-bold text-gray-500 tabular-nums">
          {durationSecs > 0 && <span className="flex items-center gap-1"><Timer size={11} /> {formatClock(durationSecs)}</span>}
          {setCount > 0 && <span className="flex items-center gap-1"><Dumbbell size={11} /> {setCount} sets</span>}
          <span className="flex items-center gap-1 text-orange-500"><Flame size={11} /> ~{session.caloriesBurned} kcal</span>
        </div>
      </div>
      <button
        onClick={onDelete}
        aria-label={`Delete workout ${session.name}`}
        className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function WorkoutsPage() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const routines = useWorkoutStore((s) => s.routines);
  const saveSession = useWorkoutStore((s) => s.saveSession);
  const deleteSession = useWorkoutStore((s) => s.deleteSession);
  const deleteRoutine = useWorkoutStore((s) => s.deleteRoutine);

  const active = useActiveWorkoutStore((s) => s.active);
  const startWorkout = useActiveWorkoutStore((s) => s.startWorkout);
  const startFromRoutine = useActiveWorkoutStore((s) => s.startFromRoutine);

  const [showActive, setShowActive] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [confirmRoutineDelete, setConfirmRoutineDelete] = useState(null);
  const [now, setNow] = useState(0);

  // Tick only while a minimized workout banner is visible.
  useEffect(() => {
    if (!active || showActive) return;
    // First tick is deferred (not sync in the effect body) per react-compiler.
    const t0 = setTimeout(() => setNow(Date.now()), 0);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, [active, showActive]);

  const weekStats = useMemo(() => {
    const cutoff = subDays(new Date(), 7).getTime();
    let count = 0, kcal = 0, volume = 0;
    for (const s of Object.values(sessions)) {
      if ((s.startedAt || 0) < cutoff) continue;
      count += 1;
      kcal += s.caloriesBurned || 0;
      for (const e of s.entries || []) {
        for (const set of e.sets || []) {
          if (set.done && !set.isWarmup) volume += (set.weight || 0) * (set.reps || 0);
        }
      }
    }
    return { count, kcal, volume: Math.round(volume) };
  }, [sessions]);

  const history = useMemo(
    () => Object.values(sessions).sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0)).slice(0, 30),
    [sessions]
  );

  const handleDelete = (session) => {
    triggerHaptic('medium');
    deleteSession(session.id);
    toast.undo(`Deleted "${session.name}"`, { onUndo: () => saveSession(session) });
  };

  const activeElapsed = active && now ? Math.max(0, Math.floor((now - active.startedAt) / 1000)) : 0;

  return (
    <div className="min-h-[100dvh] pb-32 px-5 pt-8 max-w-md mx-auto">
      <header className="mb-6">
        <h1 className="text-[28px] font-black tracking-tight text-gray-900 dark:text-white">Workouts</h1>
      </header>

      {/* Resume banner or start CTAs */}
      {active ? (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => { triggerHaptic('medium'); setShowActive(true); }}
          className="w-full bg-violet-500 text-white rounded-[24px] p-5 mb-5 flex items-center justify-between shadow-lg shadow-violet-500/25 active:scale-[0.99] transition-transform"
        >
          <div className="text-left">
            <p className="font-black text-[16px]">{active.name} in progress</p>
            <p className="font-bold text-[13px] opacity-80 tabular-nums mt-0.5">
              {formatClock(activeElapsed)} · {active.entries.length} exercise{active.entries.length !== 1 ? 's' : ''}
            </p>
          </div>
          <span className="flex items-center gap-1 font-black text-sm bg-white/20 px-4 py-2 rounded-full">
            Resume <ChevronRight size={16} />
          </span>
        </motion.button>
      ) : (
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => { triggerHaptic('medium'); startWorkout(); setShowActive(true); }}
            className="flex-[3] bg-violet-500 text-white py-5 rounded-[24px] font-black text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-transform"
          >
            <Play size={18} fill="currentColor" /> Start Workout
          </button>
          <button
            onClick={() => { triggerHaptic('light'); setShowQuick(true); }}
            className="flex-[2] bg-white dark:bg-[#141416] border border-gray-100 dark:border-[#1f1f23] py-5 rounded-[24px] font-black text-[14px] text-violet-600 dark:text-violet-400 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-transform"
          >
            <Zap size={16} /> Quick Log
          </button>
        </div>
      )}

      {/* Routines */}
      {Object.keys(routines).length > 0 && !active && (
        <section className="mb-6">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-gray-400 mb-2.5 px-1 flex items-center gap-1.5">
            <FolderOpen size={12} /> Routines
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-5 px-5">
            {Object.entries(routines).map(([id, r]) => (
              <div key={id} className="shrink-0 flex items-center bg-white dark:bg-[#141416] border border-gray-100 dark:border-[#1f1f23] rounded-full shadow-sm">
                <button
                  onClick={() => { triggerHaptic('medium'); startFromRoutine(id); setShowActive(true); }}
                  className="pl-4 pr-2 py-2.5 font-bold text-sm"
                  aria-label={`Start routine ${r.name}`}
                >
                  {r.name}
                </button>
                <button
                  onClick={() => {
                    if (confirmRoutineDelete === id) {
                      triggerHaptic('heavy');
                      deleteRoutine(id);
                      setConfirmRoutineDelete(null);
                    } else {
                      triggerHaptic('light');
                      setConfirmRoutineDelete(id);
                      setTimeout(() => setConfirmRoutineDelete((c) => (c === id ? null : c)), 3000);
                    }
                  }}
                  aria-label={confirmRoutineDelete === id ? `Confirm delete routine ${r.name}` : `Delete routine ${r.name}`}
                  className={`pr-3 pl-1 py-2.5 text-xs font-bold ${confirmRoutineDelete === id ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'}`}
                >
                  {confirmRoutineDelete === id ? 'Sure?' : '✕'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* This week */}
      <section className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-[#141416] p-4 rounded-[20px] text-center">
          <p className="text-[22px] font-black tabular-nums">{weekStats.count}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Workouts / 7d</p>
        </div>
        <div className="bg-white dark:bg-[#141416] p-4 rounded-[20px] text-center">
          <p className="text-[22px] font-black tabular-nums">{weekStats.volume >= 1000 ? `${(weekStats.volume / 1000).toFixed(1)}t` : weekStats.volume}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Volume kg</p>
        </div>
        <div className="bg-white dark:bg-[#141416] p-4 rounded-[20px] text-center">
          <p className="text-[22px] font-black tabular-nums text-orange-500">{weekStats.kcal}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Est. kcal</p>
        </div>
      </section>

      {/* History */}
      <section>
        <h2 className="text-[12px] font-black uppercase tracking-widest text-gray-400 mb-2.5 px-1">History</h2>
        {history.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="text-4xl mb-3">🏋️</div>
            <p className="font-bold text-gray-500 dark:text-gray-400 text-sm mb-1">No workouts yet</p>
            <p className="text-gray-400 dark:text-gray-600 text-xs">Start your first workout — your history, volume, and calorie burn will show up here.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((s) => (
              <SessionCard key={s.id} session={s} onDelete={() => handleDelete(s)} />
            ))}
          </div>
        )}
      </section>

      {/* Sheets */}
      <AnimatePresence>
        {showActive && <ActiveWorkoutSheet onClose={() => setShowActive(false)} />}
        {showQuick && <QuickActivitySheet onClose={() => setShowQuick(false)} />}
      </AnimatePresence>
    </div>
  );
}
