import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Minus, PlusCircle, Flame, Loader2, Pencil } from 'lucide-react';
import { useFoodStore } from '../../store/useFoodStore';
import { useLedgerStore, getInitialDayRecord } from '../../store/useLedgerStore';
import { useAppStore } from '../../store/useAppStore';
import { FOOD_CATEGORIES, POPULAR_FOOD_KEYS } from '../../data/foods';
import { triggerHaptic } from '../../utils/haptics';
import { toast } from '../../lib/toast';
import { validateQty } from '../../utils/validation';
import debounce from 'lodash/debounce';
import QuickCalsSheet from './QuickCalsSheet';
import { useSheetA11y } from '../../hooks/useSheetA11y';

const MAX_RESULTS = 30;

// Lower is better. A name that *starts with* the query beats a word-boundary
// match, which beats a mid-word substring — so typing "chic" surfaces
// "Chicken…" ahead of "Butter Chicken", instead of raw insertion order.
function matchScore(name, q) {
  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  if (name.includes(` ${q}`)) return 2; // start of a later word
  return 3;
}

// Bounded Levenshtein distance for typo tolerance.
function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

// Typo-tolerant match used only as a fallback when strict substring search
// finds nothing — so "chiken" still surfaces "Chicken Curry". Allows 1 edit
// for short queries, 2 for longer ones, against the whole name or any word.
function fuzzyMatches(name, q) {
  const threshold = q.length <= 4 ? 1 : 2;
  if (levenshtein(name, q) <= threshold) return true;
  for (const word of name.split(/\s+/)) {
    if (levenshtein(word, q) <= threshold) return true;
    if (word.length > q.length && levenshtein(word.slice(0, q.length), q) <= threshold) return true;
  }
  return false;
}

