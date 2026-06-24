import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Minus, PlusCircle, Flame } from 'lucide-react';
import { useFoodStore } from '../../store/useFoodStore';
import { useLedgerStore, getInitialDayRecord } from '../../store/useLedgerStore';
import { useAppStore } from '../../store/useAppStore';
import { FOOD_CATEGORIES } from '../../data/foods';
import { triggerHaptic } from '../../utils/haptics';
import QuickCalsSheet from './QuickCalsSheet';

export default function FoodSearchSheet({ mealKey, onClose }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showQuickCals, setShowQuickCals] = useState(false);
  
  const selectedDate = useAppStore(state => state.selectedDate);
  const setActiveSheet = useAppStore(state => state.setActiveSheet);

  const getFullDB = useFoodStore(state => state.getFullDB);
  const getRecentFoods = useFoodStore(state => state.getRecentFoods);
  const fullDB = useMemo(() => getFullDB(), [getFullDB]);

  const addFoodToMeal = useLedgerStore(state => state.addFoodToMeal);
  const ledger = useLedgerStore(state => state.ledger);
  const currentRecord = ledger[selectedDate] || getInitialDayRecord();
  const currentMealFoods = currentRecord.meals[mealKey] || {};

  const filteredFoods = useMemo(() => {
    let entries = Object.entries(fullDB);
    
    if (activeCategory !== 'all') {
      entries = entries.filter(([, item]) => item.category === activeCategory);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      entries = entries.filter(([, item]) => item.name.toLowerCase().includes(q));
    } else if (activeCategory === 'all') {
      const recentIds = getRecentFoods(ledger, 15);
      if (recentIds.length > 0) {
        const recentEntries = recentIds.map(id => [id, fullDB[id]]).filter(e => e[1]);
        const otherEntries = entries.filter(([id]) => !recentIds.includes(id));
        entries = [...recentEntries, ...otherEntries].slice(0, 30);
      } else {
        entries = entries.slice(0, 20);
      }
    }
    return entries;
  }, [search, fullDB, activeCategory, ledger, getRecentFoods]);

  const [activeFoodKey, setActiveFoodKey] = useState(null);
  const [activeQty, setActiveQty] = useState(1);

  const handleSelectFood = (fk, currentQty) => {
    triggerHaptic('light');
    if (activeFoodKey === fk) {
      setActiveFoodKey(null);
    } else {
      setActiveFoodKey(fk);
      setActiveQty(currentQty || (fullDB[fk]?.unit === 'g' ? 100 : 1));
    }
  };

  const handleCommit = (fk) => {
    triggerHaptic('success');
    addFoodToMeal(selectedDate, mealKey, fk, activeQty);
    onClose(); // UX enhancement: Auto-close after adding to reduce friction
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
      className="fixed inset-0 bg-[#FAFBFC] dark:bg-[#0A0A0C] z-50 flex flex-col"
    >
      <div className="px-6 pt-16 pb-4 bg-white/90 dark:bg-[#141416]/90 backdrop-blur-xl z-20 border-b border-gray-100 dark:border-[#1f1f23] rounded-b-[32px] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black tracking-tighter capitalize">Add to {mealKey}</h2>
          <button onClick={() => { triggerHaptic('light'); onClose(); }} className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold text-sm shadow-sm hover:scale-105 transition-transform active:scale-95">
            Done
          </button>
        </div>
        
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            autoFocus
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search foods (Puttu, Chicken...)" 
            className="w-full bg-gray-50 dark:bg-[#0A0A0C] rounded-[20px] pl-12 pr-4 py-4 font-bold text-base outline-none border border-transparent focus:border-gray-200 dark:focus:border-[#1f1f23] transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-gray-200 dark:bg-[#1f1f23] rounded-full text-gray-500">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
          <button 
            onClick={() => { triggerHaptic('light'); setActiveCategory('all'); }}
            className={`flex items-center whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-colors border ${activeCategory === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-[#141416] text-gray-500 border-gray-100 dark:border-[#1f1f23]'}`}
          >
            All
          </button>
          {Object.entries(FOOD_CATEGORIES).map(([key, cat]) => (
            <button 
              key={key}
              onClick={() => { triggerHaptic('light'); setActiveCategory(key); }}
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
              className="flex-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 p-4 rounded-[20px] flex items-center justify-center gap-2 font-bold text-sm border border-blue-100 dark:border-blue-500/20 active:scale-95 transition-transform"
            >
              <PlusCircle size={18} /> Custom Food
            </button>
            <button 
              onClick={handleQuickAddCals}
              className="flex-1 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 p-4 rounded-[20px] flex items-center justify-center gap-2 font-bold text-sm border border-orange-100 dark:border-orange-500/20 active:scale-95 transition-transform"
            >
              <Flame size={18} /> Quick Cals
            </button>
          </div>
        )}

        {filteredFoods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#1c1c1e] rounded-full flex items-center justify-center mb-4">
              <Search className="text-gray-400" size={24} />
            </div>
            <p className="font-bold text-gray-900 dark:text-white text-[16px] mb-2">No foods found</p>
            <p className="text-[14px] text-gray-500 mb-6 max-w-[200px]">We couldn't find anything matching your search.</p>
            <button 
              onClick={() => { triggerHaptic('light'); setActiveSheet('customFood'); }}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-[20px] font-bold text-sm shadow-sm active:scale-95 transition-transform"
            >
              + Create Custom Food
            </button>
          </div>
        ) : (
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
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => handleSelectFood(fk, currentQty)}>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl bg-white dark:bg-[#0A0A0C] w-12 h-12 rounded-full flex items-center justify-center shadow-sm">{emoji}</div>
                      <div>
                        <p className={`font-bold text-base ${isAdded && !isActive ? 'text-emerald-900 dark:text-emerald-400' : ''}`}>{item.name}</p>
                        <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                          {item.cals} kcal <span className="opacity-50 mx-1">•</span> P:{item.p} C:{item.c} F:{item.f} <span className="opacity-50 mx-1">•</span> 1{item.unit === 'g' ? '00g' : item.unit}
                        </p>
                      </div>
                    </div>
                    {!isActive && (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors ${isAdded ? 'bg-emerald-500 text-white' : 'bg-gray-50 dark:bg-[#0A0A0C] text-gray-900 dark:text-white'}`}>
                        {isAdded ? <span className="font-bold text-sm">{currentQty}x</span> : <Plus size={18} />}
                      </div>
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {isActive && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden border-t border-gray-200 dark:border-[#2c2c2e] pt-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4 bg-white dark:bg-[#0A0A0C] rounded-full p-1 border border-gray-200 dark:border-[#2c2c2e]">
                          <button 
                            onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); setActiveQty(Math.max(0.5, activeQty - 0.5)); }}
                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1c1c1e] flex items-center justify-center active:scale-95 transition-transform"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-bold w-8 text-center tabular-nums">{activeQty}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); setActiveQty(activeQty + 0.5); }}
                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1c1c1e] flex items-center justify-center active:scale-95 transition-transform"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCommit(fk); }}
                          className="bg-emerald-500 text-white font-bold px-6 py-3 rounded-full flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
                        >
                          Add <span className="opacity-75">{Math.round(item.cals * activeQty)} kcal</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {showQuickCals && (
        <QuickCalsSheet 
          onClose={() => setShowQuickCals(false)} 
          onAdd={(numCals) => {
            const tempKey = `quick_${Date.now()}`;
            useFoodStore.getState().addCustomFood(tempKey, {
              name: 'Quick Calories',
              cals: numCals,
              p: 0, c: 0, f: 0,
              unit: 'serving',
              category: 'fitness'
            });
            handleCommit(tempKey);
          }} 
        />
      )}
    </motion.div>
  );
}
