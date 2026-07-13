import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Plus } from 'lucide-react';
import { useExerciseStore } from '../../store/useExerciseStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { EXERCISE_CATEGORIES, POPULAR_EXERCISE_KEYS } from '../../data/exercises';
import { matchScore, fuzzyMatches } from '../../utils/search';
import { triggerHaptic } from '../../utils/haptics';
import { useSheetA11y } from '../../hooks/useSheetA11y';

const MAX_RESULTS = 40;

/**
 * Exercise picker — the FoodSearchSheet pattern applied to the exercise
 * library: relevance-ranked search with typo-tolerant fallback, category
 * chips, and a "For You" shortlist from workout history (popular defaults
 * for new users). Tapping a row calls onPick(exerciseKey).
 */
export default function ExerciseSearchSheet({ onClose, onPick }) {
  const sheetRef = useSheetA11y(onClose);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const customExercises = useExerciseStore((s) => s.customExercises);
  const getFullExerciseDB = useExerciseStore((s) => s.getFullExerciseDB);
  const getForYouExercises = useExerciseStore((s) => s.getForYouExercises);
  const sessions = useWorkoutStore((s) => s.sessions);
  // customExercises is a real dependency read inside getFullExerciseDB().
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const db = useMemo(() => getFullExerciseDB(), [customExercises, getFullExerciseDB]);

  const filtered = useMemo(() => {
    let entries = Object.entries(db);
    if (activeCategory !== 'all') {
      entries = entries.filter(([, ex]) => ex.category === activeCategory);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      let scored = entries
        .filter(([, ex]) => ex.name.toLowerCase().includes(q))
        .map(([id, ex]) => [id, ex, matchScore(ex.name.toLowerCase(), q)]);
      if (scored.length === 0 && q.length >= 3) {
        scored = entries
          .filter(([, ex]) => fuzzyMatches(ex.name.toLowerCase(), q))
          .map(([id, ex]) => [id, ex, 3]);
      }
      return scored
        .sort((a, b) => a[2] - b[2] || a[1].name.length - b[1].name.length)
        .slice(0, MAX_RESULTS)
        .map(([id, ex]) => [id, ex]);
    }
    if (activeCategory === 'all') {
      const forYou = getForYouExercises(sessions, 12);
      const seedIds = forYou.length > 0 ? forYou : POPULAR_EXERCISE_KEYS;
      const seedSet = new Set(seedIds);
      const seed = seedIds.map((id) => [id, db[id]]).filter((e) => e[1]);
      const rest = entries.filter(([id]) => !seedSet.has(id));
      return [...seed, ...rest].slice(0, MAX_RESULTS);
    }
    return entries.slice(0, MAX_RESULTS);
  }, [db, search, activeCategory, sessions, getForYouExercises]);

  const hasHistory = getForYouExercises(sessions, 1).length > 0;
  const showHeader = !search.trim() && activeCategory === 'all';

  return (
    <motion.div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label="Add exercise"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      className="fixed inset-0 bg-[#F0F1EE] dark:bg-[#0A0A0C] z-[60] flex flex-col"
    >
      <div className="px-6 pt-16 pb-4 bg-white/90 dark:bg-[#141416]/90 backdrop-blur-xl z-20 border-b border-gray-100 dark:border-[#1f1f23] rounded-b-[32px] shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-3xl font-black tracking-tighter">Add Exercise</h2>
          <button
            onClick={() => { triggerHaptic('light'); onClose(); }}
            aria-label="Close exercise picker"
            className="p-3 bg-gray-50 dark:bg-[#0A0A0C] rounded-full text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises (Bench, Squat...)"
            aria-label="Search exercises"
            className="w-full bg-gray-50 dark:bg-[#0A0A0C] rounded-[20px] pl-12 pr-4 py-4 font-bold text-base outline-none border border-transparent focus:border-gray-200 dark:focus:border-[#1f1f23] transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
          <button
            onClick={() => { triggerHaptic('light'); setActiveCategory('all'); }}
            aria-pressed={activeCategory === 'all'}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-colors border ${activeCategory === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-[#141416] text-gray-500 border-gray-100 dark:border-[#1f1f23]'}`}
          >
            All
          </button>
          {Object.entries(EXERCISE_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => { triggerHaptic('light'); setActiveCategory(key); }}
              aria-pressed={activeCategory === key}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-colors border ${activeCategory === key ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-[#141416] text-gray-500 border-gray-100 dark:border-[#1f1f23]'}`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32">
        {showHeader && (
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
            {hasHistory ? 'For You' : 'Popular'}
          </p>
        )}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-bold text-sm">No exercises found</div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(([key, ex]) => {
              const emoji = EXERCISE_CATEGORIES[ex.category]?.emoji || '🏋️';
              return (
                <button
                  key={key}
                  onClick={() => { triggerHaptic('success'); onPick(key); }}
                  aria-label={`Add ${ex.name}`}
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-[20px] bg-white dark:bg-[#141416] border border-gray-100 dark:border-[#1f1f23] shadow-sm text-left hover:border-gray-200 dark:hover:border-gray-800 active:scale-[0.99] transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="text-xl bg-gray-50 dark:bg-[#0A0A0C] w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0">{emoji}</div>
                    <div className="min-w-0">
                      <p className="font-bold text-[15px] truncate">{ex.name}</p>
                      <p className="text-[11px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider truncate">
                        {(ex.primary || []).join(', ')}{ex.equipment && ex.equipment !== 'none' ? ` · ${ex.equipment}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="w-9 h-9 shrink-0 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-500 flex items-center justify-center">
                    <Plus size={17} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