export default function FoodSearchSheet({ mealKey, onClose }) {
  const sheetRef = useSheetA11y(onClose);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showQuickCals, setShowQuickCals] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const selectedDate = useAppStore(state => state.selectedDate);
  const setActiveSheet = useAppStore(state => state.setActiveSheet);
  const setEditingFoodId = useAppStore(state => state.setEditingFoodId);

  const getFullDB = useFoodStore(state => state.getFullDB);
  const getForYouFoods = useFoodStore(state => state.getForYouFoods);
  const getFrequentFoods = useFoodStore(state => state.getFrequentFoods);
  const rememberQty = useFoodStore(state => state.rememberQty);
  const getLastQty = useFoodStore(state => state.getLastQty);
  const customFoods = useFoodStore(state => state.customFoods);
  // customFoods is read inside getFullDB() via the store's get(), not as a
  // literal argument — without it in the deps, a newly-created custom food
  // (or any custom food edit) would silently never appear here because this
  // memo would never recompute. Real (necessary) dependency, not a stale one.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fullDB = useMemo(() => getFullDB(), [customFoods, getFullDB]);

  const addFoodToMeal = useLedgerStore(state => state.addFoodToMeal);
  const ledger = useLedgerStore(state => state.ledger);
  const currentRecord = ledger[selectedDate] || getInitialDayRecord();
  const currentMealFoods = currentRecord.meals[mealKey] || {};

  // Debounced search (300ms)
  const debouncedSetSearch = useMemo(
    () => debounce((val) => {
      setDebouncedSearch(val);
      setIsSearching(false);
    }, 300),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (val.trim()) setIsSearching(true);
    debouncedSetSearch(val);
  };

  // How often the user logs each food — used to break ranking ties so the
  // foods someone actually eats float to the top of both search and browse.
  const freqRank = useMemo(() => {
    const m = new Map();
    getFrequentFoods(ledger, 200).forEach((id, i) => m.set(id, i));
    return m;
  }, [getFrequentFoods, ledger]);

  const filteredFoods = useMemo(() => {
    let entries = Object.entries(fullDB);

    if (activeCategory !== 'all') {
      entries = entries.filter(([, item]) => item.category === activeCategory);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      // Rank matches by relevance, then by how often the user eats them, then
      // by shorter name (a closer overall match) — not raw insertion order.
      let scored = entries
        .filter(([, item]) => item.name.toLowerCase().includes(q))
        .map(([id, item]) => [id, item, matchScore(item.name.toLowerCase(), q)]);
      // Typo tolerance: only if strict substring search found nothing, fall
      // back to fuzzy matching so a misspelling still returns results instead
      // of an empty "no foods found" wall.
      if (scored.length === 0 && q.length >= 3) {
        scored = entries
          .filter(([, item]) => fuzzyMatches(item.name.toLowerCase(), q))
          .map(([id, item]) => [id, item, 3]);
      }
      entries = scored
        .sort((a, b) =>
          a[2] - b[2] ||
          (freqRank.get(a[0]) ?? Infinity) - (freqRank.get(b[0]) ?? Infinity) ||
          a[1].name.length - b[1].name.length
        )
        .slice(0, MAX_RESULTS)
        .map(([id, item]) => [id, item]);
    } else if (activeCategory === 'all') {
      // Empty search: lead with the user's own "for you" shortlist (recent +
      // frequent). A brand-new user has none, so fall back to a curated
      // popular list instead of niche items in DB-insertion order.
      const forYouIds = getForYouFoods(ledger, 15);
      const seedIds = forYouIds.length > 0 ? forYouIds : POPULAR_FOOD_KEYS;
      const seedSet = new Set(seedIds);
      const seedEntries = seedIds.map(id => [id, fullDB[id]]).filter(e => e[1]);
      const otherEntries = entries.filter(([id]) => !seedSet.has(id));
      entries = [...seedEntries, ...otherEntries].slice(0, MAX_RESULTS);
    } else {
      entries = entries.slice(0, MAX_RESULTS);
    }
    return entries;
  }, [debouncedSearch, fullDB, activeCategory, ledger, getForYouFoods, freqRank]);

  const hasHistory = getForYouFoods(ledger, 1).length > 0;
  const showSuggestionHeader = !debouncedSearch.trim() && activeCategory === 'all';
  const suggestionLabel = hasHistory ? 'For You' : 'Popular';

  const [activeFoodKey, setActiveFoodKey] = useState(null);
  const [activeQty, setActiveQty] = useState(1);

  // Tapping a food row is the common case: log it immediately at a sensible
  // default (1 serving, or 100g for gram-based foods), or +1 more if it's
  // already logged — no intermediate "select, then confirm" step. Fine-
  // tuning an exact quantity is a deliberate second action (the pencil/edit
  // affordance), not the default path.
  const handleQuickAdd = (fk, currentQty) => {
    const item = fullDB[fk];
    if (!item) return;
    // Default to the user's usual portion for this food, falling back to a
    // sensible generic (100g for gram foods, else 1 serving).
    const defaultQty = getLastQty(fk) ?? (item.unit === 'g' ? 100 : 1);
    triggerHaptic('success');
    addFoodToMeal(selectedDate, mealKey, fk, defaultQty);
    rememberQty(fk, defaultQty);
    toast.success(currentQty > 0 ? `+${defaultQty} more ${item.name}` : `Added ${item.name}`);
  };

  const handleOpenEditor = (fk, currentQty) => {
    triggerHaptic('light');
    if (activeFoodKey === fk) {
      setActiveFoodKey(null);
    } else {
      setActiveFoodKey(fk);
      setActiveQty(currentQty || getLastQty(fk) || (fullDB[fk]?.unit === 'g' ? 100 : 1));
    }
  };

  const handleCommit = (fk) => {
    // Validate qty before committing
    const validation = validateQty(activeQty);
    if (!validation.valid) {
      toast.warning(validation.error || 'Please enter a valid quantity');
      triggerHaptic('error');
      return;
    }
    triggerHaptic('success');
    addFoodToMeal(selectedDate, mealKey, fk, validation.value);
    rememberQty(fk, validation.value);
    toast.success(`Added to ${mealKey}`);
    // Keep sheet open for multi-food logging — do NOT call onClose()
    setActiveFoodKey(null);
  };

  const handleQuickAddCals = () => {
    setShowQuickCals(true);
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.8 }}
      onDragEnd={(e, info) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
          triggerHaptic('light');
          onClose();
        }
      }}
      className="fixed inset-0 bg-[#F0F1EE] dark:bg-[#0A0A0C] z-50 flex flex-col"
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Add food to ${mealKey}`}
    >
      <div className="px-6 pt-16 pb-4 bg-white/90 dark:bg-[#141416]/90 backdrop-blur-xl z-20 border-b border-gray-100 dark:border-[#1f1f23] rounded-b-[32px] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black tracking-tighter capitalize">Add to {mealKey}</h2>
          <button
            onClick={() => { triggerHaptic('light'); onClose(); }}
            aria-label="Done adding foods"
            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold text-sm shadow-sm hover:scale-105 transition-transform active:scale-95"
          >
            Done
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search foods (Puttu, Chicken...)"
            aria-label="Search foods"
            className="w-full bg-gray-50 dark:bg-[#0A0A0C] rounded-[20px] pl-12 pr-4 py-4 font-bold text-base outline-none border border-transparent focus:border-gray-200 dark:focus:border-[#1f1f23] transition-colors"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setDebouncedSearch(''); setIsSearching(false); debouncedSetSearch.cancel(); }}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-gray-200 dark:bg-[#1f1f23] rounded-full text-gray-500"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
          <button
            onClick={() => { triggerHaptic('light'); setActiveCategory('all'); }}
            aria-label="Show all categories"
            aria-pressed={activeCategory === 'all'}
            className={`flex items-center whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-colors border ${activeCategory === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-[#141416] text-gray-500 border-gray-100 dark:border-[#1f1f23]'}`}
          >
            All
          </button>
          {Object.entries(FOOD_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => { triggerHaptic('light'); setActiveCategory(key); }}
              aria-label={`Filter by ${cat.label}`}
              aria-pressed={activeCategory === key}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-colors border ${activeCategory === key ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-[#141416] text-gray-500 border-gray-100 dark:border-[#1f1f23]'}`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32">

        {/* Quick Actions */}
        {!search && activeCategory === 'all' && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => { triggerHaptic('light'); setActiveSheet('customFood'); }}
              aria-label="Create custom food"
              className="flex-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 p-4 rounded-[20px] flex items-center justify-center gap-2 font-bold text-sm border border-blue-100 dark:border-blue-500/20 active:scale-95 transition-transform"
            >
              <PlusCircle size={18} /> Custom Food
            </button>
            <button
              onClick={handleQuickAddCals}
              aria-label="Quick add calories"
              className="flex-1 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 p-4 rounded-[20px] flex items-center justify-center gap-2 font-bold text-sm border border-orange-100 dark:border-orange-500/20 active:scale-95 transition-transform"
            >
              <Flame size={18} /> Quick Cals
            </button>
          </div>
        )}

        {/* Loading state during search */}
        {isSearching && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-gray-400" size={24} />
            <span className="ml-2 text-gray-400 font-bold text-sm">Searching...</span>
          </div>
        )}

        {!isSearching && filteredFoods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#1c1c1e] rounded-full flex items-center justify-center mb-4">
              <Search className="text-gray-400" size={24} />
            </div>
            <p className="font-bold text-gray-900 dark:text-white text-[16px] mb-2">No foods found</p>
            <p className="text-[14px] text-gray-500 mb-6 max-w-[200px]">We couldn&apos;t find anything matching your search.</p>
            <button
              onClick={() => { triggerHaptic('light'); setActiveSheet('customFood'); }}
              aria-label="Create a custom food"
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-[20px] font-bold text-sm shadow-sm active:scale-95 transition-transform"
            >
              + Create Custom Food
            </button>
          </div>
        ) : !isSearching && (
          <>
            {showSuggestionHeader && (
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">{suggestionLabel}</p>
            )}

            {/* Results cap indicator */}
            {filteredFoods.length >= MAX_RESULTS && (
              <div className="text-center text-gray-400 text-xs font-bold mb-3 bg-gray-50 dark:bg-[#141416] py-2 rounded-full">
                Showing top {MAX_RESULTS} results — refine your search
              </div>
            )}

            <div className="space-y-3">
              {filteredFoods.map(([fk, item]) => {
                const currentQty = currentMealFoods[fk] || 0;
                const isAdded = currentQty > 0;
                const emoji = FOOD_CATEGORIES[item.category]?.emoji || '🍲';
                const isActive = activeFoodKey === fk;

                return (
                  <motion.div
                    layout
                    key={fk}
                    className={`flex flex-col p-4 rounded-[24px] border transition-all ${isActive ? 'bg-gray-100 dark:bg-[#1c1c1e] border-transparent shadow-md' : isAdded ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-white dark:bg-[#141416] border-gray-100 dark:border-[#1f1f23] hover:border-gray-200 dark:hover:border-gray-800 shadow-sm'}`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <button
                        onClick={() => handleOpenEditor(fk, currentQty)}
                        aria-label={`${item.name}, ${item.cals} kcal per ${item.unit === 'g' ? '100g' : item.unit}${isAdded ? `, ${currentQty} added` : ''}. Adjust quantity.`}
                        className="flex items-center gap-4 text-left flex-1 min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl"
                      >
                        <div className="text-2xl bg-white dark:bg-[#0A0A0C] w-12 h-12 rounded-full flex items-center justify-center shadow-sm shrink-0">{emoji}</div>
                        <div className="min-w-0">
                          <p className={`font-bold text-base truncate ${isAdded && !isActive ? 'text-emerald-900 dark:text-emerald-400' : ''}`}>{item.name}</p>
                          <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            {item.cals} kcal <span className="opacity-50 mx-1">•</span> P:{item.p} C:{item.c} F:{item.f} <span className="opacity-50 mx-1">•</span> 1{item.unit === 'g' ? '00g' : item.unit}
                          </p>
                        </div>
                      </button>
                      {!isActive && (
                        <button
                          onClick={() => handleQuickAdd(fk, currentQty)}
                          aria-label={isAdded ? `Add one more ${item.name}` : `Quick add ${item.name}`}
                          className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-sm transition-colors active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isAdded ? 'bg-emerald-500 text-white' : 'bg-gray-50 dark:bg-[#0A0A0C] text-gray-900 dark:text-white'}`}
                        >
                          {isAdded ? <span className="font-bold text-sm">{currentQty}x</span> : <Plus size={18} />}
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden border-t border-gray-200 dark:border-[#2c2c2e] pt-4 flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2 bg-white dark:bg-[#0A0A0C] rounded-full p-1 border border-gray-200 dark:border-[#2c2c2e]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('light');
                                const step = item.unit === 'g' ? 50 : 0.5;
                                setActiveQty(Math.max(step, activeQty - step));
                              }}
                              aria-label={`Decrease quantity by ${item.unit === 'g' ? 50 : 0.5}`}
                              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1c1c1e] flex items-center justify-center active:scale-95 transition-transform"
                            >
                              <Minus size={16} />
                            </button>

                            <input
                              type="text"
                              inputMode="numeric"
                              value={activeQty}
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Food quantity"
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') { setActiveQty(''); return; }
                                const num = parseFloat(val);
                                if (!isNaN(num)) setActiveQty(num);
                              }}
                              onBlur={() => {
                                if (activeQty === '' || activeQty <= 0) {
                                  setActiveQty(item.unit === 'g' ? 100 : 1);
                                }
                              }}
                              className="font-bold w-12 text-center bg-transparent border-none outline-none tabular-nums"
                            />

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('light');
                                const step = item.unit === 'g' ? 50 : 0.5;
                                setActiveQty(Number(activeQty) + step);
                              }}
                              aria-label={`Increase quantity by ${item.unit === 'g' ? 50 : 0.5}`}
                              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1c1c1e] flex items-center justify-center active:scale-95 transition-transform"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCommit(fk); }}
                            aria-label={`Add ${item.name}, ${Math.round(item.cals * (item.unit === 'g' ? activeQty / 100 : activeQty))} calories`}
                            className="bg-emerald-500 text-white font-bold px-6 py-3 rounded-full flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
                          >
                            Add <span className="opacity-75">{Math.round(item.cals * (item.unit === 'g' ? activeQty / 100 : activeQty))} kcal</span>
                          </button>
                          </div>
                          {customFoods[fk] && (
                            <button
                              onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); setEditingFoodId(fk); setActiveSheet('customFood'); }}
                              aria-label={`Edit ${item.name} details`}
                              className="self-start flex items-center gap-1.5 text-[12px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-1"
                            >
                              <Pencil size={13} /> Edit food details
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showQuickCals && (
        <QuickCalsSheet
          onClose={() => setShowQuickCals(false)}
          onAdd={async (numCals) => {
            const tempKey = `quick_${crypto.randomUUID()}`;
            // Reuses an existing "Quick Calories" entry with the same value
            // instead of minting a new custom-food row every single time.
            const foodKey = await useFoodStore.getState().addOrReuseCustomFood(tempKey, {
              name: 'Quick Calories',
              cals: numCals,
              p: 0, c: 0, f: 0,
              unit: 'serving',
              category: 'fitness'
            });
            triggerHaptic('success');
            addFoodToMeal(selectedDate, mealKey, foodKey, 1);
            toast.success(`Added ${numCals} kcal`);
            // Keep sheet open — do NOT call onClose()
          }}
        />
      )}
    </motion.div>
  );
}
