import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, AlertCircle } from 'lucide-react';
import { useFoodStore } from '../../store/useFoodStore';
import { triggerHaptic } from '../../utils/haptics';
import { FOOD_CATEGORIES } from '../../data/foods';
import { toast } from '../../lib/toast';
import { VALIDATION } from '../../utils/constants';
import { validateMacro, validateCalories } from '../../utils/validation';
import { useSheetA11y } from '../../hooks/useSheetA11y';

const MACRO_COLORS = {
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-900 dark:text-blue-400 placeholder-blue-300 dark:placeholder-blue-500/50 focus:border-blue-200 dark:focus:border-blue-500/30',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-400 placeholder-emerald-300 dark:placeholder-emerald-500/50 focus:border-emerald-200 dark:focus:border-emerald-500/30',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 placeholder-amber-300 dark:placeholder-amber-500/50 focus:border-amber-200 dark:focus:border-amber-500/30'
};

export default function CustomFoodSheet({ onClose }) {
  const sheetRef = useSheetA11y(onClose);
  const addCustomFood = useFoodStore(state => state.addCustomFood);

  const [form, setForm] = useState({
    name: '',
    cals: '',
    p: '',
    c: '',
    f: '',
    unit: 'serving',
    category: 'breakfast'
  });
  const [error, setError] = useState('');

  // Derived (not stored) — when any macro is entered, calories are computed
  // from them and the field becomes read-only-by-macros; otherwise the
  // manually-typed value in form.cals is used. Deriving this during render
  // (rather than writing it back via an effect) avoids the extra render
  // pass a setState-in-effect would cause.
  const pNum = Number(form.p || 0);
  const cNum = Number(form.c || 0);
  const fNum = Number(form.f || 0);
  const macroCals = (pNum > 0 || cNum > 0 || fNum > 0) ? (pNum * 4) + (cNum * 4) + (fNum * 9) : null;
  const displayedCals = macroCals !== null ? String(macroCals) : form.cals;

  const handleSave = () => {
    if (!form.name.trim()) {
      setError('Name is required');
      triggerHaptic('error');
      return;
    }
    if (form.name.trim().length > VALIDATION.foodNameMaxLength) {
      setError(`Name must be ${VALIDATION.foodNameMaxLength} characters or less`);
      triggerHaptic('error');
      return;
    }
    const calsResult = validateCalories(macroCals !== null ? macroCals : form.cals);
    if (!calsResult.valid) {
      setError(calsResult.error);
      triggerHaptic('error');
      return;
    }

    // Validate macros are not negative
    for (const macro of ['p', 'c', 'f']) {
      const validation = validateMacro(form[macro]);
      if (form[macro] !== '' && !validation.valid && validation.error) {
        const labels = { p: 'Protein', c: 'Carbs', f: 'Fat' };
        setError(`${labels[macro]}: ${validation.error}`);
        triggerHaptic('error');
        return;
      }
    }

    triggerHaptic('success');
    const customId = `custom_${crypto.randomUUID()}`;
    addCustomFood(customId, {
      name: form.name.trim(),
      cals: calsResult.value,
      p: pNum,
      c: cNum,
      f: fNum,
      unit: form.unit,
      category: form.category
    });
    toast.success(`"${form.name.trim()}" created`);
    onClose();
  };

  const updateForm = (field, val) => {
    // Enforce max length on name
    if (field === 'name' && val.length > VALIDATION.foodNameMaxLength) {
      return;
    }
    setForm(prev => ({ ...prev, [field]: val }));
    if (error) setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
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
      className="fixed inset-0 bg-[#F0F1EE] dark:bg-[#0A0A0C] z-50 overflow-y-auto"
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label="Create custom food"
      onKeyDown={handleKeyDown}
    >
      <div className="p-6 pb-4 sticky top-0 bg-[#F0F1EE]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-xl z-20">
        <div className="flex justify-between items-center pt-4 mb-6">
          <h2 className="text-3xl font-black tracking-tighter">Create Food</h2>
          <button
            onClick={() => { triggerHaptic('light'); onClose(); }}
            aria-label="Close create food sheet"
            className="p-3 bg-white dark:bg-[#141416] rounded-full shadow-sm border border-gray-100 dark:border-[#1f1f23]"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-32 space-y-6">

        {error && (
          <div role="alert" className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-[20px] flex items-center gap-3 font-bold text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div className="bg-white dark:bg-[#141416] p-5 rounded-[28px] space-y-5">
          <div>
            <label htmlFor="food-name" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Food Name
              <span className="ml-2 text-gray-300 normal-case tracking-normal">
                {form.name.length}/{VALIDATION.foodNameMaxLength}
              </span>
            </label>
            <input
              id="food-name"
              autoFocus
              type="text"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              maxLength={VALIDATION.foodNameMaxLength}
              placeholder="e.g. Mom's Chicken Curry"
              className="w-full bg-gray-50 dark:bg-[#0A0A0C] px-4 py-4 rounded-[20px] font-bold text-base outline-none border border-transparent focus:border-gray-200 dark:focus:border-gray-800 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="food-cals" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Calories (kcal){macroCals !== null && <span className="ml-1 normal-case tracking-normal text-gray-300">· from macros</span>}
              </label>
              <input
                id="food-cals"
                type="number"
                inputMode="decimal"
                value={displayedCals}
                readOnly={macroCals !== null}
                onChange={(e) => updateForm('cals', e.target.value)}
                placeholder="0"
                aria-invalid={!!error}
                className="w-full bg-orange-50 dark:bg-orange-500/10 text-orange-900 dark:text-orange-400 placeholder-orange-300 dark:placeholder-orange-500/50 px-4 py-4 rounded-[20px] font-black text-xl outline-none border border-transparent focus:border-orange-200 dark:focus:border-orange-500/30 transition-colors read-only:opacity-70"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Serving Unit</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                {/* 'g' (not the literal '100g') is the app-wide token for a
                    per-100g food — the calorie engine and steppers only divide
                    by 100 when unit === 'g'/'ml'. Labeling it "100g (grams)"
                    keeps the UI clear while storing the value the rest of the
                    app understands. */}
                {['serving', 'g', 'ml', 'item'].map(u => (
                  <button
                    key={u}
                    onClick={() => updateForm('unit', u)}
                    aria-label={u === 'g' ? 'Unit: per 100 grams' : `Unit: ${u}`}
                    aria-pressed={form.unit === u}
                    className={`whitespace-nowrap px-4 py-3 rounded-[16px] font-bold text-sm transition-colors border ${form.unit === u ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-gray-50 dark:bg-[#0A0A0C] text-gray-500 border-transparent'}`}
                  >
                    {u === 'g' ? '100g (grams)' : u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
              {Object.entries(FOOD_CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => updateForm('category', key)}
                  aria-label={`Category: ${cat.label}`}
                  aria-pressed={form.category === key}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-3 rounded-[16px] font-bold text-sm transition-colors border ${form.category === key ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-gray-50 dark:bg-[#0A0A0C] text-gray-500 border-transparent'}`}
                >
                  <span>{cat.emoji}</span> {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#141416] p-5 rounded-[28px]">
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Macros (Optional — auto-calculates calories)</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'p', label: 'Protein (g)', color: 'blue' },
              { id: 'c', label: 'Carbs (g)', color: 'emerald' },
              { id: 'f', label: 'Fat (g)', color: 'amber' }
            ].map(m => (
              <div key={m.id}>
                <label htmlFor={`macro-${m.id}`} className="block text-xs font-bold text-gray-500 mb-1">{m.label}</label>
                <input
                  id={`macro-${m.id}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={form[m.id]}
                  onChange={(e) => updateForm(m.id, e.target.value)}
                  placeholder="0"
                  className={`w-full px-3 py-3 rounded-[16px] font-bold text-lg outline-none border border-transparent transition-colors text-center tabular-nums ${MACRO_COLORS[m.color]}`}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          aria-label="Save custom food"
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-5 rounded-[24px] font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
        >
          <Save size={20} /> Save Food
        </button>
      </div>
    </motion.div>
  );
}
